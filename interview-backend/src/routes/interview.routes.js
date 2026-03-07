const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { protect, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');
const {
    transcribeResponse,
    createSession,
    getSessionByLink,
    submitResponse, 
    getMySessions,
    getCompletedSessions,
    getSessionDetailsForAdmin,
    markSessionCompletedOrTerminated,
    submitDecision
} = require('../controllers/interview.controller');

const config = require('../config');

// --- File Storage Setup for Multer ---
const uploadDir = path.join(path.dirname(require.main.filename), config.uploadPath);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = req.user._id + '-' + Date.now();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const audioFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error('File upload rejected: Not an audio file.'), false);
    }
};
const upload = multer({ storage: storage, fileFilter: audioFileFilter, limits: { fileSize: 25 * 1024 * 1024 } });


// --- Route Definitions ---

router.post('/transcribe', protect, upload.single('audio'), asyncHandler(transcribeResponse));
router.post('/sessions', protect, authorize('admin', 'interviewer', 'hr_manager'), asyncHandler(createSession));
router.post('/sessions/:sessionId/responses', protect, asyncHandler(submitResponse));
router.get('/sessions/my-sessions', protect, authorize('candidate'), asyncHandler(getMySessions));
router.get(
    '/sessions/completed',
    protect,
    authorize('admin', 'interviewer', 'hr_manager'),
    asyncHandler(getCompletedSessions)
);

/**
 * NEW: Route for admins to get full details of any session.
 * @route   GET /api/interview/sessions/:sessionId/details
 * @access  Private (Admin, Interviewer, HR Manager)
 */
router.get(
    '/sessions/:sessionId/details',
    protect,
    authorize('admin', 'interviewer', 'hr_manager'),
    asyncHandler(getSessionDetailsForAdmin)
);

// Add route for marking session as completed/terminated
router.post('/sessions/:sessionId/complete', protect, asyncHandler(markSessionCompletedOrTerminated));

// This dynamic route must be last to avoid catching specific routes like '/completed' or '/details'
router.get('/sessions/:uniqueLink', protect, asyncHandler(getSessionByLink));

/**
 * @desc    Submit a decision (approve/reject) for an interview session
 * @route   POST /api/interview/sessions/:sessionId/decision
 * @access  Private (Admin, Interviewer, HR Manager)
 */
router.post(
  '/sessions/:sessionId/decision',
  protect,
  authorize('admin', 'interviewer', 'hr_manager'),
  asyncHandler(submitDecision)
);

module.exports = router;