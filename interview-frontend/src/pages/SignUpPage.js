import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, TextField, Button, Typography, Paper, Alert, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, IconButton, InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import * as apiClient from '../services/apiClient';

const SignUpPage = ({ onSignUpSuccess }) => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'interviewer',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // OTP verification state
    const [showOTP, setShowOTP] = useState(false);
    const [verifyEmail, setVerifyEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpSuccess, setOtpSuccess] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            setError('Please fill in all required fields.'); return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.'); return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.'); return;
        }
        setIsLoading(true);
        try {
            const { confirmPassword, ...signupData } = form;
            const data = await apiClient.signup(signupData);
            if (data.requiresVerification) {
                setVerifyEmail(data.email);
                setShowOTP(true);
            } else if (onSignUpSuccess) {
                onSignUpSuccess(data);
            }
        } catch (err) {
            setError(err.message || 'Failed to create account.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP digit input
    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setOtpError('Please enter all 6 digits.'); return;
        }
        setOtpLoading(true);
        setOtpError('');
        try {
            const data = await apiClient.verifyEmail({ email: verifyEmail, code });
            setOtpSuccess('Email verified successfully! Redirecting...');
            setTimeout(() => {
                if (onSignUpSuccess) onSignUpSuccess(data);
            }, 1500);
        } catch (err) {
            setOtpError(err.message || 'Invalid or expired code.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            await apiClient.resendVerificationCode(verifyEmail);
            setOtpSuccess('New code sent to your email!');
            setOtpError('');
            setOtp(['', '', '', '', '', '']);
            // 30 second cooldown
            setResendCooldown(30);
            const timer = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) { clearInterval(timer); return 0; }
                    return prev - 1;
                });
            }, 1000);
            setTimeout(() => setOtpSuccess(''), 3000);
        } catch (err) {
            setOtpError(err.message || 'Failed to resend code.');
        }
    };

    const inputSx = { disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1 } };
    const btnSx = {
        color: '#FFE066', borderColor: '#FFE066', borderWidth: 2, borderRadius: 1,
        py: 1.5, px: 4, minWidth: '140px', fontSize: '0.875rem', fontWeight: 700,
        position: 'relative', '&:hover': { backgroundColor: '#FFE066', color: '#181818' },
    };

    // OTP Verification Screen
    if (showOTP) {
        return (
            <Box sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4,
            }}>
                <Paper elevation={3} sx={{
                    p: { xs: 3, sm: 5 }, maxWidth: 480, width: '100%', mx: 2,
                    background: 'rgba(24, 24, 24, 0.98)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    color: '#fff', borderRadius: 3, textAlign: 'center',
                }}>
                    <MarkEmailReadIcon sx={{ fontSize: 60, color: '#FFE066', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Verify Your Email
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bdbdbd', mb: 3 }}>
                        We've sent a 6-digit code to<br />
                        <strong style={{ color: '#FFE066' }}>{verifyEmail}</strong>
                    </Typography>

                    {otpError && <Alert severity="error" sx={{ mb: 2, bgcolor: '#2a1f1f', color: '#ff6b6b' }}>{otpError}</Alert>}
                    {otpSuccess && <Alert severity="success" sx={{ mb: 2, bgcolor: '#1f2a1f', color: '#66ff66' }}>{otpSuccess}</Alert>}

                    {/* 6-digit OTP Input */}
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 3 }} onPaste={handleOtpPaste}>
                        {otp.map((digit, idx) => (
                            <TextField
                                key={idx}
                                inputRef={el => inputRefs.current[idx] = el}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                variant="outlined"
                                inputProps={{
                                    maxLength: 1,
                                    style: {
                                        textAlign: 'center', fontSize: '1.8rem', fontWeight: 700,
                                        color: '#FFE066', padding: '12px 0',
                                    },
                                }}
                                sx={{
                                    width: 52, height: 60,
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#232526', borderRadius: 2,
                                        '& fieldset': { borderColor: digit ? '#FFE066' : '#444' },
                                        '&:hover fieldset': { borderColor: '#FFE066' },
                                        '&.Mui-focused fieldset': { borderColor: '#FFE066', borderWidth: 2 },
                                    },
                                }}
                            />
                        ))}
                    </Box>

                    <Button
                        variant="contained"
                        onClick={handleVerify}
                        disabled={otpLoading || otp.join('').length !== 6}
                        fullWidth
                        sx={{
                            py: 1.5, fontWeight: 700, fontSize: '1rem',
                            bgcolor: '#FFE066', color: '#181818',
                            '&:hover': { bgcolor: '#ffd633' },
                            '&:disabled': { bgcolor: '#333', color: '#666' },
                            mb: 2,
                        }}
                    >
                        {otpLoading ? <CircularProgress size={24} sx={{ color: '#181818' }} /> : 'VERIFY EMAIL'}
                    </Button>

                    <Typography variant="body2" sx={{ color: '#888' }}>
                        Didn't receive the code?{' '}
                        <Button
                            onClick={handleResend}
                            disabled={resendCooldown > 0}
                            sx={{
                                color: '#FFE066', textTransform: 'none', fontWeight: 600,
                                '&:disabled': { color: '#555' },
                            }}
                        >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                        </Button>
                    </Typography>
                </Paper>
                <Box sx={{ textAlign: 'center', mt: 3, pb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: '0.75rem' }}>
                        Made with ❤️ by Asmi Gupta
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.7rem', mt: 0.5 }}>
                        © 2026 | HireGenius
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4,
        }}>
            <Paper elevation={3} sx={{
                p: { xs: 2, sm: 5 }, maxWidth: 600, width: '100%', mx: 2,
                background: 'rgba(24, 24, 24, 0.98)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                color: '#fff', borderRadius: 3,
            }}>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFE066', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <img src="/logo-hiregenius.png" alt="HireGenius" style={{ height: 36, width: 36, objectFit: 'contain' }} /> HireGenius
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: '#bdbdbd', mt: 0.5 }}>Create your account</Typography>
                </Box>
                <form onSubmit={handleSubmit}>
                    {error && <Alert severity="error" sx={{ mb: 2, bgcolor: '#2a1f1f', color: '#ff6b6b' }}>{error}</Alert>}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="First Name *" name="firstName" value={form.firstName} onChange={handleChange} fullWidth variant="filled" InputProps={inputSx} InputLabelProps={{ sx: { color: '#bdbdbd' } }} />
                            <TextField label="Last Name *" name="lastName" value={form.lastName} onChange={handleChange} fullWidth variant="filled" InputProps={inputSx} InputLabelProps={{ sx: { color: '#bdbdbd' } }} />
                        </Box>
                        <TextField label="Email *" name="email" type="email" value={form.email} onChange={handleChange} fullWidth variant="filled" InputProps={inputSx} InputLabelProps={{ sx: { color: '#bdbdbd' } }} />
                        <TextField label="Password *" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} fullWidth variant="filled"
                            InputProps={{
                                ...inputSx,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#bdbdbd' }}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            InputLabelProps={{ sx: { color: '#bdbdbd' } }}
                        />
                        <TextField label="Confirm Password *" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} fullWidth variant="filled" InputProps={inputSx} InputLabelProps={{ sx: { color: '#bdbdbd' } }} />
                        <FormControl variant="filled" fullWidth>
                            <InputLabel sx={{ color: '#bdbdbd' }}>I am a...</InputLabel>
                            <Select name="role" value={form.role} onChange={handleChange}
                                sx={{ bgcolor: '#232526', borderRadius: 1, color: '#fff', '& .MuiSvgIcon-root': { color: '#bdbdbd' } }}
                                MenuProps={{ PaperProps: { sx: { bgcolor: '#232526', color: '#fff' } } }}>
                                <MenuItem value="interviewer">Interviewer</MenuItem>
                                <MenuItem value="hr_manager">HR Manager</MenuItem>
                            </Select>
                        </FormControl>
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                            <Button type="submit" variant="outlined" disabled={isLoading} sx={btnSx}>
                                {isLoading ? <CircularProgress size={24} sx={{ color: '#FFE066' }} /> : 'CREATE ACCOUNT'}
                            </Button>
                        </Box>
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                            <Button onClick={() => navigate('/login')} sx={{ color: '#bdbdbd', textTransform: 'none', '&:hover': { color: '#FFE066' } }}>
                                Already have an account? Sign In
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>
            <Box sx={{ textAlign: 'center', mt: 3, pb: 2 }}>
                <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: '0.75rem' }}>
                    Made with ❤️ by Asmi Gupta
                </Typography>
                <Typography variant="body2" sx={{ color: '#888', fontSize: '0.7rem', mt: 0.5 }}>
                    © 2026 | HireGenius
                </Typography>
            </Box>
        </Box>
    );
};

export default SignUpPage;
