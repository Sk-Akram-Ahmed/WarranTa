import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Input from '../components/Input';
import CardStack from '../components/auth/CardStack';
import GoogleButton from '../components/auth/GoogleButton';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
export default Register;
