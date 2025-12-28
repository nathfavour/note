'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  TextField, 
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';

interface MFASettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  factor: 'totp' | 'email';
  isEnabled: boolean;
  onEnable: (factor: 'totp' | 'email') => Promise<void>;
  onDisable: (factor: 'totp' | 'email') => Promise<void>;
  onVerify?: (factor: 'totp' | 'email', otp: string) => Promise<void>;
  totpSecret?: string;
  totpQrCode?: string;
  totpManualEntry?: string;
}

export const MFASettingsModal: React.FC<MFASettingsModalProps> = ({
  isOpen,
  onClose,
  factor,
  isEnabled,
  onEnable,
  onDisable,
  onVerify,
  totpQrCode,
  totpManualEntry,
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'confirm' | 'setup' | 'verify'>('confirm');

  const handleEnable = async () => {
    if (factor === 'totp') {
      setStep('setup');
    } else {
      setStep('verify');
      setLoading(true);
      try {
        await onEnable(factor);
        setSuccess('Email MFA has been enabled. Check your email for verification.');
        setStep('verify');
      } catch (err: any) {
        setError(err.message || 'Failed to enable email MFA');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyTOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    try {
      if (onVerify) {
        await onVerify(factor, otp);
      }
      setSuccess(`${factor === 'totp' ? 'TOTP' : 'Email'} MFA has been successfully enabled!`);
      setTimeout(() => {
        resetModal();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await onDisable(factor);
      setSuccess(`${factor === 'totp' ? 'TOTP' : 'Email'} MFA has been disabled`);
      setTimeout(() => {
        resetModal();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setOtp('');
    setError('');
    setSuccess('');
    setStep('confirm');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          backgroundImage: 'none',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 900, 
        fontFamily: '"Space Grotesk", sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#00F5FF',
        pt: 3
      }}>
        {factor === 'totp' ? 'Authenticator App' : 'Email OTP'} MFA
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: '12px',
                bgcolor: 'rgba(255, 69, 58, 0.1)',
                color: '#FF453A',
                border: '1px solid rgba(255, 69, 58, 0.2)',
                '& .MuiAlert-icon': { color: '#FF453A' }
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                borderRadius: '12px',
                bgcolor: 'rgba(0, 245, 255, 0.1)',
                color: '#00F5FF',
                border: '1px solid rgba(0, 245, 255, 0.2)',
                '& .MuiAlert-icon': { color: '#00F5FF' }
              }}
            >
              {success}
            </Alert>
          )}

          {step === 'confirm' && (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: '"Inter", sans-serif' }}>
              {isEnabled
                ? `${factor === 'totp' ? 'TOTP' : 'Email'} MFA is currently enabled. You can disable it if you no longer need it.`
                : `Enable ${factor === 'totp' ? 'TOTP' : 'Email'} MFA to add an extra layer of security to your account.`}
            </Typography>
          )}

          {step === 'setup' && factor === 'totp' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)', fontFamily: '"Inter", sans-serif' }}>
                Scan this QR code with your authenticator app:
              </Typography>
              {totpQrCode && (
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: '#fff', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                }}>
                  <img src={totpQrCode} alt="TOTP QR Code" style={{ width: 192, height: 192 }} />
                </Paper>
              )}
              {totpManualEntry && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>
                    Or enter this code manually:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: '12px', 
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#00F5FF',
                      textAlign: 'center',
                      letterSpacing: '0.1em'
                    }}
                  >
                    {totpManualEntry}
                  </Typography>
                </Box>
              )}
              <TextField
                fullWidth
                label="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                slotProps={{ 
                  htmlInput: { 
                    maxLength: 6, 
                    style: { 
                      textAlign: 'center', 
                      letterSpacing: '0.5em', 
                      fontSize: '1.5rem', 
                      fontWeight: 900,
                      fontFamily: '"Space Grotesk", sans-serif',
                      color: '#00F5FF'
                    } 
                  },
                  inputLabel: {
                    sx: {
                      color: 'rgba(255, 255, 255, 0.5)',
                      '&.Mui-focused': { color: '#00F5FF' }
                    }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#00F5FF' },
                  }
                }}
                variant="outlined"
              />
            </Box>
          )}

          {step === 'verify' && factor === 'email' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: '"Inter", sans-serif' }}>
                A verification code has been sent to your email. Please enter it below:
              </Typography>
              <TextField
                fullWidth
                label="Verification code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                slotProps={{ 
                  htmlInput: { 
                    maxLength: 6, 
                    style: { 
                      textAlign: 'center', 
                      letterSpacing: '0.5em', 
                      fontSize: '1.5rem', 
                      fontWeight: 900,
                      fontFamily: '"Space Grotesk", sans-serif',
                      color: '#00F5FF'
                    } 
                  },
                  inputLabel: {
                    sx: {
                      color: 'rgba(255, 255, 255, 0.5)',
                      '&.Mui-focused': { color: '#00F5FF' }
                    }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#00F5FF' },
                  }
                }}
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading} 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 700,
            fontFamily: '"Space Grotesk", sans-serif',
            textTransform: 'uppercase'
          }}
        >
          Cancel
        </Button>
        {step === 'confirm' ? (
          isEnabled ? (
            <Button 
              variant="contained" 
              onClick={handleDisable} 
              disabled={loading}
              sx={{ 
                borderRadius: '12px', 
                flex: 1,
                bgcolor: 'rgba(255, 69, 58, 0.1)',
                color: '#FF453A',
                border: '1px solid rgba(255, 69, 58, 0.2)',
                fontWeight: 900,
                fontFamily: '"Space Grotesk", sans-serif',
                textTransform: 'uppercase',
                '&:hover': {
                  bgcolor: 'rgba(255, 69, 58, 0.2)',
                }
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#FF453A' }} /> : 'Disable MFA'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleEnable} 
              disabled={loading}
              sx={{ 
                borderRadius: '12px', 
                flex: 1,
                bgcolor: '#00F5FF',
                color: '#000',
                fontWeight: 900,
                fontFamily: '"Space Grotesk", sans-serif',
                textTransform: 'uppercase',
                '&:hover': {
                  bgcolor: '#00D1D9',
                }
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : 'Enable MFA'}
            </Button>
          )
        ) : (
          <Button 
            variant="contained" 
            onClick={handleVerifyTOTP} 
            disabled={loading || otp.length !== 6}
            sx={{ 
              borderRadius: '12px', 
              flex: 1,
              bgcolor: '#00F5FF',
              color: '#000',
              fontWeight: 900,
              fontFamily: '"Space Grotesk", sans-serif',
              textTransform: 'uppercase',
              '&:hover': {
                bgcolor: '#00D1D9',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : 'Verify & Enable'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

