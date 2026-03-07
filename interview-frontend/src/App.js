import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import * as apiClient from './services/apiClient';
import { ThemeProvider, createTheme, CssBaseline, Box, IconButton, Menu, MenuItem, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Typography, Button, Snackbar } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircle from '@mui/icons-material/AccountCircle';

// Import all pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CandidateDashboard from './pages/CandidateDashboard';
import InstructionsPage from './pages/InstructionsPage';
import InterviewPage from './pages/InterviewPage';
import DetailedReportPage from './pages/DetailedReportPage';
import AdminPanel from './components/AdminPanel';
import InterviewCompletedPage from './pages/InterviewCompletedPage';
import ResourceCheckPage from './pages/ResourceCheckPage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';
import NetworkErrorPage from './pages/NetworkErrorPage';
import DashboardLayout from './components/DashboardLayout';
import ScheduleInterviewPage from './pages/ScheduleInterviewPage';
import CreateUserPage from './pages/CreateUserPage';
import TemplatesPage from './pages/TemplatesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import SignUpPage from './pages/SignUpPage';

// --- Protected Route Components ---
function ProtectedRoute({ user, children, allowedRoles }) {
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
}

function App() {
    const [user, setUser] = useState(null);
    const [appLoading, setAppLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');
    const [resourceCheckedFor, setResourceCheckedFor] = useState(null);
    // Candidate menu/dialog state
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [pwOpen, setPwOpen] = useState(false);
    const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    // Toast notification state
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
    const closeToast = () => setToast({ ...toast, open: false });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }
        setAppLoading(false);
    }, []);

    const theme = useMemo(() => createTheme({
        palette: {
            mode: 'dark',
            background: {
                default: '#181818',
                paper: '#232526',
                sidebar: 'rgba(30,30,30,0.85)',
            },
            primary: { main: '#FFE066' },
            secondary: { main: '#FFD133' },
            accent: { main: '#FFD133', contrastText: '#181818' },
            text: { primary: '#fff', secondary: '#bdbdbd' },
            divider: '#FFE066',
            custom: {
                glow: '0 4px 32px 0 #ffe06622, 0 1.5px 8px 0 #0008',
                shadow: '0 2px 8px 0 #0006',
                gradient: 'linear-gradient(135deg, #232526 60%, #181818 100%)',
                sidebarActive: 'rgba(255,224,102,0.08)',
                sidebarHover: 'rgba(255,224,102,0.12)',
            },
        },
        typography: {
            fontFamily: 'Inter, Roboto, Arial, sans-serif',
        },
    }), []);

    const handleLogin = async (credentials) => {
        setError('');
        const data = await apiClient.login(credentials);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        showToast('Login successful!');
        if (data.role === 'candidate') {
            navigate('/dashboard');
        } else {
            navigate('/admin/dashboard');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        showToast('Logged out successfully.');
        navigate('/login');
    };

    // Candidate menu handlers
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleDetailsOpen = () => { setDetailsOpen(true); handleMenuClose(); };
    const handleDetailsClose = () => setDetailsOpen(false);
    const handlePwOpen = () => { setPwData({ currentPassword: '', newPassword: '', confirm: '' }); setPwError(''); setPwSuccess(''); setPwOpen(true); handleMenuClose(); };
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
            showToast('Password changed successfully!');
            setTimeout(() => setPwOpen(false), 1000);
        } catch (e) {
            setPwError(e.message || 'Failed to change password.');
        } finally {
            setPwLoading(false);
        }
    };

    useEffect(() => {
        setAnchorEl(null);
    }, [user, location.pathname]);

    if (appLoading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className="text-center p-12">Loading Application...</div>
            </ThemeProvider>
        );
    }

    // Admin layout wrapper
    const AdminLayout = () => (
        <DashboardLayout
            activePath={location.pathname}
            onNavigate={(path) => navigate(path)}
            onLogout={handleLogout}
        >
            <Routes>
                <Route path="dashboard" element={<AdminPanel />} />
                <Route path="schedule" element={<ScheduleInterviewPage />} />
                <Route path="create-user" element={<CreateUserPage />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
        </DashboardLayout>
    );

    // Resource check wrapper for interview flow
    const InstructionsWrapper = ({ onBegin }) => {
        const uniqueLink = window.location.pathname.split('/').pop();
        if (resourceCheckedFor !== uniqueLink) {
            return <ResourceCheckPage onSuccess={async () => {
                await new Promise(resolve => setTimeout(resolve, 200));
                setResourceCheckedFor(uniqueLink);
            }} />;
        }
        return <InstructionsPage onBegin={onBegin} />;
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="bg-slate-900 font-sans min-h-screen" style={{ background: theme.palette.background.default }}>
                <header style={{ background: theme.palette.background.paper, boxShadow: '0 2px 8px 0 #0006', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: theme.palette.primary.main }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
                    <img
                      src="/logo-hiregenius.png"
                      alt="HireGenius Logo"
                      style={{ height: 40, width: 40, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #ffe06655)' }}
                    />
                    <h1 style={{ color: theme.palette.primary.main, fontWeight: 900, fontSize: '1.6rem', letterSpacing: 1, textShadow: '0 2px 12px #ffe06633', fontFamily: 'Inter, Roboto, Arial, sans-serif', margin: 0 }}>
                      HireGenius
                    </h1>
                  </div>
                  {/* Candidate user menu (right side) */}
                  {user && user.role === 'candidate' && (
                    <Box sx={{ position: 'absolute', right: 24, top: 0, height: 56, display: 'flex', alignItems: 'center' }}>
                      <IconButton color="inherit" onClick={handleMenuOpen} size="large">
                        {user?.avatarUrl ? (
                          <Avatar src={user.avatarUrl} alt={user.firstName} />
                        ) : (
                          <AccountCircle sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                        )}
                      </IconButton>
                      {anchorEl && (
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl)}
                          onClose={handleMenuClose}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          <MenuItem onClick={handleDetailsOpen}><SettingsIcon sx={{ mr: 1 }} />Account Details</MenuItem>
                          <MenuItem onClick={handlePwOpen}>Change Password</MenuItem>
                          <MenuItem onClick={handleLogout} sx={{ color: '#ff5252', fontWeight: 700 }}>Logout</MenuItem>
                        </Menu>
                      )}
                    </Box>
                  )}
                </header>
                <main>
                 {error && (
                        <div className="max-w-4xl mx-auto bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 mb-6 rounded-r-lg">
                        <p className="font-bold">Error</p><p>{error}</p>
                    </div>
                 )}
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={user ? <Navigate to={user.role === 'candidate' ? '/dashboard' : '/admin/dashboard'} replace /> : <LoginPage onLoginSuccess={handleLogin} />} />
                    <Route path="/signup" element={user ? <Navigate to={user.role === 'candidate' ? '/dashboard' : '/admin/dashboard'} replace /> : <SignUpPage onSignUpSuccess={(data) => {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data));
                        setUser(data);
                        showToast(`Welcome, ${data.firstName}! Account created successfully.`);
                        if (data.role === 'candidate') navigate('/dashboard');
                        else navigate('/admin/dashboard');
                    }} />} />

                    {/* Candidate Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute user={user} allowedRoles={['candidate']}>
                            <CandidateDashboard user={user} />
                        </ProtectedRoute>
                    } />
                    <Route path="/instructions/:uniqueLink" element={
                        <ProtectedRoute user={user}>
                            <InstructionsWrapper onBegin={() => {
                                const uniqueLink = window.location.pathname.split('/').pop();
                                navigate(`/interview/${uniqueLink}`);
                            }} />
                        </ProtectedRoute>
                    } />
                    <Route path="/interview/:uniqueLink" element={
                        <ProtectedRoute user={user}>
                            <InterviewPage onInterviewComplete={() => navigate('/interview-completed')} />
                        </ProtectedRoute>
                    } />
                    <Route path="/interview-completed" element={
                        <ProtectedRoute user={user}>
                            <InterviewCompletedPage onRedirect={() => navigate('/dashboard')} />
                        </ProtectedRoute>
                    } />

                    {/* Report Route (both admin and candidate) */}
                    <Route path="/reports/:sessionId" element={
                        <ProtectedRoute user={user}>
                            <DetailedReportPage onBack={() => navigate(user?.role === 'candidate' ? '/dashboard' : '/admin/reports')} />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin/*" element={
                        <ProtectedRoute user={user} allowedRoles={['admin', 'interviewer', 'hr_manager']}>
                            <AdminLayout />
                        </ProtectedRoute>
                    } />

                    {/* Root redirect */}
                    <Route path="/" element={user ? <Navigate to={user.role === 'candidate' ? '/dashboard' : '/admin/dashboard'} replace /> : <Navigate to="/login" replace />} />

                    {/* Error pages */}
                    <Route path="/server-error" element={<ServerErrorPage />} />
                    <Route path="/network-error" element={<NetworkErrorPage onRetry={() => window.location.reload()} />} />

                    {/* 404 fallback */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
                {/* Candidate dialogs (global, so they work on all candidate pages) */}
                {user && user.role === 'candidate' && (
                  <>
                    {/* Account Details Dialog */}
                    <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="xs" fullWidth>
                      <DialogTitle>Account Details</DialogTitle>
                      <DialogContent>
                        <Typography sx={{ mb: 2 }}>Name: <b>{user.firstName} {user.lastName}</b></Typography>
                        <Typography sx={{ mb: 2 }}>Email: <b>{user.email}</b></Typography>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleDetailsClose}>Close</Button>
                      </DialogActions>
                    </Dialog>
                    {/* Change Password Dialog */}
                    <Dialog open={pwOpen} onClose={handlePwClose} maxWidth="xs" fullWidth>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogContent>
                        {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
                        {pwSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwSuccess}</Alert>}
                        <TextField margin="dense" label="Current Password" name="currentPassword" value={pwData.currentPassword} onChange={handlePwChange} fullWidth type="password" variant="outlined" autoFocus />
                        <TextField margin="dense" label="New Password" name="newPassword" value={pwData.newPassword} onChange={handlePwChange} fullWidth type="password" variant="outlined" />
                        <TextField margin="dense" label="Confirm New Password" name="confirm" value={pwData.confirm} onChange={handlePwChange} fullWidth type="password" variant="outlined" />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handlePwClose} disabled={pwLoading}>Cancel</Button>
                        <Button onClick={handlePwSave} variant="contained" sx={{ bgcolor: '#4caf50', color: '#181818', fontWeight: 700 }} disabled={pwLoading}>
                          {pwLoading ? 'Changing...' : 'Change'}
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </>
                )}
                </main>
                {/* Toast Notification */}
                <Snackbar
                    open={toast.open}
                    autoHideDuration={3000}
                    onClose={closeToast}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
                        {toast.message}
                    </Alert>
                </Snackbar>
            </div>
        </ThemeProvider>
    );
}

export default App;