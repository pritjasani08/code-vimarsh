# Vercel Deployment Guide

This guide explains how to deploy both frontend and backend together on Vercel.

## Project Structure

```
codevimarsh/
├── frontend/          # React frontend
├── backend/          # Express backend
├── api/              # Serverless function wrapper
│   ├── index.js      # Express app wrapper
│   └── package.json  # API dependencies
└── vercel.json       # Vercel configuration
```

## Setup Instructions

### 1. Environment Variables

In Vercel dashboard, add these environment variables:

**Database:**
- `DB_HOST` - Your MySQL database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (e.g., codevimarsh)
- `DB_PORT` - Database port (usually 3306)

**JWT & Security:**
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT expiration time (e.g., 7d)

**Email (if using):**
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - Email username
- `EMAIL_PASS` - Email password

**Frontend URL:**
- `FRONTEND_URL` - Your Vercel frontend URL (will be auto-set)
- `NODE_ENV` - Set to "production"

### 2. Build Configuration

The `vercel.json` file is configured to:
- Build the frontend React app
- Install dependencies for both frontend and backend
- Route API calls to the serverless function
- Serve static files from frontend/build

### 3. Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Set Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all the variables listed above

4. **Deploy:**
   - Vercel will automatically deploy on push
   - Or click "Deploy" in the dashboard

### 4. Important Notes

- **Database:** You need an external MySQL database (Vercel doesn't provide MySQL). Consider:
  - [PlanetScale](https://planetscale.com) - Free MySQL hosting
  - [Railway](https://railway.app) - Database hosting
  - [AWS RDS](https://aws.amazon.com/rds/) - Production option
  - [Render](https://render.com) - Database hosting

- **File Uploads:** The `/uploads` folder won't persist on Vercel serverless functions. Consider:
  - Use cloud storage (AWS S3, Cloudinary, etc.)
  - Or use a separate service for file storage

- **Cold Starts:** Serverless functions may have cold starts. First request might be slower.

### 5. Testing Deployment

After deployment, test:
- Frontend: `https://your-project.vercel.app`
- API Health: `https://your-project.vercel.app/api/health`
- API Endpoints: `https://your-project.vercel.app/api/auth/login`

### 6. Troubleshooting

**Build fails:**
- Check that all dependencies are in package.json files
- Ensure Node.js version is compatible (18.x recommended)

**API not working:**
- Check environment variables are set correctly
- Verify database connection string
- Check Vercel function logs

**CORS errors:**
- Verify FRONTEND_URL is set correctly
- Check CORS configuration in api/index.js

## Alternative: Separate Deployments

If you prefer separate deployments:
1. Deploy frontend to Vercel
2. Deploy backend to Render/Railway/Heroku
3. Set `REACT_APP_API_URL` in frontend environment variables

