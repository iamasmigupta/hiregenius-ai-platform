// Centralized configuration for API URLs
// Change these when deploying to production

const config = {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
    PROCTOR_API_URL: process.env.REACT_APP_PROCTOR_URL || 'http://localhost:5001',
};

export default config;
