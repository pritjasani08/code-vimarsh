const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Announcement = require('../models/Announcement');

dotenv.config();

const seedAnnouncements = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codevimarsh');
    console.log('Connected to MongoDB');

    // Clear existing announcements
    await Announcement.deleteMany({});
    console.log('Cleared existing announcements');

    // Add sample announcements
    const announcements = [
      {
        title: 'Welcome to Code Vimarsh!',
        content: 'We are excited to welcome all new members to Code Vimarsh. Join us for our upcoming workshops and events.',
        type: 'notice',
        date: new Date()
      },
      {
        title: 'Upcoming Coding Workshop',
        content: 'We will be hosting a workshop on React.js next week. Stay tuned for more details.',
        type: 'article',
        date: new Date()
      }
    ];

    await Announcement.insertMany(announcements);
    console.log('Announcements seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding announcements:', error);
    process.exit(1);
  }
};

seedAnnouncements();

