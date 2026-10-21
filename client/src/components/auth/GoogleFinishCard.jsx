import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { googleLink, googleSignup } from '../../api/axiosInstance';
import './GoogleFinishCard.css';

const GoogleFinishCard = ({ flow, ticket, profile, maskedEmail, onSuccess, onUseDifferentAccount }) => {
  const cardRef = useRef(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  const finishSignup = async () => {
    if (!acceptedTerms || loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await googleSignup(ticket);
      onSuccess(response.data);
    } catch (requestError) {
      if (requestError.response?.data?.code === 'TICKET_EXPIRED') {
        onUseDifferentAccount({ message: 'Session expired. Please click Continue with Google again.' });
      } else {
        setError(requestError.response?.data?.message || 'Unable to create your account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const connectGoogle = async (event) => {
    event.preventDefault();
    if (!password || loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await googleLink(ticket, password);
      onSuccess(response.data);
    } catch {
      setError('Unable to connect Google. Check your password and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (flow === 'link') {
    return (
      <section className="google-finish-card" ref={cardRef} tabIndex="-1" aria-labelledby="google-link-title">
        <h2 id="google-link-title">Connect your Google account</h2>
        <p>An account already exists for {maskedEmail}. Enter your Warranta password to connect Google.</p>
        {error && <div className="google-finish-card__error" id="google-link-error" role="alert">{error}</div>}
        <form onSubmit={connectGoogle} noValidate>
          <label htmlFor="google-link-password">Warranta password</label>
          <div className="google-finish-card__password">
            <input
              id="google-link-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={error ? 'google-link-error' : undefined}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button className="button button-primary google-finish-card__action" type="submit" disabled={loading || !password} aria-busy={loading}>
            {loading ? 'Connecting...' : 'Connect and sign in'}
          </button>
        </form>
        <Link to="/forgot-password">Forgot your password?</Link>
        <button className="google-finish-card__link" type="button" onClick={onUseDifferentAccount}>Use a different account</button>
      </section>
    );
  }

  return (
    <div className="google-finish-card__wrap">
      <section className="google-finish-card" ref={cardRef} tabIndex="-1" aria-labelledby="google-finish-title">
        <div className="google-finish-card__profile">
          {profile?.picture ? <img src={profile.picture} alt="" /> : <span aria-hidden="true">{profile?.name?.slice(0, 1) || 'G'}</span>}
          <div>
            <strong>{profile?.name}</strong>
            <span>{profile?.email}</span>
          </div>
        </div>
        <h2 id="google-finish-title">Finish signing up with Google</h2>
        {error && <div className="google-finish-card__error" role="alert">{error}</div>}
        <div className="google-finish-card__divider" aria-hidden="true" />
        <label className="google-finish-card__terms">
          <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
          <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
        </label>
        <button className="button button-primary google-finish-card__action" type="button" onClick={finishSignup} disabled={!acceptedTerms || loading} aria-busy={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </section>
      <button className="google-finish-card__link" type="button" onClick={onUseDifferentAccount}>Use a different account</button>
    </div>
  );
};

export default GoogleFinishCard;
