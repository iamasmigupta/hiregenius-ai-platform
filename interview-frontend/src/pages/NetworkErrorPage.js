import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const NetworkErrorPage = ({ onRetry }) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#181818', color: '#fff', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
      <Typography variant="h1" sx={{ fontWeight: 900, fontSize: '4rem', color: '#ff5252', mb: 2 }}>Network Error</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Unable to connect</Typography>
      <Typography sx={{ color: '#bdbdbd', mb: 4, fontSize: '1.1rem' }}>
        Please check your internet connection and try again.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {onRetry && <Button onClick={onRetry} variant="contained" sx={{ bgcolor: '#FFE066', color: '#181818', fontWeight: 700, fontSize: '1.1rem', borderRadius: 2, px: 4, py: 1.5, '&:hover': { bgcolor: '#FFD700' } }}>Retry</Button>}
        <Button onClick={() => window.location.href = '/'} variant="outlined" sx={{ color: '#FFE066', borderColor: '#FFE066', fontWeight: 700, fontSize: '1.1rem', borderRadius: 2, px: 4, py: 1.5, '&:hover': { bgcolor: '#FFE066', color: '#181818' } }}>
          Go to Home
        </Button>
      </Box>
    </Box>
  );
};

export default NetworkErrorPage; 