import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    IconButton,
    InputAdornment,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import * as apiClient from '../services/apiClient';

const LoginPage = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    // View mode: 'login', 'forgot', 'otp', 'newPassword'
    const [view, setView] = useState('login');
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Forgot password state
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (!form.email || !form.password) {
            setError('Please enter both email and password.');
            setIsLoading(false);
            return;
        }
        try {
            await onLoginSuccess(form);
        } catch (err) {
            setError(err.message || 'Failed to log in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await apiClient.forgotPassword(resetEmail);
            setSuccess('If an account with that email exists, a reset code has been sent.');
            setView('otp');
        } catch (err) {
            setError(err.message || 'Failed to send reset email.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await apiClient.resetPasswordWithOTP({ email: resetEmail, otp, newPassword });
            setSuccess(res.message || 'Password reset successfully!');
            setTimeout(() => {
                setView('login');
                setSuccess('');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setIsLoading(false);
        }
    };

    const paperSx = {
        p: { xs: 2, sm: 5 },
        maxWidth: 600,
        width: '100%',
        mx: 2,
        background: 'rgba(24, 24, 24, 0.98)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        color: '#fff',
        borderRadius: 3,
    };

    const inputSx = {
        disableUnderline: true,
        sx: { bgcolor: '#232526', borderRadius: 1 },
    };

    const btnSx = {
        color: '#FFE066',
        borderColor: '#FFE066',
        borderWidth: 2,
        borderRadius: 1,
        py: 1.5,
        px: 4,
        minWidth: '120px',
        fontSize: '0.875rem',
        fontWeight: 700,
        position: 'relative',
        '&:hover': {
            backgroundColor: '#FFE066',
            color: '#181818',
        },
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
            }}
        >
            <Paper elevation={3} sx={paperSx}>
                {/* ===== LOGIN VIEW ===== */}
                {view === 'login' && (
                    <>
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                                Sign In
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#bdbdbd', fontWeight: 400 }}>
                                Enter your email and password to sign in
                            </Typography>
                        </Box>
                        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                        <form onSubmit={handleLogin}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    name="email" placeholder="Write email here" fullWidth required type="email"
                                    value={form.email} onChange={handleChange} variant="filled"
                                    InputProps={inputSx} sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                                />
                                <TextField
                                    name="password" placeholder="Password" type={showPassword ? 'text' : 'password'}
                                    fullWidth required value={form.password} onChange={handleChange} variant="filled"
                                    InputProps={{
                                        ...inputSx,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#fff' }} disabled={isLoading}>
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                    <Button
                                        onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                                        sx={{ color: '#bdbdbd', textTransform: 'none', fontSize: '0.85rem', '&:hover': { color: '#FFE066' } }}
                                    >
                                        Forgot Password?
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                    <Button type="submit" variant="outlined" sx={btnSx} disabled={isLoading}>
                                        {isLoading ? <CircularProgress size={24} sx={{ color: '#FFE066', position: 'absolute' }} /> : 'SIGN IN'}
                                    </Button>
                                </Box>
                            </Box>
                        </form>
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button onClick={() => navigate('/signup')} sx={{ color: '#bdbdbd', textTransform: 'none', '&:hover': { color: '#FFE066' } }}>
                                Don't have an account? Create one
                            </Button>
                        </Box>
                    </>
                )}

                {/* ===== FORGOT PASSWORD VIEW ===== */}
                {view === 'forgot' && (
                    <>
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                                Forgot Password
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#bdbdbd' }}>
                                Enter your email to receive a reset code
                            </Typography>
                        </Box>
                        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}
                        <form onSubmit={handleForgotSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    placeholder="Enter your email" fullWidth required type="email"
                                    value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} variant="filled"
                                    InputProps={inputSx} sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                                    <Button variant="text" onClick={() => { setView('login'); setError(''); setSuccess(''); }} sx={{ color: '#bdbdbd' }} disabled={isLoading}>
                                        Back to Login
                                    </Button>
                                    <Button type="submit" variant="outlined" sx={btnSx} disabled={isLoading}>
                                        {isLoading ? <CircularProgress size={24} sx={{ color: '#FFE066', position: 'absolute' }} /> : 'SEND CODE'}
                                    </Button>
                                </Box>
                            </Box>
                        </form>
                    </>
                )}

                {/* ===== OTP + NEW PASSWORD VIEW ===== */}
                {view === 'otp' && (
                    <>
                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                                Reset Password
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#bdbdbd' }}>
                                Enter the 6-digit code sent to <strong style={{ color: '#FFE066' }}>{resetEmail}</strong>
                            </Typography>
                        </Box>
                        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}
                        <form onSubmit={handleResetSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    placeholder="6-digit code" fullWidth required value={otp}
                                    onChange={(e) => setOtp(e.target.value)} variant="filled"
                                    InputProps={inputSx}
                                    sx={{ input: { color: '#FFE066', px: 2, py: 1.5, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 } }}
                                    disabled={isLoading} inputProps={{ maxLength: 6 }}
                                />
                                <TextField
                                    placeholder="New Password (min 8 chars)" fullWidth required type="password"
                                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} variant="filled"
                                    InputProps={inputSx} sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                                />
                                <TextField
                                    placeholder="Confirm New Password" fullWidth required type="password"
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} variant="filled"
                                    InputProps={inputSx} sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                                    <Button variant="text" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} sx={{ color: '#bdbdbd' }} disabled={isLoading}>
                                        Resend Code
                                    </Button>
                                    <Button type="submit" variant="outlined" sx={btnSx} disabled={isLoading}>
                                        {isLoading ? <CircularProgress size={24} sx={{ color: '#FFE066', position: 'absolute' }} /> : 'RESET PASSWORD'}
                                    </Button>
                                </Box>
                            </Box>
                        </form>
                    </>
                )}
            </Paper>
            <Box sx={{ textAlign: 'center', mt: 3, pb: 2 }}>
                <Typography variant="body2" sx={{ color: '#bdbdbd', fontSize: '0.75rem' }}>
                    Made with ❤️ by Asmi Gupta
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>
                    © Copyright HireGenius 2026
                </Typography>
            </Box>
        </Box>
    );
};

export default LoginPage;