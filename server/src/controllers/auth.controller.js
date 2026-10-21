const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sendEmail } = require('../config/mailer');
const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');

const googleClient = new OAuth2Client();
const DUMMY_PASSWORD_HASH = '$2b$12$f7upBFpdJSNYvm.5RtxnAeWuzFKkD3txL0PqgSoya1TnHrCbw3iV2';
const GENERIC_LOGIN_MESSAGE = 'Unable to sign in with those details. Check your email and password and try again.';
const ACCOUNT_EXISTS_MESSAGE = 'An account may already exist with this email. Try signing in or resetting your password.';
const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

const ticketSecret = () => process.env.GOOGLE_SIGNUP_TICKET_SECRET || process.env.JWT_SECRET;
const currentTermsVersion = () => process.env.TERMS_VERSION || '1.0';
const normalizeEmail = (email) => email.trim().toLowerCase();
const createTicket = (payload, expiresIn) => jwt.sign(payload, ticketSecret(), { expiresIn });

const verifyTicket = (ticket, purpose) => {
  const payload = jwt.verify(ticket, ticketSecret());
  if (payload.purpose !== purpose) throw new jwt.JsonWebTokenError('Invalid ticket purpose');
  return payload;
};

const loginResponse = (res, user, isNewUser, status = 200) => {
  const response = {
    success: true,
    message: isNewUser === true ? 'User registered successfully' : 'Logged in successfully',
    token: generateToken(user._id),
    user,
  };
  if (typeof isNewUser === 'boolean') response.isNewUser = isNewUser;
  return res.status(status).json(response);
};

const accountExistsResponse = (res) => res.status(409).json({
  success: false,
  code: 'ACCOUNT_EXISTS',
  message: ACCOUNT_EXISTS_MESSAGE,
});

const maskedEmail = (email) => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
};

const isDuplicateKeyError = (error) => error && error.code === 11000;
const registerStartResponse = {
  success: true,
  message: "If this email can be used, we've sent a 6-digit code.",
  resendAfter: 45,
};

const codeHash = (email, code) => crypto
  .createHash('sha256')
  .update(`${process.env.JWT_SECRET}:${email}:${code}`)
  .digest('hex');

const createEmailVerificationTicket = (email, name) => jwt.sign(
  { purpose: 'email_verified', email, name },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

const verifyEmailVerificationTicket = (ticket) => {
  const payload = jwt.verify(ticket, process.env.JWT_SECRET);
  if (payload.purpose !== 'email_verified') throw new jwt.JsonWebTokenError('Invalid ticket purpose');
  return payload;
};

const verificationEmail = (code) => ({
  subject: 'Your Warranta verification code',
  text: `Your Warranta verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
  html: `<p>Your Warranta verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
});

const accountExistsEmail = () => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const loginUrl = `${clientUrl}/login`;
  const resetUrl = `${clientUrl}/forgot-password`;
  return {
    subject: 'An account already exists for this address',
    text: `An account already exists for this address. Sign in: ${loginUrl}\nReset your password: ${resetUrl}`,
    html: `<p>An account already exists for this address.</p><p><a href="${loginUrl}">Sign in</a> or <a href="${resetUrl}">reset your password</a>.</p>`,
  };
};

exports.register = async (req, res, next) => {
  return res.status(410).json({
    success: false,
    code: 'ENDPOINT_REMOVED',
    message: 'Please use email verification to register.',
  });
};

exports.registerStart = async (req, res, next) => {
  try {
    const { name } = req.body;
    const email = normalizeEmail(req.body.email);
    const now = new Date();
    const existingVerification = await EmailVerification.findOne({ email });
    const resendAt = existingVerification?.lastSentAt?.getTime() + (45 * 1000);

    if (resendAt && resendAt > now.getTime()) {
      return res.status(429).json({
        success: false,
        code: 'RESEND_TOO_SOON',
        retryAfter: Math.ceil((resendAt - now.getTime()) / 1000),
      });
    }

    const hourAgo = now.getTime() - (60 * 60 * 1000);
    const isNewWindow = !existingVerification || existingVerification.sendWindowStart.getTime() <= hourAgo;
    const sendWindowStart = isNewWindow ? now : existingVerification.sendWindowStart;
    const sendCount = isNewWindow ? 0 : existingVerification.sendCount;
    if (sendCount >= 5) {
      return res.status(429).json({
        success: false,
        code: 'SEND_LIMIT',
        retryAfter: Math.ceil(((sendWindowStart.getTime() + (60 * 60 * 1000)) - now.getTime()) / 1000),
      });
    }

    const userExists = await User.exists({ email });
    const code = userExists ? null : crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const expiresAt = new Date(now.getTime() + (userExists ? 60 * 60 * 1000 : 10 * 60 * 1000));
    const values = {
      name,
      attempts: 0,
      expiresAt,
      lastSentAt: now,
      sendCount: sendCount + 1,
      sendWindowStart,
    };

    if (code) values.codeHash = codeHash(email, code);

    await EmailVerification.findOneAndUpdate(
      { email },
      code
        ? { $set: values, $setOnInsert: { email } }
        : { $set: values, $unset: { codeHash: 1 }, $setOnInsert: { email } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const emailContent = code ? verificationEmail(code) : accountExistsEmail();
    const delivery = await sendEmail({ to: email, ...emailContent });
    if (!delivery.success) console.error(`[Email verification] Failed to send verification email to ${email}.`);
    if (code && process.env.NODE_ENV !== 'production') console.log(`[Email verification] Code for ${email}: ${code}`);

    return res.status(200).json(registerStartResponse);
  } catch (error) {
    return next(error);
  }
};

exports.registerVerify = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const verification = await EmailVerification.findOne({ email });
    if (!verification || !verification.codeHash || verification.expiresAt <= new Date()) {
      if (verification) await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({ success: false, code: 'CODE_EXPIRED' });
    }

    const expectedHash = Buffer.from(verification.codeHash, 'hex');
    const submittedHash = Buffer.from(codeHash(email, req.body.code), 'hex');
    const isValid = expectedHash.length === submittedHash.length && crypto.timingSafeEqual(expectedHash, submittedHash);
    if (!isValid) {
      verification.attempts += 1;
      if (verification.attempts >= 5) {
        await EmailVerification.deleteOne({ _id: verification._id });
        return res.status(429).json({ success: false, code: 'TOO_MANY_ATTEMPTS' });
      }
      await verification.save();
      return res.status(400).json({ success: false, code: 'CODE_INVALID', attemptsLeft: 5 - verification.attempts });
    }

    await EmailVerification.deleteOne({ _id: verification._id });
    return res.status(200).json({
      success: true,
      verifiedTicket: createEmailVerificationTicket(email, verification.name),
    });
  } catch (error) {
    return next(error);
  }
};

exports.registerComplete = async (req, res, next) => {
  let ticket;
  try {
    ticket = verifyEmailVerificationTicket(req.body.verifiedTicket);
  } catch {
    return res.status(401).json({ success: false, code: 'TICKET_EXPIRED' });
  }

  try {
    const email = normalizeEmail(ticket.email);
    if (await User.exists({ email })) return accountExistsResponse(res);
    const user = await User.create({
      name: ticket.name,
      email,
      passwordHash: await bcrypt.hash(req.body.password, 12),
      emailVerified: true,
      authProviders: ['password'],
      termsVersion: currentTermsVersion(),
      termsAcceptedAt: new Date(),
    });
    return loginResponse(res, user, undefined, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) return accountExistsResponse(res);
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    const passwordHash = user && user.passwordHash ? user.passwordHash : DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(req.body.password, passwordHash);

    if (!user || !user.passwordHash || !passwordMatches) {
      return res.status(401).json({ success: false, message: GENERIC_LOGIN_MESSAGE });
    }
    if (user.accountStatus === 'disabled') {
      return res.status(403).json({ success: false, message: 'This account is unavailable. Please contact support.' });
    }
    return loginResponse(res, user, false);
  } catch (error) {
    return next(error);
  }
};

exports.google = async (req, res, next) => {
  if (typeof req.body.credential !== 'string' || !req.body.credential.trim()) {
    return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
  }

  if (!payload?.sub || !payload?.email || payload.email_verified !== true || !payload.exp ||
      Number(payload.exp) * 1000 <= Date.now() || !GOOGLE_ISSUERS.has(payload.iss)) {
    return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
  }

  try {
    const email = normalizeEmail(payload.email);
    const googleUser = await User.findOne({ googleId: payload.sub });
    if (googleUser) {
      if (googleUser.accountStatus === 'disabled') {
        return res.status(403).json({ success: false, message: 'This account is unavailable. Please contact support.' });
      }
      return loginResponse(res, googleUser, false);
    }

    const emailUser = await User.findOne({ email });
    if (emailUser) {
      const linkTicket = createTicket({
        purpose: 'google_link',
        userId: emailUser._id.toString(),
        googleId: payload.sub,
      }, '10m');
      return res.status(409).json({
        success: false,
        code: 'LINK_REQUIRED',
        message: 'Confirm your password to link Google sign-in.',
        linkTicket,
        maskedEmail: maskedEmail(email),
      });
    }

    const signupTicket = createTicket({
      purpose: 'google_signup',
      googleId: payload.sub,
      email,
      name: payload.name || email,
      picture: payload.picture,
    }, '15m');
    return res.status(404).json({
      success: false,
      code: 'ACCOUNT_NOT_FOUND',
      message: 'No account found for this Google email. Please sign up first.',
      signupTicket,
      profile: { name: payload.name, email, picture: payload.picture },
    });
  } catch (error) {
    return next(error);
  }
};

exports.googleSignup = async (req, res, next) => {
  if (req.body.acceptedTerms !== true) {
    return res.status(400).json({ success: false, message: 'You must agree to the Terms and Conditions and Privacy Policy.' });
  }

  let ticket;
  try {
    ticket = verifyTicket(req.body.signupTicket, 'google_signup');
  } catch (error) {
    const code = error.name === 'TokenExpiredError' ? 'TICKET_EXPIRED' : 'INVALID_TICKET';
    return res.status(401).json({ success: false, code, message: code === 'TICKET_EXPIRED' ? 'Signup ticket has expired.' : 'Invalid signup ticket.' });
  }

  try {
    const existing = await User.exists({ $or: [{ email: ticket.email }, { googleId: ticket.googleId }] });
    if (existing) return accountExistsResponse(res);

    const user = await User.create({
      name: ticket.name || ticket.email,
      email: normalizeEmail(ticket.email),
      googleId: ticket.googleId,
      avatarUrl: ticket.picture,
      authProviders: ['google'],
      emailVerified: true,
      termsVersion: currentTermsVersion(),
      termsAcceptedAt: new Date(),
    });
    return loginResponse(res, user, true, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) return accountExistsResponse(res);
    return next(error);
  }
};

exports.googleLink = async (req, res, next) => {
  let ticket;
  try {
    ticket = verifyTicket(req.body.linkTicket, 'google_link');
  } catch (error) {
    const code = error.name === 'TokenExpiredError' ? 'TICKET_EXPIRED' : 'INVALID_TICKET';
    return res.status(401).json({ success: false, code, message: 'Unable to link this Google account.' });
  }

  try {
    const user = await User.findById(ticket.userId);
    const passwordMatches = user?.passwordHash && await bcrypt.compare(req.body.password, user.passwordHash);
    if (!user || !passwordMatches) {
      return res.status(401).json({ success: false, message: GENERIC_LOGIN_MESSAGE });
    }
    if (user.accountStatus === 'disabled') {
      return res.status(403).json({ success: false, message: 'This account is unavailable. Please contact support.' });
    }

    user.googleId = ticket.googleId;
    if (!user.authProviders.includes('google')) user.authProviders.push('google');
    await user.save();
    return loginResponse(res, user, false);
  } catch (error) {
    if (isDuplicateKeyError(error)) return accountExistsResponse(res);
    return next(error);
  }
};

exports.acceptTerms = async (req, res, next) => {
  try {
    req.user.termsVersion = currentTermsVersion();
    req.user.termsAcceptedAt = new Date();
    await req.user.save();
    return res.status(200).json({ success: true, message: 'Terms accepted successfully', user: req.user });
  } catch (error) {
    return next(error);
  }
};

exports.getCurrentUser = async (req, res) => res.status(200).json({
  success: true,
  user: req.user,
  termsOutdated: req.user.termsVersion !== currentTermsVersion(),
});

exports.logout = async (req, res) => res.status(200).json({
  success: true,
  message: 'Logged out successfully',
});
