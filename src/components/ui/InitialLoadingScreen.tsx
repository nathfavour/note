'use client';

import React from 'react';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';

interface InitialLoadingScreenProps {
  show?: boolean;
}

export const InitialLoadingScreen: React.FC<InitialLoadingScreenProps> = ({
  show = true
}) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(10, 10, 10, 1)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'rgba(20, 20, 20, 0.8)',
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          p: 6,
          borderRadius: '32px',
          maxWidth: 320,
          width: '100%',
          mx: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Box
          sx={{
            width: 96,
            height: 96,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            src="/logo/whisperrnote.png"
            alt="WhisperNote logo"
            style={{ width: 72, height: 72, opacity: 0.8 }}
          />
        </Box>

        <Typography
          variant="caption"
          sx={{
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'var(--font-space-grotesk)',
          }}
        >
          Initializing
        </Typography>

        <Box sx={{ width: '100%', px: 2 }}>
          <LinearProgress 
            sx={{ 
              height: 4, 
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#00F5FF',
                borderRadius: 2,
              }
            }} 
          />
        </Box>
      </Paper>
    </Box>
  );
};
