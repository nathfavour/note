"use client";

import React from 'react';
import { 
  Modal, 
  Box, 
  Fade, 
  Backdrop
} from '@mui/material';
import { useOverlay } from './OverlayContext';

const Overlay: React.FC = () => {
  const { isOpen, content, closeOverlay } = useOverlay();

  return (
    <Modal
      open={isOpen}
      onClose={closeOverlay}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 400,
          sx: { 
            bgcolor: 'rgba(0, 0, 0, 0.4)', 
            backdropFilter: 'blur(4px) saturate(120%)' 
          }
        },
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 0, sm: 2 },
        zIndex: 1300
      }}
    >
      <Fade in={isOpen}>
        <Box
          sx={{
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 'fit-content',
            maxHeight: '100vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </Box>
      </Fade>
    </Modal>
  );
};

export default Overlay;

