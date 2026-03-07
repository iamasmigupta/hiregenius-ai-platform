const mongoose = require('mongoose');

/**
 * Defines the schema for a single Interview Response.
 * Each document represents a candidate's answer to one specific question in an interview session.
 */
const interviewResponseSchema = new mongoose.Schema({
    // Link to the overall interview session this response belongs to.
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        required: true,
        index: true
    },
    // The specific question within the session that was answered.
    // Note: This refers to the subdocument ID from the InterviewSession's 'questions' array.
    question: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // URL pointing to the stored audio file of the candidate's response.
    // This will initially point to a local file path but can be a cloud URL in the future.
    audioFileUrl: {
        type: String,
        required: true,
        trim: true
    },
    // The final, high-accuracy transcription of the audio, potentially edited by the user.
    transcribedText: {
        type: String,
        required: true,
        trim: true
    },
    // The time the candidate took to answer this specific question.
    responseDurationSeconds: {
        type: Number
    },
    // The score for this specific response, as determined by the AI.
    aiScore: {
        type: Number,
        min: 0,
        max: 100
    },
    // Detailed textual feedback from the AI for this single answer.
    aiFeedback: {
        type: String,
        trim: true
    },
    // A list of keywords the AI detected in the response.
    keywordsMatched: {
        type: [String]
    },
    // The AI's confidence in its own scoring for this response.
    confidenceScore: {
        type: Number,
        min: 0,
        max: 1
    },
}, {
    timestamps: true
});

const InterviewResponse = mongoose.model('InterviewResponse', interviewResponseSchema);

module.exports = InterviewResponse;