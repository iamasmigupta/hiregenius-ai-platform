const InterviewTemplate = require('../models/interviewTemplate.model');
const InterviewSession = require('../models/interviewSession.model');
const InterviewResponse = require('../models/interviewResponse.model');
const InterviewReport = require('../models/interviewReport.model');
const User = require('../models/user.model');
const { generateInterviewFromJD, processAnswer, generateFinalReport } = require('../controllers/aiController');
const AppError = require('../utils/AppError');
const { sendReportEmail, sendDecisionEmail } = require('../utils/mail');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

const createSessionFromTemplate = async ({ templateId, candidateId, interviewerId, scheduledAt }) => {
    const template = await InterviewTemplate.findById(templateId);
    if (!template) {
        throw new AppError(404, 'Interview template not found.');
    }
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'candidate') {
        throw new AppError(404, 'A valid candidate could not be found for the provided ID.');
    }
    const generatedQuestions = await generateInterviewFromJD(template.jobDescription, template.numberOfQuestions);
    if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new AppError(500, 'AI failed to generate questions for the interview.');
    }
    const session = new InterviewSession({
        template: templateId,
        candidate: candidateId,
        interviewer: interviewerId,
        scheduledAt: scheduledAt || new Date(),
        questions: generatedQuestions,
        status: 'scheduled'
    });
    await session.save();
    console.log(`New interview session created with ID: ${session._id}`);
    return session;
};

const submitResponse = async ({ sessionId, questionId, userId, responseData }) => {
    const session = await InterviewSession.findById(sessionId);
    if (!session || !['in_progress'].includes(session.status)) {
        throw new AppError(404, 'Active interview session not found or not in progress.');
    }
    if (session.candidate.toString() !== userId.toString()) {
        throw new AppError(403, 'You are not authorized to submit a response for this interview.');
    }
    const questionDetails = session.questions.find(q => q._id.toString() === questionId);
    if (!questionDetails) {
        throw new AppError(404, 'Question not found in this interview session.');
    }
    const aiEvaluation = await processAnswer(responseData.transcribedText, questionDetails);
    const interviewResponse = await InterviewResponse.create({
        session: sessionId,
        question: questionId,
        audioFileUrl: responseData.audioFileUrl,
        transcribedText: responseData.transcribedText,
        responseDurationSeconds: responseData.duration,
        aiScore: aiEvaluation.finalWeightedScore,
        aiFeedback: `Mentioned: ${aiEvaluation.detailedAnalysis.feedbackFromAI.conceptsMentioned.join(', ') || 'None'}. Missed: ${aiEvaluation.detailedAnalysis.feedbackFromAI.conceptsMissed.join(', ') || 'None'}.`,
        keywordsMatched: aiEvaluation.detailedAnalysis.feedbackFromAI.conceptsMentioned,
    });
    session.currentQuestionIndex += 1;
    const responsePayload = {
        evaluation: aiEvaluation,
        responseId: interviewResponse._id,
        nextStep: {}
    };
    if (session.currentQuestionIndex >= session.questions.length) {
        session.status = 'completed';
        session.completedAt = new Date();
        responsePayload.nextStep = { status: 'interview_finished' };
    } else {
        const nextQuestion = session.questions[session.currentQuestionIndex];
        responsePayload.nextStep = {
            status: 'next_question',
            question: { _id: nextQuestion._id, questionText: nextQuestion.questionText, questionType: nextQuestion.questionType, timeLimitSeconds: nextQuestion.timeLimitSeconds }
        };
    }
    await session.save();
    return responsePayload;
};

const finalizeAndGenerateReport = async (sessionId) => {
    const responses = await InterviewResponse.find({ session: sessionId }).populate('question');
    if (responses.length === 0) {
        throw new AppError(400, 'Cannot generate a report for an interview with no responses.');
    }

    const enrichedResponses = responses.map(r => ({
        ...r.toObject(),
        questionText: r.question.questionText // Ensure question text is available
    }));

    const overallScore = enrichedResponses.reduce((acc, r) => acc + (r.aiScore || 0), 0) / enrichedResponses.length;
    
    // Get the full, detailed report from the AI
    const aiReportData = await generateFinalReport(enrichedResponses);

    // Fetch session for proctoring analytics
    const session = await InterviewSession.findById(sessionId);
    
    // The skillsDistribution for the radar chart needs to be a Map
    const skillsDistribution = new Map(
        aiReportData.detailedAnalysis.map(item => [item.skill, item.score])
    );

    // Create and save the report using data from the AI
    const report = await InterviewReport.create({
        session: sessionId,
        overallScore,
        recommendation: aiReportData.recommendation,
        strengths: aiReportData.strengths,
        areasForImprovement: aiReportData.areasForImprovement,
        skillScores: aiReportData.skillScores,
        detailedAnalysis: aiReportData.detailedAnalysis,
        skillsDistribution, // Use the converted Map
        interviewSummary: aiReportData.interviewSummary,
        feedback: aiReportData.feedback,
        recommendations: aiReportData.recommendations,
        warningCount: session.warningCount || 0,
        proctoringInfractions: session.proctoringInfractions || [],
        proctoringEventLog: session.proctoringEventLog || [],
        terminationReason: session.terminationReason || null,
    });
    return report;
};

/**
 * NEW: Fetches all individual responses for a given session with pagination.
 * @param {string} sessionId - The ID of the session.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of responses per page.
 * @returns {Promise<object>} An object containing the paginated responses and metadata.
 */
const getSessionResponses = async (sessionId, page, limit) => {
    const skip = (page - 1) * limit;

    // Find the session to get access to the original question texts
    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) {
        throw new AppError(404, 'Interview session not found.');
    }

    const total = await InterviewResponse.countDocuments({ session: sessionId });
    const responses = await InterviewResponse.find({ session: sessionId })
        .sort({ createdAt: 1 }) // Sort by the order they were answered
        .skip(skip)
        .limit(limit)
        .lean();

    // Enrich each response with the corresponding question text
    const enrichedResponses = responses.map(response => {
        const question = session.questions.find(q => q._id.toString() === response.question.toString());
        return {
            ...response,
            questionText: question ? question.questionText : 'Question not found'
        };
    });

    return {
        responses: enrichedResponses,
        pagination: {
            page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total
        }
    };
};

const markSessionCompletedOrTerminated = async ({ sessionId, terminated, terminationReason, proctoringInfractions, warningCount, proctoringEventLog }) => {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new AppError(404, 'Interview session not found.');
    if (terminated) {
        session.status = 'terminated';
        session.terminationReason = terminationReason || 'Terminated by proctoring.';
        session.completedAt = new Date();
    } else {
        session.status = 'completed';
        session.completedAt = new Date();
    }
    if (Array.isArray(proctoringInfractions)) session.proctoringInfractions = proctoringInfractions;
    if (typeof warningCount === 'number') session.warningCount = Math.min(warningCount, 3);
    if (Array.isArray(proctoringEventLog)) session.proctoringEventLog = proctoringEventLog;
    await session.save();
    if (session.status === 'completed') {
        // Generate the final report
        await finalizeAndGenerateReport(sessionId);

        // Notify the recruiter
        await session.populate('candidate interviewer');
        if (session.interviewer && session.interviewer.email) {
            const reportLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports/${sessionId}`;
            await sendReportEmail(session.interviewer.email, reportLink, session.candidate.firstName);
        }
    }
    return session;
};

const submitDecision = async ({ sessionId, decision, comments, adminId }) => {
    if (!['approved', 'rejected'].includes(decision)) {
        throw new AppError(400, 'Decision must be either "approved" or "rejected".');
    }

    const session = await InterviewSession.findById(sessionId).populate('candidate');
    if (!session) {
        throw new AppError(404, 'Interview session not found.');
    }

    session.decision = {
        status: decision,
        comments: comments,
        decidedBy: adminId,
        decidedAt: new Date(),
    };

    await session.save();

    // Send notification email to the candidate
    if (session.candidate && session.candidate.email) {
        await sendDecisionEmail(
            session.candidate.email,
            decision,
            comments,
            session.candidate.firstName
        );
    }

    return session;
};

/**
 * Export the report for an interview as CSV
 * @param {string} sessionId
 * @param {object} res - Express response object
 */
const exportReportCSV = async (sessionId, res) => {
    // 1. Fetch the full report and session details
    const report = await InterviewReport.findOne({ session: sessionId }).populate({
        path: 'session',
        populate: [
            { path: 'candidate', select: 'firstName lastName email' },
            { path: 'template', select: 'title' }
        ]
    });

    if (!report) {
        throw new AppError(404, 'Report not found.');
    }

    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) {
        throw new AppError(404, 'Interview session not found.');
    }

    const responses = await InterviewResponse.find({ session: sessionId }).lean();

    // 2. Define fields for the comprehensive report
    const fields = [
        'candidateName', 'candidateEmail', 'templateTitle', 'overallScore',
        'technicalScore', 'communicationScore', 'problemSolvingScore', 'behavioralScore',
        'interviewSummary', 'feedback',
        'question', 'answer', 'aiScore', 'aiFeedback', 'keywordsMatched', 'durationSeconds'
    ];

    // 3. Map responses to a flat CSV structure
    const data = responses.map(r => {
        const candidate = report.session?.candidate || {};
        const template = report.session?.template || {};
        const question = session.questions.find(q => q._id.toString() === r.question.toString());
        
        return {
            candidateName: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
            candidateEmail: candidate.email || 'N/A',
            templateTitle: template.title || 'N/A',
            overallScore: report.overallScore,
            technicalScore: report.skillScores?.technical || 0,
            communicationScore: report.skillScores?.communication || 0,
            problemSolvingScore: report.skillScores?.problemSolving || 0,
            behavioralScore: report.skillScores?.behavioral || 0,
            interviewSummary: report.interviewSummary,
            feedback: report.feedback,
            question: question?.questionText || 'Question text not found',
            answer: r.transcribedText,
            aiScore: r.aiScore,
            aiFeedback: r.aiFeedback,
            keywordsMatched: (r.keywordsMatched || []).join('; '),
            durationSeconds: r.responseDurationSeconds,
        };
    });

    // 4. Create and send CSV
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    const candidateName = `${report.session?.candidate?.firstName || 'candidate'}_${report.session?.candidate?.lastName || 'report'}`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report_${candidateName}_${sessionId}.csv`);
    res.status(200).send(csv);
};

/**
 * Export the report for an interview as PDF
 * @param {string} sessionId
 * @param {object} res - Express response object
 */
const exportReportPDF = async (sessionId, res) => {
    // Fetch report and session
    const report = await InterviewReport.findOne({ session: sessionId }).populate({
        path: 'session',
        populate: [
            { path: 'candidate', select: 'firstName lastName email' },
            { path: 'template', select: 'title' }
        ]
    });
    if (!report) throw new AppError(404, 'Report not found.');
    
    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) {
        throw new AppError(404, 'Interview session not found.');
    }

    const responses = await InterviewResponse.find({ session: sessionId }).lean();
    
    const candidate = report.session?.candidate || {};
    const template = report.session?.template || {};
    const candidateName = `${candidate.firstName || 'candidate'}_${candidate.lastName || 'report'}`;

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${candidateName}_${sessionId}.pdf`);
    doc.pipe(res);
    // Title
    doc.fontSize(22).fillColor('#222').text('Interview Report', { align: 'center' });
    doc.moveDown();
    // Candidate Info
    doc.fontSize(14).fillColor('#333').text(`Candidate: ${candidate.firstName || ''} ${candidate.lastName || ''}`.trim());
    doc.text(`Email: ${candidate.email || 'N/A'}`);
    doc.text(`Template: ${template.title || 'N/A'}`);
    doc.moveDown();
    // Scores
    doc.fontSize(16).fillColor('#222').text('Scores:', { underline: true });
    Object.entries(report.skillScores || {}).forEach(([skill, score]) => {
        doc.fontSize(12).fillColor('#333').text(`${skill}: ${score}`);
    });
    doc.fontSize(12).fillColor('#333').text(`Overall Score: ${report.overallScore}`);
    doc.moveDown();
    // Responses
    doc.fontSize(16).fillColor('#222').text('Responses:', { underline: true });
    responses.forEach((r, idx) => {
        const question = session.questions.find(q => q._id.toString() === r.question.toString());
        const questionText = question?.questionText || 'Question text not found';
        doc.moveDown(0.5);
        doc.fontSize(13).fillColor('#444').text(`Q${idx + 1}: ${questionText}`);
        doc.fontSize(12).fillColor('#000').text(`Answer: ${r.transcribedText || ''}`);
        doc.fontSize(12).fillColor('#333').text(`AI Score: ${r.aiScore || 0}`);
        doc.fontSize(12).fillColor('#333').text(`AI Feedback: ${r.aiFeedback || ''}`);
        doc.fontSize(12).fillColor('#333').text(`Keywords Matched: ${(r.keywordsMatched || []).join(', ')}`);
        doc.fontSize(12).fillColor('#333').text(`Duration: ${r.responseDurationSeconds || 0}s`);
        doc.moveDown(0.5);
    });
    doc.moveDown();
    // Summary
    doc.fontSize(16).fillColor('#222').text('Summary:', { underline: true });
    doc.fontSize(12).fillColor('#333').text(report.interviewSummary || '');
    doc.moveDown();
    // Feedback
    doc.fontSize(16).fillColor('#222').text('Feedback:', { underline: true });
    doc.fontSize(12).fillColor('#333').text(report.feedback || '');
    doc.end();
};

// Export filtered interview sessions as CSV
const exportFilteredReportsCSV = async (req, res) => {
    // Parse filters
    const { status, templateId, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status === 'approved' || status === 'rejected') filter['decision.status'] = status;
    if (templateId) filter['template'] = templateId;
    if (dateFrom || dateTo) {
        filter['completedAt'] = {};
        if (dateFrom) filter['completedAt'].$gte = new Date(dateFrom);
        if (dateTo) filter['completedAt'].$lte = new Date(dateTo);
        if (Object.keys(filter['completedAt']).length === 0) delete filter['completedAt'];
    }
    filter['status'] = 'completed';
    // Fetch sessions
    const sessions = await InterviewSession.find(filter)
        .populate('candidate', 'firstName lastName email')
        .populate('template', 'title')
        .sort({ completedAt: -1 });
    // Fetch reports for all sessions
    const sessionIds = sessions.map(s => s._id);
    const reports = await InterviewReport.find({ session: { $in: sessionIds } });
    // Map sessionId to report
    const reportMap = {};
    reports.forEach(r => { reportMap[r.session.toString()] = r; });
    // Flatten data for CSV
    const data = sessions.map(s => {
        const r = reportMap[s._id.toString()] || {};
        return {
            candidateName: `${s.candidate?.firstName || ''} ${s.candidate?.lastName || ''}`.trim(),
            candidateEmail: s.candidate?.email || '',
            templateTitle: s.template?.title || '',
            overallScore: r.overallScore || '',
            status: s.status,
            decision: s.decision?.status || '',
            completedAt: s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '',
        };
    });
    const fields = ['candidateName', 'candidateEmail', 'templateTitle', 'overallScore', 'status', 'decision', 'completedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=filtered_interview_reports.csv`);
    res.status(200).send(csv);
};

// Export filtered interview sessions as PDF
const exportFilteredReportsPDF = async (req, res) => {
    // Parse filters
    const { status, templateId, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status === 'approved' || status === 'rejected') filter['decision.status'] = status;
    if (templateId) filter['template'] = templateId;
    if (dateFrom || dateTo) {
        filter['completedAt'] = {};
        if (dateFrom) filter['completedAt'].$gte = new Date(dateFrom);
        if (dateTo) filter['completedAt'].$lte = new Date(dateTo);
        if (Object.keys(filter['completedAt']).length === 0) delete filter['completedAt'];
    }
    filter['status'] = 'completed';
    // Fetch sessions
    const sessions = await InterviewSession.find(filter)
        .populate('candidate', 'firstName lastName email')
        .populate('template', 'title')
        .sort({ completedAt: -1 });
    // Fetch reports for all sessions
    const sessionIds = sessions.map(s => s._id);
    const reports = await InterviewReport.find({ session: { $in: sessionIds } });
    const reportMap = {};
    reports.forEach(r => { reportMap[r.session.toString()] = r; });
    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=filtered_interview_reports.pdf`);
    doc.pipe(res);
    doc.fontSize(22).fillColor('#222').text('Filtered Interview Reports', { align: 'center' });
    doc.moveDown();
    sessions.forEach((s, idx) => {
        const r = reportMap[s._id.toString()] || {};
        doc.fontSize(14).fillColor('#333').text(`#${idx + 1}`);
        doc.fontSize(13).fillColor('#444').text(`Candidate: ${s.candidate?.firstName || ''} ${s.candidate?.lastName || ''}`);
        doc.fontSize(12).fillColor('#333').text(`Email: ${s.candidate?.email || ''}`);
        doc.fontSize(12).fillColor('#333').text(`Template: ${s.template?.title || ''}`);
        doc.fontSize(12).fillColor('#333').text(`Score: ${r.overallScore || ''}`);
        doc.fontSize(12).fillColor('#333').text(`Status: ${s.status}`);
        doc.fontSize(12).fillColor('#333').text(`Decision: ${s.decision?.status || ''}`);
        doc.fontSize(12).fillColor('#333').text(`Completed: ${s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ''}`);
        doc.moveDown();
    });
    doc.end();
};

module.exports = {
    createSessionFromTemplate,
    submitResponse,
    finalizeAndGenerateReport,
    getSessionResponses,
    markSessionCompletedOrTerminated,
    submitDecision,
    exportReportCSV,
    exportReportPDF,
    exportFilteredReportsCSV,
    exportFilteredReportsPDF,
};