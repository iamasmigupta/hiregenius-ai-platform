import React, { useEffect, useState } from 'react';
import { CheckCircle } from '@mui/icons-material';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';

/**
 * A "Thank You" page shown to candidates after they complete an interview.
 * Automatically redirects to the dashboard after a short delay.
 * @param {object} props - Component props.
 * @param {function} props.onRedirect - Callback to navigate to the dashboard.
 */
const InterviewCompletedPage = ({ onRedirect }) => {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Start a timer to redirect the user after 10 seconds.
        const redirectTimer = setTimeout(() => {
            onRedirect();
        }, 10000);

        // Start a timer to update the visual countdown every second.
        const countdownTimer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // Cleanup timers on component unmount.
        return () => {
            clearTimeout(redirectTimer);
            clearInterval(countdownTimer);
        };
    }, [onRedirect]);

    const progress = (10 - countdown) * 10;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                fontFamily: 'Inter, Roboto, Arial, sans-serif',
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 5 },
                    maxWidth: 500,
                    width: '100%',
                    mx: 2,
                    background: 'rgba(24, 24, 24, 0.98)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    color: '#fff',
                    borderRadius: 3,
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                <CheckCircle sx={{ fontSize: 80, color: '#FFE066', mb: 2 }} />
                <Typography variant="h3" component="h1" sx={{ color: '#FFE066', fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 1, textAlign: 'center' }} gutterBottom>
                    Thank You!
                </Typography>
                <Typography variant="h6" sx={{ color: '#bdbdbd', fontWeight: 400, maxWidth: '600px', mb: 4, fontFamily: 'inherit' }}>
                    You have successfully completed the interview. Your responses have been submitted for analysis. You will be notified of the results.
                </Typography>
                <Box sx={{ width: '80%', maxWidth: '400px' }}>
                    <Typography variant="body2" sx={{ color: '#bdbdbd', mb: 1, fontFamily: 'inherit' }}>
                        Redirecting you to your dashboard in {countdown} seconds...
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            background: '#232526',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: '#FFE066',
                                borderRadius: 5,
                            },
                        }}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default InterviewCompletedPage;