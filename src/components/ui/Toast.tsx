'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertTitle, Stack, Box } from '@mui/material';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  showError: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
    const id = Date.now().toString();
    const toast: Toast = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showError = useCallback((title: string, message?: string) => {
    showToast('error', title, message);
  }, [showToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast('warning', title, message);
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast('info', title, message);
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    dismissToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Stack spacing={2} sx={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, width: '100%', maxWidth: 400 }}>
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={toast.duration}
            onClose={() => dismissToast(toast.id)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ position: 'relative' }}
          >
            <Alert 
              onClose={() => dismissToast(toast.id)} 
              severity={toast.type} 
              sx={{ 
                width: '100%', 
                borderRadius: '16px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                bgcolor: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(25px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                '& .MuiAlert-icon': {
                  color: toast.type === 'success' ? '#00F5FF' : 
                         toast.type === 'error' ? '#FF453A' : 
                         toast.type === 'warning' ? '#FFA500' : '#00F5FF'
                },
                '& .MuiAlert-action': {
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              <AlertTitle sx={{ 
                fontWeight: 900, 
                fontFamily: '"Space Grotesk", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.85rem',
                color: toast.type === 'success' ? '#00F5FF' : 
                       toast.type === 'error' ? '#FF453A' : 
                       toast.type === 'warning' ? '#FFA500' : '#00F5FF'
              }}>
                {toast.title}
              </AlertTitle>
              <Box sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.9rem', opacity: 0.8 }}>
                {toast.message}
              </Box>
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </ToastContext.Provider>
  );
}
