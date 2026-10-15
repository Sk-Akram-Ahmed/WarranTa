import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/Button';
import Card from '../components/Card';
import FormField from '../components/FormField';
import Input from '../components/Input';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', formData);
      login(res.data.user, res.data.token);
      showToast('Logged in successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-auth">
      <Card className="auth-card">
        <h1 className="auth-heading">Welcome Back</h1>
        {error && (
          <div className="form-alert" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <FormField label="Email Address" htmlFor="email">
            <Input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <Input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </FormField>

          <Button type="submit" className="button-full" loading={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one here</Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
