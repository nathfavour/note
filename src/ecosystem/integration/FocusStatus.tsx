"use client";

import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Paper, 
  Typography, 
  LinearProgress,
  alpha 
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

export const FocusStatus = () => {
    const [isActive, setIsActive] = useState(false);
    const [_timeLeft, _setTimeLeft] = useState(1500);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = ((1500 - _timeLeft) / 1500) * 100;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                        p: 1, 
                        borderRadius: '10px', 
                        bgcolor: alpha('#3b82f6', 0.1),
                        color: '#3b82f6'
                    }}>
                        <TimerIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'white' }}>
                        Flow Timer
                    </Typography>
                </Box>
                <IconButton 
                    size="small"
                    onClick={() => setIsActive(!isActive)}
                    sx={{ 
                        color: '#3b82f6',
                        bgcolor: alpha('#3b82f6', 0.1),
                        '&:hover': { bgcolor: alpha('#3b82f6', 0.2) }
                    }}
                >
                    {isActive ? <PauseIcon sx={{ fontSize: 18 }} /> : <PlayIcon sx={{ fontSize: 18 }} />}
                </IconButton>
            </Box>

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>
                      {formatTime(_timeLeft)}
                  </Typography>
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: '#3b82f6',
                        }
                    }}
                />
            </Box>
        </Paper>
    );
};
