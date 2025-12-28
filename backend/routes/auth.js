const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { sendOTPEmail } = require('../services/emailService');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Signup - Step 1: Register user and send OTP
router.post('/signup', [
  body('prn').trim().notEmpty().withMessage('PRN is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').optional().custom((value, { req }) => {
    if (value && value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prn, username, mobileNumber, email, password } = req.body;

    // Check if email already exists
    const [emailCheck] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if PRN already exists
    const [prnCheck] = await pool.execute(
      'SELECT id FROM users WHERE prn = ?',
      [prn]
    );

    if (prnCheck.length > 0) {
      return res.status(400).json({ message: 'PRN already exists' });
    }

    // Check if username already exists
    const [usernameCheck] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (usernameCheck.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Insert user (unverified)
    const [result] = await pool.execute(
      `INSERT INTO users (prn, username, email, mobile_number, password, email_verified, otp, otp_expires_at) 
       VALUES (?, ?, ?, ?, ?, FALSE, ?, ?)`,
      [prn, username, email, mobileNumber, hashedPassword, otp, otpExpires]
    );

    // Store OTP in otp_verifications table
    await pool.execute(
      `INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)`,
      [email, otp, otpExpires]
    );

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      // If email fails, still create user but log error
      console.error('Failed to send OTP email:', emailResult.error);
    }

    res.status(201).json({
      message: 'User registered successfully. Please verify your email with the OTP sent to your inbox.',
      userId: result.insertId,
      emailSent: emailResult.success,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error message
    let errorMessage = 'Server error';
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('email')) {
        errorMessage = 'Email already exists';
      } else if (error.sqlMessage.includes('prn')) {
        errorMessage = 'PRN already exists';
      } else if (error.sqlMessage.includes('username')) {
        errorMessage = 'Username already exists';
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Database connection failed. Please check MySQL is running.';
    } else {
      errorMessage = error.message || 'Server error';
    }
    
    res.status(500).json({ message: errorMessage, error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Check OTP in otp_verifications table
    const [otpRecords] = await pool.execute(
      `SELECT * FROM otp_verifications 
       WHERE email = ? AND otp = ? AND expires_at > NOW() AND verified = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (otpRecords.length === 0) {
      // Increment attempts
      await pool.execute(
        `UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = ?`,
        [email]
      );
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as verified
    await pool.execute(
      `UPDATE otp_verifications SET verified = TRUE WHERE email = ? AND otp = ?`,
      [email, otp]
    );

    // Update user as verified
    await pool.execute(
      `UPDATE users SET email_verified = TRUE, otp = NULL, otp_expires_at = NULL WHERE email = ?`,
      [email]
    );

    // Get user
    const [users] = await pool.execute(
      'SELECT id, prn, username, email, mobile_number FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        prn: user.prn,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobile_number
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (users[0].email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Update user OTP
    await pool.execute(
      `UPDATE users SET otp = ?, otp_expires_at = ? WHERE email = ?`,
      [otp, otpExpires, email]
    );

    // Store in otp_verifications
    await pool.execute(
      `INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)`,
      [email, otp, otpExpires]
    );

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    res.json({
      message: 'OTP resent successfully',
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fixed credentials for admin access
const FIXED_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const FIXED_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Login
router.post('/login', [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('username').optional().trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    // Check for fixed credentials login
    if (username && username === FIXED_ADMIN_USERNAME && password === FIXED_ADMIN_PASSWORD) {
      // Find or create admin user
      let [users] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [FIXED_ADMIN_USERNAME]
      );

      let user;
      if (users.length === 0) {
        // Create admin user if doesn't exist
        const hashedPassword = await bcrypt.hash(FIXED_ADMIN_PASSWORD, 10);
        const [result] = await pool.execute(
          `INSERT INTO users (prn, username, email, mobile_number, password, email_verified, is_admin) 
           VALUES (?, ?, ?, ?, ?, TRUE, TRUE)`,
          ['ADMIN001', FIXED_ADMIN_USERNAME, 'admin@codevimarsh.com', '9999999999', hashedPassword]
        );
        
        [users] = await pool.execute(
          'SELECT * FROM users WHERE id = ?',
          [result.insertId]
        );
        user = users[0];
      } else {
        user = users[0];
        // Update user to be admin if not already
        if (!user.is_admin) {
          await pool.execute(
            'UPDATE users SET is_admin = TRUE WHERE id = ?',
            [user.id]
          );
          user.is_admin = true;
        }
      }

      const token = generateToken(user.id);

      return res.json({
        token,
        user: {
          id: user.id,
          prn: user.prn,
          username: user.username,
          email: user.email,
          mobileNumber: user.mobile_number,
          isAdmin: true
        }
      });
    }

    // Regular email/password login
    if (!email) {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        message: 'Please verify your email first. Check your inbox for OTP.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        prn: user.prn,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobile_number,
        isAdmin: user.is_admin === 1 || user.is_admin === true
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Server error';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Database connection failed. Please check MySQL is running.';
    } else {
      errorMessage = error.message || 'Server error';
    }
    
    res.status(500).json({ message: errorMessage, error: error.message });
  }
});

module.exports = router;
