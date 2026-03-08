import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as apiClient from '../services/apiClient';
import config from '../config';
import ScoreCard from '../components/ScoreCard';
import SkillsRadarChart from '../components/SkillsRadarChart';
import DetailedAnalysisView from '../components/DetailedAnalysisView';
import SummaryAndFeedback from '../components/SummaryAndFeedback';
import RecommendationsView from '../components/RecommendationsView';
import {
    Box, Typography, Paper, Button, Alert, IconButton, CircularProgress,
    Modal, TextField, Backdrop, Fade, Grid
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CodeIcon from '@mui/icons-material/Code';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FunctionsIcon from '@mui/icons-material/Functions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const TabButton = ({ children, isActive, onClick }) => (
    <Button
        onClick={onClick}
        variant={isActive ? 'contained' : 'text'}
        sx={{
            borderRadius: '12px 12px 0 0',
            fontWeight: 700,
            fontFamily: 'Inter, Roboto, Arial, sans-serif',
            fontSize: '1rem',
            color: isActive ? '#181818' : '#bdbdbd',
            background: isActive ? '#FFE066' : 'transparent',
            boxShadow: 'none',
            px: 4,
            py: 1.5,
            borderBottom: isActive ? 'none' : '2px solid #232526',
            transition: 'all 0.2s',
            '&:hover': {
                background: isActive ? '#FFE066' : '#232526',
                color: '#fff',
            },
        }}
        disableElevation
    >
        {children}
    </Button>
);

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: '#1E1E1E',
  border: '1px solid #FFE066',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
  color: '#fff',
  fontFamily: 'inherit',
};

// A new styled Paper component for consistency
const ReportBlock = ({ children }) => (
    <Paper 
        sx={{ 
            p: { xs: 2, md: 3 }, 
            backgroundColor: '#1E1E1E', 
            border: '1px solid #2c2c2c', 
            borderRadius: 3, 
            height: '100%' 
        }}
    >
        {children}
    </Paper>
);

const DetailedReportPage = ({ sessionId: propSessionId, onBack }) => {
    const { sessionId: paramSessionId } = useParams();
    const sessionId = propSessionId || paramSessionId;
    const [activeTab, setActiveTab] = useState('summary');
    const [reportData, setReportData] = useState(null);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [sessionResponses, setSessionResponses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [decisionState, setDecisionState] = useState({
        modalOpen: false,
        decisionType: null, // 'approved' or 'rejected'
        comments: '',
        isSubmitting: false,
        submitError: '',
        decisionMade: null, // Stores the final decision
    });
    const [exporting, setExporting] = useState(false);

    const fetchAllReportData = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError('');
        try {
            const [reportRes, sessionRes, responsesRes] = await Promise.all([
                apiClient.getReport(sessionId),
                apiClient.getSessionDetailsForAdmin(sessionId),
                apiClient.getSessionResponses(sessionId, page)
            ]);
            setReportData(reportRes.data);
            setSessionDetails(sessionRes.data);
            setSessionResponses(responsesRes.responses);
            setPagination(responsesRes.pagination);
        } catch (err) {
            setError(err.message || "Failed to fetch detailed report data.");
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchAllReportData(pagination.page);
    }, [sessionId, pagination.page, fetchAllReportData]);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleOpenModal = (decisionType) => {
        setDecisionState(prev => ({ ...prev, modalOpen: true, decisionType, submitError: '' }));
    };

    const handleCloseModal = () => {
        setDecisionState(prev => ({ ...prev, modalOpen: false, comments: '' }));
    };

    const handleSubmitDecision = async () => {
        setDecisionState(prev => ({ ...prev, isSubmitting: true, submitError: '' }));
        try {
            await apiClient.submitDecision(sessionId, {
                decision: decisionState.decisionType,
                comments: decisionState.comments
            });
            setDecisionState(prev => ({
                ...prev,
                isSubmitting: false,
                modalOpen: false,
                decisionMade: prev.decisionType,
            }));
        } catch (err) {
            setDecisionState(prev => ({ ...prev, isSubmitting: false, submitError: err.message || 'Failed to submit decision.' }));
        }
    };

    const handleExport = (type) => {
        setExporting(true);
        apiClient.exportReport(sessionId, type)
            .catch(err => {
                alert('Export failed: ' + err.message);
            })
            .finally(() => {
                setExporting(false);
            });
    };

    const renderTabContent = () => {
        if (isLoading) return <Box sx={{ p: 8, textAlign: 'center', color: '#bdbdbd' }}><CircularProgress sx={{ color: '#FFE066' }} /></Box>;
        if (error) return <Box sx={{ p: 8, textAlign: 'center', color: '#ff5252' }}>{error}</Box>;
        
        switch (activeTab) {
            case 'questions':
                return <QuestionsListView questions={sessionDetails?.questions || []} />;
            case 'breakdown':
                return <BreakdownView responses={sessionResponses} pagination={pagination} onPageChange={handlePageChange} />;
            case 'summary':
            default:
                if (!reportData) return <Typography sx={{ color: '#bdbdbd', p: 4 }}>No summary available.</Typography>;

                const { skillScores, skillsDistribution, detailedAnalysis, interviewSummary, feedback, recommendations } = reportData;
                const radarChartData = skillsDistribution ? Object.entries(skillsDistribution).map(([skill, score]) => ({ skill, score })) : [];

                return (
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                        {/* Centered Score Cards */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', mb: 4 }}>
                            <ScoreCard title="Technical" score={skillScores?.technical?.toFixed(0) || 0} icon={<CodeIcon />} color="#82ca9d" />
                            <ScoreCard title="Communication" score={skillScores?.communication?.toFixed(0) || 0} icon={<SpeakerNotesIcon />} color="#8884d8" />
                            <ScoreCard title="Behavioral" score={skillScores?.behavioral?.toFixed(0) || 0} icon={<PsychologyIcon />} color="#ffc658" />
                            <ScoreCard title="Problem Solving" score={skillScores?.problemSolving?.toFixed(0) || 0} icon={<FunctionsIcon />} color="#ff8042" />
                        </Box>
                        {/* Main Content Area: Detailed Analysis & Skills Distribution */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'stretch', mb: 4 }}>
                            <Box sx={{ flex: 2, minWidth: 0 }}>
                                <ReportBlock>
                                    <DetailedAnalysisView analysis={detailedAnalysis || []} />
                                </ReportBlock>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ReportBlock>
                                    <SkillsRadarChart data={radarChartData} />
                                </ReportBlock>
                            </Box>
                        </Box>
                        {/* Right Sidebar (Summary & Recommendations) */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6} lg={6}>
                                <ReportBlock>
                                    <SummaryAndFeedback summary={interviewSummary} feedback={feedback} />
                                </ReportBlock>
                            </Grid>
                            <Grid item xs={12} md={6} lg={6}>
                                <ReportBlock>
                                    <RecommendationsView recommendations={recommendations} />
                                </ReportBlock>
                            </Grid>
                        </Grid>
                    </Box>
                );
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#121212', // Darker main background
                p: { xs: 1, sm: 2, md: 3 },
                fontFamily: 'Inter, Roboto, Arial, sans-serif',
            }}
        >
            <Paper
                elevation={0} // Flat design
                sx={{
                    width: '100%',
                    background: '#181818', // Main container background
                    color: '#fff',
                    borderRadius: 4,
                }}
            >
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Button onClick={onBack} sx={{ color: '#FFE066', fontWeight: 700, textTransform: 'none', '&:hover': { color: '#fff' } }}>
                    &larr; Back to Admin Panel
                </Button>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleExport('csv')}
                                disabled={exporting}
                                sx={{ color: '#FFE066', borderColor: '#FFE066', fontWeight: 700, borderRadius: 2, px: 3, py: 1, '&:hover': { bgcolor: '#FFE066', color: '#181818' } }}
                            >
                                {exporting ? 'Exporting...' : 'Export as CSV'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={() => handleExport('pdf')}
                                disabled={exporting}
                                sx={{ color: '#ff5252', borderColor: '#ff5252', fontWeight: 700, borderRadius: 2, px: 3, py: 1, '&:hover': { bgcolor: '#ff5252', color: '#fff' } }}
                            >
                                {exporting ? 'Exporting...' : 'Export as PDF'}
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid #2c2c2c', mb: 0 }}>
                    <TabButton isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Overall Summary</TabButton>
                    <TabButton isActive={activeTab === 'questions'} onClick={() => setActiveTab('questions')}>Questions List</TabButton>
                    <TabButton isActive={activeTab === 'breakdown'} onClick={() => setActiveTab('breakdown')}>Response Breakdown</TabButton>
                </Box>
                    <Box>
                    {renderTabContent()}
                    </Box>
                </Box>
                
                {/* Enhanced Recruiter Actions Section */}
                <Box sx={{ 
                    m: { xs: 2, sm: 3 },
                    p: { xs: 2, sm: 3 }, 
                    background: '#1E1E1E',
                    border: '1px solid #2c2c2c',
                    borderRadius: 3,
                }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#fff', textAlign: 'center' }}>
                        Recruiter Actions
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#fff', textAlign: 'center' }}>
                        Recruitment Status: {sessionDetails?.decision?.status ? sessionDetails.decision.status.toUpperCase() : 'PENDING'}
                    </Typography>
                    {decisionState.decisionMade ? (
                        <Alert
                            severity={decisionState.decisionMade === 'approved' ? 'success' : 'error'}
                            iconMapping={{
                                success: <CheckCircleOutlineIcon fontSize="inherit" />,
                                error: <HighlightOffIcon fontSize="inherit" />,
                            }}
                            sx={{ 
                                justifyContent: 'center', 
                                fontWeight: 'bold', 
                                fontSize: '1.2rem',
                                py: 2,
                                borderRadius: 2
                            }}
                        >
                            Candidate has been {decisionState.decisionMade}.
                        </Alert>
                    ) : (
                        <Grid container spacing={2} justifyContent="center">
                            <Grid item xs={12} sm={5}>
                                <Button
                                    fullWidth
                                    startIcon={<CheckCircleOutlineIcon />}
                                    onClick={() => handleOpenModal('approved')}
                                    sx={{ 
                                        bgcolor: '#4caf50', 
                                        color: '#fff', 
                                        fontWeight: 'bold', 
                                        py: 1.5,
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: '#388e3c' } 
                                    }}
                                >
                                    Approve Candidate
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={5}>
                                <Button
                                    fullWidth
                                    startIcon={<HighlightOffIcon />}
                                    onClick={() => handleOpenModal('rejected')}
                                    sx={{ 
                                        bgcolor: '#f44336', 
                                        color: '#fff', 
                                        fontWeight: 'bold', 
                                        py: 1.5,
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: '#d32f2f' } 
                                    }}
                                >
                                    Reject Candidate
                                </Button>
                            </Grid>
                        </Grid>
                    )}
                </Box>

                {/* Enhanced Decision Modal */}
                <Modal
                    open={decisionState.modalOpen}
                    onClose={handleCloseModal}
                    closeAfterTransition
                    slots={{ backdrop: Backdrop }}
                    slotProps={{ backdrop: { timeout: 500 } }}
                >
                    <Fade in={decisionState.modalOpen}>
                        <Box sx={modalStyle}>
                            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                                Confirm Decision: {decisionState.decisionType?.toUpperCase()}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2, color: '#FFE066' }}>
                                Provide final feedback for the candidate. This will be shared with them.
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                placeholder="e.g., Excellent problem-solving skills, but we're looking for more experience in..."
                                value={decisionState.comments}
                                onChange={(e) => setDecisionState(prev => ({ ...prev, comments: e.target.value }))}
                                InputProps={{
                                    sx: {
                                        color: '#fff',
                                        '&::placeholder': { color: '#bdbdbd', opacity: 1 },
                                    },
                                }}
                                sx={{
                                    my: 2,
                                    '& .MuiInputBase-input': { color: '#fff' },
                                    '& .MuiInputBase-input::placeholder': { color: '#bdbdbd', opacity: 1 },
                                    textarea: { color: '#fff' },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: '#444' },
                                        '&:hover fieldset': { borderColor: '#FFE066' },
                                    },
                                }}
                            />
                            {decisionState.submitError && <Alert severity="error" sx={{ mb: 2 }}>{decisionState.submitError}</Alert>}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                                <Button onClick={handleCloseModal} sx={{ color: '#bdbdbd' }}>Cancel</Button>
                                <Button
                                    onClick={handleSubmitDecision}
                                    variant="contained"
                                    disabled={decisionState.isSubmitting}
                                    sx={{ 
                                        bgcolor: decisionState.decisionType === 'approved' ? '#4caf50' : '#f44336',
                                        '&:hover': {
                                            bgcolor: decisionState.decisionType === 'approved' ? '#388e3c' : '#d32f2f'
                                        }
                                    }}
                                >
                                    {decisionState.isSubmitting ? <CircularProgress size={24} color="inherit" /> : `Submit Decision`}
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                </Modal>
            </Paper>
        </Box>
    );
};

// --- Sub-components for the tabs ---

const QuestionsListView = ({ questions }) => (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
        {questions.map((q, index) => (
            <Paper 
                key={q._id} 
                elevation={0} 
                sx={{ 
                    p: 3, 
                    mb: 3,
                    background: '#1E1E1E',
                    borderLeft: '4px solid #FFE066',
                    borderRadius: '0 8px 8px 0',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>
                    Q{index + 1}: {q.questionText}
                </Typography>
                <Box sx={{ color: '#bdbdbd', lineHeight: 1.7, '& p': { my: 0 }, '& strong': { color: '#FFE066' } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>Ideal Answer:</Typography>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.idealAnswer}</ReactMarkdown>
                    </Box>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {q.keywords.map(keyword => (
                        <Button key={keyword} size="small" sx={{ 
                            background: '#333',
                            color: '#FFE066',
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontWeight: 600,
                            pointerEvents: 'none',
                        }}>
                            {keyword}
                        </Button>
                    ))}
                </Box>
            </Paper>
        ))}
    </Box>
);

const BreakdownView = ({ responses, pagination, onPageChange }) => {
    const audioRefs = useRef([]);

    const handlePlay = (idx) => {
        if (audioRefs.current[idx]) {
            audioRefs.current.forEach((audio, i) => {
                if (audio && i !== idx) audio.pause();
            });
            audioRefs.current[idx].play();
        }
    };

    return (
        <Box sx={{ p: 4, fontFamily: 'inherit' }}>
            <Box sx={{ overflowX: 'auto', fontFamily: 'inherit' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
                    <thead>
                        <tr style={{ background: '#232526' }}>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Question</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Candidate's Answer</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Score</th>
                            <th style={{ padding: '12px 8px', textAlign: 'left', color: '#bdbdbd', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 1, fontFamily: 'inherit' }}>Audio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {responses.map((res, idx) => (
                            <tr key={res._id} style={{ borderBottom: '1px solid #232526' }}>
                                <td style={{ padding: '10px 8px', color: '#fff', fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontWeight: 500 }}>{res.questionText}</td>
                                <td style={{ padding: '10px 8px', color: '#bdbdbd', fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                                    "{res.transcribedText}"
                                </td>
                                <td style={{ padding: '10px 8px', color: '#FFE066', fontFamily: 'inherit', fontWeight: 700, fontSize: '1.1rem' }}>{(res.aiScore).toFixed(1)}%</td>
                                <td style={{ padding: '10px 8px', fontFamily: 'inherit' }}>
                                    <audio ref={el => audioRefs.current[idx] = el} src={`${config.BACKEND_URL}${res.audioFileUrl}`} preload="none" style={{ display: 'none' }} />
                                    <IconButton onClick={() => handlePlay(idx)} sx={{ color: '#FFE066', background: '#232526', borderRadius: 2, '&:hover': { background: '#FFE066', color: '#181818' } }}>
                                        <PlayArrowIcon fontSize="large" />
                                    </IconButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, p: 2, borderTop: '1px solid #232526' }}>
                <Button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    sx={{
                        color: '#bdbdbd',
                        borderColor: '#232526',
                        borderWidth: 2,
                        borderRadius: 1,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        background: 'transparent',
                        '&:hover': { background: '#232526', color: '#fff' },
                        opacity: pagination.page <= 1 ? 0.5 : 1,
                    }}
                >
                    Previous
                </Button>
                <Typography sx={{ color: '#bdbdbd', fontFamily: 'inherit' }}>Page {pagination.page} of {pagination.totalPages}</Typography>
                <Button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    sx={{
                        color: '#bdbdbd',
                        borderColor: '#232526',
                        borderWidth: 2,
                        borderRadius: 1,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        background: 'transparent',
                        '&:hover': { background: '#232526', color: '#fff' },
                        opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                    }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default DetailedReportPage;