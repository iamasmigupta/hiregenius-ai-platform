import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, CircularProgress, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Modal, IconButton } from '@mui/material';
import * as apiClient from '../services/apiClient';
import VisibilityIcon from '@mui/icons-material/Visibility';

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '',
    jobDescription: '',
    numberOfQuestions: 5,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [jdModalOpen, setJDModalOpen] = useState(false);
  const [selectedJD, setSelectedJD] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await apiClient.getTemplates();
        setTemplates(res.data);
      } catch (err) {
        setError('Failed to load templates.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [success]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);
    if (!form.title || !form.jobDescription || !form.numberOfQuestions) {
      setError('Please provide all required fields.');
      setFormLoading(false);
      return;
    }
    try {
      await apiClient.createTemplate(form);
      setSuccess(`Successfully created template: "${form.title}"!`);
      setForm({ title: '', jobDescription: '', numberOfQuestions: 5 });
    } catch (err) {
      setError(err.message || 'Failed to create template.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewJD = (jd) => {
    setSelectedJD(jd);
    setJDModalOpen(true);
  };

  const handleCloseJDModal = () => {
    setJDModalOpen(false);
    setSelectedJD('');
  };

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, background: 'none', minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ color: '#FFE066', fontWeight: 900, fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: 1, textShadow: '0 2px 16px #ffe06633', mb: 4, textAlign: 'center' }}>
        Interview Templates
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, md: 6 }, mb: 6, alignItems: 'stretch', justifyContent: 'center' }}>
        <Card sx={{ flex: 1, minWidth: 340, maxWidth: 520, background: 'linear-gradient(135deg, #232526 60%, #181818 100%)', borderRadius: 5, p: { xs: 3, md: 5 }, boxShadow: '0 4px 32px 0 #ffe06622, 0 1.5px 8px 0 #0008', mb: { xs: 4, md: 0 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="h6" sx={{ color: '#FFE066', fontWeight: 700, fontFamily: 'Inter, Roboto, Arial, sans-serif', textAlign: 'left', mb: 3 }}>Create New Template</Typography>
            <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <TextField
                name="title"
                label="Template Title (e.g. ML Engg. ) *"
                value={form.title}
                onChange={handleChange}
                required
                variant="outlined"
                fullWidth
                InputProps={{ sx: { bgcolor: '#232526', borderRadius: 2, color: '#fff', fontWeight: 600 } }}
                InputLabelProps={{ sx: { color: '#bdbdbd', fontWeight: 600 }, shrink: true }}
                placeholder="Template Title (e.g. ML Engg. )"
                sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', fontWeight: 600 }, mb: 2 }}
              />
              <TextField
                name="jobDescription"
                label="Job Description *"
                value={form.jobDescription}
                onChange={handleChange}
                required
                multiline
                rows={6}
                variant="outlined"
                fullWidth
                InputProps={{ sx: { bgcolor: '#232526', borderRadius: 2, color: '#fff', fontWeight: 600 } }}
                InputLabelProps={{ sx: { color: '#bdbdbd', fontWeight: 600 }, shrink: true }}
                placeholder="Job Description *"
                sx={{ '.MuiInputBase-input': { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', fontWeight: 600, resize: 'vertical' }, mb: 2 }}
              />
              <TextField
                name="numberOfQuestions"
                label="Number of Questions *"
                value={form.numberOfQuestions}
                onChange={handleChange}
                required
                type="number"
                variant="outlined"
                fullWidth
                InputProps={{ sx: { bgcolor: '#232526', borderRadius: 2, color: '#fff', fontWeight: 600 } }}
                InputLabelProps={{ sx: { color: '#bdbdbd', fontWeight: 600 }, shrink: true }}
                placeholder="Number of Questions *"
                sx={{ input: { color: '#fff', px: 2, py: 1.5, fontFamily: 'inherit', fontWeight: 600 }, mb: 2 }}
              />
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
                disabled={formLoading}
              >
                {formLoading ? <CircularProgress size={22} sx={{ color: '#FFE066' }} /> : 'Create Template'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1.2, minWidth: 340, maxWidth: 720, background: 'linear-gradient(135deg, #232526 60%, #181818 100%)', borderRadius: 5, p: { xs: 3, md: 5 }, boxShadow: '0 4px 32px 0 #ffe06622, 0 1.5px 8px 0 #0008', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="h6" sx={{ color: '#FFE066', fontWeight: 700, fontFamily: 'Inter, Roboto, Arial, sans-serif', textAlign: 'left', mb: 3 }}>Existing Templates</Typography>
            <TableContainer component={Paper} sx={{ background: 'none', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#FFE066', fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ color: '#FFE066', fontWeight: 700 }}>Questions</TableCell>
                    <TableCell sx={{ color: '#FFE066', fontWeight: 700 }}>Job Description</TableCell>
                    <TableCell sx={{ color: '#FFE066', fontWeight: 700 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((tpl) => (
                    <TableRow key={tpl._id} hover>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>{tpl.title}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{tpl.numberOfQuestions}</TableCell>
                      <TableCell sx={{ color: '#fff', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tpl.jobDescription.length > 100 ? tpl.jobDescription.slice(0, 100) + '...' : tpl.jobDescription}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleViewJD(tpl.jobDescription)} sx={{ color: '#FFE066' }} title="View Full JD">
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
      <Modal open={jdModalOpen} onClose={handleCloseJDModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: '#181818',
          color: '#fff',
          border: '2px solid #FFE066',
          borderRadius: 4,
          boxShadow: 24,
          p: 4,
          minWidth: 320,
          maxWidth: 600,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}>
          <Typography variant="h6" sx={{ color: '#FFE066', fontWeight: 900, mb: 2 }}>Full Job Description</Typography>
          <Typography sx={{ whiteSpace: 'pre-line' }}>{selectedJD}</Typography>
          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button onClick={handleCloseJDModal} sx={{ color: '#FFE066', borderColor: '#FFE066', fontWeight: 700 }} variant="outlined">Close</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default TemplatesPage; 