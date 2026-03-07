import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const NotFoundPage = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#181818', color: '#fff', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
      <Typography variant="h1" sx={{ fontWeight: 900, fontSize: '5rem', color: '#FFE066', mb: 2 }}>404</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Page Not Found</Typography>
      <Typography sx={{ color: '#bdbdbd', mb: 4, fontSize: '1.2rem' }}>
        Sorry, the page you are looking for does not exist or has been moved.
      </Typography>
      <Button onClick={() => window.location.href = '/'} variant="contained" sx={{ bgcolor: '#FFE066', color: '#181818', fontWeight: 700, fontSize: '1.1rem', borderRadius: 2, px: 4, py: 1.5, '&:hover': { bgcolor: '#FFD700' } }}>
        Go to Home
      </Button>
    </Box>
  );
};

export default NotFoundPage; 