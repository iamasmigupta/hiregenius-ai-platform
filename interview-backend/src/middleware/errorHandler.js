const config = require('../config');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
    // If the error is not an AppError, convert it to one
    if (!(err instanceof AppError)) {
        // Log the original error for debugging non-operational errors
        console.error('--- UNHANDLED OPERATIONAL ERROR ---', err);
        
        // Default to a 500 server error
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Something went wrong on the server.';
        
        err = new AppError(statusCode, message);
    }
    
    // Log the error
    console.error(`[${err.statusCode}] ${err.message}`);

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        // Only show stack in development
        stack: config.nodeEnv === 'development' ? err.stack : undefined,
    });
};

module.exports = { errorHandler };