const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, acceptedTerms } = req.body;

    if (acceptedTerms !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the Terms and Conditions and Privacy Policy.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      acceptedTermsAt: new Date(),
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const match = user.passwordHash && await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.google = async (req, res, next) => {
  const { credential, mode = 'login', acceptedTerms } = req.body;
  if (typeof credential !== 'string' || !credential.trim()) {
    return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
  }

  if (!payload?.sub || !payload?.email || payload.email_verified !== true) {
    return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
  }

  try {
    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email });
    }

    if (mode === 'login') {
      if (!user) {
        return res.status(404).json({
          success: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'No account found for this Google email. Please sign up first.',
          profile: { name: payload.name, email, picture: payload.picture },
        });
      }
      if (user.googleId !== payload.sub) {
        user.googleId = payload.sub;
        if (!user.authProviders) user.authProviders = [];
        if (!user.authProviders.includes('google')) user.authProviders.push('google');
        if (!user.avatarUrl) user.avatarUrl = payload.picture;
        await user.save();
      }
      const token = generateToken(user._id);
      return res.status(200).json({ success: true, message: 'Logged in successfully', token, user, isNewUser: false });
    }

    if (mode !== 'signup') return res.status(401).json({ success: false, message: 'Invalid Google credential.' });
    if (user) return res.status(409).json({ success: false, code: 'ACCOUNT_EXISTS', message: 'You already have an account. Please sign in.' });
    if (acceptedTerms !== true) return res.status(400).json({ success: false, message: 'You must accept the Terms and Privacy Policy' });

    user = await User.create({
      name: payload.name || email,
      email,
      googleId: payload.sub,
      avatarUrl: payload.picture,
      authProviders: ['google'],
      acceptedTermsAt: new Date(),
    });
    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: 'Logged in successfully', token, user, isNewUser: true });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
