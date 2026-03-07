import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const SummaryDonut = ({ label, value, color, icon, arc }) => {
    const [progress, setProgress] = useState(0);
    const reqRef = useRef();
    useEffect(() => {
        let start = 0;
        const end = Math.round(arc);
        const duration = 900;
        const step = (timestamp, startTime) => {
            if (!startTime) startTime = timestamp;
            const progressVal = Math.min((timestamp - startTime) / duration, 1);
            setProgress(Math.round(progressVal * end));
            if (progressVal < 1) {
                reqRef.current = requestAnimationFrame(ts => step(ts, startTime));
            } else {
                setProgress(end);
            }
        };
        reqRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(reqRef.current);
    }, [arc]);

    return (
        <Box
            sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 110,
                transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
                '&:hover .donut-shine': {
                    opacity: 1,
                },
                cursor: 'pointer',
                position: 'relative',
            }}
        >
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                <CircularProgress
                    variant="determinate"
                    value={progress}
                    size={80}
                    thickness={6}
                    sx={{ color, background: 'rgba(255,255,255,0.03)', borderRadius: '50%', zIndex: 2, transition: 'color 0.3s' }}
                />
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={80}
                    thickness={6}
                    sx={{ color: '#444', position: 'absolute', left: 0, opacity: 0.18, zIndex: 1 }}
                />
                {/* Shine effect on hover - circular overlay only */}
                <Box className="donut-shine" sx={{
                    position: 'absolute',
                    top: 0, left: 0, width: 80, height: 80,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    background: `radial-gradient(circle at 60% 30%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.01) 80%)`,
                    zIndex: 3,
                }} />
                <Box sx={{
                    top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Typography sx={{ color, fontWeight: 800, fontSize: '1.6rem', letterSpacing: 0.5 }}>{value}</Typography>
                </Box>
            </Box>
            {icon}
            <Typography sx={{ color: '#bdbdbd', fontWeight: 500, fontSize: '1.05rem', mt: 0.5 }}>{label}</Typography>
        </Box>
    );
};

export default SummaryDonut; 