const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { adminAuth } = require('../middleware/auth');

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query; // 'upcoming' or 'past'
    
    let query = `SELECT id, name, description, registration_link, event_date, is_upcoming, created_at 
                 FROM events`;
    
    const params = [];
    
    if (type === 'upcoming') {
      query += ' WHERE is_upcoming = TRUE';
    } else if (type === 'past') {
      query += ' WHERE is_upcoming = FALSE';
    }
    
    query += ' ORDER BY event_date DESC';
    
    const [events] = await pool.execute(query, params);

    const formatted = events.map(event => ({
      id: event.id,
      name: event.name,
      description: event.description,
      registrationLink: event.registration_link,
      eventDate: event.event_date,
      isUpcoming: event.is_upcoming === 1 || event.is_upcoming === true,
      createdAt: event.created_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT id, name, description, registration_link, event_date, is_upcoming 
       FROM events WHERE id = ?`,
      [req.params.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = events[0];
    res.json({
      id: event.id,
      name: event.name,
      description: event.description,
      registrationLink: event.registration_link,
      eventDate: event.event_date,
      isUpcoming: event.is_upcoming === 1 || event.is_upcoming === true
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create event (admin only)
router.post('/', adminAuth, [
  body('name').trim().notEmpty().withMessage('Event name is required'),
  body('description').trim().notEmpty().withMessage('Event description is required'),
  body('eventDate').notEmpty().withMessage('Event date is required'),
  body('registrationLink').optional().isURL().withMessage('Registration link must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, registrationLink, eventDate } = req.body;
    
    // Determine if event is upcoming
    const eventDateTime = new Date(eventDate);
    const now = new Date();
    const isUpcoming = eventDateTime > now;

    const [result] = await pool.execute(
      `INSERT INTO events (name, description, registration_link, event_date, is_upcoming) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, description, registrationLink || '', eventDate, isUpcoming]
    );

    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: {
        id: events[0].id,
        name: events[0].name,
        description: events[0].description,
        registrationLink: events[0].registration_link,
        eventDate: events[0].event_date,
        isUpcoming: events[0].is_upcoming === 1 || events[0].is_upcoming === true
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event (admin only)
router.put('/:id', adminAuth, [
  body('name').optional().trim().notEmpty().withMessage('Event name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Event description cannot be empty'),
  body('registrationLink').optional().isURL().withMessage('Registration link must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, registrationLink, eventDate } = req.body;

    // Check if event exists
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (description) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (registrationLink !== undefined) {
      updateFields.push('registration_link = ?');
      updateValues.push(registrationLink || '');
    }

    if (eventDate) {
      updateFields.push('event_date = ?');
      updateValues.push(eventDate);
      // Update is_upcoming based on new date
      const eventDateTime = new Date(eventDate);
      const now = new Date();
      updateFields.push('is_upcoming = ?');
      updateValues.push(eventDateTime > now);
    }

    if (updateFields.length > 0) {
      updateValues.push(req.params.id);
      await pool.execute(
        `UPDATE events SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const [updatedEvents] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Event updated successfully',
      event: {
        id: updatedEvents[0].id,
        name: updatedEvents[0].name,
        description: updatedEvents[0].description,
        registrationLink: updatedEvents[0].registration_link,
        eventDate: updatedEvents[0].event_date,
        isUpcoming: updatedEvents[0].is_upcoming === 1 || updatedEvents[0].is_upcoming === true
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const [events] = await pool.execute(
      'SELECT id FROM events WHERE id = ?',
      [req.params.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await pool.execute('DELETE FROM events WHERE id = ?', [req.params.id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

