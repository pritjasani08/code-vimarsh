const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sendContactEmail } = require('../services/emailService');

// Contact form submission
router.post('/contact', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    // Send email to frutrigo786@gmail.com
    const emailResult = await sendContactEmail({
      fromName: name,
      fromEmail: email,
      subject: subject,
      message: message
    });

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      });
    } else {
      console.error('Failed to send contact email:', emailResult.error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message
    });
  }
});

module.exports = router;

