import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OTPVerification.css';

const OTPVerification = ({ email, onVerified, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp: otpString
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        onVerified(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { email });
      setOtp(['', '', '', '', '', '']);
      setTimer(600); // Reset timer
      setError('');
      alert('OTP has been resent to your email. Please check your inbox.');
      if (onResend) onResend();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="otp-verification">
      <div className="otp-header">
        <h2>Verify Your Email</h2>
        <p>We've sent a 6-digit OTP to <strong>{email}</strong></p>
      </div>

      {error && <div className="otp-error">{error}</div>}

      <form onSubmit={handleSubmit} className="otp-form">
        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="otp-input"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="otp-timer">
          {timer > 0 ? (
            <p>OTP expires in: <span className="timer-countdown">{formatTime(timer)}</span></p>
          ) : (
            <p className="timer-expired">OTP has expired</p>
          )}
        </div>

        <button
          type="submit"
          className="btn-verify-otp"
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          className="btn-resend-otp"
          disabled={resendLoading || timer > 0}
        >
          {resendLoading ? 'Sending...' : 'Resend OTP'}
        </button>
      </form>

      <div className="otp-help">
        <p>Didn't receive the OTP? Check your spam folder or click "Resend OTP" after the timer expires.</p>
      </div>
    </div>
  );
};

export default OTPVerification;

