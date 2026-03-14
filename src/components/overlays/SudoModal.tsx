"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Button,
    TextField,
    Box,
    IconButton,
    CircularProgress,
    Stack,
    Fade,
    alpha,
    InputAdornment,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CloseIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Shield";
import AppsIcon from "@mui/icons-material/Apps";
import { ecosystemSecurity } from "@/lib/ecosystem/security";
import { AppwriteService } from "@/lib/appwrite";
import { useAuth } from "@/components/ui/AuthContext";
import { unlockWithPasskey } from "@/lib/passkey";
import { PasskeySetup } from "./PasskeySetup";
import toast from "react-hot-toast";

interface SudoModalProps {
    open: boolean;
    onSuccess: () => void;
    onClose: () => void;
    intent?: "unlock" | "initialize" | "reset";
}

export default function SudoModal({
    open,
    onSuccess,
    onClose,
    intent,
}: SudoModalProps) {
    const { user } = useAuth();
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [hasMasterpass, setHasMasterpass] = useState<boolean | null>(null);
    const [mode, setMode] = useState<"passkey" | "password" | "pin" | "initialize" | null>(null);
    const [isDetecting, setIsDetecting] = useState(true);
    const [showPasskeyIncentive, setShowPasskeyIncentive] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [resetStep, setResetStep] = useState(1);

    const handleSuccessWithSync = useCallback(async () => {
        if (user?.$id) {
            try {
                // Sudo Hook: Ensure E2E Identity is created and published upon successful MasterPass unlock
                console.log("[Note] Synchronizing Identity...");
                await ecosystemSecurity.ensureE2EIdentity(user.$id);
            } catch (e) {
                console.error("[Note] Failed to sync identity on unlock", e);
            }
        }

        if (intent === "reset") {
            setResetStep(2);
            return;
        }

        const skipTimestamp = localStorage.getItem(`passkey_skip_${user?.$id}`);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const shouldShowIncentive =
            !hasPasskey &&
            (!skipTimestamp ||
                Date.now() - parseInt(skipTimestamp) > sevenDays);

        if (shouldShowIncentive) {
            setShowPasskeyIncentive(true);
        } else {
            onSuccess();
        }
    }, [user, hasPasskey, onSuccess, intent]);

    const handleInitializeMasterPass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.$id || !user?.email) return;
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            // 1. Generate new MEK
            const mek = await ecosystemSecurity.generateRandomMEK();
            
            // 2. Wrap it with the password
            const salt = crypto.getRandomValues(new Uint8Array(32));
            const wrappedKey = await ecosystemSecurity.wrapMEK(mek, password, salt);
            
            // 3. Create Keychain Entry
            await AppwriteService.createKeychainEntry({
                userId: user.$id,
                type: 'password',
                credentialId: null,
                wrappedKey: wrappedKey,
                salt: btoa(String.fromCharCode(...salt)),
                params: JSON.stringify({ iterations: 600000, hash: "SHA-256" }),
                isBackup: false
            });

            // 4. Set Masterpass Flag on User Doc
            await AppwriteService.setMasterpassFlag(user.$id, user.email);
            
            // 5. Unlock MasterPass locally
            const rawMek = await crypto.subtle.exportKey("raw", mek);
            await ecosystemSecurity.importMasterKey(rawMek);

            toast.success("MasterPass initialized successfully");
            handleSuccessWithSync();
        } catch (err) {
            console.error(err);
            toast.error("Initialization failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePasskeyVerify = useCallback(async () => {
        if (!user?.$id || !open) return;
        setPasskeyLoading(true);
        try {
            const success = await unlockWithPasskey(user.$id);
            if (success && open) {
                toast.success("Verified via Passkey");
                handleSuccessWithSync();
            }
        } catch (error: unknown) {
            console.error("Passkey verification failed or cancelled", error);
        } finally {
            setPasskeyLoading(false);
        }
    }, [user?.$id, open, handleSuccessWithSync]);

    // Check if user has passkey and PIN set up
    useEffect(() => {
        if (open && user?.$id) {
            const pinSet = ecosystemSecurity.isPinSet();
            setHasPin(pinSet);

            // Check for passkey keychain entry
            AppwriteService.listKeychainEntries(user.$id).then(entries => {
                const passkeyPresent = entries.some((e: any) => e.type === 'passkey');
                const passwordPresent = entries.some((e: any) => e.type === 'password');
                setHasPasskey(passkeyPresent);
                setHasMasterpass(passwordPresent);

                // Intent Logic
                if (intent === "initialize") {
                    if (passwordPresent) {
                        toast.error("MasterPass already set");
                        setMode("password");
                    } else {
                        setMode("initialize");
                    }
                    setIsDetecting(false);
                    return;
                }

                if (intent === "reset") {
                    setIsResetting(true);
                    setMode(passkeyPresent ? "passkey" : "password");
                    setIsDetecting(false);
                    return;
                }

                // Enforce Master Password setup if missing
                if (!passwordPresent && open) {
                    setMode("initialize");
                    setIsDetecting(false);
                    return;
                }

                if (passkeyPresent) {
                    setMode("passkey");
                    handlePasskeyVerify();
                } else if (pinSet) {
                    setMode("pin");
                } else {
                    setMode("password");
                }
                setIsDetecting(false);
            }).catch(() => {
                setIsDetecting(false);
                setMode("password");
            });

            // Reset state on open
            setPassword("");
            setPin("");
            setConfirmPassword("");
            setLoading(false);
            setPasskeyLoading(false);
            setIsDetecting(true);
        }
    }, [open, user?.$id, handlePasskeyVerify, intent]);

    const handlePasswordVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!user?.$id) return;

        if (hasMasterpass === false) {
            setMode("initialize");
            return;
        }

        if (!password) return;

        setLoading(true);
        try {
            // Find password keychain entry
            const entries = await AppwriteService.listKeychainEntries(user.$id);
            const passwordEntry = entries.find((e: any) => e.type === 'password');

            if (!passwordEntry) {
                setHasMasterpass(false);
                setMode("initialize");
                setLoading(false);
                return;
            }

            const isValid = await ecosystemSecurity.unlock(password, passwordEntry);
            if (isValid) {
                toast.success("Verified");
                handleSuccessWithSync();
            } else {
                toast.error("Incorrect master password");
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePinVerify = async (pinValue: string) => {
        if (pinValue.length !== 4 || loading) return;

        setLoading(true);
        try {
            const success = await ecosystemSecurity.unlockWithPin(pinValue);
            if (success) {
                toast.success("Verified via PIN");
                handleSuccessWithSync();
            } else {
                toast.error("Incorrect PIN");
                setPin("");
            }
        } catch (error: unknown) {
            console.error(error);
            toast.error("PIN verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        setPin(val);
        if (val.length === 4) {
            handlePinVerify(val);
        }
    };

    const handleFinalReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.$id || !user?.email || !password) return;
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            const mek = await ecosystemSecurity.generateRandomMEK();
            const salt = crypto.getRandomValues(new Uint8Array(32));
            const wrappedKey = await ecosystemSecurity.wrapMEK(mek, password, salt);
            
            const entries = await AppwriteService.listKeychainEntries(user.$id);
            const passEntry = entries.find((e: any) => e.type === 'password');
            if (passEntry) await AppwriteService.deleteKeychainEntry(passEntry.$id);

            await AppwriteService.createKeychainEntry({
                userId: user.$id,
                type: 'password',
                wrappedKey: wrappedKey,
                salt: btoa(String.fromCharCode(...salt)),
                params: JSON.stringify({ iterations: 600000, hash: "SHA-256" }),
                isBackup: false
            });

            const rawMek = await crypto.subtle.exportKey("raw", mek);
            await ecosystemSecurity.importMasterKey(rawMek);
            toast.success("MasterPass reset complete");
            onSuccess();
        } catch (err) {
            toast.error("Reset failed");
        } finally {
            setLoading(false);
        }
    };

    if (showPasskeyIncentive && user) {
        return (
            <PasskeySetup
                open={true}
                onClose={() => {
                    setShowPasskeyIncentive(false);
                    handleSuccessWithSync();
                }}
                userId={user.$id}
                onSuccess={() => {
                    setShowPasskeyIncentive(false);
                    handleSuccessWithSync();
                }}
                trustUnlocked={true}
            />
        );
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    borderRadius: '28px',
                    bgcolor: 'rgba(10, 10, 10, 0.95)',
                    backdropFilter: 'blur(25px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundImage: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 1, position: 'relative' }}>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 16,
                        top: 16,
                        color: 'rgba(255, 255, 255, 0.3)',
                        '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' }
                    }}
                >
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>

                <Box sx={{
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: '16px',
                    bgcolor: alpha('#6366F1', 0.1),
                    color: '#6366F1',
                    mb: 2
                }}>
                    <ShieldIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    fontFamily: 'var(--font-space-grotesk)',
                    color: 'white'
                }}>
                    Security Check
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1 }}>
                    Please verify your identity to continue
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ pb: 4 }}>
                {isResetting && resetStep === 2 ? (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <Box sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: alpha('#ef4444', 0.1),
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}>
                            <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShieldIcon sx={{ fontSize: 16 }} /> RESET MASTERPASS
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 0.5, display: 'block' }}>
                                This will replace your current master password. Your encrypted data will remain accessible with the new password.
                            </Typography>
                        </Box>

                        <form onSubmit={handleFinalReset}>
                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, mb: 1, display: 'block' }}>
                                        ENTER NEW MASTERPASS
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        placeholder="New master password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '14px',
                                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                                '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                                            },
                                            '& .MuiInputBase-input': { color: 'white' }
                                        }}
                                    />
                                </Box>

                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    disabled={loading || !password || password.length < 8}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: '14px',
                                        bgcolor: '#ef4444',
                                        color: '#fff',
                                        fontWeight: 700,
                                        '&:hover': {
                                            bgcolor: alpha('#ef4444', 0.8),
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Reset and Update Vault"}
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                ) : isDetecting || passkeyLoading ? (
                    <Stack spacing={3} sx={{ mt: 4, mb: 2, alignItems: 'center' }}>
                        <CircularProgress size={48} sx={{ color: '#6366F1' }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, letterSpacing: '0.1em' }}>
                                {passkeyLoading ? "AUTHENTICATING..." : "PREPARING SECURITY CHECK..."}
                            </Typography>
                            {passkeyLoading && (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', mt: 1, display: 'block' }}>
                                    Please confirm on your device
                                </Typography>
                            )}
                        </Box>
                        {passkeyLoading && (
                            <Button
                                fullWidth
                                variant="text"
                                size="small"
                                onClick={() => setMode("password")}
                                sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: 'white' } }}
                            >
                                Use Master Password
                            </Button>
                        )}
                    </Stack>
                ) : mode === "initialize" ? (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <form onSubmit={handleInitializeMasterPass}>
                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, mb: 1, display: 'block' }}>
                                        SET MASTER PASSWORD
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '14px',
                                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                                '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                                            },
                                            '& .MuiInputBase-input': { color: 'white' }
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, mb: 1, display: 'block' }}>
                                        CONFIRM PASSWORD
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        placeholder="Repeat your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <ShieldIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '14px',
                                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                                '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                                            },
                                            '& .MuiInputBase-input': { color: 'white' }
                                        }}
                                    />
                                </Box>

                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    disabled={loading || !password || !confirmPassword}
                                    sx={{
                                        py: 1.8,
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        fontFamily: 'var(--font-satoshi)',
                                        textTransform: 'none',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)'
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Initialize Ecosystem Vault"}
                                </Button>
                                
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', mt: 1 }}>
                                    Your MasterPass is the key to all your secure data. <br/> It cannot be recovered if lost.
                                </Typography>
                            </Stack>
                        </form>
                    </Stack>
                ) : mode === "pin" ? (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, mb: 1, display: 'block', textAlign: 'center' }}>
                                ENTER 4-DIGIT PIN
                            </Typography>
                            <TextField
                                fullWidth
                                type="password"
                                placeholder="••••"
                                value={pin}
                                onChange={handlePinChange}
                                autoFocus
                                inputProps={{
                                    maxLength: 4,
                                    inputMode: 'numeric',
                                    style: { textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em' }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AppsIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '14px',
                                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                        '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                                    },
                                    '& .MuiInputBase-input': { color: 'white' }
                                }}
                            />
                        </Box>

                        <Box sx={{ width: '100%', position: 'relative', py: 1 }}>
                            <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Typography variant="caption" sx={{
                                position: 'relative',
                                bgcolor: 'rgba(10, 10, 10, 1)',
                                px: 2,
                                mx: 'auto',
                                display: 'table',
                                color: 'rgba(255, 255, 255, 0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em'
                            }}>
                                Or
                            </Typography>
                        </Box>

                        <Button
                            fullWidth
                            variant="text"
                            size="small"
                            onClick={() => setMode("password")}
                            sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: 'white' } }}
                        >
                            Use Master Password
                        </Button>
                    </Stack>
                ) : mode === "passkey" ? (
                    <Stack spacing={3} sx={{ mt: 2, alignItems: 'center' }}>
                        <Box
                            onClick={handlePasskeyVerify}
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                border: '2px dashed',
                                borderColor: passkeyLoading ? '#6366F1' : 'rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                animation: passkeyLoading ? 'pulse 2s infinite' : 'none',
                                '&:hover': {
                                    borderColor: '#6366F1',
                                    bgcolor: alpha('#6366F1', 0.05)
                                },
                                '@keyframes pulse': {
                                    '0%': { boxShadow: '0 0 0 0 rgba(168, 85, 247, 0.4)' },
                                    '70%': { boxShadow: '0 0 0 15px rgba(168, 85, 247, 0)' },
                                    '100%': { boxShadow: '0 0 0 0 rgba(168, 85, 247, 0)' }
                                }
                            }}
                        >
                            <FingerprintIcon sx={{ fontSize: 40, color: passkeyLoading ? '#6366F1' : 'rgba(255, 255, 255, 0.4)' }} />
                        </Box>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                Use Face ID / Touch ID
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Authenticate with your device security
                            </Typography>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handlePasskeyVerify}
                            disabled={passkeyLoading}
                            sx={{
                                py: 1.5,
                                borderRadius: '14px',
                                bgcolor: '#6366F1',
                                color: '#000',
                                fontWeight: 700,
                                '&:hover': {
                                    bgcolor: '#00D1DA',
                                },
                                '&.Mui-disabled': {
                                    bgcolor: alpha('#6366F1', 0.1),
                                    color: 'rgba(255, 255, 255, 0.3)'
                                }
                            }}
                        >
                            {passkeyLoading ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CircularProgress size={20} color="inherit" />
                                    <span>Waiting for Passkey...</span>
                                </Stack>
                            ) : "Verify with Passkey"}
                        </Button>

                        <Box sx={{ width: '100%', position: 'relative', py: 1 }}>
                            <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Typography variant="caption" sx={{
                                position: 'relative',
                                bgcolor: 'rgba(10, 10, 10, 1)',
                                px: 2,
                                mx: 'auto',
                                display: 'table',
                                color: 'rgba(255, 255, 255, 0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em'
                            }}>
                                Or
                            </Typography>
                        </Box>

                        <Button
                            fullWidth
                            variant="text"
                            size="small"
                            onClick={() => setMode("password")}
                            sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: 'white' } }}
                        >
                            Use Master Password
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <form onSubmit={handlePasswordVerify}>
                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, mb: 1, display: 'block' }}>
                                        MASTER PASSWORD
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        placeholder="Enter your master password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '14px',
                                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                                '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                                            },
                                            '& .MuiInputBase-input': { color: 'white' }
                                        }}
                                    />
                                </Box>

                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    disabled={loading || !password}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: '14px',
                                        bgcolor: '#6366F1',
                                        color: '#000',
                                        fontWeight: 700,
                                        '&:hover': {
                                            bgcolor: '#00D1DA',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Confirm Password"}
                                </Button>
                            </Stack>
                        </form>

                        {(hasPasskey || hasPin) && (
                            <Box sx={{ width: '100%', position: 'relative', py: 1 }}>
                                <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                <Typography variant="caption" sx={{
                                    position: 'relative',
                                    bgcolor: 'rgba(10, 10, 10, 1)',
                                    px: 2,
                                    mx: 'auto',
                                    display: 'table',
                                    color: 'rgba(255, 255, 255, 0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>
                                    Or
                                </Typography>
                            </Box>
                        )}

                        {hasPasskey && mode !== "passkey" && (
                            <Button
                                fullWidth
                                variant="text"
                                startIcon={<FingerprintIcon sx={{ fontSize: 18 }} />}
                                onClick={() => {
                                    setMode("passkey");
                                    handlePasskeyVerify();
                                }}
                                sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: 'white' } }}
                            >
                                Use Passkey
                            </Button>
                        )}

                        {hasPin && mode !== "pin" && (
                            <Button
                                fullWidth
                                variant="text"
                                startIcon={<AppsIcon sx={{ fontSize: 18 }} />}
                                onClick={() => setMode("pin")}
                                sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: 'white' } }}
                            >
                                Use PIN
                            </Button>
                        )}

                        <Button
                            fullWidth
                            variant="text"
                            size="small"
                            onClick={() => window.open("https://vault.kylrix.space/masterpass/reset", "_blank")}
                            sx={{ color: 'error.main', '&:hover': { bgcolor: alpha('#ef4444', 0.1) }, mt: 2 }}
                        >
                            Reset Master Password
                        </Button>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
}
