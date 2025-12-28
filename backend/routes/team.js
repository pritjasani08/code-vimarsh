const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all team members
router.get('/', async (req, res) => {
  try {
    const [members] = await pool.execute(
      `SELECT id, name, role, photo, email, linkedin, github, display_order 
       FROM team_members 
       ORDER BY display_order ASC, name ASC`
    );

    const formatted = members.map(member => ({
      _id: member.id,
      name: member.name,
      role: member.role,
      photo: member.photo || '',
      email: member.email || '',
      linkedin: member.linkedin || '',
      github: member.github || '',
      order: member.display_order
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
