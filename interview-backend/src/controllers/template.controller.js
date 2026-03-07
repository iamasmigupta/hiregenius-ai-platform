const InterviewTemplate = require('../models/interviewTemplate.model');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get all available interview templates
 * @route   GET /api/templates
 * @access  Private (Interviewer, HR Manager, Admin)
 */
const getTemplates = async (req, res) => {
    // Fetch all active templates, populating the creator's name and email
    const templates = await InterviewTemplate.find({ isActive: true }).populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
        success: true,
        count: templates.length,
        data: templates,
    });
};


/**
 * @desc    Create a new interview template
 * @route   POST /api/templates
 * @access  Private (Interviewer, HR Manager, Admin)
 */
const createTemplate = async (req, res) => {
    const {
        title,
        jobDescription,
        numberOfQuestions,
        description,
        durationMinutes,
        department,
        position,
        difficultyLevel
    } = req.body;

    if (!title || !jobDescription || !numberOfQuestions) {
        throw new AppError(400, 'Please provide all required fields: title, jobDescription, and numberOfQuestions.');
    }

    const template = await InterviewTemplate.create({
        title,
        jobDescription,
        numberOfQuestions,
        description,
        durationMinutes,
        department,
        position,
        difficultyLevel,
        createdBy: req.user._id
    });

    res.status(201).json(template);
};


module.exports = {
    createTemplate,
    getTemplates,
    // We will add functions for getting a single template, updating, and deleting later.
};