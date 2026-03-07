import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

/**
 * A page that displays instructions to the candidate before they begin their interview.
 * @param {object} props - Component props.
 * @param {function} props.onBegin - Callback function to call when the user clicks "Begin Interview".
 */
const InstructionsPage = ({ onBegin }) => {
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
                    maxWidth: 600,
                    width: '100%',
                    mx: 2,
                    background: 'rgba(24, 24, 24, 0.98)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    color: '#fff',
                    borderRadius: 3,
                    fontFamily: 'inherit',
                }}
            >
                <Typography variant="h4" sx={{ color: '#FFE066', fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 2, textAlign: 'center' }}>
                    Interview Instructions
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#bdbdbd', fontWeight: 400, mb: 4, textAlign: 'center', fontFamily: 'inherit' }}>
                    Welcome to your AI-powered interview. Please read the following instructions carefully before you begin.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, color: '#bdbdbd', fontFamily: 'inherit', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ color: '#FFE066', fontWeight: 700, fontSize: '1.2rem', minWidth: 24, fontFamily: 'inherit' }}>1.</Typography>
                        <Typography sx={{ fontSize: '1rem', fontFamily: 'inherit' }}>You will be presented with a series of questions one by one. Ensure you have a stable internet connection.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ color: '#FFE066', fontWeight: 700, fontSize: '1.2rem', minWidth: 24, fontFamily: 'inherit' }}>2.</Typography>
                        <Typography sx={{ fontSize: '1rem', fontFamily: 'inherit' }}>For each question, you must click the <b>"Record"</b> button to start your answer and <b>"Stop"</b> when you have finished. Your microphone and camera must be enabled.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ color: '#FFE066', fontWeight: 700, fontSize: '1.2rem', minWidth: 24, fontFamily: 'inherit' }}>3.</Typography>
                        <Typography sx={{ fontSize: '1rem', fontFamily: 'inherit' }}>After stopping the recording, the system will automatically transcribe and submit your answer. This process is fully automated.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ color: '#FFE066', fontWeight: 700, fontSize: '1.2rem', minWidth: 24, fontFamily: 'inherit' }}>4.</Typography>
                        <Typography sx={{ fontSize: '1rem', fontFamily: 'inherit', fontWeight: 600, color: '#ff5252' }}>You cannot go back to a previous question. Once you proceed, your previous answer is final.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ color: '#FFE066', fontWeight: 700, fontSize: '1.2rem', minWidth: 24, fontFamily: 'inherit' }}>5.</Typography>
                        <Typography sx={{ fontSize: '1rem', fontFamily: 'inherit' }}>Please ensure you are in a quiet environment to allow for clear audio recording and accurate transcription.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ color: '#FFE066', fontWeight: 700, fontSize: '1.2rem', minWidth: 24, fontFamily: 'inherit' }}>6.</Typography>
                        <Typography sx={{ fontSize: '1rem', fontFamily: 'inherit', color: '#ff5252', fontWeight: 600 }}>
                            If you receive 3 proctoring infractions (e.g., multiple faces, not facing the camera, or no face detected), your interview will be <b>terminated</b> and you will see a termination message.
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ mt: 6, textAlign: 'center' }}>
                    <Button
                        onClick={onBegin}
                        variant="outlined"
                        sx={{
                            color: '#FFE066',
                            borderColor: '#FFE066',
                            borderWidth: 2,
                            borderRadius: 1.5,
                            py: 1.5,
                            px: 6,
                            minWidth: '220px',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            fontFamily: 'inherit',
                            boxShadow: 'none',
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: '#FFE066',
                                color: '#181818',
                                borderColor: '#FFE066',
                                boxShadow: '0 0 16px 0 #ffe06644',
                            },
                        }}
                    >
                        I Understand, Begin Interview
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default InstructionsPage;