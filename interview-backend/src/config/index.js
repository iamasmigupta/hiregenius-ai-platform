const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 5000,
    mongoURI: process.env.MONGO_URI,
    geminiAPIKey: process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'a-very-secret-key-that-should-be-in-env-file',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
    groqApiKey: process.env.GROQ_API_KEY,
    whisperApiUrl: process.env.WHISPER_API_URL || 'https://api.groq.com/openai/v1/audio/transcriptions',
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL,
    senderEmail: process.env.SENDER_EMAIL,
    senderPassword: process.env.SENDER_PASSWORD,
};