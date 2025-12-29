// API URL Configuration
// This file centralizes API URL handling for better deployment

const getApiUrl = () => {
  // Priority order:
  // 1. Environment variable (set in Vercel)
  // 2. Check if we're in production (Vercel)
  // 3. Default to localhost for development
  
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If deployed on Vercel but no env var set, show error
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.error('REACT_APP_API_URL is not set! Please set it in Vercel environment variables.');
    // You can set a fallback backend URL here if needed
    // return 'https://your-backend-url.railway.app/api';
  }
  
  // Default to localhost for local development
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

// Helper function to log API errors
export const handleApiError = (error, context = 'API call') => {
  if (error.response) {
    // Server responded with error
    console.error(`${context} failed:`, {
      status: error.response.status,
      data: error.response.data,
      url: error.config?.url
    });
  } else if (error.request) {
    // Request made but no response (network error)
    console.error(`${context} failed: No response from server. Check backend URL:`, API_URL);
  } else {
    // Something else happened
    console.error(`${context} failed:`, error.message);
  }
};

