import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Simple API client for this page
const apiClient = {
    analyzeFrame: async (imageBlob) => {
        const formData = new FormData();
        formData.append('frame', imageBlob, 'frame.jpg');
        
        // This endpoint will need to be created in your Flask proctoring API
        const response = await fetch('http://localhost:5001/analyze_frame', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to analyze frame.');
        }
        return response.json();
    }
};

const ResourceCheckPage = ({ onSuccess }) => {
    const [micStatus, setMicStatus] = useState('pending');
    const [cameraStatus, setCameraStatus] = useState('pending');
    const [analysis, setAnalysis] = useState({ status: 'pending', landmarks: null });
    const [error, setError] = useState('');
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Helper to stop the media stream
    const stopMediaStream = () => {
        return new Promise((resolve) => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            // Wait a tick to ensure browser releases the device
            setTimeout(resolve, 100);
        });
    };

    // Effect to get media and perform the check
    useEffect(() => {
        const performCheck = async () => {
            try {
                // 1. Get Camera and Mic Stream
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                streamRef.current = stream;
                setMicStatus('ok');

                // Attach stream to video element
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setCameraStatus('ok');
                        
                        // 2. Auto-capture after a delay
                        setTimeout(captureAndAnalyze, 2000);
                    };
                }
            } catch (err) {
                setError('Camera or Microphone not accessible. Please allow access and retry.');
                setCameraStatus('error');
                setMicStatus('error');
            }
        };

        performCheck();

        // 5. Graceful Teardown
        return () => {
            stopMediaStream();
        };
    }, []);

    // 3. Capture and Analyze Frame
    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setAnalysis({ status: 'loading', landmarks: null });

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            try {
                const result = await apiClient.analyzeFrame(blob);
                if (result.success && result.landmarks) {
                    drawLandmarks(result.landmarks);
                    setAnalysis({ status: 'ok', landmarks: result.landmarks });
                } else {
                    setAnalysis({ status: 'error', landmarks: null });
                }
            } catch (err) {
                setAnalysis({ status: 'error', landmarks: null });
                setError(err.message);
            }
        }, 'image/jpeg');
    };

    // 4. Draw landmarks on canvas
    const drawLandmarks = (landmarks) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.font = '16px Arial';
        context.fillStyle = '#FFE066';

        Object.entries(landmarks).forEach(([key, { x, y }]) => {
            context.fillText(key.charAt(0).toUpperCase() + key.slice(1), x + 10, y + 5);
            context.beginPath();
            context.arc(x, y, 5, 0, 2 * Math.PI);
            context.fill();
        });
    };

    // Handler for Continue button
    const handleContinue = async () => {
        await stopMediaStream();
        onSuccess();
    };

    const allChecksPassed = micStatus === 'ok' && cameraStatus === 'ok' && analysis.status === 'ok';

    return (
        <Box sx={{ minHeight: '100vh', background: '#121212', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Paper sx={{ p: 4, maxWidth: 700, width: '100%', background: '#1E1E1E', color: '#fff', borderRadius: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
                    System & Resource Check
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'center' }}>
                    {/* Camera Feed & Canvas */}
                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 2, overflow: 'hidden' }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <canvas ref={canvasRef} style={{ display: analysis.status !== 'pending' ? 'block' : 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                    </Box>

                    {/* Status List */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <StatusItem status={cameraStatus} text="Camera Access" />
                        <StatusItem status={micStatus} text="Microphone Access" />
                        <StatusItem status={analysis.status} text="Face Detection Analysis" />
                    </Box>
                </Box>
                
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                        onClick={handleContinue}
                        variant="contained"
                        sx={{ py: 1.5, px: 6, fontSize: '1.1rem', fontWeight: 700, background: allChecksPassed ? '#FFE066' : '#444', color: '#181818', '&:hover': { background: '#FFD133' } }}
                        disabled={!allChecksPassed}
                    >
                        {allChecksPassed ? 'Continue' : 'Checking...'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

const StatusItem = ({ status, text }) => {
    const getIcon = () => {
        switch (status) {
            case 'ok': return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
            case 'error': return <CancelIcon sx={{ color: '#ff5252' }} />;
            default: return <CircularProgress size={20} sx={{ color: '#bdbdbd' }} />;
        }
    };
    return (
        <Paper elevation={0} sx={{ p: 2, background: '#2c2c2c', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            {getIcon()}
            <Typography sx={{ fontWeight: 500 }}>{text}</Typography>
        </Paper>
    );
};

export default ResourceCheckPage; 