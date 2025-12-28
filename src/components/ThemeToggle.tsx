"use client";

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Box, IconButton, Typography, Stack } from '@mui/material';
import { 
  LightMode as SunIcon, 
  DarkMode as MoonIcon 
} from '@mui/icons-material';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({
  showLabel = false
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {showLabel && (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
          {isDark ? 'Dark' : 'Light'} Mode
        </Typography>
      )}

      <IconButton
        onClick={toggleTheme}
        sx={{
          width: 40,
          height: 40,
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          color: isDark ? '#00F5FF' : '#FFD700',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            transform: 'rotate(15deg) scale(1.1)',
            boxShadow: isDark ? '0 0 20px rgba(0, 245, 255, 0.2)' : '0 0 20px rgba(255, 215, 0, 0.2)'
          }
        }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </IconButton>
    </Stack>
  );
}
