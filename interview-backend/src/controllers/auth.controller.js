const User = require('../models/user.model');
const config = require('../config');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/mail');

/**
 * Generates a JSON Web Token for a given user ID.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Private (Admin & HR Manager only)
 */
const registerUser = async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
        res.status(400);
        throw new Error('Please provide all required fields: firstName, lastName, email, password, role.');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists.');
    }

    const user = await User.create({ firstName, lastName, email, password, role });

    if (user) {
        const token = generateToken(user._id);
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: token,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data received.');
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide both email and password.');
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
        const token = generateToken(user._id);
        res.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: token,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password.');
    }
};

/**
 * @desc    Forgot Password - send reset OTP via email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide your email address.');
    }

    const user = await User.findOne({ email });

    if (!user) {
        // Don't reveal whether user exists for security
        return res.status(200).json({
            status: 'success',
            message: 'If an account with that email exists, a reset code has been sent.',
        });
    }

    // Generate a 6-digit OTP
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP and store it
    const hashedToken = crypto.createHash('sha256').update(resetOTP).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
        await sendPasswordResetEmail(user.email, resetOTP, user.firstName);
        res.status(200).json({
            status: 'success',
            message: 'If an account with that email exists, a reset code has been sent.',
        });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500);
        throw new Error('Email could not be sent. Please try again later.');
    }
};

/**
 * @desc    Reset Password using OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        res.status(400);
        throw new Error('Please provide email, OTP, and new password.');
    }

    if (newPassword.length < 8) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long.');
    }

    const hashedToken = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
        email,
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset code.');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Password has been reset successfully. You can now log in.',
    });
};

/**
 * @desc    Change password (for logged-in users)
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide current and new password.');
    }

    if (newPassword.length < 8) {
        res.status(400);
        throw new Error('New password must be at least 8 characters long.');
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.comparePassword(currentPassword))) {
        res.status(401);
        throw new Error('Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully.',
    });
};

/**
 * @desc    Self-register (public sign up)
 * @route   POST /api/auth/signup
 * @access  Public
 */
const selfRegister = async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
        res.status(400);
        throw new Error('Please provide all required fields.');
    }

    // Only allow interviewer and hr_manager for self-registration
    const allowedRoles = ['interviewer', 'hr_manager'];
    if (!allowedRoles.includes(role)) {
        res.status(400);
        throw new Error('Invalid role for self-registration.');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists.');
    }

    const user = await User.create({ firstName, lastName, email, password, role });

    if (user) {
        const token = generateToken(user._id);
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: token,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data received.');
    }
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    changePassword,
    selfRegister,
};