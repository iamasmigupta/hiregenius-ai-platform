import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CircularProgress, Divider } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import * as apiClient from '../services/apiClient';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SummaryDonut from './SummaryDonut';

const STATUS_COLORS = {
    accepted: '#4caf50', // Green
    pending: '#FFE066', // Yellow
    completed: '#FFE066', // Yellow
    rejected: '#ff5252', // Red
    terminated: '#ff9800', // Orange
};

const getStatusColor = (row) => {
    if (row.status === 'terminated') return STATUS_COLORS.terminated;
    if (row.status === 'completed' && row.decision?.status === 'approved') return STATUS_COLORS.accepted;
    if (row.status === 'completed' && row.decision?.status === 'rejected') return STATUS_COLORS.rejected;
    if (row.status === 'completed' || row.status === 'in_progress' || row.status === 'scheduled') return STATUS_COLORS.pending;
    return '#bdbdbd';
};

const AdminPanel = () => {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Replace with real API endpoints for analytics
                const statsRes = await apiClient.getDashboardStats();
                const recentRes = await apiClient.getRecentInterviews();
                setStats(statsRes.data);
                setRecent(recentRes.data);
            } catch (err) {
                setStats(null);
                setRecent([]);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress sx={{ color: '#FFE066' }} /></Box>;
    }

    if (!stats) {
        return <Box sx={{ color: '#ff5252', textAlign: 'center', mt: 8 }}>Failed to load dashboard analytics.</Box>;
    }

    // Pie chart data (order: Accepted, Pending, Rejected, Terminated)
    const pieData = [
        { name: 'Accepted', value: stats.accepted, color: STATUS_COLORS.accepted },
        { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
        { name: 'Rejected', value: stats.rejected, color: STATUS_COLORS.rejected },
        { name: 'Terminated', value: stats.terminated, color: STATUS_COLORS.terminated },
    ];
    // Bar chart data
    const barData = stats.monthlyCounts || [];

    return (
        <Box sx={{ p: { xs: 1, md: 4 }, background: 'none' }}>
            <Typography variant="h4" sx={{ color: '#FFE066', fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 4, textAlign: 'center' }}>
                Admin Dashboard
            </Typography>
            {/* Modern donut summary row */}
            <Box sx={{ display: 'flex', gap: 8, alignItems: 'flex-end', mb: 5, flexWrap: 'wrap' }}>
                {[
                    {
                        label: 'Total',
                        value: stats.total,
                        color: '#46a2da',
                        icon: <InfoOutlinedIcon sx={{ color: '#46a2da', fontSize: 28, mb: 0.2 }} />,
                        arc: 100,
                    },
                    {
                        label: 'Accepted',
                        value: stats.accepted,
                        color: STATUS_COLORS.accepted,
                        icon: <CheckCircleOutlineIcon sx={{ color: STATUS_COLORS.accepted, fontSize: 28, mb: 0.2 }} />,
                        arc: stats.total ? (stats.accepted / stats.total) * 100 : 0,
                    },
                    {
                        label: 'Pending',
                        value: stats.pending,
                        color: STATUS_COLORS.pending,
                        icon: <AccessTimeIcon sx={{ color: STATUS_COLORS.pending, fontSize: 28, mb: 0.2 }} />,
                        arc: stats.total ? (stats.pending / stats.total) * 100 : 0,
                    },
                    {
                        label: 'Rejected',
                        value: stats.rejected,
                        color: STATUS_COLORS.rejected,
                        icon: <HighlightOffIcon sx={{ color: STATUS_COLORS.rejected, fontSize: 28, mb: 0.2 }} />,
                        arc: stats.total ? (stats.rejected / stats.total) * 100 : 0,
                    },
                    {
                        label: 'Terminated',
                        value: stats.terminated,
                        color: STATUS_COLORS.terminated,
                        icon: <WarningAmberIcon sx={{ color: STATUS_COLORS.terminated, fontSize: 28, mb: 0.2 }} />,
                        arc: stats.total ? (stats.terminated / stats.total) * 100 : 0,
                    },
                ].map((props) => (
                    <SummaryDonut key={props.label} {...props} />
                ))}
            </Box>
            <Divider sx={{ bgcolor: '#FFE066', opacity: 0.15, mb: 4 }} />
            {/* Analytics Section: Modern, aligned, and visually appealing */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 4,
                mb: 6,
                mt: 2,
                alignItems: 'stretch',
                justifyContent: 'center',
            }}>
                {/* Pie Chart: Interview Outcomes */}
                <Paper
                    elevation={3}
            sx={{
                        flex: 1,
                        minWidth: 280,
                        maxWidth: 420,
                        background: 'linear-gradient(135deg, #232526 60%, #181818 100%)',
                        borderRadius: 5,
                        p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                        boxShadow: '0 4px 32px 0 #ffe06622, 0 1.5px 8px 0 #0008',
                        mb: { xs: 4, md: 0 },
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#FFE066', fontWeight: 900, mb: 2, fontSize: '1.25rem', letterSpacing: 0.5, textAlign: 'center', textShadow: '0 2px 16px #ffe06633' }}>
                        Interview Outcomes
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, value }) => `${name}: ${value}`}
                            >
                                {pieData.map((entry, idx) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </Paper>
                {/* Bar Chart: Interviews Per Month */}
            <Paper
                    elevation={3}
                sx={{
                        flex: 1,
                        minWidth: 280,
                        maxWidth: 420,
                        background: 'linear-gradient(135deg, #232526 60%, #181818 100%)',
                        borderRadius: 5,
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxShadow: '0 4px 32px 0 #ffe06622, 0 1.5px 8px 0 #0008',
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#FFE066', fontWeight: 900, mb: 2, fontSize: '1.25rem', letterSpacing: 0.5, textAlign: 'center', textShadow: '0 2px 16px #ffe06633' }}>
                        Interviews Per Month
                </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="month" stroke="#bdbdbd" />
                            <YAxis stroke="#bdbdbd" />
                            <Tooltip />
                            <Bar dataKey="count" fill="#FFE066" />
                        </BarChart>
                    </ResponsiveContainer>
                    </Paper>
                </Box>
            <Divider sx={{ bgcolor: '#FFE066', opacity: 0.15, mb: 4 }} />
            {/* Recent Interviews Table */}
            <Paper sx={{ p: 3, background: '#181818', borderRadius: 3, color: '#fff', mt: 2 }}>
                <Typography variant="h6" sx={{ color: '#FFE066', mb: 2, fontWeight: 700 }}>Recent Interviews</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
                            <thead>
                                <tr style={{ background: '#232526' }}>
                                <th style={{ padding: '10px 8px', color: '#bdbdbd', fontWeight: 700 }}>Candidate</th>
                                <th style={{ padding: '10px 8px', color: '#bdbdbd', fontWeight: 700 }}>Template</th>
                                <th style={{ padding: '10px 8px', color: '#bdbdbd', fontWeight: 700 }}>Status</th>
                                <th style={{ padding: '10px 8px', color: '#bdbdbd', fontWeight: 700 }}>Score</th>
                                <th style={{ padding: '10px 8px', color: '#bdbdbd', fontWeight: 700 }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                            {recent.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#bdbdbd', padding: 24 }}>No recent interviews found.</td></tr>
                            ) : recent.map((row, idx) => (
                                <tr 
                                  key={idx} 
                                  style={{ 
                                    borderBottom: '1px solid #232526',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                  }}
                                  onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#232526'}
                                  onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                                  onClick={() => window.location.href = `/reports/${row.sessionId}`}
                                >
                                    <td style={{ padding: '10px 8px', color: '#fff' }}>{row.candidateName}</td>
                                    <td style={{ padding: '10px 8px', color: '#fff' }}>{row.templateTitle}</td>
                                    <td style={{ padding: '10px 8px', color: getStatusColor(row), fontWeight: 700 }}>
                                        {row.status === 'terminated' ? 'Terminated' :
                                         row.status === 'completed' && row.decision?.status === 'approved' ? 'Accepted' :
                                         row.status === 'completed' && row.decision?.status === 'rejected' ? 'Rejected' :
                                         'Pending/Completed'}
                                    </td>
                                    <td style={{ padding: '10px 8px', color: '#FFE066', fontWeight: 700 }}>
                                        {row.score ? `${parseFloat(row.score).toFixed(2)}%` : '-'}
                                            </td>
                                    <td style={{ padding: '10px 8px', color: '#bdbdbd' }}>{row.date}</td>
                                        </tr>
                            ))}
                            </tbody>
                        </table>
                    </Box>
            </Paper>
        </Box>
    );
};

export default AdminPanel;