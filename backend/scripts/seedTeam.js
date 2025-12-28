const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TeamMember = require('../models/TeamMember');

dotenv.config();

const seedTeamMembers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codevimarsh');
    console.log('Connected to MongoDB');

    // Clear existing team members
    await TeamMember.deleteMany({});
    console.log('Cleared existing team members');

    // Add sample team members
    // Replace these with actual team data from codevimarsh.in
    const teamMembers = [
      {
        name: 'Team Member 1',
        role: 'President',
        email: 'president@codevimarsh.in',
        order: 1
      },
      {
        name: 'Team Member 2',
        role: 'Vice President',
        email: 'vicepresident@codevimarsh.in',
        order: 2
      },
      {
        name: 'Team Member 3',
        role: 'Secretary',
        email: 'secretary@codevimarsh.in',
        order: 3
      }
    ];

    await TeamMember.insertMany(teamMembers);
    console.log('Team members seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding team members:', error);
    process.exit(1);
  }
};

seedTeamMembers();

