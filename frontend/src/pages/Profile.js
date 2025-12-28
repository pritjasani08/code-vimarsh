import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    mobileNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setFormData({
        email: user.email || '',
        mobileNumber: user.mobileNumber || ''
      });
    }
  }, [user, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
    setStatus({ type: '', message: '' });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
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
    setStatus({ type: '', message: '' });

    const result = await updateProfile(formData);

    if (result.success) {
      setStatus({
        type: 'success',
        message: 'Profile updated successfully!'
      });
    } else {
      setStatus({
        type: 'error',
        message: result.message || 'Failed to update profile'
      });
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="profile">
        <section className="section">
          <div className="container">
            <p>Loading profile...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="profile">
      <section className="section">
        <div className="container">
          <h1 className="section-title">My Profile</h1>

          <div className="profile-content">
            <div className="profile-card">
              <h2>Profile Information</h2>

              {status.message && (
                <div className={`form-status ${status.type}`}>
                  {status.message}
                </div>
              )}

              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="prn" className="form-label">PRN</label>
                  <input
                    type="text"
                    id="prn"
                    name="prn"
                    className="form-input"
                    value={user.prn || ''}
                    disabled
                  />
                  <small className="form-help">PRN cannot be changed</small>
                </div>

                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-input"
                    value={user.username || ''}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="mobileNumber" className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    className="form-input"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                  />
                  {errors.mobileNumber && (
                    <div className="form-error">{errors.mobileNumber}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;

