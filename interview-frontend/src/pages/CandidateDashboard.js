import React, { useState, useEffect } from 'react';
import * as apiClient from '../services/apiClient';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const CandidateDashboard = ({ user }) => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const theme = useTheme();

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await apiClient.getMySessions();
                setSessions(response.data);
            } catch (err) {
                setError('Could not fetch your scheduled interviews.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const handleStartInterview = (uniqueLink) => {
        window.location.pathname = `/instructions/${uniqueLink}`;
    };

    return (
        <Box sx={{ minHeight: '100vh', background: theme.palette.background.default }}>
            {/* Main content (existing) */}
            <Box
                sx={{
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
                        background: theme.palette.background.paper,
                        boxShadow: theme.palette.custom.glow,
                        color: theme.palette.text.primary,
                        borderRadius: 3,
                        fontFamily: 'inherit',
                    }}
                >
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1, fontFamily: 'inherit', textAlign: 'center', letterSpacing: 0.5 }}>
                        Welcome, {user.firstName}!
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, fontWeight: 400, mb: 4, fontFamily: 'inherit', textAlign: 'center' }}>
                        Here are your scheduled interviews.
                    </Typography>
                    {isLoading && <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress sx={{ color: theme.palette.primary.main }} /></Box>}
                    {error && <Typography sx={{ textAlign: 'center', p: 4, color: '#ff5252', fontFamily: 'inherit' }}>{error}</Typography>}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {!isLoading && sessions.length > 0 ? (
                            sessions.map(session => (
                                <Paper key={session._id} elevation={2} sx={{ p: 3, background: theme.palette.background.paper, borderRadius: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 3, fontFamily: 'inherit', boxShadow: theme.palette.custom.shadow }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: theme.palette.primary.main, fontFamily: 'inherit' }}>{session.template.title}</Typography>
                                        <Typography sx={{ color: theme.palette.text.secondary, fontFamily: 'inherit', mt: 0.5 }}>
                                            Status: {session.status === 'terminated' ? (
                                                <span style={{ fontWeight: 700, color: '#ff5252', textTransform: 'capitalize', border: '1.5px solid #ff5252', borderRadius: 6, padding: '2px 10px', marginLeft: 6 }}>Terminated</span>
                                            ) : session.status === 'completed' ? (
                                                <span style={{ fontWeight: 700, color: '#4caf50', textTransform: 'capitalize', border: '1.5px solid #4caf50', borderRadius: 6, padding: '2px 10px', marginLeft: 6 }}>Completed</span>
                                            ) : (
                                                <span style={{ fontWeight: 600, color: theme.palette.text.primary, textTransform: 'capitalize' }}>{session.status.replace('_', ' ')}</span>
                                            )}
                                        </Typography>
                                        <Typography sx={{ color: theme.palette.text.secondary, fontFamily: 'inherit', mt: 0.5 }}>
                                            Scheduled for: {new Date(session.scheduledAt).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    {session.status === 'scheduled' && (
                                        <Button
                                            onClick={() => handleStartInterview(session.uniqueLink)}
                                            variant="outlined"
                                            sx={{
                                                color: theme.palette.primary.main,
                                                borderColor: theme.palette.primary.main,
                                                borderWidth: 2,
                                                borderRadius: 1.5,
                                                py: 1.2,
                                                px: 4,
                                                minWidth: '160px',
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                letterSpacing: 1,
                                                fontFamily: 'inherit',
                                                boxShadow: 'none',
                                                transition: 'all 0.2s',
                                                background: 'transparent',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.primary.main,
                                                    color: theme.palette.background.default,
                                                    borderColor: theme.palette.primary.main,
                                                    boxShadow: theme.palette.custom.glow,
                                                },
                                            }}
                                        >
                                            Start Interview
                                        </Button>
                                    )}
                                </Paper>
                            ))
                        ) : (
                            !isLoading && <Typography sx={{ textAlign: 'center', color: theme.palette.text.secondary, p: 4, fontFamily: 'inherit' }}>You have no interviews scheduled at this time.</Typography>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default CandidateDashboard;