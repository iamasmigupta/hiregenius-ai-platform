const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/user.model');
const config = require('../config');
const AppError = require('../utils/AppError');

/**
 * Protects routes by verifying the user's JWT.
 * If the token is valid, it attaches the user document to the request object.
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from "Bearer <token>" header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token against the secret
            const decoded = jwt.verify(token, config.jwtSecret);

            // Fetch the user from the database using the ID from the token payload
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                // If user associated with token is not found, it's an authorization error.
                return next(new AppError(401, 'Not authorized, user not found.'));
            }
            
            req.user = user;
            return next();
        } catch (error) {
            // Catches JWT errors (e.g., expired, invalid)
            return next(new AppError(401, 'Not authorized, token failed.'));
        }
    }

    if (!token) {
        return next(new AppError(401, 'Not authorized, no token.'));
    }
});

/**
 * Authorizes users based on their role.
 * @param {...string} roles - A list of roles that are allowed to access the route.
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403); // 403 Forbidden
            throw new Error(
                `User role '${req.user.role}' is not authorized to access this route.`
            );
        }
        next();
    };
};


module.exports = {
    protect,
    authorize
};