const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all resources (public)
router.get('/', async (req, res) => {
  try {
    const [resources] = await pool.execute(
      `SELECT id, main_topic, subtopic, link, display_order 
       FROM resources 
       ORDER BY main_topic ASC, display_order ASC, subtopic ASC`
    );

    // Group by main topic
    const grouped = resources.reduce((acc, resource) => {
      if (!acc[resource.main_topic]) {
        acc[resource.main_topic] = [];
      }
      acc[resource.main_topic].push({
        id: resource.id,
        subtopic: resource.subtopic,
        link: resource.link
      });
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all resources as list (for admin)
router.get('/list', adminAuth, async (req, res) => {
  try {
    const [resources] = await pool.execute(
      `SELECT id, main_topic, subtopic, link, display_order, created_at 
       FROM resources 
       ORDER BY main_topic ASC, display_order ASC, subtopic ASC`
    );

    res.json(resources);
  } catch (error) {
    console.error('Get resources list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create resource (admin only)
router.post('/', adminAuth, [
  body('mainTopic').trim().notEmpty().withMessage('Main topic is required'),
  body('subtopic').trim().notEmpty().withMessage('Subtopic is required'),
  body('link').isURL().withMessage('Link must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mainTopic, subtopic, link, displayOrder } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO resources (main_topic, subtopic, link, display_order) 
       VALUES (?, ?, ?, ?)`,
      [mainTopic, subtopic, link, displayOrder || 0]
    );

    const [resources] = await pool.execute(
      'SELECT * FROM resources WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Resource created successfully',
      resource: {
        id: resources[0].id,
        mainTopic: resources[0].main_topic,
        subtopic: resources[0].subtopic,
        link: resources[0].link,
        displayOrder: resources[0].display_order
      }
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update resource (admin only)
router.put('/:id', adminAuth, [
  body('mainTopic').optional().trim().notEmpty().withMessage('Main topic cannot be empty'),
  body('subtopic').optional().trim().notEmpty().withMessage('Subtopic cannot be empty'),
  body('link').optional().isURL().withMessage('Link must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mainTopic, subtopic, link, displayOrder } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (mainTopic) {
      updateFields.push('main_topic = ?');
      updateValues.push(mainTopic);
    }

    if (subtopic) {
      updateFields.push('subtopic = ?');
      updateValues.push(subtopic);
    }

    if (link) {
      updateFields.push('link = ?');
      updateValues.push(link);
    }

    if (displayOrder !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(displayOrder);
    }

    if (updateFields.length > 0) {
      updateValues.push(req.params.id);
      await pool.execute(
        `UPDATE resources SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const [resources] = await pool.execute(
      'SELECT * FROM resources WHERE id = ?',
      [req.params.id]
    );

    if (resources.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({
      message: 'Resource updated successfully',
      resource: {
        id: resources[0].id,
        mainTopic: resources[0].main_topic,
        subtopic: resources[0].subtopic,
        link: resources[0].link,
        displayOrder: resources[0].display_order
      }
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete resource (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const [resources] = await pool.execute(
      'SELECT id FROM resources WHERE id = ?',
      [req.params.id]
    );

    if (resources.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await pool.execute('DELETE FROM resources WHERE id = ?', [req.params.id]);

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

