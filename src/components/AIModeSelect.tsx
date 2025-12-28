"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  alpha, 
  Stack,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  AutoAwesome as SparklesIcon, 
  KeyboardArrowDown as ChevronDownIcon, 
  Lock as LockClosedIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { AIMode, SubscriptionTier, getAIModeDisplayName, getAIModeDescription, canUseAIMode } from '@/types/ai';

interface AIModeSelectProps {
  currentMode: AIMode;
  userTier: SubscriptionTier;
  onModeChangeAction: (mode: AIMode) => void;
}

export default function AIModeSelect({ currentMode, userTier, onModeChangeAction }: AIModeSelectProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const modes = [
    { mode: AIMode.STANDARD, requiresTier: SubscriptionTier.FREE },
    { mode: AIMode.CREATIVE, requiresTier: SubscriptionTier.PRO },
    { mode: AIMode.ULTRA, requiresTier: SubscriptionTier.PRO_PLUS }
  ];

  const getRequiredTierText = (mode: AIMode): string => {
    switch (mode) {
      case AIMode.CREATIVE:
        return "Pro";
      case AIMode.ULTRA:
        return "Pro+";
      default:
        return "";
    }
  };

  const handleModeSelect = (mode: AIMode) => {
    if (canUseAIMode(userTier, mode)) {
      onModeChangeAction(mode);
      handleClose();
    }
  };

  const isLocked = (mode: AIMode): boolean => !canUseAIMode(userTier, mode);

  return (
    <Box>
      <Button
        onClick={handleClick}
        startIcon={<SparklesIcon sx={{ color: '#00F5FF' }} />}
        endIcon={<ChevronDownIcon sx={{ 
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none',
          color: 'rgba(255, 255, 255, 0.4)'
        }} />}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          px: 2,
          py: 1,
          color: 'white',
          fontWeight: 700,
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.06)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }
        }}
      >
        {getAIModeDisplayName(currentMode)}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            bgcolor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            backgroundImage: 'none',
            minWidth: 280,
            overflow: 'hidden',
            p: 0
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI Generation Mode
          </Typography>
        </Box>

        <Box sx={{ py: 1 }}>
          {modes.map(({ mode }) => {
            const locked = isLocked(mode);
            const isSelected = currentMode === mode;
            const requiredTierText = getRequiredTierText(mode);
            
            return (
              <MenuItem
                key={mode}
                onClick={() => handleModeSelect(mode)}
                disabled={locked}
                sx={{
                  py: 1.5,
                  px: 2,
                  opacity: locked ? 0.5 : 1,
                  bgcolor: isSelected ? alpha('#00F5FF', 0.05) : 'transparent',
                  borderRight: isSelected ? '2px solid #00F5FF' : 'none',
                  '&:hover': {
                    bgcolor: locked ? 'transparent' : 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: mode === AIMode.STANDARD ? '#4CAF50' : mode === AIMode.CREATIVE ? '#2196F3' : '#9C27B0',
                    boxShadow: `0 0 10px ${mode === AIMode.STANDARD ? alpha('#4CAF50', 0.5) : mode === AIMode.CREATIVE ? alpha('#2196F3', 0.5) : alpha('#9C27B0', 0.5)}`
                  }} />
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
                        {getAIModeDisplayName(mode)}
                      </Typography>
                      {requiredTierText && (
                        <Box sx={{ 
                          px: 1, 
                          py: 0.25, 
                          bgcolor: alpha('#00F5FF', 0.1), 
                          color: '#00F5FF', 
                          borderRadius: '6px', 
                          fontSize: '0.65rem', 
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}>
                          {requiredTierText}
                        </Box>
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block' }}>
                      {getAIModeDescription(mode)}
                    </Typography>
                  </Box>
                  {locked ? (
                    <LockClosedIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.2)' }} />
                  ) : isSelected ? (
                    <CheckIcon sx={{ fontSize: 18, color: '#00F5FF' }} />
                  ) : null}
                </Stack>
              </MenuItem>
            );
          })}
        </Box>
        
        {userTier === SubscriptionTier.FREE && (
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: '#00F5FF',
                color: '#000',
                fontWeight: 800,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#00D1DA' }
              }}
            >
              Upgrade to Pro
            </Button>
          </Box>
        )}
      </Menu>
    </Box>
  );
}
