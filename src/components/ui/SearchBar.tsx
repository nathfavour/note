'use client';

import React from 'react';
import { Box, TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  isSearching?: boolean;
  onClear?: () => void;
  className?: string;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  isSearching = false,
  onClear,
}: SearchBarProps) {
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        variant="outlined"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                {isSearching ? (
                  <CircularProgress size={18} sx={{ color: '#00F5FF' }} />
                ) : (
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                )}
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    onSearchChange('');
                    onClear?.();
                  }}
                  edge="end"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.4)',
                    '&:hover': { color: '#00F5FF' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '16px',
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00F5FF',
              borderWidth: '1px',
              boxShadow: '0 0 15px rgba(0, 245, 255, 0.2)',
            },
          },
          '& .MuiInputBase-input': {
            color: '#FFFFFF',
            fontFamily: '"Inter", sans-serif',
            '&::placeholder': {
              color: 'rgba(255, 255, 255, 0.3)',
              opacity: 1,
            },
          },
        }}
      />
    </Box>
  );
}
