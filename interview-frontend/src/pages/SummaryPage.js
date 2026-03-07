import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

/**
 * A purely presentational component for displaying the final report summary.
 * It receives the fully populated report object as a prop.
 */
const SummaryPage = ({ reportData: report }) => {
    if (!report) {
        return <Box sx={{ textAlign: 'center', p: 12, color: '#bdbdbd', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>Report data is not available.</Box>;
    }

    const { overallScore, recommendation, strengths, areasForImprovement, session, warningCount, proctoringInfractions, proctoringEventLog, terminationReason } = report;
    const { candidate, template } = session || {};

    let scoreColor = '#ff5252';
    if (overallScore >= 70) scoreColor = '#4caf50';
    else if (overallScore >= 50) scoreColor = '#FFE066';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
                fontFamily: 'Inter, Roboto, Arial, sans-serif',
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 5 },
                    maxWidth: 700,
                    width: '100%',
                    mx: 2,
                    background: 'rgba(24, 24, 24, 0.98)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    color: '#fff',
                    borderRadius: 3,
                    fontFamily: 'inherit',
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 6, borderBottom: '1px solid #232526', pb: 4 }}>
                    <Typography variant="h4" sx={{ color: '#FFE066', fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 4, textAlign: 'center' }}>
                        Interview Report
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#bdbdbd', fontWeight: 500, fontFamily: 'inherit', textTransform: 'capitalize' }}>
                        {template?.title || 'Interview'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bdbdbd', fontFamily: 'inherit', mt: 1 }}>
                        Candidate: {candidate?.firstName} {candidate?.lastName}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', background: '#232526', p: 5, borderRadius: 2, mb: 6, fontFamily: 'inherit' }}>
                    <Typography sx={{ fontWeight: 600, color: '#bdbdbd', fontSize: '1.1rem', fontFamily: 'inherit' }}>Overall Score</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1, mt: 1 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: '4rem', color: scoreColor, fontFamily: 'inherit', lineHeight: 1 }}>
                            {Number(overallScore).toFixed(1)}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '2rem', color: '#bdbdbd', fontFamily: 'inherit', mb: 0.5 }}>/100</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#FFE066', mt: 2, textTransform: 'capitalize', fontFamily: 'inherit' }}>
                        Recommendation: {recommendation?.replace('_', ' ') || 'Not available'}
                    </Typography>
                </Box>
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 3, fontFamily: 'inherit' }}>AI-Generated Summary</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                        <Box sx={{ background: '#1e2e1e', p: 3, borderRadius: 2, border: '1px solid #4caf50', fontFamily: 'inherit' }}>
                            <Typography sx={{ fontWeight: 700, color: '#4caf50', mb: 1, fontFamily: 'inherit' }}>Strengths</Typography>
                            <Typography sx={{ color: '#b2ffb2', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{Array.isArray(strengths) ? strengths.join('\n') : (strengths && typeof strengths === 'string') ? strengths : 'No specific strengths highlighted.'}</Typography>
                        </Box>
                        <Box sx={{ background: '#2e1e1e', p: 3, borderRadius: 2, border: '1px solid #ff5252', fontFamily: 'inherit' }}>
                            <Typography sx={{ fontWeight: 700, color: '#ff5252', mb: 1, fontFamily: 'inherit' }}>Areas for Improvement</Typography>
                            <Typography sx={{ color: '#ffb2b2', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{Array.isArray(areasForImprovement) ? areasForImprovement.join('\n') : (areasForImprovement && typeof areasForImprovement === 'string') ? areasForImprovement : 'No specific areas for improvement highlighted.'}</Typography>
                        </Box>
                    </Box>
                </Box>
                {/* Proctoring Analytics Section */}
                {(warningCount > 0 || terminationReason || (proctoringInfractions && proctoringInfractions.length > 0)) && (
                    <Box sx={{ mb: 5, background: '#232526', p: 3, borderRadius: 2, border: '1px solid #FFE066', fontFamily: 'inherit' }}>
                        <Typography sx={{ fontWeight: 700, color: '#FFE066', mb: 1, fontFamily: 'inherit' }}>Proctoring Analytics</Typography>
                        <Typography sx={{ color: '#bdbdbd', fontFamily: 'inherit' }}>Warnings Issued: <b style={{ color: warningCount >= 3 ? '#ff5252' : '#FFE066' }}>{warningCount}</b></Typography>
                        {terminationReason && <Typography sx={{ color: '#ff5252', fontFamily: 'inherit' }}>Termination Reason: {terminationReason}</Typography>}
                        {proctoringInfractions && proctoringInfractions.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                                <Typography sx={{ color: '#bdbdbd', fontFamily: 'inherit' }}>Infractions:</Typography>
                                <ul style={{ color: '#ffb2b2', marginLeft: 20 }}>
                                    {proctoringInfractions.map((inf, idx) => (
                                        <li key={idx}>{typeof inf === 'string' ? inf : JSON.stringify(inf)}</li>
                                    ))}
                                </ul>
                            </Box>
                        )}
                        {proctoringEventLog && proctoringEventLog.length > 0 && (
                            <details style={{ marginTop: 8 }}>
                                <summary style={{ color: '#FFE066', cursor: 'pointer', fontWeight: 600 }}>View Proctoring Event Log</summary>
                                <Box sx={{ mt: 1, maxHeight: 200, overflowY: 'auto', background: '#181818', borderRadius: 1, p: 2, fontSize: '0.95rem', color: '#bdbdbd', fontFamily: 'inherit' }}>
                                    <ul style={{ paddingLeft: 16 }}>
                                        {proctoringEventLog.map((event, idx) => (
                                            <li key={idx} style={{ marginBottom: 4 }}>{typeof event === 'string' ? event : JSON.stringify(event)}</li>
                                        ))}
                                    </ul>
                                </Box>
                            </details>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default SummaryPage;
