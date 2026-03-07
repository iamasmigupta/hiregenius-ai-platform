const mongoose = require('mongoose');

/**
 * Defines the schema for the final Interview Report.
 * This model stores a comprehensive summary and analysis of a completed interview session.
 */
const interviewReportSchema = new mongoose.Schema({
    // Link to the interview session this report summarizes.
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        required: true,
        unique: true, // A session should only have one final report.
        index: true
    },
    // Overall score for the interview, typically an average or weighted average.
    overallScore: {
        type: Number,
        min: 0,
        max: 100
    },
    // Sub-scores for different categories, calculated from question types.
    technicalScore: {
        type: Number,
        min: 0,
        max: 100
    },
    communicationScore: {
        type: Number,
        min: 0,
        max: 100
    },
    culturalFitScore: {
        type: Number,
        min: 0,
        max: 100
    },
    // --- FIX: Changed type from String to [String] to accept an array of strings ---
    strengths: {
        type: [String],
        default: []
    },
    // --- FIX: Changed type from String to [String] to accept an array of strings ---
    areasForImprovement: {
        type: [String],
        default: []
    },
    // Final recommendation based on the overall performance.
    recommendation: {
        type: String,
        enum: ['strong_hire', 'hire', 'maybe', 'no_hire'],
        default: 'maybe'
    },
    // Proctoring analytics (copied from session at report generation time)
    warningCount: {
        type: Number,
        default: 0
    },
    proctoringInfractions: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    proctoringEventLog: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    terminationReason: {
        type: String,
        default: null
    },
    // New Detailed Analytics Fields
    skillScores: {
        technical: { type: Number, min: 0, max: 100 },
        communication: { type: Number, min: 0, max: 100 },
        behavioral: { type: Number, min: 0, max: 100 },
        problemSolving: { type: Number, min: 0, max: 100 },
    },
    detailedAnalysis: [
        {
            skill: String,
            score: Number,
            description: String,
        },
    ],
    skillsDistribution: {
        type: Map,
        of: Number,
    },
    interviewSummary: { type: String, trim: true },
    feedback: { type: String, trim: true },
    recommendations: { type: String, trim: true },
}, {
    timestamps: {
        createdAt: 'generatedAt',
        updatedAt: false
    }
});

const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);

module.exports = InterviewReport;