const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, changePassword, selfRegister } = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Private (Admin & HR Manager only)
 */
router.post(
    '/register',
    protect,
    authorize('admin', 'hr_manager', 'interviewer'),
    asyncHandler(registerUser)
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', asyncHandler(loginUser));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset OTP to email
 * @access  Public
 */
router.post('/forgot-password', asyncHandler(forgotPassword));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
router.post('/reset-password', asyncHandler(resetPassword));

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for logged-in user
 * @access  Private
 */
router.put('/change-password', protect, asyncHandler(changePassword));

/**
 * @route   POST /api/auth/signup
 * @desc    Self-register (public sign up for interviewer, HR, candidate)
 * @access  Public
 */
router.post('/signup', asyncHandler(selfRegister));

module.exports = router;