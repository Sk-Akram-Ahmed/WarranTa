import { useEffect, useRef, useState } from 'react';
import { googleLogin } from '../../api/axiosInstance';
import './GoogleButton.css';

const scriptId = 'google-identity-services';
const unavailableMessage = 'Google sign-in was cancelled or is unavailable. Use email instead.';

const loadGoogle = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) {
    resolve();
    return;
  }

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

const GoogleButton = ({ onSuccess, onNotFound, onLinkRequired, onError, className = '' }) => {
  const containerRef = useRef(null);
  const callbacksRef = useRef({ onSuccess, onNotFound, onLinkRequired, onError });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    callbacksRef.current = { onSuccess, onNotFound, onLinkRequired, onError };
  }, [onSuccess, onNotFound, onLinkRequired, onError]);

  useEffect(() => {
    if (!clientId) {
      setError(unavailableMessage);
      callbacksRef.current.onError?.(unavailableMessage);
      return undefined;
    }

    let cancelled = false;
    const reportError = (message) => {
      if (cancelled) return;
      setError(message);
      callbacksRef.current.onError?.(message);
    };

    const handleCredential = async ({ credential }) => {
      if (!credential || cancelled) {
        reportError(unavailableMessage);
        return;
      }

      setError('');
      setLoading(true);
      try {
        const response = await googleLogin(credential);
        callbacksRef.current.onSuccess?.(response.data);
      } catch (requestError) {
        const data = requestError.response?.data;
        if (data?.code === 'ACCOUNT_NOT_FOUND') {
          callbacksRef.current.onNotFound?.({
            signupTicket: data.signupTicket,
            profile: data.profile,
          });
        } else if (data?.code === 'LINK_REQUIRED') {
          callbacksRef.current.onLinkRequired?.({
            linkTicket: data.linkTicket,
            maskedEmail: data.maskedEmail,
          });
        } else {
          reportError(data?.message || 'Google sign-in failed. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const render = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
      const width = Math.max(240, Math.min(400, Math.floor(containerRef.current.getBoundingClientRect().width)));

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        error_callback: () => reportError(unavailableMessage),
      });
      containerRef.current.replaceChildren();
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width,
      });
    };

    loadGoogle().then(render).catch(() => reportError(unavailableMessage));
    const observer = new ResizeObserver(render);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [clientId]);

  return (
    <div className={`google-button ${className}`} aria-busy={loading}>
      <div
        className={loading ? 'google-button__official google-button__official--loading' : 'google-button__official'}
        ref={containerRef}
      />
      {loading && <span className="google-button__loading">Signing in with Google...</span>}
      {error && <div className="google-button__error" role="alert">{error}</div>}
    </div>
  );
};

export default GoogleButton;
