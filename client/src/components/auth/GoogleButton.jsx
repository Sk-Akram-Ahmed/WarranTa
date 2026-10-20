import { useEffect, useRef, useState } from 'react';
import { googleLogin } from '../../api/axiosInstance';
import './GoogleButton.css';

const scriptId = 'google-identity-services';

const loadGoogle = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve();
  let script = document.getElementById(scriptId);
  const onLoad = () => resolve();
  const onError = () => reject(new Error('Google Identity Services unavailable'));
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  script.addEventListener('load', onLoad, { once: true });
  script.addEventListener('error', onError, { once: true });
});

const GoogleButton = ({ mode, disabled = false, onSuccess, onAccountNotFound, onAccountExists, acceptedTerms, className = '' }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not configured.');
      return undefined;
    }
    let cancelled = false;
    const render = () => {
      if (cancelled || !containerRef.current) return;
      const width = Math.min(400, Math.floor(containerRef.current.getBoundingClientRect().width));
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential || cancelled) return;
          setError('');
          setLoading(true);
          try {
            const response = await googleLogin(credential, mode, acceptedTerms);
            onSuccess(response.data);
          } catch (err) {
            const data = err.response?.data;
            if (data?.code === 'ACCOUNT_NOT_FOUND') onAccountNotFound?.(data.profile, credential);
            else if (data?.code === 'ACCOUNT_EXISTS') onAccountExists?.();
            else if (!cancelled) setError(err.response?.status === 401 ? 'Session expired. Please click Continue with Google again.' : 'Google sign-in failed. Please try again.');
          } finally {
            if (!cancelled) setLoading(false);
          }
        },
      });
      containerRef.current.replaceChildren();
      window.google.accounts.id.renderButton(containerRef.current, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'left', width });
    };
    loadGoogle().then(render).catch(() => !cancelled && setError('Google sign-in is unavailable right now. Use email instead.'));
    const observer = new ResizeObserver(render);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, [clientId, onSuccess]);

  if (!clientId) return null;
  return <div className={`google-button ${className}`} aria-busy={loading}>
    <div className={loading || disabled ? 'google-button__official google-button__official--loading' : 'google-button__official'} ref={containerRef} />
    {loading && <span className="google-button__loading">Signing in with Google...</span>}
    {error && <div className="google-button__error" role="alert">{error}</div>}
  </div>;
};

export default GoogleButton;
