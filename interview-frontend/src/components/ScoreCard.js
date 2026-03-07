import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Box, Icon } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ScoreCard = ({ title, score, icon, color }) => {
    const theme = useTheme();
    // Animate the score number
    const [displayScore, setDisplayScore] = useState(0);
    const animationRef = useRef();
    useEffect(() => {
        let start = 0;
        const end = Math.round(score);
        const duration = 900;
        const step = (timestamp, startTime) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setDisplayScore(Math.round(progress * end));
            if (progress < 1) {
                animationRef.current = requestAnimationFrame(ts => step(ts, startTime));
            } else {
                setDisplayScore(end);
            }
        };
        animationRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animationRef.current);
    }, [score]);

    return (
        <Card
            sx={{
                background: theme.palette.background.paper,
                border: `2.5px solid ${theme.palette.primary.main}`,
                borderRadius: 4,
                boxShadow: theme.palette.custom.glow,
                height: '100%',
                minWidth: 180,
                maxWidth: 260,
                transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
                '&:hover': {
                    transform: 'translateY(-7px) scale(1.04)',
                    boxShadow: theme.palette.custom.glow,
                    borderColor: theme.palette.primary.main,
                },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 0,
                m: 0,
                backgroundClip: 'padding-box',
            }}
        >
            <CardContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 3,
                    gap: 1.5,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '1.13rem', letterSpacing: 0.2 }}>
                        {title}
                    </Typography>
                    <Icon sx={{ color, fontSize: 30, filter: `drop-shadow(0 0 6px ${color}66)` }}>{icon}</Icon>
                </Box>
                <Box sx={{
                    mt: 1,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                }}>
                    <Typography
                        variant="h2"
                        component="div"
                        sx={{
                            fontWeight: 900,
                            color: theme.palette.text.primary,
                            textShadow: `0 0 16px ${color}99, 0 2px 8px #000a`,
                            fontSize: { xs: '2.2rem', sm: '2.7rem', md: '3.1rem' },
                            lineHeight: 1.1,
                            letterSpacing: 0.5,
                            transition: 'color 0.2s',
                        }}
                    >
                        {displayScore}%
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ScoreCard; 