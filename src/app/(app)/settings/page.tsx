'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Button, 
    TextField, 
    Stack, 
    Switch, 
    FormControlLabel, 
    Divider,
    Alert,
    CircularProgress,
    alpha,
    useTheme
} from '@mui/material';
import { 
    Lock, 
    Shield, 
    Smartphone,
    Key,
    Fingerprint,
    Zap,
    ShieldAlert,
    ChevronRight,
    Search
} from 'lucide-react';
import { ecosystemSecurity } from '@/lib/ecosystem/security';
import { SudoModal } from '@/components/overlays/SudoModal';
import { useAuth } from '@/components/ui/AuthContext';
import { PageHeader } from '@/components/PageHeader';

export default function SettingsPage() {
    const { user } = useAuth();
    const theme = useTheme();
    const [isUnlocked, setIsUnlocked] = useState(ecosystemSecurity.status.isUnlocked);
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isPinSet, setIsPinSet] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setIsPinSet(ecosystemSecurity.isPinSet());
        
        const interval = setInterval(() => {
            if (ecosystemSecurity.status.isUnlocked !== isUnlocked) {
                setIsUnlocked(ecosystemSecurity.status.isUnlocked);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isUnlocked]);

    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setMessage({ type: 'error', text: 'PIN must be 4 digits.' });
            return;
        }
        if (pin !== confirmPin) {
            setMessage({ type: 'error', text: 'PINs do not match.' });
            return;
        }

        if (!isUnlocked) {
            setUnlockModalOpen(true);
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const success = await ecosystemSecurity.setupPin(pin);
            if (success) {
                setMessage({ type: 'success', text: 'Quick Unlock PIN set successfully!' });
                setIsPinSet(true);
                setPin('');
                setConfirmPin('');
            } else {
                setMessage({ type: 'error', text: 'Failed to setup PIN. Please ensure vault is unlocked.' });
            }
        } catch (err: unknown) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
            <PageHeader 
                title="Settings" 
                subtitle="Configure your note-taking experience and security." 
            />

            <Stack spacing={4} sx={{ mt: 4 }}>
                {/* Security Section */}
                <Box>
                    <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
                        SECURITY & PRIVACY
                    </Typography>
                    
                    <Paper sx={{ 
                        p: 4, 
                        borderRadius: '32px', 
                        bgcolor: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        backgroundImage: 'none'
                    }}>
                        <Stack spacing={4}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'var(--font-space-grotesk)' }}>Vault Session</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.6 }}>Your current encryption status for protected notes</Typography>
                                </Box>
                                <Button 
                                    variant={isUnlocked ? "outlined" : "contained"}
                                    onClick={() => isUnlocked ? ecosystemSecurity.lock() : setUnlockModalOpen(true)}
                                    color={isUnlocked ? "inherit" : "primary"}
                                    startIcon={isUnlocked ? <Lock size={18} /> : <Shield size={18} />}
                                    sx={{ 
                                        borderRadius: '16px', 
                                        px: 3, 
                                        py: 1.2, 
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        ...(isUnlocked && {
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'rgba(255, 255, 255, 0.6)'
                                        })
                                    }}
                                >
                                    {isUnlocked ? "Lock Vault" : "Unlock Vault"}
                                </Button>
                            </Box>

                            <Divider sx={{ opacity: 0.05 }} />

                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'var(--font-space-grotesk)', mb: 1 }}>Quick Unlock (PIN)</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.6, mb: 4, maxWidth: 600 }}>
                                    Set a 4-digit PIN for instant access to your private notes between sessions. This allows you to bypass the master password for a limited time.
                                </Typography>

                                {message && (
                                    <Alert severity={message.type} sx={{ mb: 3, borderRadius: '16px', bgcolor: alpha(theme.palette[message.type].main, 0.05), color: theme.palette[message.type].main, border: `1px solid ${alpha(theme.palette[message.type].main, 0.1)}` }}>
                                        {message.text}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSetPin} sx={{ maxWidth: 360 }}>
                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder="New PIN"
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                variant="filled"
                                                inputProps={{ maxLength: 4, inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 800, letterSpacing: '0.5em' } }}
                                                InputProps={{ disableUnderline: true, sx: { borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.04)' } }}
                                            />
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder="Confirm"
                                                value={confirmPin}
                                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                variant="filled"
                                                inputProps={{ maxLength: 4, inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 800, letterSpacing: '0.5em' } }}
                                                InputProps={{ disableUnderline: true, sx: { borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.04)' } }}
                                            />
                                        </Box>
                                        <Button 
                                            fullWidth
                                            variant="contained" 
                                            type="submit"
                                            disabled={loading || pin.length !== 4 || pin !== confirmPin}
                                            sx={{ 
                                                borderRadius: '16px', 
                                                py: 1.8, 
                                                fontWeight: 800,
                                                bgcolor: isPinSet ? alpha('#00F5FF', 0.1) : 'primary.main',
                                                color: isPinSet ? '#00F5FF' : 'black',
                                                border: isPinSet ? '1px solid rgba(0, 245, 255, 0.2)' : 'none',
                                                '&:hover': { bgcolor: isPinSet ? alpha('#00F5FF', 0.2) : alpha('#00F5FF', 0.8) },
                                                textTransform: 'none'
                                            }}
                                        >
                                            {loading ? <CircularProgress size={24} color="inherit" /> : (isPinSet ? "Update Quick Unlock PIN" : "Setup Quick Unlock PIN")}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Box>
                        </Stack>
                    </Paper>
                </Box>

                {/* Editor Section */}
                <Box>
                    <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
                        EDITOR PREFERENCES
                    </Typography>
                    <Paper sx={{ 
                        p: 4, 
                        borderRadius: '32px', 
                        bgcolor: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        backgroundImage: 'none'
                    }}>
                        <Stack spacing={1}>
                            <FormControlLabel
                                control={<Switch defaultChecked color="primary" />}
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'var(--font-space-grotesk)' }}>Auto-save</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Automatically save notes while typing</Typography>
                                    </Box>
                                }
                                sx={{ justifyContent: 'space-between', width: '100%', ml: 0, flexDirection: 'row-reverse', py: 1 }}
                            />
                            <Divider sx={{ opacity: 0.05 }} />
                            <FormControlLabel
                                control={<Switch color="primary" />}
                                label={
                                    <Box sx={{ ml: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'var(--font-space-grotesk)' }}>Markdown Preview</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>Show side-by-side markdown preview</Typography>
                                    </Box>
                                }
                                sx={{ justifyContent: 'space-between', width: '100%', ml: 0, flexDirection: 'row-reverse', py: 1 }}
                            />
                        </Stack>
                    </Paper>
                </Box>
            </Stack>

            <SudoModal 
                open={unlockModalOpen}
                onClose={() => setUnlockModalOpen(false)}
                onSuccess={() => {
                    setIsUnlocked(true);
                    if (pin.length === 4 && pin === confirmPin) {
                        ecosystemSecurity.setupPin(pin).then(success => {
                            if (success) {
                                setMessage({ type: 'success', text: 'Quick Unlock PIN set successfully!' });
                                setIsPinSet(true);
                                setPin('');
                                setConfirmPin('');
                            }
                        });
                    }
                }}
            />
        </Box>
    );
}
