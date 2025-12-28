const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { uploadTeamPhoto, uploadGalleryImages } = require('../middleware/upload');
const pool = require('../config/database');
const path = require('path');

// Upload team member photo
router.post('/team-photo', adminAuth, uploadTeamPhoto, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the file path relative to uploads directory
    const filePath = `/uploads/team/${req.file.filename}`;
    
    res.json({
      message: 'Photo uploaded successfully',
      photoPath: filePath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Upload gallery images
router.post('/gallery', adminAuth, uploadGalleryImages, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { eventName } = req.body;
    const sanitizedEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    const uploadedImages = [];
    
    for (const file of req.files) {
      const relativePath = `/uploads/gallery/${sanitizedEventName}/${file.filename}`;
      
      // Save to database
      const [result] = await pool.execute(
        `INSERT INTO gallery_images (event_name, image_path, image_name) 
         VALUES (?, ?, ?)`,
        [eventName, relativePath, file.filename]
      );
      
      uploadedImages.push({
        id: result.insertId,
        eventName: eventName,
        imagePath: relativePath,
        imageName: file.filename
      });
    }

    res.json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Get all gallery images (public)
router.get('/gallery', async (req, res) => {
  try {
    const { eventName } = req.query;
    
    let query = `SELECT id, event_name, image_path, image_name, uploaded_at 
                 FROM gallery_images`;
    const params = [];
    
    if (eventName) {
      query += ' WHERE event_name = ?';
      params.push(eventName);
    }
    
    query += ' ORDER BY uploaded_at DESC';
    
    const [images] = await pool.execute(query, params);
    
    res.json(images);
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unique event names for gallery
router.get('/gallery/events', async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT DISTINCT event_name, COUNT(*) as image_count 
       FROM gallery_images 
       GROUP BY event_name 
       ORDER BY event_name ASC`
    );
    
    res.json(events);
  } catch (error) {
    console.error('Get gallery events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete gallery image (admin only)
router.delete('/gallery/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get image info
    const [images] = await pool.execute(
      'SELECT image_path FROM gallery_images WHERE id = ?',
      [id]
    );
    
    if (images.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    const imagePath = images[0].image_path;
    const fs = require('fs');
    const fullPath = path.join(__dirname, '..', imagePath);
    
    // Delete file from filesystem
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    // Delete from database
    await pool.execute('DELETE FROM gallery_images WHERE id = ?', [id]);
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

