'use client';

import React from 'react';
import { Box, Paper, Typography, CircularProgress, alpha } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
  show?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = "Loading...", 
  show = true 
}) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        p: 3,
        pt: 10,
        bgcolor: alpha('#000', 0.1),
        backdropFilter: 'blur(2px)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2.5,
          py: 1.25,
          borderRadius: '100px',
          bgcolor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          backgroundImage: 'none',
        }}
      >
        <CircularProgress 
          size={14} 
          thickness={6} 
          sx={{ 
            color: '#00F5FF',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
        
        {message && message !== "Loading..." && (
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 900, 
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: '"Space Grotesk", sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.65rem',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {message}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default LoadingOverlay;
