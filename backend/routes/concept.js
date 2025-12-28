const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { adminAuth } = require('../middleware/auth');

// Get current concept of the day
router.get('/', async (req, res) => {
  try {
    // Get the most recent concept (only one should exist, but get latest just in case)
    const [concepts] = await pool.execute(
      `SELECT id, question, answer, created_at, updated_at 
       FROM concept_of_day 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (concepts.length === 0) {
      return res.json(null);
    }

    res.json({
      _id: concepts[0].id,
      question: concepts[0].question,
      answer: concepts[0].answer,
      createdAt: concepts[0].created_at,
      updatedAt: concepts[0].updated_at
    });
  } catch (error) {
    // If table doesn't exist, return null instead of error
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes('doesn\'t exist')) {
      console.log('Concept of day table does not exist yet. Please run the migration SQL.');
      return res.json(null);
    }
    console.error('Get concept of day error:', error);
    // Return null instead of error so frontend can handle gracefully
    return res.json(null);
  }
});

// Add/Update concept of the day (admin only)
// When a new concept is added, automatically remove the old one
router.post('/', adminAuth, [
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, answer } = req.body;

    // Start a transaction to ensure atomicity
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete all existing concepts (only one should exist, but delete all to be safe)
      await connection.execute('DELETE FROM concept_of_day');

      // Insert the new concept
      const [result] = await connection.execute(
        `INSERT INTO concept_of_day (question, answer) 
         VALUES (?, ?)`,
        [question, answer]
      );

      await connection.commit();

      // Fetch the newly created concept
      const [concepts] = await pool.execute(
        'SELECT * FROM concept_of_day WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        message: 'Concept of the day added successfully',
        concept: {
          _id: concepts[0].id,
          question: concepts[0].question,
          answer: concepts[0].answer,
          createdAt: concepts[0].created_at,
          updatedAt: concepts[0].updated_at
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Add concept of day error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

