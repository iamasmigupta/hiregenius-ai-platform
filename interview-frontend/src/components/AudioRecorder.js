import React, { useState, useRef, useEffect } from 'react';
import * as apiClient from '../services/apiClient';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';

const RecorderState = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PROCESSING: 'processing',
};

const supportedMimeTypes = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
];

/**
 * An AudioRecorder that is decoupled from the submission process.
 * It records, transcribes, and then passes the result to the parent via a callback.
 * @param {object} props - Component props.
 * @param {MediaStream} props.stream - The active audio stream.
 * @param {function} props.onTranscriptionComplete - Callback with { transcription, audioFileUrl, isEmpty }.
 */
const AudioRecorder = ({ stream, onTranscriptionComplete }) => {
    const [recorderState, setRecorderState] = useState(RecorderState.IDLE);
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Reset component state if the stream prop changes (e.g., when moving to a new question)
    useEffect(() => {
        setRecorderState(RecorderState.IDLE);
        setError('');
    }, [stream]);

    const handleToggleRecording = async () => {
        setError('');

        // --- Start Recording ---
        if (recorderState === RecorderState.IDLE) {
            if (!stream || !stream.active) {
                setError("Microphone stream not available. Please allow access.");
                return;
            }
            const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
            if (!mimeType) {
                setError("Your browser does not support required audio recording formats.");
                return;
            }

            try {
                const audioStream = new MediaStream(stream.getAudioTracks());
                mediaRecorderRef.current = new MediaRecorder(audioStream, { mimeType });
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    setRecorderState(RecorderState.PROCESSING);
                    
                    // --- FIX 1: Handle Empty Audio Recording ---
                    // If no audio chunks were recorded, notify the parent that the recording was empty.
                    if (audioChunksRef.current.length === 0) {
                        onTranscriptionComplete({ transcription: "", audioFileUrl: "N/A", isEmpty: true });
                        setRecorderState(RecorderState.IDLE); // Reset for next attempt
                        return;
                    }

                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    
                    try {
                        const result = await apiClient.transcribeAudio(audioBlob);
                        // Pass the successful result up to the parent.
                        onTranscriptionComplete({ 
                            transcription: result.transcription, 
                            audioFileUrl: result.audioFileUrl,
                            isEmpty: false 
                        });
                    } catch (err) {
                        setError(err.message || "Failed to transcribe audio.");
                    } finally {
                        setRecorderState(RecorderState.IDLE); // Reset after processing
                    }
                };

                mediaRecorderRef.current.start();
                setRecorderState(RecorderState.RECORDING);

            } catch (err) {
                console.error("Error starting media recorder:", err);
                setError("Could not start the media recorder. " + err.message);
            }
        } 
        // --- Stop Recording ---
        else if (recorderState === RecorderState.RECORDING) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
        }
    };

    let buttonText = 'Record';
    let buttonColor = '#FFE066';
    let buttonBg = 'transparent';
    let buttonHoverBg = '#FFE066';
    let buttonHoverColor = '#181818';
    let buttonBorder = '#FFE066';
    let buttonLoading = false;
    if (recorderState === RecorderState.RECORDING) {
        buttonText = 'Stop Recording';
        buttonColor = '#fff';
        buttonBg = '#ff5252';
        buttonHoverBg = '#ff5252';
        buttonHoverColor = '#fff';
        buttonBorder = '#ff5252';
    } else if (recorderState === RecorderState.PROCESSING) {
        buttonText = 'Processing...';
        buttonColor = '#bdbdbd';
        buttonBg = 'transparent';
        buttonHoverBg = 'transparent';
        buttonHoverColor = '#bdbdbd';
        buttonBorder = '#bdbdbd';
        buttonLoading = true;
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto', p: 0, textAlign: 'center', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
            <Paper elevation={2} sx={{ p: 4, background: '#232526', borderRadius: 2, fontFamily: 'inherit', boxShadow: '0 4px 24px 0 #0002', mb: 2 }}>
                <Button
                    onClick={handleToggleRecording}
                    disabled={recorderState === RecorderState.PROCESSING || !stream}
                    sx={{
                        color: buttonColor,
                        background: buttonBg,
                        borderColor: buttonBorder,
                        borderWidth: 2,
                        borderRadius: 1.5,
                        py: 1.5,
                        px: 6,
                        minWidth: '180px',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        boxShadow: 'none',
                        borderStyle: 'solid',
                        letterSpacing: 1,
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: buttonHoverBg,
                            color: buttonHoverColor,
                            borderColor: buttonBorder,
                            boxShadow: '0 0 16px 0 #ffe06644',
                        },
                        opacity: recorderState === RecorderState.PROCESSING || !stream ? 0.5 : 1,
                        cursor: recorderState === RecorderState.PROCESSING || !stream ? 'not-allowed' : 'pointer',
                    }}
                >
                    {buttonLoading ? <CircularProgress size={24} sx={{ color: buttonColor }} /> : buttonText}
                </Button>
                {error && <Typography sx={{ color: '#ff5252', mt: 3, fontFamily: 'inherit', fontWeight: 500 }}>{error}</Typography>}
            </Paper>
        </Box>
    );
};

export default AudioRecorder;