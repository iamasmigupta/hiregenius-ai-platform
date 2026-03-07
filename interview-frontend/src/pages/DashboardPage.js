import React, { useState, useEffect, useRef } from 'react';
import * as apiClient from '../services/apiClient';
import {
    Box, Typography, Paper, Button, Alert, CircularProgress, Stepper, Step, StepLabel,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTheme } from '@mui/material/styles';

const loadingMessages = [
    "Contacting AI for analysis...",
    "Analyzing job description...",
    "Generating behavioral questions...",
    "Crafting technical challenges...",
    "Finalizing interview session...",
    "Almost there..."
];

const getInitialTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now;
};

const CreateInterviewForm = ({ templates, candidates, onCreate }) => {
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [scheduledTime, setScheduledTime] = useState(getInitialTime());
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Scheduling...');
    const [error, setError] = useState('');
    const [successInfo, setSuccessInfo] = useState(null);
    const loadingIntervalRef = useRef(null);
    const steps = ['Template', 'Candidate', 'Time', 'Confirm'];
    const [activeStep, setActiveStep] = useState(0);
    const [minTime, setMinTime] = useState(getInitialTime());
    const theme = useTheme();

    const getScheduledAt = () => {
        if (!scheduledDate || !scheduledTime) return '';
        const date = new Date(scheduledDate);
        date.setHours(scheduledTime.getHours());
        date.setMinutes(scheduledTime.getMinutes());
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date.toISOString();
    };

    useEffect(() => {
        const today = new Date();
        const selected = new Date(scheduledDate);
        
        const isSameDay = today.getFullYear() === selected.getFullYear() &&
                          today.getMonth() === selected.getMonth() &&
                          today.getDate() === selected.getDate();

        if (isSameDay) {
            const newMinTime = new Date();
            setMinTime(newMinTime);
            // If the currently scheduled time is now in the past, reset it
            if (scheduledTime < newMinTime) {
                setScheduledTime(newMinTime);
            }
        } else {
            setMinTime(null); // No minTime for future dates
        }
    }, [scheduledDate, scheduledTime]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTemplate || !selectedCandidate) {
            setError('Please select a template and a candidate.');
            return;
        }
        const scheduledAt = getScheduledAt();
        if (new Date(scheduledAt) < new Date()) {
            setError('Error: Scheduled date and time cannot be in the past.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessInfo(null);
        let messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);
        loadingIntervalRef.current = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 2500);
        try {
            const sessionData = {
                templateId: selectedTemplate,
                candidateId: selectedCandidate,
                scheduledAt
            };
            const response = await apiClient.createSession(sessionData);
            setSuccessInfo({
                message: 'Interview scheduled successfully!',
                link: `${window.location.origin}/interview/${response.data.uniqueLink}`
            });
            setSelectedTemplate('');
            setSelectedCandidate('');
            setActiveStep(steps.length);
            if (onCreate) onCreate();
        } catch (err) {
            setError(err.message || 'Failed to schedule interview.');
        } finally {
            clearInterval(loadingIntervalRef.current);
            setIsLoading(false);
        }
    };

    const formControlStyles = {
        '& .MuiInputLabel-root': { 
            color: '#bdbdbd',
            fontWeight: 500,
        },
        '& .MuiInputLabel-root.Mui-focused': { 
            color: '#FFE066',
        },
        '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '& input': {
                color: '#fff',
            },
            '& fieldset': {
                borderColor: '#444',
            },
            '&:hover fieldset': {
                borderColor: '#666',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#FFE066',
                borderWidth: '2px',
            },
            '&.Mui-error fieldset': {
                borderColor: '#ff5252',
            },
        },
        '& .MuiSvgIcon-root': {
            color: '#bdbdbd',
        },
        '& .MuiInputLabel-root.Mui-error': {
            color: '#ff5252',
        },
        '& .MuiSelect-select': {
            color: '#bdbdbd',
        },
    };

    return (
        <Paper elevation={4} sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 520,
            width: '100%',
            mx: 'auto',
            background: theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            color: theme.palette.text.primary,
            borderRadius: 4,
            fontFamily: 'Inter, Roboto, Arial, sans-serif',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.custom.glow,
        }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 3, textAlign: 'center' }}>
                Schedule Interview
            </Typography>
            
            <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                    mb: 4,
                    '.MuiStepLabel-label': {
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        opacity: 1,
                    },
                    '.MuiStepIcon-root': {
                        color: '#bdbdbd', // default (upcoming)
                        '&.Mui-active': {
                            color: '#FFE066', // active step icon color (yellow)
                        },
                        '&.Mui-completed': {
                            color: '#4caf50', // completed step icon color (green)
                        },
                    },
                    '.MuiStepLabel-label.Mui-active': {
                        color: '#FFE066', // active step label color
                        fontWeight: 900,
                        textShadow: '0 2px 8px #181818',
                    },
                    '.MuiStepLabel-label.Mui-completed': {
                        color: '#4caf50', // completed step label color
                    },
                }}
            >
                {steps.map((label, idx) => (
                    <Step key={label} completed={activeStep > idx}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            {error && <Alert severity="error" sx={{ width: '100%', mb: 2, fontFamily: 'inherit' }}>{error}</Alert>}
            {successInfo && (
                <Alert severity="success" sx={{ width: '100%', mb: 2, fontFamily: 'inherit' }}>
                    <strong>{successInfo.message}</strong>
                    <br />
                    <span>Shareable Link: <a href={successInfo.link} target="_blank" rel="noopener noreferrer" style={{ color: '#FFE066', textDecoration: 'underline', wordBreak: 'break-all', fontFamily: 'inherit' }}>{successInfo.link}</a></span>
                </Alert>
            )}
            <form onSubmit={handleSubmit} autoComplete="off">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
                        <FormControl fullWidth sx={formControlStyles}>
                            <InputLabel id="template-label">Interview Template</InputLabel>
                            <Select
                                labelId="template-label"
                                label="Interview Template"
                            value={selectedTemplate}
                            onChange={(e) => { setSelectedTemplate(e.target.value); setActiveStep(1); }}
                            required
                            >
                            {templates.map(template => (
                                    <MenuItem key={template._id} value={template._id}>{template.title}</MenuItem>
                            ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl fullWidth sx={formControlStyles}>
                            <InputLabel id="candidate-label">Candidate</InputLabel>
                            <Select
                                labelId="candidate-label"
                                label="Candidate"
                            value={selectedCandidate}
                            onChange={(e) => { setSelectedCandidate(e.target.value); setActiveStep(2); }}
                            required
                            >
                            {candidates.map(candidate => (
                                    <MenuItem key={candidate._id} value={candidate._id}>
                                        {`${candidate.firstName} ${candidate.lastName} (${candidate.email})`}
                                    </MenuItem>
                            ))}
                            </Select>
                        </FormControl>
                        
                        <DatePicker
                            label="Scheduled Date"
                            value={scheduledDate}
                            onChange={(newValue) => { setScheduledDate(newValue); setActiveStep(3); }}
                            disablePast
                            sx={{
                                ...formControlStyles,
                                '& .MuiOutlinedInput-input': { color: '#bdbdbd' },
                                '& .MuiInputBase-input': { color: '#bdbdbd' },
                                '& input': { color: '#bdbdbd' },
                                '& .MuiPickersInputBase-sectionContent': { color: '#bdbdbd' },
                                '& .MuiPickersSectionList-sectionContent': { color: '#bdbdbd' },
                                '& .MuiPickersSectionList-sectionBefore': { color: '#bdbdbd' },
                                '& .MuiPickersSectionList-sectionAfter': { color: '#bdbdbd' },
                                '& .MuiPickersSectionList-sectionSeparator': { color: '#bdbdbd' },
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                        
                        <TimePicker
                            label="Scheduled Time"
                            value={scheduledTime}
                            onChange={(newValue) => { setScheduledTime(newValue); setActiveStep(3); }}
                            minutesStep={5}
                            minTime={minTime}
                            sx={{
                                ...formControlStyles,
                                '& .MuiOutlinedInput-input': { color: '#bdbdbd' },
                                '& .MuiInputBase-input': { color: '#bdbdbd' },
                                '& input': { color: '#bdbdbd' },
                                '& .MuiPickersInputBase-sectionContent': { color: '#bdbdbd' },
                                '& .MuiPickersSectionList-sectionContent': { color: '#bdbdbd' },
                                '& .MuiPickersSectionList-sectionBefore': { color: '#bdbdbd' },
                                '& .MuiPickersSectionList-sectionAfter': { color: '#bdbdbd' },
                                '& .MuiPickersSectionList-sectionSeparator': { color: '#bdbdbd' },
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />

                        {/* Loading Overlay */}
                        {isLoading && (
                            <Box sx={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(30, 30, 30, 0.85)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 2,
                                pointerEvents: 'all'
                            }}>
                                <CircularProgress size={48} sx={{ color: '#FFE066', mb: 3 }} />
                                <Typography sx={{
                                    color: '#FFE066',
                                    fontWeight: 700,
                                    fontSize: '1.2rem',
                                    textAlign: 'center',
                                    fontFamily: 'inherit',
                                }}>
                                    {loadingMessage}
                                </Typography>
                    </Box>
                        )}
                        
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                            fullWidth
                            sx={{
                                bgcolor: '#FFE066',
                                color: '#181818',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                borderRadius: 2,
                                py: 1.5,
                                mt: 2,
                                '&:hover': { bgcolor: '#FFD700' },
                            }}
                        >
                            {isLoading ? "Scheduling..." : 'Create Interview'}
                        </Button>
                    </Box>
                </LocalizationProvider>
            </form>
        </Paper>
    );
};

/**
 * The main dashboard for authenticated users, particularly for roles that create interviews.
 * Fetches available templates and candidates and provides a form to schedule a new interview session.
 */
const DashboardPage = () => {
    const [templates, setTemplates] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesRes, candidatesRes] = await Promise.all([
                    apiClient.getTemplates(),
                    apiClient.getCandidates()
                ]);
                setTemplates(templatesRes.data);
                setCandidates(candidatesRes.data);
            } catch (err) {
                // handle error
            }
        };
        fetchData();
    }, [refresh]);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                fontFamily: 'Inter, Roboto, Arial, sans-serif',
            }}
        >
            <CreateInterviewForm templates={templates} candidates={candidates} onCreate={() => setRefresh(r => !r)} />
        </Box>
    );
};

export default DashboardPage;