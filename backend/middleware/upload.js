const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const teamPhotosDir = path.join(uploadsDir, 'team');
const galleryDir = path.join(uploadsDir, 'gallery');

[uploadsDir, teamPhotosDir, galleryDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for team photos
const teamStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, teamPhotosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for gallery images (organized by event name)
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const eventName = req.body.eventName || 'general';
    // Sanitize event name for folder name
    const sanitizedEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const eventDir = path.join(galleryDir, sanitizedEventName);
    
    // Create event directory if it doesn't exist
    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true });
    }
    
    cb(null, eventDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Upload middleware for team photos
const uploadTeamPhoto = multer({
  storage: teamStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter
});

// Upload middleware for gallery images
const uploadGalleryImage = multer({
  storage: galleryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: imageFilter
});

module.exports = {
  uploadTeamPhoto: uploadTeamPhoto.single('photo'),
  uploadGalleryImages: uploadGalleryImage.array('images', 20) // Allow up to 20 images at once
};

