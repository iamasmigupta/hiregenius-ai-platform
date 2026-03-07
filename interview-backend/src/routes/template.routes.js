const express = require('express');
const router = express.Router();
const { createTemplate, getTemplates } = require('../controllers/template.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const ROLES = ['admin', 'interviewer', 'hr_manager', 'ml_engineer'];

/**
 * @route   POST /api/templates
 * @desc    Create a new interview template
 * @access  Private (Admin, Interviewer, HR Manager)
 */
router.post(
    '/',
    protect,
    authorize(...ROLES),
    asyncHandler(createTemplate)
);

/**
 * @route   GET /api/templates
 * @desc    Get all available interview templates
 * @access  Private (Admin, Interviewer, HR Manager)
 */
router.get(
    '/',
    protect,
    authorize(...ROLES),
    asyncHandler(getTemplates)
);

module.exports = router;