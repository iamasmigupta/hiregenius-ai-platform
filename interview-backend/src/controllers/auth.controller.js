const User = require('../models/user.model');
const config = require('../config');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/mail');

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

    // Admin-created users are auto-verified
    const user = await User.create({ firstName, lastName, email, password, role, isEmailVerified: true });

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
        // Block login for unverified users (existing users without the field are treated as verified)
        if (user.isEmailVerified === false) {
            res.status(403);
            throw new Error('Please verify your email before logging in. Check your inbox for the verification code.');
        }
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
        return res.status(200).json({
            status: 'success',
            message: 'If an account with that email exists, a reset code has been sent.',
        });
    }

    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = crypto.createHash('sha256').update(resetOTP).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

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
 * @desc    Self-register (public sign up) — sends 6-digit verification code to email
 * @route   POST /api/auth/signup
 * @access  Public
 */
const selfRegister = async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
        res.status(400);
        throw new Error('Please provide all required fields.');
    }

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

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    const user = await User.create({
        firstName, lastName, email, password, role,
        isEmailVerified: false,
        verificationCode: hashedCode,
        verificationCodeExpire: Date.now() + 10 * 60 * 1000,
    });

    if (user) {
        try {
            await sendVerificationEmail(user.email, verificationCode, user.firstName);
        } catch (err) {
            console.error('Failed to send verification email:', err.message);
        }

        res.status(201).json({
            status: 'success',
            message: 'Account created! A verification code has been sent to your email.',
            email: user.email,
            requiresVerification: true,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data received.');
    }
};

/**
 * @desc    Verify email with 6-digit code
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        res.status(400);
        throw new Error('Please provide email and verification code.');
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
        email,
        verificationCode: hashedCode,
        verificationCodeExpire: { $gt: Date.now() },
    }).select('+verificationCode +verificationCodeExpire');

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired verification code.');
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.status(200).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token: token,
        message: 'Email verified successfully!',
    });
};

/**
 * @desc    Resend verification code
 * @route   POST /api/auth/resend-code
 * @access  Public
 */
const resendVerificationCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide your email address.');
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(200).json({ status: 'success', message: 'If the account exists, a new code has been sent.' });
    }

    if (user.isEmailVerified) {
        res.status(400);
        throw new Error('This email is already verified.');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    user.verificationCode = hashedCode;
    user.verificationCodeExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
        await sendVerificationEmail(user.email, verificationCode, user.firstName);
    } catch (err) {
        console.error('Failed to resend verification email:', err.message);
    }

    res.status(200).json({
        status: 'success',
        message: 'A new verification code has been sent to your email.',
    });
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    changePassword,
    selfRegister,
    verifyEmail,
    resendVerificationCode,
};