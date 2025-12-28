'use client';

import { Box, Paper, IconButton, alpha } from '@mui/material';
import GlobalSearch from './GlobalSearch';
import KeyboardShortcuts from './KeyboardShortcuts';
import { useState } from 'react';
import { Keyboard as KeyboardIcon } from '@mui/icons-material';

export default function PageHeader() {
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  return (
    <>
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 4, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          bgcolor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          backgroundImage: 'none'
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <GlobalSearch />
        </Box>
        <IconButton 
          onClick={() => setShowKeyboardShortcuts(true)}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              color: '#00F5FF'
            }
          }}
        >
          <KeyboardIcon />
        </IconButton>
      </Paper>
      <KeyboardShortcuts
        open={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </>
  );
}

