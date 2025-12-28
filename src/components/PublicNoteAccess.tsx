'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { TURNSTILE_SITE_KEY } from '@/lib/turnstile';
import type { Notes } from '@/types/appwrite';
import { Box, Typography, Button, Alert, CircularProgress, alpha } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

interface PublicNoteAccessProps {
  noteId: string;
  onVerified: (note: Notes) => void;
  onError?: (message: string) => void;
}

export function PublicNoteAccess({ noteId, onVerified, onError }: PublicNoteAccessProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);
  const autoFetchAttempted = useRef(false);

  useEffect(() => {
    autoFetchAttempted.current = false;
  }, [noteId]);

  const fetchNote = useCallback(async () => {
    const noteRes = await fetch(`/api/shared/${noteId}`);

    if (!noteRes.ok) {
      if (noteRes.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }
      throw new Error('Failed to load note');
    }

    const note = await noteRes.json();
    onVerified(note);
  }, [noteId, onVerified]);

  const loadWithoutVerification = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchNote();
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNote, onError]);

  useEffect(() => {
    // Automatically fall back to direct loading when Turnstile is not configured.
    if (!turnstileEnabled && !autoFetchAttempted.current) {
      autoFetchAttempted.current = true;
      loadWithoutVerification();
    }
  }, [turnstileEnabled, loadWithoutVerification]);

  const handleTurnstileSuccess = async (captchaToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verify Turnstile token server-side
      const verifyRes = await fetch('/api/turnstile/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      await fetchNote();
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurnstileError = (errorCode: string) => {
    const errorMsg = `Verification failed: ${errorCode}`;
    setError(errorMsg);
    onError?.(errorMsg);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: '16px',
            bgcolor: alpha('#FF3B30', 0.1),
            color: '#FF3B30',
            border: '1px solid',
            borderColor: alpha('#FF3B30', 0.2),
            '& .MuiAlert-icon': { color: '#FF3B30' }
          }}
        >
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3,
        p: 4,
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ 
          width: 64, 
          height: 64, 
          borderRadius: '20px', 
          bgcolor: alpha('#00F5FF', 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          mb: 1
        }}>
          <SecurityIcon sx={{ color: '#00F5FF', fontSize: 32 }} />
        </Box>

        {turnstileEnabled ? (
          <>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', mb: 1 }}>
                Security Verification
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>
                Complete the verification to view this shared note
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
              <TurnstileWidget
                onToken={handleTurnstileSuccess}
                onError={handleTurnstileError}
                theme="dark"
                size="normal"
              />
            </Box>
          </>
        ) : (
          <>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', mb: 1 }}>
                Loading Note
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>
                Verification is temporarily unavailable. Loading the note directly.
              </Typography>
            </Box>
            {!isLoading && (
              <Button
                variant="contained"
                onClick={loadWithoutVerification}
                sx={{ 
                  alignSelf: 'center',
                  bgcolor: '#00F5FF',
                  color: '#000',
                  fontWeight: 900,
                  borderRadius: '12px',
                  px: 4,
                  '&:hover': { bgcolor: alpha('#00F5FF', 0.8) }
                }}
              >
                Retry loading note
              </Button>
            )}
          </>
        )}
        
        {isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
            <CircularProgress size={40} sx={{ color: '#00F5FF' }} />
            <Typography variant="caption" sx={{ color: '#00F5FF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Verifying...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}


