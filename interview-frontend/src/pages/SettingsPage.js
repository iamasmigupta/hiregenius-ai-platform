import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import * as apiClient from '../services/apiClient';

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const SettingsPage = () => {
  const theme = useTheme();
  const [user, setUser] = useState(getUserFromStorage());

  // Edit Profile Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Change Password Dialog
  const [pwOpen, setPwOpen] = useState(false);
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Delete Account Dialog
  const [delOpen, setDelOpen] = useState(false);
  const [delLoading, setDelLoading] = useState(false);
  const [delError, setDelError] = useState('');

  // Handlers for Edit Profile
  const handleEditOpen = () => {
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setEditError('');
    setEditSuccess('');
    setEditOpen(true);
  };
  const handleEditClose = () => setEditOpen(false);
  const handleEditChange = e => setEditData({ ...editData, [e.target.name]: e.target.value });
  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const res = await apiClient.updateProfile(editData);
      setUser(u => ({ ...u, ...res.data }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }));
      setEditSuccess('Profile updated successfully.');
      setTimeout(() => setEditOpen(false), 1000);
    } catch (e) {
      setEditError(e.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handlers for Change Password
  const handlePwOpen = () => {
    setPwData({ currentPassword: '', newPassword: '', confirm: '' });
    setPwError('');
    setPwSuccess('');
    setPwOpen(true);
  };
  const handlePwClose = () => setPwOpen(false);
  const handlePwChange = e => setPwData({ ...pwData, [e.target.name]: e.target.value });
  const handlePwSave = async () => {
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    if (!pwData.currentPassword || !pwData.newPassword || !pwData.confirm) {
      setPwError('All fields are required.');
      setPwLoading(false);
      return;
    }
    if (pwData.newPassword !== pwData.confirm) {
      setPwError('New passwords do not match.');
      setPwLoading(false);
      return;
    }
    try {
      await apiClient.changePassword({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword });
      setPwSuccess('Password changed successfully.');
      setTimeout(() => setPwOpen(false), 1000);
    } catch (e) {
      setPwError(e.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  // Handlers for Delete Account
  const handleDelOpen = () => {
    setDelError('');
    setDelOpen(true);
  };
  const handleDelClose = () => setDelOpen(false);
  const handleDelConfirm = async () => {
    setDelLoading(true);
    setDelError('');
    try {
      await apiClient.deleteAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (e) {
      setDelError(e.message || 'Failed to delete account.');
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, background: 'none' }}>
      <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 4, textAlign: 'center' }}>
        Settings
      </Typography>
      <Card sx={{ mb: 4, background: theme.palette.background.paper, color: theme.palette.text.primary, border: `2px solid ${theme.palette.primary.main}`, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 2 }}>
            Appearance
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            Dark mode is always enabled for now.
          </Typography>
        </CardContent>
      </Card>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: theme.palette.background.paper, color: theme.palette.primary.main, border: `2px solid ${theme.palette.primary.main}`, borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 2 }}>Profile</Typography>
              <Typography sx={{ color: theme.palette.text.primary, mb: 2 }}>Name: {user?.firstName || ''} {user?.lastName || ''}</Typography>
              <Typography sx={{ color: theme.palette.text.primary, mb: 2 }}>Email: {user?.email || ''}</Typography>
              <Button variant="outlined" sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main, fontWeight: 700 }} onClick={handleEditOpen}>Edit Profile</Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: theme.palette.background.paper, color: '#4caf50', border: '2px solid #4caf50', borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 700, mb: 2 }}>Change Password</Typography>
              <Button variant="outlined" sx={{ borderColor: '#4caf50', color: '#4caf50', fontWeight: 700 }} onClick={handlePwOpen}>Change Password</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Divider sx={{ bgcolor: theme.palette.primary.main, opacity: 0.15, my: 4 }} />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ background: theme.palette.background.paper, color: '#ff5252', border: '2px solid #ff5252', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#ff5252', fontWeight: 700, mb: 2 }}>Admin Options</Typography>
              <Button variant="outlined" sx={{ borderColor: '#ff5252', color: '#ff5252', fontWeight: 700 }} onClick={handleDelOpen}>Delete Account</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          {editSuccess && <Alert severity="success" sx={{ mb: 2 }}>{editSuccess}</Alert>}
          <TextField
            margin="dense"
            label="First Name"
            name="firstName"
            value={editData.firstName}
            onChange={handleEditChange}
            fullWidth
            autoFocus
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Last Name"
            name="lastName"
            value={editData.lastName}
            onChange={handleEditChange}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            value={editData.email}
            onChange={handleEditChange}
            fullWidth
            variant="outlined"
            type="email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={editLoading}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" sx={{ bgcolor: theme.palette.primary.main, color: '#181818', fontWeight: 700 }} disabled={editLoading}>
            {editLoading ? <CircularProgress size={22} sx={{ color: '#181818' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwOpen} onClose={handlePwClose} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
          {pwSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwSuccess}</Alert>}
          <TextField
            margin="dense"
            label="Current Password"
            name="currentPassword"
            value={pwData.currentPassword}
            onChange={handlePwChange}
            fullWidth
            type="password"
            variant="outlined"
            autoFocus
          />
          <TextField
            margin="dense"
            label="New Password"
            name="newPassword"
            value={pwData.newPassword}
            onChange={handlePwChange}
            fullWidth
            type="password"
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Confirm New Password"
            name="confirm"
            value={pwData.confirm}
            onChange={handlePwChange}
            fullWidth
            type="password"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePwClose} disabled={pwLoading}>Cancel</Button>
          <Button onClick={handlePwSave} variant="contained" sx={{ bgcolor: '#4caf50', color: '#181818', fontWeight: 700 }} disabled={pwLoading}>
            {pwLoading ? <CircularProgress size={22} sx={{ color: '#181818' }} /> : 'Change'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={delOpen} onClose={handleDelClose} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          {delError && <Alert severity="error" sx={{ mb: 2 }}>{delError}</Alert>}
          <Typography sx={{ mb: 2 }} color="error">Are you sure you want to delete your account? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDelClose} disabled={delLoading}>Cancel</Button>
          <Button onClick={handleDelConfirm} variant="contained" sx={{ bgcolor: '#ff5252', color: '#fff', fontWeight: 700 }} disabled={delLoading}>
            {delLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage; 