# Code Vimarsh Website

A modern, academic website for Code Vimarsh coding club.

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT-based session management

## Project Structure

```
codevimarsh/
├── backend/          # Express server
├── frontend/         # React application
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in the `backend/` directory
   - Update MongoDB connection string and JWT secret

3. Start the development servers:
```bash
npm run dev
```

This will start both backend (port 5000) and frontend (port 3000) servers concurrently.

### Manual Setup

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## Features

- Home page with club information
- Resources page with curated links
- Gallery page with image grid
- Team page with member profiles
- Announcements page for updates
- Contact page
- User authentication (Signup/Login)
- User profile management
- Secure session handling

## Environment Variables

Create a `.env` file in the `backend/` directory:

```
MONGO_URI=mongodb://localhost:27017/codevimarsh
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

**Important:** Replace `your-secret-key-here` with a strong, random secret key for JWT token signing.

## Seeding Initial Data

To seed the database with initial team members and announcements:

```bash
cd backend
node scripts/seedTeam.js
node scripts/seedAnnouncements.js
```

**Note:** Update the team member data in `backend/scripts/seedTeam.js` with actual data from codevimarsh.in before running the seed script.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### User
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)

### Team
- `GET /api/team` - Get all team members

### Announcements
- `GET /api/announcements` - Get all active announcements
- `GET /api/announcements/:id` - Get single announcement

## Logo Setup

To add the Code Vimarsh logo:
1. Download the logo from https://www.codevimarsh.in/
2. Place it in `frontend/public/` directory
3. Update the logo reference in `frontend/src/components/Navbar.js` if needed

Currently, the navbar displays "Code Vimarsh" as text. Replace with an `<img>` tag pointing to your logo file.

## Development Notes

- The frontend runs on `http://localhost:3000`
- The backend API runs on `http://localhost:5000`
- Make sure MongoDB is running before starting the backend
- All API requests from frontend include JWT token in Authorization header when user is logged in
- CORS is enabled for development (adjust for production)

## Production Deployment

Before deploying to production:
1. Set `NODE_ENV=production` in backend `.env`
2. Use a strong, unique `JWT_SECRET`
3. Use MongoDB Atlas or a production MongoDB instance
4. Build the frontend: `cd frontend && npm run build`
5. Serve the built files using a production server (e.g., Nginx, Express static files)

