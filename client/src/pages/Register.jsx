/*
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
*/
import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { registerComplete, registerStart, registerVerify } from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Input from '../components/Input';
import CardStack from '../components/auth/CardStack';
import GoogleButton from '../components/auth/GoogleButton';
import GoogleFinishCard from '../components/auth/GoogleFinishCard';
import OtpInput from '../components/auth/OtpInput';

const emailPattern = /^\S+@\S+\.\S+$/;
const passwordIsValid = (password) => password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
const CheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
const EyeIcon = ({ hidden }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{hidden ? <><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.8 4.2A10.7 10.7 0 0 1 12 4c5 0 8.3 4.1 9 8-.3 1.3-1 2.5-1.9 3.5" /><path d="M6.2 6.2C4.5 7.6 3.4 9.8 3 12c.7 3.9 4 8 9 8 1.3 0 2.5-.3 3.6-.8" /></> : <><path d="M3 12s3.3-8 9-8 9 8 9 8-3.3 8-9 8-9-8-9-8Z" /><circle cx="12" cy="12" r="3" /></>}</svg>;

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
/*
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (!acceptedTerms) {
      return setError('You must agree to the Terms and Privacy Policy.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        acceptedTerms
      });
      login(res.data.user, res.data.token);
      showToast('Registration successful! Welcome.', 'success');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const change = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });
  return <div className="auth-layout"><aside className="auth-brand-panel"><div className="auth-brand"><span className="brand-mark">W</span><span>Warranty Tracker</span></div><div><p className="eyebrow">Start simply</p><h1>Make every purchase easier to protect.</h1><p>Your personal home for bills, coverage dates, and claim-ready details.</p></div><div className="auth-brand-note"><span aria-hidden="true">✓</span> Free to organize your warranties</div><CardStack variant="register" /></aside><main className="auth-form-panel"><div className="auth-form-wrap"><p className="eyebrow">Create your account</p><h1>Start tracking smarter</h1><p className="auth-subtitle">It only takes a minute.</p><GoogleButton mode="signup" disabled={!acceptedTerms} acceptedTerms={acceptedTerms} onSuccess={({ user, token }) => { login(user, token); showToast("Welcome to Warranta! Your account is ready.", "success"); navigate("/dashboard"); }} onAccountExists={() => { showToast("You already have an account. Please sign in.", "error"); navigate("/login"); }} /><div className="google-button__divider"><span>or continue with email</span></div>{error && <div className="form-alert" role="alert">{error}</div>}<form onSubmit={submit}><FormField label="Full name" htmlFor="name"><Input id="name" name="name" autoComplete="name" required value={formData.name} onChange={change} placeholder="Jane Doe" autoFocus /></FormField><FormField label="Email address" htmlFor="email"><Input type="email" id="email" name="email" autoComplete="email" required value={formData.email} onChange={change} placeholder="you@example.com" /></FormField><FormField label="Password" htmlFor="password" hint="At least 6 characters."><div className="password-control"><Input type={showPassword ? 'text' : 'password'} id="password" name="password" autoComplete="new-password" required minLength={6} value={formData.password} onChange={change} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={`${showPassword ? 'Hide' : 'Show'} passwords`}>{showPassword ? 'Hide' : 'Show'}</button></div></FormField><FormField label="Confirm password" htmlFor="confirmPassword"><Input type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" autoComplete="new-password" required value={formData.confirmPassword} onChange={change} placeholder="••••••••" /></FormField><div className="consent-group"><input type="checkbox" id="acceptedTerms" required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /><label htmlFor="acceptedTerms">I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</label></div><Button type="submit" className="button-full" loading={loading}>{loading ? 'Creating account…' : 'Create account'}</Button></form><p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p></div></main></div>;
};
*/
  const [errors, setErrors] = useState({});
  const [accountExists, setAccountExists] = useState(false);
  const [googleFlow, setGoogleFlow] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifiedTicket, setVerifiedTicket] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [otpShake, setOtpShake] = useState(false);
  const [otpResetKey, setOtpResetKey] = useState(0);
  const alertRef = useRef(null);
  const passwordRef = useRef(null);
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (accountExists || errors.form || errors.otp) alertRef.current?.focus();
  }, [accountExists, errors.form, errors.otp]);

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = window.setTimeout(() => setResendSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (verifiedTicket) passwordRef.current?.focus();
  }, [verifiedTicket]);

  const setFieldError = (field, message) => setErrors((current) => ({ ...current, [field]: message }));
  const emailIsValid = emailPattern.test(formData.email);
  const passwordsMatch = Boolean(formData.confirmPassword) && formData.password === formData.confirmPassword;
  const canComplete = Boolean(verifiedTicket) && passwordIsValid(formData.password) && passwordsMatch && acceptedTerms;
  const passwordScore = [formData.password.length >= 8, /[A-Za-z]/.test(formData.password), /\d/.test(formData.password), passwordIsValid(formData.password) && formData.password.length >= 12].filter(Boolean).length;

  const completeLogin = ({ user: authenticatedUser, token }) => {
    login(authenticatedUser, token);
    showToast('Welcome to Warranta! Your account is ready.', 'success');
    navigate('/dashboard');
  };

  const resetVerification = () => {
    setOtpSent(false);
    setOtp('');
    setVerifiedTicket('');
    setResendSeconds(0);
    setOtpResetKey((current) => current + 1);
    setErrors((current) => ({ ...current, otp: '', form: '' }));
    setStep(1);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setAccountExists(false);
    if (errors[name]) setFieldError(name, '');
  };

  const startOtp = async () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Enter your full name.';
    if (!formData.email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!emailIsValid) nextErrors.email = 'Enter a valid email address.';
    setErrors((current) => ({ ...current, ...nextErrors, form: '', otp: '' }));
    if (Object.keys(nextErrors).length || sendingOtp) return;

    setSendingOtp(true);
    try {
      const response = await registerStart({ name: formData.name, email: formData.email });
      setOtpSent(true);
      setOtp('');
      setOtpResetKey((current) => current + 1);
      setResendSeconds(response.data.resendAfter ?? 45);
      setErrors((current) => ({ ...current, form: 'If this email can be used, we\'ve sent a 6-digit code.' }));
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data?.code === 'RESEND_TOO_SOON' || data?.code === 'SEND_LIMIT') {
        setResendSeconds(data.retryAfter ?? 45);
        setErrors((current) => ({ ...current, otp: data.code === 'SEND_LIMIT' ? 'Too many codes requested. Please try again later.' : 'Please wait before requesting another code.' }));
      } else {
        setErrors((current) => ({ ...current, form: data?.message || 'Unable to send a verification code. Please try again.' }));
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (code) => {
    if (verifyingOtp || code.length !== 6) return;
    setVerifyingOtp(true);
    setErrors((current) => ({ ...current, otp: '' }));
    try {
      const response = await registerVerify({ email: formData.email, code });
      setVerifiedTicket(response.data.verifiedTicket);
      window.setTimeout(() => {
        setOtp('');
        setStep(2);
      }, 600);
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data?.code === 'TOO_MANY_ATTEMPTS') {
        resetVerification();
        setErrors((current) => ({ ...current, form: 'Too many incorrect codes. Please request a new code.' }));
      } else {
        const message = data?.code === 'CODE_EXPIRED'
          ? 'Code expired. Please resend.'
          : data?.code === 'CODE_INVALID'
            ? `Wrong code. ${data.attemptsLeft} attempts left.`
            : 'Unable to verify the code. Please try again.';
        setErrors((current) => ({ ...current, otp: message }));
        setOtp('');
        setOtpShake(true);
        setOtpResetKey((current) => current + 1);
        window.setTimeout(() => setOtpShake(false), 300);
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!verifiedTicket) nextErrors.form = 'Please verify your email before creating an account.';
    if (!passwordIsValid(formData.password)) nextErrors.password = 'Use at least 8 characters with a letter and a number.';
    if (!passwordsMatch) nextErrors.confirmPassword = 'Passwords do not match.';
    if (!acceptedTerms) nextErrors.acceptedTerms = 'You must agree to the Terms and Privacy Policy.';
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (completing || Object.keys(nextErrors).length) return;

    setCompleting(true);
    try {
      const response = await registerComplete({ verifiedTicket, password: formData.password, acceptedTerms });
      completeLogin(response.data);
    } catch (requestError) {
      const data = requestError.response?.data;
      if (data?.code === 'TICKET_EXPIRED') {
        resetVerification();
        setErrors((current) => ({ ...current, form: 'Verification expired. Please verify your email again.' }));
      } else if (data?.code === 'ACCOUNT_EXISTS') {
        setAccountExists(true);
      } else {
        setErrors((current) => ({ ...current, form: data?.message || 'Registration failed. Please try again.' }));
      }
    } finally {
      setCompleting(false);
    }
  };

  if (user) return <Navigate to="/dashboard" replace />;

  const clearGoogleFlow = ({ message } = {}) => {
    setGoogleFlow(null);
    if (message) setErrors({ form: message });
  };

  const maskedEmail = formData.email.replace(/^(.).*(@.*)$/, '$1***$2');
  const authContent = googleFlow ? <GoogleFinishCard flow={googleFlow.type} ticket={googleFlow.ticket} profile={googleFlow.profile} maskedEmail={googleFlow.maskedEmail} onSuccess={completeLogin} onUseDifferentAccount={clearGoogleFlow} /> : <>
    <p className="eyebrow">Create your account</p>
    <h1>Start tracking smarter</h1>
    <p className="auth-subtitle">It only takes a minute.</p>
    <GoogleButton onSuccess={completeLogin} onNotFound={({ signupTicket, profile }) => setGoogleFlow({ type: 'signup', ticket: signupTicket, profile })} onLinkRequired={({ linkTicket, maskedEmail: googleMaskedEmail }) => setGoogleFlow({ type: 'link', ticket: linkTicket, maskedEmail: googleMaskedEmail })} />
    <div className="google-button__divider"><span>or continue with email</span></div>
    {accountExists && <div className="form-alert" ref={alertRef} role="alert" tabIndex="-1">An account may already exist with this email. <Link to="/login">Sign in</Link> or <Link to="/forgot-password">Reset password</Link>.</div>}
    {errors.form && errors.form !== 'If this email can be used, we\'ve sent a 6-digit code.' && <div className="form-alert" ref={alertRef} role="alert" tabIndex="-1">{errors.form}</div>}
    <div className="otp-registration">
      <FormField className="otp-registration__field" label="Full name" htmlFor="name" error={errors.name}><Input id="name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} placeholder="Jane Doe" autoFocus /></FormField>
      <div className="otp-registration__email-row"><FormField className="otp-registration__field" label="Email address" htmlFor="email" error={errors.email}><div className={`otp-registration__email-control${verifiedTicket ? ' otp-registration__email-control--verified' : ''}`}><Input type="email" id="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} readOnly={otpSent || Boolean(verifiedTicket)} placeholder="you@example.com" />{verifiedTicket && <span className="otp-registration__email-check" aria-hidden="true"><CheckIcon /></span>}</div>{errors.form === 'If this email can be used, we\'ve sent a 6-digit code.' && !verifiedTicket && <span className="otp-registration__info" role="status"><span aria-hidden="true">ⓘ</span>{errors.form}</span>}</FormField><Button type="button" className="otp-registration__send" onClick={startOtp} disabled={!emailIsValid || sendingOtp || Boolean(verifiedTicket)} loading={sendingOtp}>{otpSent ? 'Resend OTP' : 'Send OTP'}</Button></div>
      {(otpSent || verifiedTicket) && <div className="otp-registration__section">
        {!verifiedTicket && <><div className="otp-registration__otp-heading"><label htmlFor="otp-input">Enter OTP</label><span>Code sent to {maskedEmail}</span></div><OtpInput value={otp} onChange={setOtp} onVerify={verifyOtp} disabled={verifyingOtp} resetKey={otpResetKey} shake={otpShake} />{errors.otp && <span className="otp-registration__error" ref={alertRef} role="alert" aria-live="assertive" tabIndex="-1"><span aria-hidden="true">!</span>{errors.otp}</span>}<div className="otp-registration__otp-actions" aria-live="polite">{resendSeconds ? <span className="otp-registration__meta">Resend OTP in {resendSeconds}s</span> : <button className="otp-registration__resend" type="button" onClick={startOtp} disabled={sendingOtp}>Resend OTP</button>}<button className="otp-registration__change" type="button" onClick={resetVerification}>Change email</button></div></>}
        {verifiedTicket && <div className="otp-registration__verified-row"><span className="otp-registration__verified" role="status" aria-live="polite"><CheckIcon />Email verified</span><button className="otp-registration__change" type="button" onClick={resetVerification}>Change email</button></div>}
      </div>}
      {verifiedTicket && <div className="otp-registration__passwords">
        <FormField className="otp-registration__field" label="Password" htmlFor="password" error={errors.password}><div className="password-control otp-registration__password-control"><input className="input" ref={passwordRef} type={showPassword ? 'text' : 'password'} id="password" name="password" autoComplete="new-password" value={formData.password} onChange={handleChange} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></FormField>
        <div className="otp-registration__strength"><div className="otp-registration__strength-title"><span>Password strength</span><strong>{passwordScore < 2 ? 'Weak' : passwordScore < 3 ? 'Fair' : passwordScore < 4 ? 'Good' : 'Strong'}</strong></div><div className="otp-registration__segments" aria-hidden="true">{[1, 2, 3, 4].map((segment) => <span key={segment} data-active={segment <= passwordScore} />)}</div><ul className="otp-registration__checklist"><li data-met={formData.password.length >= 8}><span aria-hidden="true">{formData.password.length >= 8 ? '✓' : '○'}</span>8+ characters</li><li data-met={/[A-Za-z]/.test(formData.password)}><span aria-hidden="true">{/[A-Za-z]/.test(formData.password) ? '✓' : '○'}</span>A letter</li><li data-met={/\d/.test(formData.password)}><span aria-hidden="true">{/\d/.test(formData.password) ? '✓' : '○'}</span>A number</li></ul></div>
        <FormField className="otp-registration__field" label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}><div className="password-control otp-registration__password-control"><Input type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></FormField>
        {formData.confirmPassword && <span className="otp-registration__match" data-match={passwordsMatch}><span aria-hidden="true">{passwordsMatch ? '✓' : '!'}</span>{passwordsMatch ? 'Passwords match.' : 'Passwords don\'t match.'}</span>}
        <div className="consent-group otp-registration__terms"><input type="checkbox" id="acceptedTerms" checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); if (errors.acceptedTerms) setFieldError('acceptedTerms', ''); }} aria-invalid={Boolean(errors.acceptedTerms)} aria-describedby={errors.acceptedTerms ? 'acceptedTerms-error' : undefined} /><label htmlFor="acceptedTerms">I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</label></div>
        {errors.acceptedTerms && <span className="field-error" id="acceptedTerms-error" role="alert">{errors.acceptedTerms}</span>}
        <Button type="button" className="button-full" onClick={submit} disabled={!canComplete || completing} loading={completing}>{completing ? 'Creating account...' : 'Create account'}</Button>
        {!canComplete && <span className="otp-registration__submit-helper" aria-live="polite">Verify your email, create a password and accept the Terms to continue.</span>}
      </div>}
    </div>
    <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
  </>;

  return <div className="auth-layout"><aside className="auth-brand-panel"><div className="auth-brand"><span className="brand-mark">W</span><span>Warranty Tracker</span></div><div><p className="eyebrow">Start simply</p><h1>Make every purchase easier to protect.</h1><p>Your personal home for bills, coverage dates, and claim-ready details.</p></div><div className="auth-brand-note"><span aria-hidden="true">✓</span> Free to organize your warranties</div><CardStack variant="register" /></aside><main className="auth-form-panel"><div className={`auth-form-wrap${googleFlow ? '' : ' otp-registration-wrap'}`}>{authContent}</div></main></div>;
};

export default Register;
