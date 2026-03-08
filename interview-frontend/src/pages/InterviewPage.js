import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as apiClient from '../services/apiClient';
import config from '../config';
import AudioRecorder from '../components/AudioRecorder';
import { Box, Typography, Paper, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import TerminatedPage from './TerminatedPage';

const infractionMessages = {
    'no_face': 'No face detected!',
    'multiple_faces': 'Multiple faces detected!',
    'profile_face': 'Please face the camera directly!',
};

function getSessionKey(sessionId, key) {
    return `${key}-${sessionId}`;
}

const CameraView = React.memo(({ videoRef, correctiveSeconds, infractionType, loadingError, isStreamReady }) => {
    const [showLoading, setShowLoading] = React.useState(true);
    React.useEffect(() => {
        if (isStreamReady) {
            setShowLoading(false);
        } else {
            const timer = setTimeout(() => setShowLoading(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isStreamReady]);
    return (
        <Paper elevation={0} sx={{
            p: 1,
            background: 'linear-gradient(135deg, #232526 60%, #181818 100%)',
            borderRadius: 5,
            boxShadow: '0 0 0 0 #ffe06600, 0 0 64px 0 #ffe06688',
            fontFamily: 'inherit',
            width: 520,
            margin: '32px auto 0 auto',
            position: 'relative',
            zIndex: 10,
            transition: 'box-shadow 0.3s',
        }}>
        <Typography sx={{ fontWeight: 700, textAlign: 'center', mb: 1, color: '#bdbdbd', fontFamily: 'inherit', fontSize: '1rem' }}>Self-View</Typography>
            <Box sx={{ background: '#000', borderRadius: 4, overflow: 'hidden', aspectRatio: '16/9', width: '100%', boxShadow: 'none', position: 'relative' }}>
                {showLoading ? (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFE066', fontWeight: 700 }}>
                        Loading camera...
                    </Box>
                ) : loadingError ? (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5252', fontWeight: 700, textAlign: 'center', p: 2 }}>
                        {loadingError}
        </Box>
                ) : (
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16, display: 'block', border: 'none' }} />
                )}
                {correctiveSeconds !== null && correctiveSeconds > 0 && (
        <Box sx={{
                        position: 'absolute',
            top: 0,
            left: 0,
                        width: '100%',
                        height: '100%',
                        bgcolor: 'rgba(24,24,24,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
                        flexDirection: 'column',
                        zIndex: 2,
                        borderRadius: 2,
                        pointerEvents: 'none',
                        p: 0,
                    }}>
                        <Typography sx={{ color: '#ff5252', fontWeight: 800, fontSize: '1.1rem', mb: 0.5, letterSpacing: 0.5, textAlign: 'center', px: 1 }}>
                            {infractionMessages[infractionType] || 'Correction Required!'}
                        </Typography>
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem', mb: 0, textAlign: 'center', px: 1 }}>
                            Please correct within <span style={{ color: '#ff5252', fontWeight: 900 }}>{correctiveSeconds.toFixed(1)}</span> seconds
                        </Typography>
                    </Box>
                )}
        </Box>
        </Paper>
    );
});

// --- Minimalistic Pill Timer ---
const PillTimer = ({ value, max }) => {
    // Animate color: green (>30s), yellow (<=30s), red (<=10s)
    let bg = '#4caf50', color = '#fff';
    if (value <= 10) { bg = '#ff5252'; color = '#fff'; }
    else if (value <= 30) { bg = '#FFE066'; color = '#181818'; }
    // Format time as MM:SS
    const timeStr = `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 64,
                px: 2,
                height: 36,
                borderRadius: 18,
                fontWeight: 800,
                fontSize: '1.15rem',
                background: bg,
                color,
                boxShadow: '0 2px 12px 0 #0002',
                letterSpacing: 1,
                transition: 'background 0.4s, color 0.4s',
                fontFamily: 'inherit',
                userSelect: 'none',
            }}
            aria-label="Time Left"
        >
            {timeStr}
    </Box>
);
};

const InterviewPage = ({ uniqueLink: propUniqueLink, onInterviewComplete }) => {
    const { uniqueLink: paramUniqueLink } = useParams();
    const uniqueLink = propUniqueLink || paramUniqueLink;
    const [sessionData, setSessionData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [mediaStream, setMediaStream] = useState(null);
    const [submissionData, setSubmissionData] = useState(null);
    const [autoSubmitMessage, setAutoSubmitMessage] = useState('');
    const [terminated, setTerminated] = useState(false);
    const [warningCount, setWarningCount] = useState(0);
    const [maxWarnings, setMaxWarnings] = useState(3);
    const [showWarning, setShowWarning] = useState(false);
    const [lastWarning, setLastWarning] = useState('');
    const [correctiveSeconds, setCorrectiveSeconds] = useState(null);
    const [infractionType, setInfractionType] = useState(null);
    const [proctoringEventLog, setProctoringEventLog] = useState([]);
    const [terminationReason, setTerminationReason] = useState(null);
    const [displayTime, setDisplayTime] = useState(300);
    const rafRef = useRef(null);

    // Local timer for smooth correction window countdown
    const correctionTimerRef = useRef(null);
    const videoRef = useRef(null);
    
    const [videoHasPlayed, setVideoHasPlayed] = useState(false);
    
    const handleNextQuestion = useCallback(async () => {
        if (!sessionData) return;
        const oldQuestion = sessionData.questions[currentQuestionIndex];
        if(oldQuestion) {
            localStorage.removeItem(`timerEndTime-${sessionData._id}-${oldQuestion._id}`);
        }
        if (currentQuestionIndex + 1 >= sessionData.questions.length) {
            setIsSubmitting(true);
            try {
                await apiClient.generateReport(sessionData._id);
                onInterviewComplete();
            } catch (err) {
                setError("Failed to generate the final report.");
                setIsSubmitting(false);
            }
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSubmissionData(null);
            setAutoSubmitMessage('');
            setError('');
        }
    }, [sessionData, currentQuestionIndex, onInterviewComplete]);

    const handleAnswerSubmit = useCallback(async (dataToSubmit) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError('');
        try {
            const currentQuestion = sessionData.questions[currentQuestionIndex];
            const duration = currentQuestion.timeLimitSeconds - displayTime;
            const responseData = {
                questionId: currentQuestion._id,
                transcribedText: dataToSubmit.transcription,
                audioFileUrl: dataToSubmit.audioFileUrl,
                duration,
            };
            await apiClient.submitResponse(sessionData._id, responseData);
            await handleNextQuestion();
        } catch (err) {
            setError(err.message || 'An error occurred while submitting your answer.');
        } finally {
            setIsSubmitting(false);
        }
    }, [sessionData, currentQuestionIndex, displayTime, handleNextQuestion, isSubmitting]);

    const handleTranscriptionComplete = useCallback((result) => {
        if (result.isEmpty) {
            setAutoSubmitMessage("Auto-Submitting | Your answer was empty");
            handleAnswerSubmit({ transcription: "", audioFileUrl: "N/A" });
        } else {
            setSubmissionData(result);
        }
    }, [handleAnswerSubmit]);
    
    const currentQuestion = sessionData?.questions[currentQuestionIndex];

    useEffect(() => {
        if (!currentQuestion || !sessionData) return;
        const timerKey = `timerEndTime-${sessionData._id}-${currentQuestion._id}`;
        let endTime = localStorage.getItem(timerKey);
        if (!endTime) {
            endTime = Date.now() + currentQuestion.timeLimitSeconds * 1000;
            localStorage.setItem(timerKey, endTime);
        }
        setDisplayTime(Math.round((Number(endTime) - Date.now()) / 1000));
        let lastTime = null;
        const update = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.round((Number(endTime) - now) / 1000));
            setDisplayTime(remaining);
            if (remaining <= 0) {
                if (!isSubmitting) {
                    setAutoSubmitMessage("Auto-Submitting | Time limit Exhausted");
                    handleAnswerSubmit({ transcription: "[Time Expired]", audioFileUrl: "N/A" });
                }
                return;
            }
            rafRef.current = requestAnimationFrame(update);
        };
        rafRef.current = requestAnimationFrame(update);
        return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    }, [currentQuestion, sessionData, handleAnswerSubmit, isSubmitting]);

    useEffect(() => {
        const fetchSession = async () => {
            if (!uniqueLink) {
                setError("No interview link provided.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await apiClient.getSessionByLink(uniqueLink);
                setSessionData(response.data);
                setCurrentQuestionIndex(response.data.currentQuestionIndex || 0);
            } catch (err) {
                setError(err.message || 'Could not load interview session.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSession();
    }, [uniqueLink]);

    useEffect(() => {
        const startMedia = async () => {
            // Wait a tick to ensure previous stream is released
            await new Promise(resolve => setTimeout(resolve, 200));
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setMediaStream(stream);
            } catch (err) {
                setError('Could not access your camera and microphone. Please check browser permissions.');
            }
        };
        startMedia();
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (mediaStream && videoRef.current) {
            const video = videoRef.current;
            video.srcObject = mediaStream;
            let played = false;
            const onPlay = () => {
                setVideoHasPlayed(true);
                played = true;
            };
            const onCanPlay = () => {
                setVideoHasPlayed(true);
                played = true;
            };
            video.addEventListener('play', onPlay);
            video.addEventListener('canplay', onCanPlay);
            // Try to play
            video.play().then(() => {
                setVideoHasPlayed(true);
            }).catch(() => {});
            // Fallback: if not played in 3s, show warning
            const fallback = setTimeout(() => {
                if (!played) setAutoSubmitMessage("Auto-Submitting | Video not played");
            }, 3000);
            return () => {
                video.removeEventListener('play', onPlay);
                video.removeEventListener('canplay', onCanPlay);
                clearTimeout(fallback);
            };
        }
    }, [mediaStream, videoRef]);

    useEffect(() => {
        if (sessionData && sessionData._id) {
            const storedCorrection = localStorage.getItem(getSessionKey(sessionData._id, 'correctionWindow'));
            if (storedCorrection) {
                const parsed = JSON.parse(storedCorrection);
                const timeElapsed = (Date.now() / 1000) - parsed.start;
                const timeRemaining = Math.max(0, parsed.duration - timeElapsed);
                
                // Only restore if the correction window hasn't expired
                if (timeRemaining > 0) {
                    setInfractionType(parsed.infraction);
                    setCorrectiveSeconds(timeRemaining);
                } else {
                    // Clear expired correction window
                    localStorage.removeItem(getSessionKey(sessionData._id, 'correctionWindow'));
                }
            }
            const storedEventLog = localStorage.getItem(getSessionKey(sessionData._id, 'proctoringEventLog'));
            if (storedEventLog) setProctoringEventLog(JSON.parse(storedEventLog));
            const storedTermination = localStorage.getItem(getSessionKey(sessionData._id, 'terminationReason'));
            if (storedTermination) setTerminationReason(storedTermination);
        }
    }, [sessionData]);

    useEffect(() => {
        let interval;
        if (mediaStream && videoRef.current && sessionData) {
            interval = setInterval(async () => {
                if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
                    return; // Don't proctor if video isn't playing
                }
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.7);

                try {
                    const res = await fetch(`${config.PROCTOR_API_URL}/proctor`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageData, session_id: sessionData._id }),
                    });
                    const result = await res.json();
                    setWarningCount(result.warning_count);
                    setMaxWarnings(result.max_warnings);
                    
                    // Log debug information
                    if (result.debug_info) {
                        console.log('🔍 Proctoring Debug Info:', result.debug_info);
                    }
                    
                    if (result.terminated) {
                        setTerminated(true);
                        // Immediately clear correction window state on termination
                        setInfractionType(null);
                        setCorrectiveSeconds(null);
                        if (correctionTimerRef.current) {
                            clearInterval(correctionTimerRef.current);
                            correctionTimerRef.current = null;
                        }
                    }
                    if (result.warning) {
                        setShowWarning(true);
                        setLastWarning(result.warning);
                        setTimeout(() => setShowWarning(false), 3000);
                    }

                    // Handle correction window state from backend
                    const correctionWindow = result.correction_window;
                    if (correctionWindow && correctionWindow.infraction) {
                        // Only set correction window if there's an actual infraction
                        setInfractionType(correctionWindow.infraction);
                        setCorrectiveSeconds(correctionWindow.seconds_left);
                        
                        // Start local timer if not already running
                        if (!correctionTimerRef.current) {
                            correctionTimerRef.current = setInterval(() => {
                                setCorrectiveSeconds(prev => {
                                    if (prev === null || prev <= 0) {
                                        clearInterval(correctionTimerRef.current);
                                        correctionTimerRef.current = null;
                                        return null;
                                    }
                                    return Math.max(0, prev - 0.05);
                                });
                            }, 50);
                        }
                    } else {
                        // No correction window or cleared - reset all state
                        setInfractionType(null);
                        setCorrectiveSeconds(null);
                        // Clear the local timer
                        if (correctionTimerRef.current) {
                            clearInterval(correctionTimerRef.current);
                            correctionTimerRef.current = null;
                        }
                    }
                    
                    // Update history and logs
                    setProctoringEventLog(result.proctoring_event_log || []);
                    setTerminationReason(result.termination_reason || null);
                    
                    // Persist correction window state to localStorage
                    const sessionId = sessionData._id;
                    if (correctionWindow && correctionWindow.infraction) {
                        localStorage.setItem(getSessionKey(sessionId, 'correctionWindow'), JSON.stringify({
                            start: correctionWindow.start_time,
                            duration: correctionWindow.duration,
                            infraction: correctionWindow.infraction,
                        }));
                    } else {
                        localStorage.removeItem(getSessionKey(sessionId, 'correctionWindow'));
                    }
                    
                    localStorage.setItem(getSessionKey(sessionId, 'proctoringEventLog'), JSON.stringify(result.proctoring_event_log || []));
                    if (result.termination_reason) localStorage.setItem(getSessionKey(sessionId, 'terminationReason'), result.termination_reason);
                } catch (err) {
                    setError('Camera or proctoring service failed to load. Please check your connection and refresh.');
                }
            }, 1500); // Increased interval from 100ms to 1500ms
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [mediaStream, sessionData, videoHasPlayed]);

    useEffect(() => {
        if (terminated && sessionData && sessionData._id) {
            localStorage.removeItem(`proctorWarnings-${sessionData._id}`);
        }
    }, [terminated, sessionData]);
    
    useEffect(() => {
        if (terminated && mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }
    }, [terminated, mediaStream]);

    // Also stop microphone tracks if any are still active
    useEffect(() => {
        if (terminated && mediaStream) {
            mediaStream.getAudioTracks().forEach(track => {
                if (track.readyState === 'live') track.stop();
            });
        }
    }, [terminated, mediaStream]);

    // Local correction window timer for smooth countdown
    useEffect(() => {
        // Clear any existing timer
        if (correctionTimerRef.current) {
            clearInterval(correctionTimerRef.current);
            correctionTimerRef.current = null;
        }

        // Start local timer only if correction window is active
        if (correctiveSeconds !== null && correctiveSeconds > 0) {
            correctionTimerRef.current = setInterval(() => {
                setCorrectiveSeconds(prev => {
                    if (prev === null || prev <= 0) {
                        // Timer expired or was cleared, stop the interval
                        if (correctionTimerRef.current) {
                            clearInterval(correctionTimerRef.current);
                            correctionTimerRef.current = null;
                        }
                        return null;
                    }
                    return Math.max(0, prev - 0.05); // Decrement by 50ms (0.05 seconds)
                });
            }, 50); // Update every 50ms for smooth countdown
        }

        // Cleanup function
        return () => {
            if (correctionTimerRef.current) {
                clearInterval(correctionTimerRef.current);
                correctionTimerRef.current = null;
            }
        };
    }, [correctiveSeconds]);

    // Cleanup correction timer on unmount or interview end
    useEffect(() => {
        return () => {
            if (correctionTimerRef.current) {
                clearInterval(correctionTimerRef.current);
                correctionTimerRef.current = null;
            }
        };
    }, []);
    
    useEffect(() => {
        if (terminated && sessionData && sessionData._id) {
            apiClient.markSessionCompletedOrTerminated(sessionData._id, {
                terminated: true,
                terminationReason: terminationReason || 'Terminated by proctoring.',
                proctoringInfractions: proctoringEventLog,
                warningCount: warningCount,
                proctoringEventLog: proctoringEventLog,
            }).catch((err) => {
                console.error('Failed to mark session as terminated:', err);
            });
        }
    }, [terminated, sessionData, terminationReason, proctoringEventLog, warningCount]);
    
    if (isLoading) return <Box sx={{ textAlign: 'center', p: 12, color: 'white', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}><CircularProgress sx={{ color: '#FFE066' }} /></Box>;
    if (error) return <Box sx={{ textAlign: 'center', p: 12, background: '#2d1a1a', color: '#ff5252', borderRadius: 2, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>{error}</Box>;
    if (!sessionData || !currentQuestion) return <Box sx={{ textAlign: 'center', p: 12, color: '#bdbdbd', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>Could not load question data.</Box>;

    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    if (terminated) return <TerminatedPage onRedirect={onInterviewComplete} />;

    const maxTime = currentQuestion?.timeLimitSeconds || 300;

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
                position: 'relative',
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 1100 }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', fontFamily: 'inherit', letterSpacing: 0.5 }}>{sessionData.template.title}</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Paper elevation={3} sx={{ width: '100%', p: 4, background: '#232526', borderRadius: 2, boxShadow: '0 4px 24px 0 #0002', fontFamily: 'inherit' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFE066', fontFamily: 'inherit' }}>Question {currentQuestionIndex + 1} of {sessionData.questions.length}</Typography>
                                <PillTimer value={displayTime} max={currentQuestion.timeLimitSeconds} />
                            </Box>
                            <Typography sx={{ fontSize: '1.15rem', color: '#fff', fontFamily: 'inherit', lineHeight: 1.7 }}>
                                <span style={{ userSelect: 'none', pointerEvents: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
                                    {currentQuestion.questionText}
                                </span>
                            </Typography>
                        </Paper>
                        <Paper elevation={3} sx={{ width: '100%', p: 4, background: '#232526', borderRadius: 2, boxShadow: '0 4px 24px 0 #0002', fontFamily: 'inherit' }}>
                            {isSubmitting ? (
                                <Box sx={{ textAlign: 'center', color: '#bdbdbd', fontWeight: 600, p: 4, fontFamily: 'inherit' }}>
                                    <Typography>{autoSubmitMessage || "Submitting your answer..."}</Typography>
                                </Box>
                            ) : submissionData ? (
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ mb: 4, p: 3, background: '#181818', border: '1px solid #232526', borderRadius: 2, textAlign: 'left', fontFamily: 'inherit' }}>
                                        <Typography sx={{ color: '#bdbdbd', fontWeight: 600, fontFamily: 'inherit' }}>Your transcribed answer (read-only):</Typography>
                                        <Typography sx={{ color: '#fff', fontStyle: 'italic', fontFamily: 'inherit' }}>
                                            "{submissionData.transcription}"
                                        </Typography>
                                    </Box>
                                    <Button
                                        onClick={() => handleAnswerSubmit(submissionData)}
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
                                        Submit & Continue
                                    </Button>
                                </Box>
                            ) : (
                                <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} stream={mediaStream} />
                            )}
                        </Paper>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Paper elevation={3} sx={{ p: 3, background: '#232526', borderRadius: 2, boxShadow: '0 4px 24px 0 #0002', fontFamily: 'inherit' }}>
                            <Box
                                className={`modern-selfview${correctiveSeconds !== null && correctiveSeconds > 0 ? ' selfview-glow' : ''}`}
                                sx={{
                                    background: '#000',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    aspectRatio: '16/9',
                                    width: { xs: '100%', sm: 350, md: 400 },
                                    minWidth: { xs: '100%', sm: 350, md: 400 },
                                    maxWidth: '100%',
                                    margin: '0 auto',
                                    position: 'relative',
                                    boxShadow: correctiveSeconds !== null && correctiveSeconds > 0 ? '0 0 0 4px #ffe06688, 0 0 32px 8px #ff525288' : '0 2px 16px #0008',
                                    transition: 'box-shadow 0.3s',
                                }}
                            >
                                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}></video>
                                <Box sx={{
                                    position: 'absolute',
                                    left: 0,
                                    bottom: 0,
                                    bgcolor: 'rgba(24,24,24,0.55)',
                                    color: '#FFE066',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    px: 2,
                                    py: 0.5,
                                    borderTopRightRadius: 8,
                                    borderBottomLeftRadius: 8,
                                    zIndex: 3,
                                    letterSpacing: 0.5,
                                    fontFamily: 'inherit',
                                    opacity: 0.92,
                                }}>Self-View</Box>
                                {correctiveSeconds !== null && correctiveSeconds > 0 && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        bgcolor: 'rgba(24,24,24,0.55)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        zIndex: 2,
                                        borderRadius: 2,
                                        pointerEvents: 'none',
                                        p: 0,
                                    }}>
                                        <Typography sx={{ color: '#ff5252', fontWeight: 800, fontSize: '1.1rem', mb: 0.5, letterSpacing: 0.5, textAlign: 'center', px: 1 }}>
                                            {infractionMessages[infractionType] || 'Correction Required!'}
                                        </Typography>
                                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem', mb: 0, textAlign: 'center', px: 1 }}>
                                            Please correct within <span style={{ color: '#ff5252', fontWeight: 900 }}>{correctiveSeconds.toFixed(1)}</span> seconds
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
            <Snackbar open={showWarning} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} autoHideDuration={3000} onClose={() => setShowWarning(false)}>
                <Alert severity="warning" sx={{ background: '#2d1a1a', color: '#FFE066', fontWeight: 700, fontSize: '1.1rem', border: '2px solid #FFE066', letterSpacing: 1 }}>
                    {lastWarning} (Warning {warningCount} of {maxWarnings})
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default InterviewPage;