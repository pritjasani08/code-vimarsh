const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, prn, username, email, mobile_number, is_admin FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      prn: user.prn,
      username: user.username,
      email: user.email,
      mobileNumber: user.mobile_number,
      isAdmin: user.is_admin === 1 || user.is_admin === true
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Make user admin (admin only)
router.post('/make-admin', auth, [
  body('userId').isInt().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;

    // Update user to admin
    await pool.execute(
      'UPDATE users SET is_admin = TRUE WHERE id = ?',
      [userId]
    );

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('mobileNumber').optional().trim().notEmpty().withMessage('Mobile number cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, mobileNumber } = req.body;

    // Get current user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Check if email is being changed and if new email already exists
    if (email && email !== user.email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.userId]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update user
    const updateFields = [];
    const updateValues = [];

    if (email && email !== user.email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (mobileNumber) {
      updateFields.push('mobile_number = ?');
      updateValues.push(mobileNumber);
    }

    if (updateFields.length > 0) {
      updateValues.push(req.user.userId);
      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Get updated user
    const [updatedUsers] = await pool.execute(
      'SELECT id, prn, username, email, mobile_number FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUsers[0].id,
        prn: updatedUsers[0].prn,
        username: updatedUsers[0].username,
        email: updatedUsers[0].email,
        mobileNumber: updatedUsers[0].mobile_number
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
