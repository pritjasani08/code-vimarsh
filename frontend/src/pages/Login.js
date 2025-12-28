import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.emailOrUsername, formData.password);

      if (result.success) {
        navigate('/');
      } else {
        if (result.requiresVerification) {
          setError('Please verify your email first. Check your inbox for OTP or sign up again.');
        } else {
          setError(result.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Welcome back to Code Vimarsh</p>

        {error && <div className="form-error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="emailOrUsername" className="form-label">
              Email or Username <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="emailOrUsername"
              name="emailOrUsername"
              className={`form-input ${error ? 'input-error' : ''}`}
              value={formData.emailOrUsername}
              onChange={handleChange}
              required
              placeholder="your.email@example.com or username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="required-star">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${error ? 'input-error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
