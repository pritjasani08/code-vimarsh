# Complete Render Backend Deployment Setup

## Step-by-Step Configuration

### 1. Create New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select repository: `codevimarsh-backend`

### 2. Configure Service Settings

**Basic Settings:**
- **Name**: `codevimarsh-backend` (or any name you prefer)
- **Region**: Choose closest to your users
- **Branch**: `main` or `master` (your default branch)
- **Root Directory**: `.` (just a dot - this is IMPORTANT!)
- **Runtime**: `Node`
- **Build Command**: `npm install` (or leave empty)
- **Start Command**: `npm start` (this is CRITICAL!)

**⚠️ Common Mistakes:**
- ❌ Root Directory: `backend` (wrong - use `.`)
- ❌ Start Command: `node start` (wrong - use `npm start`)
- ❌ Start Command: `/opt/render/project/src/start` (wrong - this file doesn't exist)

### 3. Add Environment Variables

Click "Advanced" → "Add Environment Variable" and add:

```
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=codevimarsh
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=5000
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
CONTACT_EMAIL=codingclub-cse@msubaroda.ac.in
QUIZAPI_KEY=your-quizapi-key-here
FRONTEND_URL=https://your-vercel-app.vercel.app
FRONTEND_DOMAIN=https://your-vercel-app.vercel.app
```

**Note**: Replace all placeholder values with your actual credentials.

### 4. Deploy

1. Click "Create Web Service"
2. Render will start building and deploying
3. Wait for deployment to complete (usually 2-5 minutes)

### 5. Get Your Backend URL

After successful deployment:
- Your backend URL will be: `https://codevimarsh-backend.onrender.com` (or similar)
- Test it: Visit `https://your-backend-url.onrender.com/api/health`
- Should return: `{"status":"OK","message":"Server is running"}`

### 6. Update Vercel Frontend

1. Go to Vercel Dashboard
2. Your project → Settings → Environment Variables
3. Add/Update:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```
4. Redeploy frontend

## Troubleshooting

### Deployment Fails with "Cannot find module"
- ✅ Check Start Command is `npm start` (not `node start`)
- ✅ Check Root Directory is `.` (not `backend`)

### Backend starts but returns errors
- ✅ Check all environment variables are set correctly
- ✅ Check database connection (DB_HOST, DB_USER, DB_PASSWORD)
- ✅ Check logs in Render dashboard

### CORS errors from frontend
- ✅ Add `FRONTEND_URL` environment variable in Render
- ✅ Set it to your Vercel URL: `https://your-app.vercel.app`

### Free tier spinning down
- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~50 seconds
- Consider upgrading to paid plan for always-on service

## Quick Reference

**Correct Settings:**
```
Root Directory: .
Build Command: npm install
Start Command: npm start
Environment: Node
```

**Your Backend URL Format:**
```
https://[service-name].onrender.com
```

**Health Check Endpoint:**
```
https://[service-name].onrender.com/api/health
```



