import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, TextField, Button, Typography, Paper, Alert, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, IconButton, InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import * as apiClient from '../services/apiClient';

const SignUpPage = ({ onSignUpSuccess }) => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'interviewer',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
            if (onSignUpSuccess) {
                onSignUpSuccess(data);
            }
        } catch (err) {
            setError(err.message || 'Failed to create account.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputSx = { disableUnderline: true, sx: { bgcolor: '#232526', borderRadius: 1 } };
    const btnSx = {
        color: '#FFE066', borderColor: '#FFE066', borderWidth: 2, borderRadius: 1,
        py: 1.5, px: 4, minWidth: '140px', fontSize: '0.875rem', fontWeight: 700,
        position: 'relative', '&:hover': { backgroundColor: '#FFE066', color: '#181818' },
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at top left, #232526 60%, #181818 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4,
        }}>
            <Paper elevation={3} sx={{
                p: { xs: 2, sm: 5 }, maxWidth: 600, width: '100%', mx: 2,
                background: 'rgba(24, 24, 24, 0.98)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                color: '#fff', borderRadius: 3,
            }}>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                        <img src="/logo-hiregenius.png" alt="HireGenius" style={{ height: 36, width: 36, objectFit: 'contain' }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFE066' }}>HireGenius</Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ color: '#bdbdbd', fontWeight: 400 }}>
                        Create your account
                    </Typography>
                </Box>
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                name="firstName" placeholder="First Name *" fullWidth required
                                value={form.firstName} onChange={handleChange} variant="filled"
                                InputProps={inputSx} sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                            />
                            <TextField
                                name="lastName" placeholder="Last Name *" fullWidth required
                                value={form.lastName} onChange={handleChange} variant="filled"
                                InputProps={inputSx} sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                            />
                        </Box>
                        <TextField
                            name="email" placeholder="Email Address *" fullWidth required type="email"
                            value={form.email} onChange={handleChange} variant="filled"
                            InputProps={inputSx} sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                        />
                        <TextField
                            name="password" placeholder="Password (min 8 chars) *" fullWidth required
                            type={showPassword ? 'text' : 'password'}
                            value={form.password} onChange={handleChange} variant="filled"
                            InputProps={{
                                ...inputSx,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#fff' }}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                        />
                        <TextField
                            name="confirmPassword" placeholder="Confirm Password *" fullWidth required type="password"
                            value={form.confirmPassword} onChange={handleChange} variant="filled"
                            InputProps={inputSx} sx={{ input: { color: '#fff', px: 2, py: 1.5 } }} disabled={isLoading}
                        />
                        <FormControl fullWidth variant="filled">
                            <InputLabel sx={{ color: '#bdbdbd' }}>I am a...</InputLabel>
                            <Select
                                name="role" value={form.role} onChange={handleChange}
                                sx={{ color: '#fff', bgcolor: '#232526', borderRadius: 1, '.MuiSelect-icon': { color: '#bdbdbd' } }}
                                disabled={isLoading}
                            >
                                <MenuItem value="interviewer">Interviewer</MenuItem>
                                <MenuItem value="hr_manager">HR Manager</MenuItem>
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                            <Button type="submit" variant="outlined" sx={btnSx} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} sx={{ color: '#FFE066', position: 'absolute' }} /> : 'CREATE ACCOUNT'}
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
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>
                    © Copyright HireGenius 2026
                </Typography>
            </Box>
        </Box>
    );
};

export default SignUpPage;
