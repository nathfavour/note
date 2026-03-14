'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    useTheme,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton
} from '@mui/material';
import {
    Lock,
    Shield,
    Fingerprint,
    Trash2
} from 'lucide-react';
import { ecosystemSecurity } from '@/lib/ecosystem/security';
import { SudoModal } from '@/components/overlays/SudoModal';
import { PasskeySetup } from '@/components/overlays/PasskeySetup';
import { DiscoverabilitySettings } from '@/components/settings/DiscoverabilitySettings';
import { useAuth } from '@/components/ui/AuthContext';
import PageHeader from '@/components/PageHeader';
import { AppwriteService } from '@/lib/appwrite';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { user } = useAuth();
    const theme = useTheme();
    const [isUnlocked, setIsUnlocked] = useState(ecosystemSecurity.status.isUnlocked);
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);
    const [passkeySetupOpen, setPasskeySetupOpen] = useState(false);
    const [oldPin, setOldPin] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isPinSet, setIsPinSet] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [pendingAction, setPendingAction] = useState<'setup' | 'wipe' | null>(null);

    // Passkey state
    const [passkeyEntries, setPasskeyEntries] = useState<any[]>([]);
    const [_loadingPasskeys, setLoadingPasskeys] = useState(true);

    const loadPasskeys = useCallback(async () => {
        if (!user?.$id) return;
        try {
            const entries = await AppwriteService.listKeychainEntries(user.$id);
            const pkEntries = entries.filter((e: any) => e.type === 'passkey').map((e: any) => ({
                ...e,
                params: typeof e.params === 'string' ? JSON.parse(e.params) : e.params
            }));

            setPasskeyEntries(pkEntries);
        } catch (_e) {
            console.error("Failed to load passkeys", _e);
        } finally {
            setLoadingPasskeys(false);
        }
    }, [user?.$id]);

    useEffect(() => {
        setIsPinSet(ecosystemSecurity.isPinSet());

        const interval = setInterval(() => {
            if (ecosystemSecurity.status.isUnlocked !== isUnlocked) {
                setIsUnlocked(ecosystemSecurity.status.isUnlocked);
            }
        }, 1000);

        if (user?.$id) {
            loadPasskeys();
        }

        return () => clearInterval(interval);
    }, [isUnlocked, user, loadPasskeys]);

    const handleRemovePasskey = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this passkey? This cannot be undone.")) return;
        try {
            await AppwriteService.deleteKeychainEntry(id);
            toast.success("Passkey removed");
            loadPasskeys();
        } catch (_e) {
            toast.error("Failed to remove passkey");
        }
    };

    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setMessage({ type: 'error', text: 'PIN must be 4 digits.' });
            return;
        }
        if (pin !== confirmPin) {
            setMessage({ type: 'error', text: 'New PINs do not match.' });
            return;
        }

        if (isPinSet) {
            const verified = await ecosystemSecurity.verifyPin(oldPin);
            if (!verified) {
                setMessage({ type: 'error', text: 'Current PIN is incorrect.' });
                return;
            }
        }

        if (!isUnlocked) {
            setPendingAction('setup');
            setUnlockModalOpen(true);
            return;
        }

        await executePinSetup();
    };

    const executePinSetup = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const success = await ecosystemSecurity.setupPin(pin);
            if (success) {
                setMessage({ type: 'success', text: isPinSet ? 'PIN updated successfully!' : 'PIN setup successfully!' });
                setIsPinSet(true);
                setPin('');
                setConfirmPin('');
                setOldPin('');
            } else {
                setMessage({ type: 'error', text: 'Failed to setup PIN. Please ensure vault is unlocked.' });
            }
        } catch (_err: unknown) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
            setPendingAction(null);
        }
    };

    const handleWipePin = () => {
        if (!isUnlocked) {
            setPendingAction('wipe');
            setUnlockModalOpen(true);
            return;
        }

        ecosystemSecurity.wipePin();
        setIsPinSet(false);
        setOldPin('');
        setPin('');
        setConfirmPin('');
        setMessage({ type: 'success', text: 'PIN has been reset. You can now set a new one.' });
        setPendingAction(null);
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
            <PageHeader />

            <Stack spacing={4} sx={{ mt: 4 }}>
                <DiscoverabilitySettings />
                {/* Security Section */}
                <Box>
                    <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
                        SECURITY & PRIVACY
                    </Typography>

                    <Paper sx={{
                        p: 4,
                        borderRadius: '32px',
                        bgcolor: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(25px)',
                        backgroundImage: 'none',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <Stack spacing={4}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)', letterSpacing: '-0.02em' }}>Vault Session</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.5, fontFamily: 'var(--font-satoshi)' }}>Your current encryption status for protected notes</Typography>
                                </Box>
                                <Button
                                    variant={isUnlocked ? "text" : "contained"}
                                    onClick={() => isUnlocked ? ecosystemSecurity.lock() : setUnlockModalOpen(true)}
                                    color={isUnlocked ? "inherit" : "primary"}
                                    startIcon={isUnlocked ? <Lock size={18} strokeWidth={1.5} /> : <Shield size={18} strokeWidth={1.5} />}
                                    sx={{
                                        borderRadius: '16px',
                                        px: 4,
                                        py: 1.5,
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-satoshi)',
                                        textTransform: 'none',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        ...(isUnlocked ? {
                                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', color: 'white' }
                                        } : {
                                            background: 'linear-gradient(135deg, #6366F1 0%, #00D1DA 100%)',
                                            color: 'black',
                                            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.15)',
                                            '&:hover': { background: 'linear-gradient(135deg, #00E5FF 0%, #00C1CA 100%)', transform: 'translateY(-1px)' }
                                        })
                                    }}
                                >
                                    {isUnlocked ? "Lock Vault" : "Unlock Vault"}
                                </Button>
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                            {/* Passkey Section */}
                            <Box sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.02)',
                                p: 3.5,
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)', letterSpacing: '-0.01em' }}>Passkeys</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.5, fontFamily: 'var(--font-satoshi)', mt: 0.5 }}>
                                            Use biometrics to securely unlock your notes.
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="text"
                                        size="small"
                                        startIcon={<Fingerprint size={16} strokeWidth={2} />}
                                        onClick={() => setPasskeySetupOpen(true)}
                                        sx={{
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            fontWeight: 800,
                                            bgcolor: 'rgba(99, 102, 241, 0.05)',
                                            color: '#6366F1',
                                            px: 2,
                                            border: '1px solid rgba(99, 102, 241, 0.1)',
                                            '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }
                                        }}
                                    >
                                        Register
                                    </Button>
                                </Box>

                                <List sx={{ bgcolor: 'rgba(255, 255, 255, 0.01)', borderRadius: '20px', p: 1, border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                    {passkeyEntries.length === 0 ? (
                                        <Box sx={{ py: 3, textAlign: 'center', opacity: 0.3 }}>
                                            <Typography variant="caption" sx={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>ZERO PASSKEYS DETECTED</Typography>
                                        </Box>
                                    ) : (
                                        passkeyEntries.map((pk, idx) => (
                                            <React.Fragment key={pk.$id}>
                                                <ListItem
                                                    sx={{
                                                        borderRadius: '14px',
                                                        mb: idx < passkeyEntries.length - 1 ? 1 : 0,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' }
                                                    }}
                                                    secondaryAction={
                                                        <IconButton edge="end" onClick={() => handleRemovePasskey(pk.$id)} sx={{ color: 'rgba(255, 77, 77, 0.4)', '&:hover': { color: '#FF4D4D', bgcolor: 'rgba(255, 77, 77, 0.1)' } }}>
                                                            <Trash2 size={16} strokeWidth={1.5} />
                                                        </IconButton>
                                                    }
                                                >
                                                    <ListItemIcon sx={{ minWidth: 44 }}>
                                                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(99, 102, 241, 0.05)', display: 'flex', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                                            <Fingerprint size={18} color="#6366F1" strokeWidth={1.5} />
                                                        </Box>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={pk.params?.name || `Passkey ${idx + 1}`}
                                                        secondary="Secure Hardware Key"
                                                        primaryTypographyProps={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-satoshi)' }}
                                                        secondaryTypographyProps={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', sx: { opacity: 0.4 } }}
                                                    />
                                                </ListItem>
                                            </React.Fragment>
                                        ))
                                    )}
                                </List>
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                            <Box sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.02)',
                                p: 3.5,
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)', letterSpacing: '-0.01em', mb: 0.5 }}>Quick Unlock (PIN)</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.5, mb: 3.5, maxWidth: 600, fontFamily: 'var(--font-satoshi)' }}>
                                    {isPinSet
                                        ? "Your PIN is active. Use the form below to update it."
                                        : "Set a 4-digit PIN for instant access to your private notes between sessions."
                                    }
                                </Typography>

                                {message && (
                                    <Alert severity={message.type} sx={{ mb: 3, borderRadius: '14px', bgcolor: alpha(theme.palette[message.type].main, 0.05), color: theme.palette[message.type].main, border: `1px solid ${alpha(theme.palette[message.type].main, 0.1)}`, fontFamily: 'var(--font-satoshi)', fontWeight: 600 }}>
                                        {message.text}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSetPin} sx={{ maxWidth: 380 }}>
                                    <Stack spacing={2}>
                                        {isPinSet && (
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder="Current PIN"
                                                value={oldPin}
                                                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                variant="filled"
                                                inputProps={{ maxLength: 4, inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 900, letterSpacing: '0.6em', fontFamily: 'var(--font-mono)' } }}
                                                InputProps={{ disableUnderline: true, sx: { borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', height: 56 } }}
                                            />
                                        )}
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder={isPinSet ? "New" : "PIN"}
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                variant="filled"
                                                inputProps={{ maxLength: 4, inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 900, letterSpacing: '0.6em', fontFamily: 'var(--font-mono)' } }}
                                                InputProps={{ disableUnderline: true, sx: { borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', height: 56 } }}
                                            />
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder="Confirm"
                                                value={confirmPin}
                                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                variant="filled"
                                                inputProps={{ maxLength: 4, inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 900, letterSpacing: '0.6em', fontFamily: 'var(--font-mono)' } }}
                                                InputProps={{ disableUnderline: true, sx: { borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', height: 56 } }}
                                            />
                                        </Box>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            type="submit"
                                            disabled={loading || pin.length !== 4 || pin !== confirmPin || (isPinSet && oldPin.length !== 4)}
                                            sx={{
                                                borderRadius: '16px',
                                                py: 1.8,
                                                fontWeight: 800,
                                                fontFamily: 'var(--font-satoshi)',
                                                bgcolor: isPinSet ? 'rgba(255, 255, 255, 0.03)' : 'primary.main',
                                                color: isPinSet ? 'white' : 'black',
                                                border: isPinSet ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                                                '&:hover': { bgcolor: isPinSet ? 'rgba(255, 255, 255, 0.06)' : alpha('#6366F1', 0.8) },
                                                textTransform: 'none'
                                            }}
                                        >
                                            {loading ? <CircularProgress size={24} color="inherit" /> : (isPinSet ? "Update Unlock PIN" : "Setup Quick Unlock")}
                                        </Button>

                                        {isPinSet && (
                                            <Button
                                                fullWidth
                                                variant="text"
                                                color="error"
                                                onClick={handleWipePin}
                                                startIcon={<Trash2 size={16} strokeWidth={1.5} />}
                                                sx={{ textTransform: 'none', fontWeight: 800, fontFamily: 'var(--font-satoshi)', fontSize: '0.75rem', opacity: 0.6, '&:hover': { opacity: 1 } }}
                                            >
                                                Forgot PIN? Reset with Master Password
                                            </Button>
                                        )}
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
                onClose={() => {
                    setUnlockModalOpen(false);
                    setPendingAction(null);
                }}
                onSuccess={() => {
                    setUnlockModalOpen(false);
                    setIsUnlocked(true);
                    if (pendingAction === 'setup') {
                        executePinSetup();
                    } else if (pendingAction === 'wipe') {
                        ecosystemSecurity.wipePin();
                        setIsPinSet(false);
                        setMessage({ type: 'success', text: 'PIN reset successful.' });
                        setPendingAction(null);
                    }
                }}
            />

            <PasskeySetup
                open={passkeySetupOpen}
                onClose={() => setPasskeySetupOpen(false)}
                userId={user?.$id || ""}
                onSuccess={() => {
                    setPasskeySetupOpen(false);
                    loadPasskeys();
                }}
                trustUnlocked={true}
            />
        </Box>
    );
}
