import React from 'react';
import { Box, Typography } from '@mui/material';

const RecommendationsView = ({ recommendations }) => {
    return (
        <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 2, color: '#fff' }}>
                Recommendations
            </Typography>
            <Box sx={{ p: 2, backgroundColor: '#121212', borderRadius: 2, borderLeft: '4px solid #8884d8' }}>
                <Typography variant="body1" sx={{ color: '#e0e0e0', lineHeight: 1.6 }}>
                    {recommendations}
                </Typography>
            </Box>
        </Box>
    );
};

export default RecommendationsView; 