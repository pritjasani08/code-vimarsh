const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { adminAuth } = require('../middleware/auth');

// Admin routes for managing announcements
router.post('/announcements', adminAuth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('type').isIn(['article', 'notice', 'update', 'tech_news']).withMessage('Invalid announcement type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, type } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO announcements (title, content, type, is_active) 
       VALUES (?, ?, ?, TRUE)`,
      [title, content, type || 'notice']
    );

    const [announcements] = await pool.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: {
        id: announcements[0].id,
        title: announcements[0].title,
        content: announcements[0].content,
        type: announcements[0].type,
        date: announcements[0].date,
        isActive: announcements[0].is_active === 1 || announcements[0].is_active === true
      }
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/announcements/:id', adminAuth, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('type').optional().isIn(['article', 'notice', 'update', 'tech_news']).withMessage('Invalid announcement type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, type, isActive } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }

    if (content) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }

    if (type) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }

    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(isActive);
    }

    if (updateFields.length > 0) {
      updateValues.push(req.params.id);
      await pool.execute(
        `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const [announcements] = await pool.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({
      message: 'Announcement updated successfully',
      announcement: {
        id: announcements[0].id,
        title: announcements[0].title,
        content: announcements[0].content,
        type: announcements[0].type,
        date: announcements[0].date,
        isActive: announcements[0].is_active === 1 || announcements[0].is_active === true
      }
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/announcements/:id', adminAuth, async (req, res) => {
  try {
    const [announcements] = await pool.execute(
      'SELECT id FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await pool.execute('DELETE FROM announcements WHERE id = ?', [req.params.id]);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes for managing team members
router.post('/team', adminAuth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').trim().notEmpty().withMessage('Role is required'),
  body('photo').optional(), // Can be URL or file path
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('linkedin').optional().isURL().withMessage('LinkedIn must be a valid URL'),
  body('github').optional().isURL().withMessage('GitHub must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, role, photo, email, linkedin, github, displayOrder } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO team_members (name, role, photo, email, linkedin, github, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, role, photo || '', email || '', linkedin || '', github || '', displayOrder || 0]
    );

    const [members] = await pool.execute(
      'SELECT * FROM team_members WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Team member added successfully',
      member: {
        id: members[0].id,
        name: members[0].name,
        role: members[0].role,
        photo: members[0].photo,
        email: members[0].email,
        linkedin: members[0].linkedin,
        github: members[0].github,
        displayOrder: members[0].display_order
      }
    });
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/team/:id', adminAuth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('role').optional().trim().notEmpty().withMessage('Role cannot be empty'),
  body('photo').optional().isURL().withMessage('Photo must be a valid URL'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('linkedin').optional().isURL().withMessage('LinkedIn must be a valid URL'),
  body('github').optional().isURL().withMessage('GitHub must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, role, photo, email, linkedin, github, displayOrder } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (photo !== undefined) {
      updateFields.push('photo = ?');
      updateValues.push(photo || '');
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email || '');
    }

    if (linkedin !== undefined) {
      updateFields.push('linkedin = ?');
      updateValues.push(linkedin || '');
    }

    if (github !== undefined) {
      updateFields.push('github = ?');
      updateValues.push(github || '');
    }

    if (displayOrder !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(displayOrder);
    }

    if (updateFields.length > 0) {
      updateValues.push(req.params.id);
      await pool.execute(
        `UPDATE team_members SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const [members] = await pool.execute(
      'SELECT * FROM team_members WHERE id = ?',
      [req.params.id]
    );

    if (members.length === 0) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.json({
      message: 'Team member updated successfully',
      member: {
        id: members[0].id,
        name: members[0].name,
        role: members[0].role,
        photo: members[0].photo,
        email: members[0].email,
        linkedin: members[0].linkedin,
        github: members[0].github,
        displayOrder: members[0].display_order
      }
    });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/team/:id', adminAuth, async (req, res) => {
  try {
    const [members] = await pool.execute(
      'SELECT id FROM team_members WHERE id = ?',
      [req.params.id]
    );

    if (members.length === 0) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    await pool.execute('DELETE FROM team_members WHERE id = ?', [req.params.id]);

    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (admin only) - for making users admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, prn, username, email, mobile_number, is_admin, created_at FROM users ORDER BY created_at DESC'
    );

    const formatted = users.map(user => ({
      id: user.id,
      prn: user.prn,
      username: user.username,
      email: user.email,
      mobileNumber: user.mobile_number,
      isAdmin: user.is_admin === 1 || user.is_admin === true,
      createdAt: user.created_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

