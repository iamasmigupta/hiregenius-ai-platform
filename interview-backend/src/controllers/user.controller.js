const User = require('../models/user.model');
const InterviewSession = require('../models/interviewSession.model');
const InterviewReport = require('../models/interviewReport.model');

/**
 * @desc    Get users, with an option to filter by role
 * @route   GET /api/users
 * @access  Private (Admin, Interviewer, HR Manager)
 */
const getUsers = async (req, res) => {
    const filter = {};

    // If a 'role' query parameter is provided, add it to the filter.
    // e.g., /api/users?role=candidate
    if (req.query.role) {
        filter.role = req.query.role;
    }

    // Fetch users based on the filter. The password is not selected by default.
    const users = await User.find(filter);

    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    });
};

const getDashboardStats = async (req, res) => {
    // Total interviews
    const total = await InterviewSession.countDocuments();
    
    // Get all sessions to properly categorize them
    const allSessions = await InterviewSession.find({});
    
    // Categorize sessions properly
    let accepted = 0;
    let rejected = 0;
    let pending = 0;
    let terminated = 0;
    
    allSessions.forEach(session => {
        if (session.status === 'terminated') {
            terminated++;
        } else if (session.status === 'completed') {
            if (session.decision?.status === 'approved') {
                accepted++;
            } else if (session.decision?.status === 'rejected') {
                rejected++;
            } else {
                // Completed but no decision made yet
                pending++;
            }
        } else if (session.status === 'scheduled' || session.status === 'in_progress') {
            pending++;
        }
    });
    
    // Monthly counts (last 6 months) - only completed interviews
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
        });
    }
    const monthlyCounts = await Promise.all(months.map(async m => {
        const count = await InterviewSession.countDocuments({ createdAt: { $gte: m.start, $lte: m.end } });
        return { month: m.month, count };
    }));
    
    res.json({
        success: true,
        data: {
            total,
            accepted,
            rejected,
            pending,
            terminated,
            monthlyCounts
        }
    });
};

const getRecentInterviews = async (req, res) => {
    // Get last 10 completed or terminated sessions
    const sessions = await InterviewSession.find({ status: { $in: ['completed', 'terminated'] } })
        .sort({ completedAt: -1 })
        .limit(10)
        .populate('candidate', 'firstName lastName')
        .populate('template', 'title');
    // Get reports for these sessions
    const sessionIds = sessions.map(s => s._id);
    const reports = await InterviewReport.find({ session: { $in: sessionIds } });
    const reportMap = {};
    reports.forEach(r => { reportMap[r.session.toString()] = r; });
    const data = sessions.map(s => {
        const r = reportMap[s._id.toString()] || {};
        return {
            sessionId: s._id,
            candidateName: `${s.candidate?.firstName || ''} ${s.candidate?.lastName || ''}`.trim(),
            templateTitle: s.template?.title || '',
            status: s.status,
            decision: s.decision,
            score: r.overallScore || '',
            date: s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '',
        };
    });
    res.json({ success: true, data });
};

// Update profile (name/email)
const updateProfile = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { firstName, lastName, email } = req.body;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    await user.save();
    res.json({ success: true, data: { firstName: user.firstName, lastName: user.lastName, email: user.email } });
};

// Change password
const changePassword = async (req, res) => {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password required' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
};

// Delete account
const deleteAccount = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.remove();
    // Optionally: Invalidate session/token here
    res.json({ success: true, message: 'Account deleted' });
};

module.exports = {
    getUsers,
    getDashboardStats,
    getRecentInterviews,
    updateProfile,
    changePassword,
    deleteAccount,
    // We will add functions for getting a single user, updating, etc. later.
};