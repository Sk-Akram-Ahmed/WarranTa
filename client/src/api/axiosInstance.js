import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const googleLogin = (credential) => api.post('/auth/google', { credential });
export const googleSignup = (signupTicket) => api.post('/auth/google/signup', { signupTicket, acceptedTerms: true });
export const googleLink = (linkTicket, password) => api.post('/auth/google/link', { linkTicket, password });
export const acceptTerms = () => api.post('/auth/accept-terms');
export const registerStart = ({ name, email }) => api.post('/auth/register/start', { name, email });
export const registerVerify = ({ email, code }) => api.post('/auth/register/verify', { email, code });
export const registerComplete = ({ verifiedTicket, password, acceptedTerms }) => api.post('/auth/register/complete', { verifiedTicket, password, acceptedTerms });

export default api;
