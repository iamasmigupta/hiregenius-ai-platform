import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SummaryAndFeedback = ({ summary, feedback }) => {
    return (
        <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 2, color: '#fff' }}>
                Interview Summary
            </Typography>
            <Typography variant="body1" sx={{ color: '#bdbdbd', mb: 3, lineHeight: 1.6 }}>
                {summary}
            </Typography>
            
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 2, color: '#fff' }}>
                Feedback
            </Typography>
            <Paper elevation={0} sx={{ p: 2, backgroundColor: '#121212', borderRadius: 2 }}>
                <Typography variant="body1" sx={{ color: '#e0e0e0', fontStyle: 'italic' }}>
                    {feedback}
                </Typography>
            </Paper>
        </Box>
    );
};

export default SummaryAndFeedback; 