import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';

const CustomAngleAxisTick = ({ x, y, payload }) => {
    const value = payload && payload.value ? String(payload.value) : '';
    const words = value.split(' ');
    return (
        <g transform={`translate(${x},${y})`}>
            <text textAnchor="middle" fill="#bdbdbd" fontSize={13}>
                {words.map((word, i) => (
                    <tspan x={0} dy={i > 0 ? '1.2em' : 0} key={i}>
                        {word}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

const SkillsRadarChart = ({ data }) => {
    // data should be an array of objects e.g. [{ skill: 'Communication', score: 80 }]
    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 2, color: '#fff', flexShrink: 0, textAlign: 'center' }}>
                Skills Distribution
            </Typography>
            <Box sx={{ width: 350, height: 350, maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#444" />
                        <PolarAngleAxis dataKey="skill" tick={<CustomAngleAxisTick />} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'none' }} axisLine={{ stroke: 'none' }} />
                        <Radar name="Candidate" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.7} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#2a2d32',
                                borderColor: '#8884d8',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default SkillsRadarChart; 