import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Paper, Divider, Pagination, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, TextField, Button, Chip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as apiClient from '../services/apiClient';
import SummaryDonut from '../components/SummaryDonut';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';

const STATUS_COLORS = {
  accepted: '#4caf50', // Green
  pending: '#FFE066', // Yellow
  completed: '#FFE066', // Yellow
  rejected: '#ff5252', // Red
  terminated: '#ff9800', // Orange
};

const getStatusColor = (session) => {
  if (session.status === 'terminated') return STATUS_COLORS.terminated;
  if (session.decision?.status === 'approved') return STATUS_COLORS.accepted;
  if (session.decision?.status === 'rejected') return STATUS_COLORS.rejected;
  if (session.status === 'completed' || session.status === 'in_progress' || session.status === 'scheduled') return STATUS_COLORS.pending;
  return '#bdbdbd';
};

const ReportsPage = () => {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    templateId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.getDashboardStats(),
      apiClient.getCompletedSessions(page, 5, filters.status, filters.templateId, filters.dateFrom, filters.dateTo),
      apiClient.getTemplates()
    ])
      .then(([statsRes, sessionsRes, templatesRes]) => {
        setStats(statsRes.data);
        setSessions(sessionsRes.data);
        setTotalPages(sessionsRes.pagination?.totalPages || 1);
        setTemplates(templatesRes.data || []);
      })
      .catch(() => {
        setStats(null);
        setSessions([]);
        setTotalPages(1);
        setTemplates([]);
      })
      .finally(() => setLoading(false));
  }, [page, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      templateId: '',
      dateFrom: '',
      dateTo: ''
    });
    setPage(1);
  };

  // Filter sessions by status and search
  const filteredSessions = sessions.filter(session => {
    const matchesStatus = !activeStatus ||
      (activeStatus === 'pending' && (session.status === 'pending' || session.status === 'in_progress' || session.status === 'scheduled')) ||
      (activeStatus === 'accepted' && session.decision?.status === 'approved') ||
      (activeStatus === 'rejected' && session.decision?.status === 'rejected') ||
      (activeStatus === 'terminated' && session.status === 'terminated');
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      session.candidateName?.toLowerCase().includes(searchLower) ||
      session.templateTitle?.toLowerCase().includes(searchLower) ||
      session.sessionId?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress sx={{ color: theme.palette.primary.main }} /></Box>;
  }

  if (!stats) {
    return <Box sx={{ color: '#ff5252', textAlign: 'center', mt: 8 }}>Failed to load reports analytics.</Box>;
  }

  // Bar chart data
  const barData = stats.monthlyCounts || [];

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, background: 'none' }}>
      <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 4, textAlign: 'center' }}>
        Reports & Analytics
      </Typography>
      {/* Summary Donut Row */}
      <Box sx={{ display: 'flex', gap: 8, alignItems: 'flex-end', mb: 5, flexWrap: 'wrap' }}>
        {[
          {
            label: 'Total Interviews',
            value: stats.total,
            color: '#46a2da',
            icon: <InfoOutlinedIcon sx={{ color: '#46a2da', fontSize: 28, mb: 0.2 }} />,
            arc: 100,
            status: '',
          },
          {
            label: 'Accepted',
            value: stats.accepted,
            color: STATUS_COLORS.accepted,
            icon: <CheckCircleOutlineIcon sx={{ color: STATUS_COLORS.accepted, fontSize: 28, mb: 0.2 }} />,
            arc: stats.total ? (stats.accepted / stats.total) * 100 : 0,
            status: 'accepted',
          },
          {
            label: 'Pending',
            value: stats.pending,
            color: STATUS_COLORS.pending,
            icon: <AccessTimeIcon sx={{ color: STATUS_COLORS.pending, fontSize: 28, mb: 0.2 }} />,
            arc: stats.total ? (stats.pending / stats.total) * 100 : 0,
            status: 'pending',
          },
          {
            label: 'Rejected',
            value: stats.rejected,
            color: STATUS_COLORS.rejected,
            icon: <HighlightOffIcon sx={{ color: STATUS_COLORS.rejected, fontSize: 28, mb: 0.2 }} />,
            arc: stats.total ? (stats.rejected / stats.total) * 100 : 0,
            status: 'rejected',
          },
          {
            label: 'Terminated',
            value: stats.terminated,
            color: STATUS_COLORS.terminated,
            icon: <WarningAmberIcon sx={{ color: STATUS_COLORS.terminated, fontSize: 28, mb: 0.2 }} />,
            arc: stats.total ? (stats.terminated / stats.total) * 100 : 0,
            status: 'terminated',
          },
        ].map((props) => (
          <Box key={props.label} onClick={() => setActiveStatus(props.status)} sx={{ cursor: 'pointer', borderRadius: 2, boxShadow: activeStatus === props.status ? theme.palette.custom.glow : 'none', border: activeStatus === props.status ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent', transition: 'box-shadow 0.2s, border 0.2s' }}>
            <SummaryDonut {...props} />
          </Box>
        ))}
      </Box>
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
            background: theme.palette.background.paper,
            borderRadius: 5,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: theme.palette.custom.glow,
            mb: { xs: 4, md: 0 },
          }}
        >
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, fontFamily: 'Inter, Roboto, Arial, sans-serif', textAlign: 'left', mb: 2 }}>
            Interview Outcomes
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Accepted', value: stats.accepted, color: STATUS_COLORS.accepted },
                  { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
                  { name: 'Rejected', value: stats.rejected, color: STATUS_COLORS.rejected },
                  { name: 'Terminated', value: stats.terminated, color: STATUS_COLORS.terminated },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {[
                  STATUS_COLORS.accepted,
                  STATUS_COLORS.pending,
                  STATUS_COLORS.rejected,
                  STATUS_COLORS.terminated,
                ].map((color, idx) => (
                  <Cell key={color} fill={color} />
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
            background: theme.palette.background.paper,
            borderRadius: 5,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: theme.palette.custom.glow,
          }}
        >
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, fontFamily: 'Inter, Roboto, Arial, sans-serif', textAlign: 'left', mb: 2 }}>
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
      {/* Filters Bar with Search */}
      <Paper sx={{ p: 3, background: theme.palette.background.paper, borderRadius: 3, color: theme.palette.text.primary, mb: 3, boxShadow: theme.palette.custom.shadow }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 0, fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.2rem' } }}>Filters</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', background: theme.palette.background.default, borderRadius: 2, px: 1, py: 0.5, boxShadow: theme.palette.custom.shadow }}>
            <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
            <input
              type="text"
              placeholder="Search candidates, IDs, templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: theme.palette.text.primary,
                fontSize: '1rem',
                fontFamily: 'inherit',
                width: 220,
                padding: '6px 0',
              }}
            />
          </Box>
        </Box>
        <Grid container spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Grid item xs={12} sm={6} md={2.5} lg={2} sx={{ minWidth: 140 }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#bdbdbd', fontWeight: 600, fontSize: '1rem' }}>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                sx={{ 
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  bgcolor: '#232526',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#232526' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFE066' },
                  '& .MuiSvgIcon-root': { color: '#bdbdbd' }
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="approved">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} sx={{ minWidth: 180 }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: '#bdbdbd', fontWeight: 600, fontSize: '1rem' }}>Template</InputLabel>
              <Select
                value={filters.templateId}
                onChange={(e) => handleFilterChange('templateId', e.target.value)}
                sx={{ 
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  bgcolor: '#232526',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#232526' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFE066' },
                  '& .MuiSvgIcon-root': { color: '#bdbdbd' }
                }}
              >
                <MenuItem value="">All Templates</MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template._id} value={template._id}>{template.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5} lg={2} sx={{ minWidth: 160 }}>
            <TextField
              type="date"
              label="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ 
                bgcolor: '#232526',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': { color: '#fff', bgcolor: '#232526', borderRadius: 2 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#232526' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFE066' },
                '& .MuiInputLabel-root': { color: '#bdbdbd', fontWeight: 600, fontSize: '1rem' },
                minWidth: 140
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5} lg={2} sx={{ minWidth: 160 }}>
            <TextField
              type="date"
              label="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ 
                bgcolor: '#232526',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': { color: '#fff', bgcolor: '#232526', borderRadius: 2 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#232526' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FFE066' },
                '& .MuiInputLabel-root': { color: '#bdbdbd', fontWeight: 600, fontSize: '1rem' },
                minWidth: 140
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2} lg={2} sx={{ minWidth: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button
              onClick={clearFilters}
              variant="outlined"
              sx={{ 
                color: '#FFE066', 
                borderColor: '#FFE066', 
                fontWeight: 700,
                px: 2.5,
                py: 1.2,
                minWidth: 120,
                fontSize: '1rem',
                '&:hover': { bgcolor: '#FFE066', color: '#181818' }
              }}
            >
              CLEAR FILTERS
            </Button>
          </Grid>
        </Grid>
        {/* Active Filters Display */}
        {(filters.status || filters.templateId || filters.dateFrom || filters.dateTo) && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.status && (
              <Chip 
                label={`Status: ${filters.status}`} 
                onDelete={() => handleFilterChange('status', '')}
                sx={{ bgcolor: '#232526', color: '#FFE066', fontWeight: 600, fontSize: '1rem' }}
              />
            )}
            {filters.templateId && (
              <Chip 
                label={`Template: ${templates.find(t => t._id === filters.templateId)?.title || filters.templateId}`} 
                onDelete={() => handleFilterChange('templateId', '')}
                sx={{ bgcolor: '#232526', color: '#FFE066', fontWeight: 600, fontSize: '1rem' }}
              />
            )}
            {filters.dateFrom && (
              <Chip 
                label={`From: ${filters.dateFrom}`} 
                onDelete={() => handleFilterChange('dateFrom', '')}
                sx={{ bgcolor: '#232526', color: '#FFE066', fontWeight: 600, fontSize: '1rem' }}
              />
            )}
            {filters.dateTo && (
              <Chip 
                label={`To: ${filters.dateTo}`} 
                onDelete={() => handleFilterChange('dateTo', '')}
                sx={{ bgcolor: '#232526', color: '#FFE066', fontWeight: 600, fontSize: '1rem' }}
              />
            )}
          </Box>
        )}
      </Paper>
      {/* Reports Table */}
      <Paper sx={{ p: 3, background: theme.palette.background.paper, borderRadius: 3, color: theme.palette.text.primary, mb: 3, boxShadow: theme.palette.custom.shadow }}>
        <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 2, fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.2rem' } }}>Detailed Reports</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit', background: 'none' }}>
            <thead>
              <tr style={{ background: theme.palette.background.paper }}>
                <th style={{ padding: '10px 8px', color: theme.palette.text.primary, fontWeight: 700 }}>Candidate</th>
                <th style={{ padding: '10px 8px', color: theme.palette.text.primary, fontWeight: 700 }}>Template</th>
                <th style={{ padding: '10px 8px', color: theme.palette.text.primary, fontWeight: 700 }}>Status</th>
                <th style={{ padding: '10px 8px', color: theme.palette.text.primary, fontWeight: 700 }}>Score</th>
                <th style={{ padding: '10px 8px', color: theme.palette.text.primary, fontWeight: 700 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#bdbdbd', padding: 24, fontSize: '1.1rem' }}>No reports found.</td></tr>
              ) : filteredSessions.map((row, idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid #232526',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#232526'}
                  onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                  onClick={() => window.location.href = `/reports/${row._id}`}
                >
                  <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 600, fontSize: '1rem' }}>{`${row.candidate?.firstName || ''} ${row.candidate?.lastName || ''}`.trim()}</td>
                  <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 600, fontSize: '1rem' }}>{row.template?.title || ''}</td>
                  <td style={{ padding: '12px 10px', color: getStatusColor(row), fontWeight: 700, fontSize: '1rem' }}>
                    {row.status === 'terminated' ? 'Terminated' :
                     row.decision?.status === 'approved' ? 'Accepted' : 
                     row.decision?.status === 'rejected' ? 'Rejected' : 
                     'Pending/Completed'}
                  </td>
                  <td style={{ padding: '12px 10px', color: '#FFE066', fontWeight: 700, fontSize: '1rem' }}>
                    {row.overallScore ? `${row.overallScore.toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ padding: '12px 10px', color: '#bdbdbd', fontWeight: 600, fontSize: '1rem' }}>{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            sx={{ '& .MuiPaginationItem-root': { color: '#FFE066', fontWeight: 700, fontSize: '1.1rem' } }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ReportsPage; 