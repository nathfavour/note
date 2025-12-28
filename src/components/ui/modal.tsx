import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          backgroundImage: 'none',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 900, 
            fontFamily: '"Space Grotesk", sans-serif',
            color: '#00F5FF',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            transition: 'all 0.2s ease',
            '&:hover': { 
              color: '#00F5FF',
              bgcolor: 'rgba(0, 245, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Box sx={{ color: '#FFFFFF' }}>
          {children}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
