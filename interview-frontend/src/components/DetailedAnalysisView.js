import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const DetailedAnalysisView = ({ analysis }) => {
    // analysis should be an array of objects e.g. [{ skill: 'Technical', score: 90, description: '...' }]
    return (
        <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 3, color: '#fff' }}>
                Detailed Analysis
            </Typography>
            {analysis.map((item, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#e0e0e0' }}>{item.skill}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#8884d8' }}>{item.score?.toFixed(0) || 0}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={item.score || 0}
                        sx={{
                            height: 8,
                            borderRadius: 5,
                            backgroundColor: '#333',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: '#8884d8',
                            },
                        }}
                    />
                    <Typography variant="body2" sx={{ color: '#bdbdbd', mt: 1, fontStyle: 'italic' }}>
                        {item.description}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

export default DetailedAnalysisView; 