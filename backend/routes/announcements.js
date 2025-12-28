const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all active announcements (optionally filter by type)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = `SELECT id, title, content, type, date, is_active, created_at, updated_at 
                 FROM announcements 
                 WHERE is_active = TRUE`;
    const params = [];

    // Filter by type if provided
    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY date DESC`;

    const [announcements] = await pool.execute(query, params);

    const formatted = announcements.map(ann => ({
      _id: ann.id,
      title: ann.title,
      content: ann.content,
      type: ann.type,
      date: ann.date,
      isActive: ann.is_active
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single announcement
router.get('/:id', async (req, res) => {
  try {
    const [announcements] = await pool.execute(
      `SELECT id, title, content, type, date, is_active 
       FROM announcements 
       WHERE id = ? AND is_active = TRUE`,
      [req.params.id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const ann = announcements[0];
    res.json({
      _id: ann.id,
      title: ann.title,
      content: ann.content,
      type: ann.type,
      date: ann.date,
      isActive: ann.is_active
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
