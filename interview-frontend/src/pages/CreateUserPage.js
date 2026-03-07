import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import * as apiClient from '../services/apiClient';

const CreateUserPage = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'candidate',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiClient.register(form);
      setSuccess(`Successfully registered user: ${form.email}`);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'candidate' });
    } catch (err) {
      setError(err.message || 'Failed to register user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 6 }}>
      <Paper elevation={4} sx={{ p: 4, background: 'rgba(30, 30, 30, 0.95)', borderRadius: 4, fontFamily: 'inherit', color: '#fff', border: '1px solid #FFE06633' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFE066', mb: 3, textAlign: 'center', fontFamily: 'inherit' }}>
          Create New User
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              name="firstName"
              label="First Name *"
              value={form.firstName}
              onChange={handleChange}
              required
              variant="outlined"
              fullWidth
              InputProps={{ sx: { bgcolor: '#232526', borderRadius: 2, color: '#fff', fontWeight: 600 } }}
              InputLabelProps={{ sx: { color: '#bdbdbd', fontWeight: 600 }, shrink: true }}
              sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', fontWeight: 600 } }}
            />
            <TextField
              name="lastName"
              label="Last Name"
              value={form.lastName}
              onChange={handleChange}
              variant="outlined"
              fullWidth
              InputProps={{ sx: { bgcolor: '#232526', borderRadius: 2, color: '#fff', fontWeight: 600 } }}
              InputLabelProps={{ sx: { color: '#bdbdbd', fontWeight: 600 }, shrink: true }}
              sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', fontWeight: 600 } }}
            />
          </Box>
          <TextField
            name="email"
            label="Email Address *"
            value={form.email}
            onChange={handleChange}
            required
            type="email"
            variant="outlined"
            fullWidth
            InputProps={{ sx: { bgcolor: '#232526', borderRadius: 2, color: '#fff', fontWeight: 600 } }}
            InputLabelProps={{ sx: { color: '#bdbdbd', fontWeight: 600 }, shrink: true }}
            sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', fontWeight: 600 }, mb: 2 }}
          />
          <TextField
            name="password"
            label="Password (min 8 chars) *"
            value={form.password}
            onChange={handleChange}
            required
            type="password"
            variant="outlined"
            fullWidth
            InputProps={{ sx: { bgcolor: '#232526', borderRadius: 2, color: '#fff', fontWeight: 600 } }}
            InputLabelProps={{ sx: { color: '#bdbdbd', fontWeight: 600 }, shrink: true }}
            sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', fontWeight: 600 }, mb: 2 }}
          />
          <TextField
            name="phone"
            label="Phone (Optional)"
            value={form.phone}
            onChange={handleChange}
            type="tel"
            variant="outlined"
            fullWidth
            InputProps={{ sx: { bgcolor: '#232526', borderRadius: 2, color: '#fff', fontWeight: 600 } }}
            InputLabelProps={{ sx: { color: '#bdbdbd', fontWeight: 600 }, shrink: true }}
            sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', fontWeight: 600 }, mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: '#bdbdbd', fontFamily: 'inherit' }}>Role</InputLabel>
            <Select
              name="role"
              value={form.role}
              onChange={handleChange}
              label="Role"
              sx={{ color: '#fff', fontFamily: 'inherit', bgcolor: '#232526cc', borderRadius: 2 }}
            >
              <MenuItem value="candidate">Candidate</MenuItem>
              <MenuItem value="interviewer">Interviewer</MenuItem>
              <MenuItem value="hr_manager">HR Manager</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              color: '#181818',
              bgcolor: '#FFE066',
              fontWeight: 700,
              fontFamily: 'inherit',
              fontSize: '1.1rem',
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 0 16px 0 #ffe06644',
              '&:hover': { bgcolor: '#FFD133' },
              mt: 2
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#FFE066' }} /> : 'Create User'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateUserPage; 