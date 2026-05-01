"use client";

import React from 'react';
import { 
  Drawer,
  Box, 
  Fade, 
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useOverlay } from './OverlayContext';

const Overlay: React.FC = () => {
  const { isOpen, content, closeOverlay } = useOverlay();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={isOpen}
      onClose={closeOverlay}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 'min(100vw, 720px)',
          maxWidth: isMobile ? '100%' : '720px',
          height: isMobile ? '92dvh' : '100%',
          maxHeight: '100dvh',
          borderTopLeftRadius: isMobile ? '24px' : 0,
          borderTopRightRadius: isMobile ? '24px' : 0,
          borderLeft: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          backgroundImage: 'none',
          bgcolor: '#161412',
          boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
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
      <Fade in={isOpen}>
        <Box
          sx={{
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            minHeight: 0,
            flex: 1,
            maxHeight: '100vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </Box>
      </Fade>
    </Drawer>
  );
};

export default Overlay;

