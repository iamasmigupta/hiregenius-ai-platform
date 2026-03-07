import React, { useState, useEffect, useRef } from 'react';
import * as apiClient from '../services/apiClient';
import {
    Box, Typography, Paper, Button, Alert, CircularProgress, Stepper, Step, StepLabel,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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

const ScheduleInterviewPage = () => {
    const [templates, setTemplates] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [templatesRes, candidatesRes] = await Promise.all([
                    apiClient.getTemplates(),
                    apiClient.getCandidates(),
                ]);
                setTemplates(templatesRes.data);
                setCandidates(candidatesRes.data);
            } catch (err) {
                setError('Failed to load templates or candidates.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refresh]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}><CircularProgress sx={{ color: '#FFE066' }} /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <CreateInterviewForm templates={templates} candidates={candidates} onCreate={() => setRefresh(r => !r)} />
        </Box>
    );
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
            if (scheduledTime < newMinTime) {
                setScheduledTime(newMinTime);
            }
        } else {
            setMinTime(null);
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
            background: 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            borderRadius: 4,
            fontFamily: 'Inter, Roboto, Arial, sans-serif',
            border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
            <Typography variant="h4" sx={{ color: '#FFE066', fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 3, textAlign: 'center' }}>
                Schedule Interview
            </Typography>
            <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                    mb: 4,
                    '.MuiStepLabel-label': { color: '#fff', fontWeight: 700, fontSize: '1.1rem', opacity: 1 },
                    '.MuiStepIcon-root': {
                        color: '#bdbdbd',
                        '&.Mui-active': { color: '#FFE066' },
                        '&.Mui-completed': { color: '#4caf50' },
                    },
                    '.MuiStepLabel-label.Mui-active': { color: '#FFE066', fontWeight: 900, textShadow: '0 2px 8px #181818' },
                    '.MuiStepLabel-label.Mui-completed': { color: '#4caf50' },
                }}
            >
                {steps.map((label, idx) => (
                    <Step key={label} completed={activeStep > idx}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successInfo && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successInfo.message} <br />
                    <a href={successInfo.link} style={{ color: '#FFE066', textDecoration: 'underline' }}>Go to Interview</a>
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
                    </Box>
                </LocalizationProvider>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{
                        bgcolor: '#FFE066',
                        color: '#181818',
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        fontSize: '1.1rem',
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: '0 0 16px 0 #ffe06644',
                        '&:hover': { bgcolor: '#FFD133' },
                        mt: 2
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? loadingMessage : 'Schedule Interview'}
                </Button>
            </form>
        </Paper>
    );
};

export default ScheduleInterviewPage; 