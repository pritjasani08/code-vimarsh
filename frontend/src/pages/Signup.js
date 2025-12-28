import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import OTPVerification from '../components/OTPVerification';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    prn: '',
    username: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // All fields are mandatory
    if (!formData.prn.trim()) {
      newErrors.prn = 'PRN is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Send all data including confirmPassword for validation
      const response = await axios.post(`${API_URL}/auth/signup`, {
        prn: formData.prn,
        username: formData.username,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.requiresVerification) {
        setUserEmail(formData.email);
        setShowOTP(true);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle different error types
      if (error.response?.data?.errors) {
        // Validation errors
        const validationErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.param) {
            validationErrors[err.param] = err.msg;
          }
        });
        setErrors(validationErrors);
      } else if (error.response?.data?.message) {
        // Server error message
        setErrors({ 
          submit: error.response.data.message 
        });
      } else if (error.message === 'Network Error') {
        setErrors({ 
          submit: 'Cannot connect to server. Please make sure the backend is running on port 5000.' 
        });
      } else {
        setErrors({ 
          submit: error.message || 'Signup failed. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = (data) => {
    // Store token and user data
    localStorage.setItem('token', data.token);
    // Redirect to home
    navigate('/');
    window.location.reload(); // Reload to update auth state
  };

  if (showOTP) {
    return (
      <div className="auth-page">
        <OTPVerification 
          email={userEmail}
          onVerified={handleOTPVerified}
        />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Sign Up</h1>
        <p className="auth-subtitle">Create your Code Vimarsh account</p>

        {errors.submit && (
          <div className="form-error-message">{errors.submit}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="prn" className="form-label">
              PRN <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="prn"
              name="prn"
              className={`form-input ${errors.prn ? 'input-error' : ''}`}
              value={formData.prn}
              onChange={handleChange}
              required
              placeholder="Enter your PRN"
            />
            {errors.prn && <div className="form-error">{errors.prn}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="mobileNumber" className="form-label">
              Mobile Number <span className="required-star">*</span>
            </label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              className={`form-input ${errors.mobileNumber ? 'input-error' : ''}`}
              value={formData.mobileNumber}
              onChange={handleChange}
              required
              placeholder="10-digit mobile number"
              maxLength="10"
            />
            {errors.mobileNumber && <div className="form-error">{errors.mobileNumber}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email <span className="required-star">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="required-star">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Minimum 6 characters"
              minLength="6"
            />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password <span className="required-star">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
              minLength="6"
            />
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
