const express = require('express');
const router = express.Router();
const { getUsers, getDashboardStats, getRecentInterviews, updateProfile, changePassword, deleteAccount } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route   GET /api/users
 * @desc    Get all users, with optional role filtering
 * @access  Private (Admin, Interviewer, HR Manager)
 */
router.get(
    '/',
    protect,
    authorize('admin', 'interviewer', 'hr_manager'),
    asyncHandler(getUsers)
);

// Admin analytics endpoints
router.get('/admin/dashboard-stats', protect, authorize('admin', 'interviewer', 'hr_manager'), getDashboardStats);
router.get('/admin/recent-interviews', protect, authorize('admin', 'interviewer', 'hr_manager'), getRecentInterviews);

// Add user self-service routes
router.put('/me', protect, asyncHandler(updateProfile));
router.put('/me/password', protect, asyncHandler(changePassword));
router.delete('/me', protect, asyncHandler(deleteAccount));

module.exports = router;