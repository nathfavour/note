'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  InputAdornment,
  Typography,
  IconButton,
  Drawer,
  Fade,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, DragHandle as DragHandleIcon } from '@mui/icons-material';
import type { Notes } from '@/types/appwrite';
import { updateNote } from '@/lib/appwrite';

interface PaywallDrawerProps {
  open: boolean;
  onClose: () => void;
  note: Notes;
  onUpdate?: (note: Notes) => void;
}

const PaywallDrawer: React.FC<PaywallDrawerProps> = ({
  open,
  onClose,
  note,
  onUpdate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartY = useRef(0);

  const metadata = typeof note.metadata === 'string' 
    ? JSON.parse(note.metadata || '{}') 
    : note.metadata || {};
  const currentPaywall = metadata?.paywall;

  // Local state - only initialize on mount, not on props change
  const [hasPaywall, setHasPaywall] = useState(() => !!currentPaywall?.enabled);
  const [paywallAmount, setPaywallAmount] = useState<number | ''>(() => currentPaywall?.amount || '');
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when drawer closes
  React.useEffect(() => {
    if (!open) {
      setIsExpanded(false);
    } else {
      // Initialize on open
      setHasPaywall(!!currentPaywall?.enabled);
      setPaywallAmount(currentPaywall?.amount || '');
    }
  }, [open, currentPaywall]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartY.current === 0) return;
    
    const deltaY = dragStartY.current - e.clientY;
    const threshold = 100;
    
    if (deltaY > threshold && !isExpanded) {
      setIsExpanded(true);
    }
    if (deltaY < -threshold && isExpanded) {
      setIsExpanded(false);
    }
  };

  const handleMouseUp = () => {
    dragStartY.current = 0;
  };

  const drawerHeight = isMobile 
    ? (isExpanded ? '100dvh' : '60dvh')
    : '100%';

  const handleSavePaywall = async () => {
    setIsSaving(true);
    try {
      const updatedNote = await updateNote(note.$id, {
        metadata: JSON.stringify({
          ...metadata,
          paywall: hasPaywall && paywallAmount ? {
            enabled: true,
            amount: typeof paywallAmount === 'number' ? paywallAmount : parseFloat(paywallAmount),
            currency: 'USD',
          } : {
            enabled: false,
            amount: 0,
            currency: 'USD',
          },
        }),
      });
      onUpdate?.(updatedNote as Notes);
      onClose();
    } catch (error) {
      console.error('Failed to update paywall:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 'min(100vw, 720px)',
          maxWidth: isMobile ? '100%' : '720px',
          height: drawerHeight,
          maxHeight: '100dvh',
          borderTopLeftRadius: isMobile ? '24px' : 0,
          borderTopRightRadius: isMobile ? '24px' : 0,
          borderLeft: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          backgroundImage: 'none',
          bgcolor: '#161412',
          boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'height 0.3s ease-out',
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(10px)',
          }
        }
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            minHeight: 0,
            flex: 1,
            maxHeight: '100vh',
            userSelect: 'none',
          }}
          onMouseDown={isMobile ? handleMouseDown : undefined}
          onMouseMove={isMobile ? handleMouseMove : undefined}
          onMouseUp={isMobile ? handleMouseUp : undefined}
        >
          {/* Header with drag handle */}
          {isMobile && (
            <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <DragHandleIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }} />
            </Box>
          )}

          {/* Close button for desktop */}
          {!isMobile && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          )}

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
              {currentPaywall?.enabled ? 'Edit Paywall' : 'Add Paywall'}
            </Typography>

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={hasPaywall} 
                    onChange={(e) => setHasPaywall(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#6366F1',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#6366F1',
                      },
                    }}
                  />
                }
                label={<span style={{ color: 'white', fontWeight: 500 }}>Lock this note behind paywall</span>}
              />
              {hasPaywall && (
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ step: '0.01', min: '0' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  value={paywallAmount}
                  onChange={(e) => setPaywallAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="Price in USD"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.12)',
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: 'rgba(255,255,255,0.3)',
                      opacity: 1,
                    },
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* Footer with action buttons */}
          <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 2 }}>
            <Button
              onClick={onClose}
              fullWidth
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePaywall}
              disabled={isSaving || (hasPaywall && !paywallAmount)}
              variant="contained"
              fullWidth
              sx={{
                bgcolor: '#6366F1',
                color: 'white',
                borderRadius: '12px',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: '#4F46E5',
                },
                '&:disabled': {
                  bgcolor: 'rgba(99,102,241,0.4)',
                  color: 'rgba(255,255,255,0.5)',
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Drawer>
  );
};

export default PaywallDrawer;
