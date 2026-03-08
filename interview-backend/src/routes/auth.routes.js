const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, changePassword, selfRegister, verifyEmail, resendVerificationCode } = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/register', protect, authorize('admin', 'hr_manager', 'interviewer'), asyncHandler(registerUser));
router.post('/login', asyncHandler(loginUser));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));
router.put('/change-password', protect, asyncHandler(changePassword));
router.post('/signup', asyncHandler(selfRegister));
router.post('/verify-email', asyncHandler(verifyEmail));
router.post('/resend-code', asyncHandler(resendVerificationCode));

module.exports = router;