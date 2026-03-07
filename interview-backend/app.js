const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./src/config');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { errorHandler } = require('./src/middleware/errorHandler');

// --- Import Application Routes ---
const authRoutes = require('./src/routes/auth.routes.js');
const interviewRoutes = require('./src/routes/interview.routes.js');
const templateRoutes = require('./src/routes/template.routes.js');
const userRoutes = require('./src/routes/user.routes.js');
const reportRoutes = require('./src/routes/report.routes.js');

// Initialize Express
const app = express();

// Connect to Database
connectDB();

// --- Security Middleware ---
app.use(helmet()); // Set security HTTP headers

// Rate limiting - prevent brute force / DDoS
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'fail', message: 'Too many requests, please try again after 15 minutes.' },
});

// Stricter rate limit for auth routes (login, forgot password)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 auth attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'fail', message: 'Too many login attempts, please try again after 15 minutes.' },
});

// --- Core Middleware ---

// CORS
const corsOptions = {
    origin: config.corsOrigin,
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(mongoSanitize()); // Prevent NoSQL injection

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
});

// --- Swagger API Documentation ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HireGenius API',
            version: '2.0.0',
            description: 'Backend API for HireGenius — AI-powered Interview Platform with real-time proctoring.',
        },
        servers: [{ url: `http://localhost:${config.port}`, description: 'Development server' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
    },
    apis: ['./src/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HireGenius - API Docs',
}));

// --- API Routes ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authLimiter, authRoutes); // Stricter rate limit on auth
app.use('/api/interview', apiLimiter, interviewRoutes);
app.use('/api/templates', apiLimiter, templateRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the HireGenius Backend API',
        version: '2.0.0',
        status: 'API is running.',
        docs: '/api-docs',
    });
});

// Error handler MUST be last middleware
app.use(errorHandler);

app.listen(config.port, () =>
    logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`)
);

module.exports = app;