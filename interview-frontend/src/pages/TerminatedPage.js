import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

const TerminatedPage = ({ onRedirect }) => {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const redirectTimer = setTimeout(() => {
            onRedirect();
        }, 10000);
        const countdownTimer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => {
            clearTimeout(redirectTimer);
            clearInterval(countdownTimer);
        };
    }, [onRedirect]);

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
                <ErrorOutline sx={{ fontSize: 80, color: '#ff5252', mb: 2 }} />
                <Typography variant="h3" component="h1" sx={{ color: '#FFE066', fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 1, textAlign: 'center' }} gutterBottom>
                    Interview Terminated
                </Typography>
                <Typography variant="h6" sx={{ color: '#bdbdbd', fontWeight: 400, maxWidth: '600px', mb: 4, fontFamily: 'inherit' }}>
                    Your interview was automatically terminated because you received 3 proctoring infractions (e.g., multiple faces, not facing the camera, or no face detected).<br />
                    Please ensure you follow the proctoring guidelines in future interviews.
                </Typography>
                <Box sx={{ width: '80%', maxWidth: '400px', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#bdbdbd', mb: 1, fontFamily: 'inherit' }}>
                        Redirecting you to your dashboard in {countdown} seconds...
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    sx={{
                        color: '#FFE066',
                        borderColor: '#FFE066',
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
                            backgroundColor: '#FFE066',
                            color: '#181818',
                            borderColor: '#FFE066',
                            boxShadow: '0 0 16px 0 #ffe06644',
                        },
                    }}
                    onClick={onRedirect}
                >
                    Go to Dashboard Now
                </Button>
            </Paper>
        </Box>
    );
};

export default TerminatedPage; 