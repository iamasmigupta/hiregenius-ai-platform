const mongoose = require('mongoose');

/**
 * Defines the schema for an Interview Template.
 * This model acts as a blueprint for creating interview sessions. It specifies the job description
 * and parameters that the AI will use to generate questions on-the-fly.
 */
const interviewTemplateSchema = new mongoose.Schema({
    // Descriptive title for the interview template.
    title: {
        type: String,
        required: [true, 'Template title is required.'],
        trim: true
    },
    // The full job description that the AI will use as context to generate questions.
    jobDescription: {
        type: String,
        required: [true, 'Job description is required.'],
    },
    // The number of questions the AI should generate for this interview.
    numberOfQuestions: {
        type: Number,
        required: [true, 'Number of questions is required.'],
        min: [1, 'An interview must have at least one question.']
    },
    // Optional description for internal use.
    description: {
        type: String,
        trim: true,
    },
    // Default duration for the entire interview, can be overridden.
    durationMinutes: {
        type: Number,
        required: true,
        default: 30
    },
    // Reference to the User (Interviewer, HR, or Admin) who created the template.
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Optional fields for categorization and filtering.
    department: {
        type: String,
        trim: true
    },
    position: {
        type: String,
        trim: true
    },
    difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true
});

const InterviewTemplate = mongoose.model('InterviewTemplate', interviewTemplateSchema);

module.exports = InterviewTemplate;