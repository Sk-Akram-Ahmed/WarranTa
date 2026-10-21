import React, { createContext, useEffect, useRef, useState } from 'react';
import api, { acceptTerms } from '../api/axiosInstance';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [termsOutdated, setTermsOutdated] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const acceptButtonRef = useRef(null);

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setTermsOutdated(Boolean(response.data.termsOutdated));
      } catch {
        setToken(null);
        setUser(null);
        setTermsOutdated(false);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token]);

  useEffect(() => {
    if (termsOutdated) acceptButtonRef.current?.focus();
  }, [termsOutdated]);

  const login = (userData, receivedToken) => {
    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setTermsOutdated(false);
  };

  const handleAcceptTerms = async () => {
    if (acceptingTerms) return;
    setAcceptingTerms(true);
    try {
      const response = await acceptTerms();
      setUser(response.data.user);
      setTermsOutdated(false);
    } finally {
      setAcceptingTerms(false);
    }
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
      {termsOutdated && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="terms-outdated-title"><section className="modal-content"><div className="modal-header"><h2 className="modal-title" id="terms-outdated-title">We've updated our Terms</h2></div><div className="modal-body"><p className="modal-copy">Please review and agree to our <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> to continue.</p></div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={logout}>Log out</button><button type="button" className="button button-primary" ref={acceptButtonRef} onClick={handleAcceptTerms} disabled={acceptingTerms} aria-busy={acceptingTerms}>{acceptingTerms ? 'Saving...' : 'I agree'}</button></div></section></div>}
    </AuthContext.Provider>
  );
};
