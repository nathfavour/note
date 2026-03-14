"use client";

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    TextField, 
    Typography, 
    Stack, 
    Paper, 
    IconButton, 
    Tooltip,
    Alert,
    alpha,
    useTheme,
    CircularProgress,
    Container,
    Grid,
    Card,
    CardContent,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    Slider,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import { 
    Copy as CopyIcon, 
    Check as CheckIcon,
    History as HistoryIcon,
    Zap,
    ExternalLink,
    Clock,
    Shield,
    Share2,
    Trash2,
    MoreVertical,
    Settings as SettingsIcon,
    X
} from 'lucide-react';
import { AppwriteService } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/ui/AuthContext';
import { Button } from '@/components/ui/Button';
import { buildAutoTitleFromContent } from '@/constants/noteTitle';
import { useToast } from '@/components/ui/Toast';

const GHOST_STORAGE_KEY = 'kylrix_ghost_notes_v2';
const GHOST_SECRET_KEY = 'kylrix_ghost_secret_v2';
const MAX_LIFESPAN_DAYS = 7;
const MAX_LIFESPAN_MS = MAX_LIFESPAN_DAYS * 24 * 60 * 60 * 1000;
const MAX_CONTENT_LENGTH = 65000;

interface GhostNoteRef {
    id: string;
    title: string;
    createdAt: string;
    expiresAt: string;
}

const LIFESPAN_OPTIONS = [
    { label: '10 Minutes', value: 10 * 60 * 1000 },
    { label: '1 Hour', value: 60 * 60 * 1000 },
    { label: '12 Hours', value: 12 * 60 * 60 * 1000 },
    { label: '1 Day', value: 24 * 60 * 60 * 1000 },
    { label: '3 Days', value: 3 * 24 * 60 * 60 * 1000 },
    { label: '7 Days', value: 7 * 24 * 60 * 60 * 1000 },
];

/**
 * A small circular countdown timer for ghost notes.
 * Uses a dotted stroke to represent the time remaining.
 */
const GhostClock = ({ createdAt, expiresAt }: { createdAt: string, expiresAt: string }) => {
    const theme = useTheme();
    const [progress, setProgress] = useState(100);
    const [isExpired, setIsExpired] = useState(false);
    
    useEffect(() => {
        const calculateProgress = () => {
            const created = new Date(createdAt).getTime();
            const expires = new Date(expiresAt).getTime();
            const now = Date.now();
            
            const totalLife = expires - created;
            const remaining = Math.max(0, expires - now);
            
            setIsExpired(remaining <= 0);
            setProgress(totalLife > 0 ? (remaining / totalLife) * 100 : 0);
        };

        calculateProgress();
        const interval = setInterval(calculateProgress, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, [createdAt, expiresAt]);

    const size = 20;
    const strokeWidth = 2;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <Tooltip title={isExpired ? "Expired" : `${Math.round(progress)}% life remaining`}>
            <Box sx={{ position: 'relative', display: 'inline-flex', ml: 1 }}>
                <svg width={size} height={size}>
                    <circle
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        r={radius}
                        cx={center}
                        cy={center}
                    />
                    <circle
                        stroke={isExpired ? theme.palette.error.main : theme.palette.primary.main}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{ 
                            strokeDashoffset: offset,
                            strokeDasharray: '2, 2', // Dotted effect
                            transition: 'stroke-dashoffset 0.5s ease'
                        }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx={center}
                        cy={center}
                        transform={`rotate(-90 ${center} ${center})`}
                    />
                </svg>
            </Box>
        </Tooltip>
    );
};

export const GhostEditor = () => {
    const theme = useTheme();
    const { openIDMWindow } = useAuth();
    const { showSuccess } = useToast();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [prevNotes, setPrevNotes] = useState<GhostNoteRef[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
    
    // Lifespan Settings
    const [lifespanMs, setLifespanMs] = useState(7 * 24 * 60 * 60 * 1000); // Default 7 days
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        noteId: string | null;
    } | null>(null);

    // Load history and secret
    useEffect(() => {
        const loadHistory = () => {
            try {
                // Migration logic from v1 to v2
                const oldHistory = localStorage.getItem('kylrix_ghost_notes');
                
                if (oldHistory) {
                    const oldSecret = localStorage.getItem('kylrix_ghost_secret');
                    const currentHistory = localStorage.getItem(GHOST_STORAGE_KEY);
                    
                    try {
                        const parsedOld = JSON.parse(oldHistory);
                        const parsedCurrent = currentHistory ? JSON.parse(currentHistory) : [];
                        
                        if (Array.isArray(parsedOld)) {
                            const sevenDaysAgo = Date.now() - MAX_LIFESPAN_MS;
                            
                            // Map old notes to v2 schema
                            const migrated = parsedOld
                                .filter((n: any) => new Date(n.createdAt).getTime() > sevenDaysAgo)
                                .map((n: any) => ({
                                    id: n.id,
                                    title: n.title,
                                    createdAt: n.createdAt,
                                    expiresAt: n.expiresAt || new Date(new Date(n.createdAt).getTime() + MAX_LIFESPAN_MS).toISOString()
                                }));
                            
                            // Merge and deduplicate by ID (preserving v2 order where possible)
                            const mergedMap = new Map();
                            [...parsedCurrent, ...migrated].forEach(note => mergedMap.set(note.id, note));
                            const finalHistory = Array.from(mergedMap.values())
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                            localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(finalHistory));
                            
                            // Priority: Keep the old secret if it exists to ensure "Claim" works for old notes
                            if (oldSecret) {
                                localStorage.setItem(GHOST_SECRET_KEY, oldSecret);
                            }
                        }
                    } catch (e) {
                        console.error('Migration failed', e);
                    } finally {
                        // Clean up v1 keys immediately so this block never runs again
                        localStorage.removeItem('kylrix_ghost_notes');
                        localStorage.removeItem('kylrix_ghost_secret');
                    }
                }

                const history = localStorage.getItem(GHOST_STORAGE_KEY);
                if (history) {
                    const parsed = JSON.parse(history);
                    if (Array.isArray(parsed)) {
                        // Filter out notes created > 7 days ago
                        const sevenDaysAgo = Date.now() - MAX_LIFESPAN_MS;
                        const valid = parsed.filter((n: GhostNoteRef) => new Date(n.createdAt).getTime() > sevenDaysAgo);
                        setPrevNotes(valid);
                    }
                }
            } catch (e) {
                console.error('Failed to parse ghost history', e);
            }
        };

        loadHistory();
        
        // Listen for storage changes (Safari/Other tabs)
        window.addEventListener('storage', loadHistory);

        if (!localStorage.getItem(GHOST_SECRET_KEY)) {
            localStorage.setItem(GHOST_SECRET_KEY, crypto.randomUUID());
        }

        return () => window.removeEventListener('storage', loadHistory);
    }, []);

    const saveHistory = (history: GhostNoteRef[]) => {
        try {
            localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(history));
            setPrevNotes(history);
            // Dispatch storage event manually for Safari/same-window consistency
            window.dispatchEvent(new Event('storage'));
        } catch (e) {
            console.error('Failed to save ghost history', e);
        }
    };

    // Seamless auto-title logic
    useEffect(() => {
        if (isTitleManuallyEdited) return;

        const generatedTitle = buildAutoTitleFromContent(content);
        if (content.trim()) {
            if (generatedTitle !== title) {
                setTitle(generatedTitle);
            }
        } else {
            setTitle('');
        }
    }, [content, isTitleManuallyEdited, title]);

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for Safari/Non-secure contexts
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            return false;
        }
    };

    const handleCreateAndCopyLink = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Complete your note first!");
            return;
        }

        setIsCreating(true);
        try {
            const secret = localStorage.getItem(GHOST_SECRET_KEY) || crypto.randomUUID();
            const finalTitle = title.trim();
            const expiresAt = new Date(Date.now() + lifespanMs).toISOString();
            
            const note = await AppwriteService.createGhostNote({
                title: finalTitle,
                content: content.trim(),
                ghostSecret: secret,
                expiresAt: expiresAt
            });

            if (note) {
                const url = `${window.location.origin}/shared/${note.$id}`;
                const copied = await copyToClipboard(url);
                
                if (copied) {
                    setCopiedId(note.$id);
                    showSuccess('Link Copied', 'Live share link copied to clipboard.');
                } else {
                    toast.error("Note created, but failed to copy link. Check your history.");
                }

                // Update history
                const newRef = { 
                    id: note.$id, 
                    title: finalTitle, 
                    createdAt: new Date().toISOString(),
                    expiresAt: expiresAt
                };
                const updatedHistory = [newRef, ...prevNotes].slice(0, 10);
                saveHistory(updatedHistory);

                // Clear editor
                setTitle('');
                setContent('');
                setIsTitleManuallyEdited(false);

                setTimeout(() => setCopiedId(null), 3000);
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Creation failed. System degraded.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyContent = async () => {
        if (!content.trim()) return;
        const copied = await copyToClipboard(content);
        if (copied) {
            setIsLinkCopied(true);
            toast.success("Content copied");
            setTimeout(() => setIsLinkCopied(false), 2000);
        }
    };

    const handleContextMenu = (event: React.MouseEvent, noteId: string) => {
        event.preventDefault();
        setContextMenu(
            contextMenu === null
                ? {
                      mouseX: event.clientX + 2,
                      mouseY: event.clientY - 6,
                      noteId
                  }
                : null,
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleDeleteNote = (noteId: string | null) => {
        if (!noteId) return;
        
        const confirmDelete = window.confirm("Removing this note from your sparks will mean you lose control over it (even though it will still exist for its 7-day lifespan). Proceed?");
        
        if (confirmDelete) {
            const updatedHistory = prevNotes.filter(n => n.id !== noteId);
            saveHistory(updatedHistory);
            toast.success("Spark removed from stash");
        }
        handleCloseContextMenu();
    };

    const handleDeleteAll = () => {
        const confirmDelete = window.confirm("This will clear your entire local stash. You will lose access to manage these notes. Proceed?");
        if (confirmDelete) {
            saveHistory([]);
            toast.success("All sparks cleared");
        }
        handleCloseContextMenu();
    };

    const activeSparks = prevNotes.filter(n => new Date(n.expiresAt).getTime() > Date.now());
    const staleSparks = prevNotes.filter(n => new Date(n.expiresAt).getTime() <= Date.now());
    const hasHistory = prevNotes.length > 0;

    return (
        <Container maxWidth="lg" sx={{ py: 2, position: 'relative' }}>
            {/* Top CTA */}
            <Alert 
                severity="info" 
                icon={<Clock size={20} />}
                sx={{ 
                    mb: 3, 
                    borderRadius: '16px', 
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    color: theme.palette.info.main,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    '& .MuiAlert-message': { width: '100%' }
                }}
            >
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1}>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Ghost Mode active. Notes last up to 7 days.
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                            Login to Edit, Delete, or Secure your sparks permanently.
                        </Typography>
                    </Box>
                    <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openIDMWindow()}
                        sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    >
                        Create Permanent Vault →
                    </Button>
                </Stack>
            </Alert>

            <Grid container spacing={4}>
                {/* Main Editor */}
                <Grid item xs={12} lg={hasHistory ? 8 : 12}>
                    <Paper sx={{ 
                        p: 0, 
                        borderRadius: '32px', 
                        overflow: 'hidden',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        position: 'relative'
                    }}>
                        {/* Action Buttons in Header Area */}
                        <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
                            <Tooltip title="Note Settings" placement="top">
                                <IconButton
                                    onClick={() => setIsSettingsOpen(true)}
                                    sx={{ 
                                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                                        color: 'rgba(255, 255, 255, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'white' }
                                    }}
                                >
                                    <SettingsIcon size={20} />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Copy Content" placement="top">
                                <IconButton
                                    onClick={handleCopyContent}
                                    disabled={!content.trim()}
                                    sx={{ 
                                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                                        color: isLinkCopied ? '#6366F1' : 'rgba(255, 255, 255, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                    }}
                                >
                                    {isLinkCopied ? <CheckIcon size={20} /> : <CopyIcon size={20} />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Copy Link" placement="top">
                                <IconButton
                                    onClick={handleCreateAndCopyLink}
                                    disabled={isCreating || !title.trim() || !content.trim()}
                                    sx={{ 
                                        bgcolor: copiedId ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                        color: copiedId ? '#6366F1' : 'white',
                                        border: '1px solid',
                                        borderColor: copiedId ? '#6366F1' : 'rgba(255, 255, 255, 0.1)',
                                        '&:hover': {
                                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                                            borderColor: '#6366F1'
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isCreating ? <CircularProgress size={20} color="inherit" /> : (copiedId ? <CheckIcon size={20} /> : <Share2 size={20} />)}
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        <Box sx={{ p: 4, pb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Note Title"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setIsTitleManuallyEdited(true);
                                    }}
                                    variant="standard"
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: { 
                                            fontSize: '2rem', 
                                            fontWeight: 900, 
                                            fontFamily: 'var(--font-clash)',
                                            color: 'white',
                                            pr: 18, 
                                            '&::placeholder': { opacity: 0.2 }
                                        }
                                    }}
                                    sx={{ flex: 1 }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: content.length >= MAX_CONTENT_LENGTH ? theme.palette.error.main : 'rgba(255, 255, 255, 0.3)',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-jetbrains-mono)',
                                        mb: 1.5,
                                        ml: 2,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
                                </Typography>
                            </Stack>
                            <TextField
                                fullWidth
                                multiline
                                minRows={12}
                                maxRows={20}
                                placeholder="Start typing your brilliance..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                variant="standard"
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { 
                                        fontSize: '1.1rem', 
                                        lineHeight: 1.6,
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontFamily: 'var(--font-satoshi)',
                                        '&::placeholder': { opacity: 0.1 }
                                    }
                                }}
                                inputProps={{
                                    maxLength: MAX_CONTENT_LENGTH
                                }}
                            />
                        </Box>

                        <Box sx={{ 
                            p: 3, 
                            bgcolor: 'rgba(255, 255, 255, 0.03)', 
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ display: 'flex', color: 'rgba(255, 255, 255, 0.3)' }}>
                                    <Shield size={16} />
                                    <Typography variant="caption" sx={{ ml: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Public & Anonymous
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', color: 'primary.main', alignItems: 'center' }}>
                                    <Clock size={16} />
                                    <Typography variant="caption" sx={{ ml: 1, fontWeight: 800 }}>
                                        Expires in {LIFESPAN_OPTIONS.find(o => o.value === lifespanMs)?.label || 'Custom'}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.4, fontWeight: 700 }}>
                                    ONCE SHARED, THIS NOTE IS LOCKED.
                                </Typography>
                                <Button
                                    onClick={handleCreateAndCopyLink}
                                    disabled={isCreating || !title.trim() || !content.trim()}
                                    sx={{ 
                                        borderRadius: '100px',
                                        px: 4,
                                        py: 1.5,
                                        fontWeight: 900,
                                        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                        color: 'white',
                                        boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 15px 40px rgba(99, 102, 241, 0.5)',
                                        }
                                    }}
                                >
                                    {isCreating ? (
                                        <CircularProgress size={20} color="inherit" />
                                    ) : (
                                        <>
                                            {copiedId ? <CheckIcon size={18} /> : <Share2 size={18} />}
                                            <Box component="span" sx={{ ml: 1 }}>{copiedId ? 'LINK COPIED' : 'COPY LINK'}</Box>
                                        </>
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Bottom CTA */}
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', display: 'block', mb: 2, fontWeight: 700, letterSpacing: '0.1em' }}>
                            WANT TO KEEP YOUR NOTES FOREVER?
                        </Typography>
                        <Button 
                            variant="outline"
                            onClick={() => openIDMWindow()}
                            sx={{ 
                                borderRadius: '100px', 
                                px: 6,
                                py: 2,
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#6366F1',
                                fontWeight: 900,
                                '&:hover': {
                                    bgcolor: 'rgba(99, 102, 241, 0.05)',
                                    borderColor: '#6366F1'
                                }
                            }}
                        >
                            <Zap size={18} style={{ marginRight: 8 }} />
                            UPGRADE TO SOVEREIGN ACCOUNT
                        </Button>
                    </Box>
                </Grid>

                {/* Sidebar History */}
                {hasHistory && (
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ 
                            p: 3, 
                            borderRadius: '32px', 
                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            height: 'fit-content'
                        }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3, justifyContent: 'space-between' }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <HistoryIcon size={20} color={theme.palette.primary.main} />
                                    <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)' }}>
                                        Your Sparks
                                    </Typography>
                                </Stack>
                                <Tooltip title="Clear Stash">
                                    <IconButton size="small" onClick={handleDeleteAll} sx={{ color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#FF453A' } }}>
                                        <Trash2 size={16} />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            <Stack spacing={3}>
                                {activeSparks.length > 0 && (
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', mb: 1.5, display: 'block', letterSpacing: '0.1em' }}>
                                            ACTIVE
                                        </Typography>
                                        <Stack spacing={1.5}>
                                            {activeSparks.map((note) => (
                                                <Card 
                                                    key={note.id} 
                                                    onContextMenu={(e) => handleContextMenu(e, note.id)}
                                                    sx={{ 
                                                        bgcolor: 'rgba(255, 255, 255, 0.03)', 
                                                        borderRadius: '20px',
                                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                                        transition: 'all 0.2s',
                                                        position: 'relative',
                                                        '&:hover': {
                                                            transform: 'translateX(4px)',
                                                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                                                            borderColor: 'rgba(99, 102, 241, 0.2)'
                                                        }
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, mb: 0.5, flex: 1, pr: 1 }}>
                                                                {note.title}
                                                            </Typography>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <GhostClock createdAt={note.createdAt} expiresAt={note.expiresAt} />
                                                                <IconButton size="small" onClick={(e) => handleContextMenu(e, note.id)} sx={{ color: 'rgba(255,255,255,0.2)' }}>
                                                                    <MoreVertical size={14} />
                                                                </IconButton>
                                                            </Stack>
                                                        </Stack>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" sx={{ opacity: 0.4 }}>
                                                                Created {new Date(note.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => window.open(`/shared/${note.id}`, '_blank')}
                                                                sx={{ color: 'primary.main' }}
                                                            >
                                                                <ExternalLink size={14} />
                                                            </IconButton>
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {staleSparks.length > 0 && (
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'error.main', mb: 1.5, display: 'block', letterSpacing: '0.1em' }}>
                                            STALE (EXPIRED)
                                        </Typography>
                                        <Stack spacing={1.5}>
                                            {staleSparks.map((note) => (
                                                <Card 
                                                    key={note.id} 
                                                    onContextMenu={(e) => handleContextMenu(e, note.id)}
                                                    sx={{ 
                                                        bgcolor: 'rgba(255, 255, 255, 0.01)', 
                                                        borderRadius: '20px',
                                                        border: '1px solid rgba(255, 255, 255, 0.03)',
                                                        transition: 'all 0.2s',
                                                        opacity: 0.6,
                                                        '&:hover': {
                                                            opacity: 1,
                                                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                                                        }
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, mb: 0.5, flex: 1, pr: 1 }}>
                                                                {note.title}
                                                            </Typography>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <GhostClock createdAt={note.createdAt} expiresAt={note.expiresAt} />
                                                                <IconButton size="small" onClick={(e) => handleContextMenu(e, note.id)} sx={{ color: 'rgba(255,255,255,0.2)' }}>
                                                                    <MoreVertical size={14} />
                                                                </IconButton>
                                                            </Stack>
                                                        </Stack>
                                                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'error.main', fontWeight: 700 }}>
                                                            Link expired. Recoverable for 7 days.
                                                        </Typography>
                                                        <Button 
                                                            fullWidth
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openIDMWindow()}
                                                            sx={{ fontSize: '0.7rem', fontWeight: 900, height: 'auto', py: 0.5 }}
                                                        >
                                                            CLAIM TO RESTORE
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Stack>

                            {/* Context Menu for Sparks */}
                            <Menu
                                open={contextMenu !== null}
                                onClose={handleCloseContextMenu}
                                anchorReference="anchorPosition"
                                anchorPosition={
                                    contextMenu !== null
                                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                                        : undefined
                                }
                                slotProps={{
                                    paper: {
                                        sx: {
                                            minWidth: 180,
                                            bgcolor: 'rgba(10, 10, 10, 0.95)',
                                            backdropFilter: 'blur(25px) saturate(180%)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            backgroundImage: 'none',
                                            py: 0.5,
                                            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                                        }
                                    }
                                }}
                            >
                                <MenuItem 
                                    onClick={() => handleDeleteNote(contextMenu?.noteId || null)}
                                    sx={{ 
                                        px: 2, 
                                        py: 1, 
                                        gap: 1.5,
                                        color: '#FF453A',
                                        '&:hover': { bgcolor: 'rgba(255, 69, 58, 0.1)' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', color: 'inherit' }}>
                                        <Trash2 size={16} />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Remove from Stash" 
                                        slotProps={{ primary: { sx: { fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-satoshi)' } } }}
                                    />
                                </MenuItem>
                            </Menu>

                            {/* Chronic User CTA */}
                            <Box sx={{ mt: 4, p: 3, borderRadius: '24px', bgcolor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#6366F1' }}>
                                    Don&apos;t Lose Your Spark!
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 2, opacity: 0.8 }}>
                                    Sparks vanish from stash 7 days after creation. Claim them now to secure them.
                                </Typography>
                                <Button 
                                    fullWidth
                                    size="sm"
                                    onClick={() => openIDMWindow()}
                                    sx={{ 
                                        bgcolor: '#6366F1', 
                                        color: 'white', 
                                        fontWeight: 900,
                                        '&:hover': { bgcolor: '#4F46E5' }
                                    }}
                                >
                                    CLAIM NOTES NOW
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Lifespan Settings Modal */}
            <Dialog 
                open={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(10, 10, 10, 0.95)',
                        backdropFilter: 'blur(25px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        backgroundImage: 'none',
                        maxWidth: '400px',
                        width: '100%'
                    }
                }}
            >
                <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)', color: 'white' }}>
                        Spark Settings
                    </Typography>
                    <IconButton onClick={() => setIsSettingsOpen(false)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        <X size={20} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3, pt: 0 }}>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <FormLabel sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, mb: 2, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Lifespan Duration
                        </FormLabel>
                        <RadioGroup
                            value={lifespanMs}
                            onChange={(e) => setLifespanMs(Number(e.target.value))}
                        >
                            <Grid container spacing={1}>
                                {LIFESPAN_OPTIONS.map((option) => (
                                    <Grid item xs={6} key={option.value}>
                                        <FormControlLabel
                                            value={option.value}
                                            control={<Radio sx={{ color: 'rgba(255,255,255,0.1)', '&.Mui-checked': { color: '#6366F1' } }} />}
                                            label={
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: lifespanMs === option.value ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                                    {option.label}
                                                </Typography>
                                            }
                                            sx={{
                                                m: 0,
                                                width: '100%',
                                                p: 1,
                                                borderRadius: '12px',
                                                bgcolor: lifespanMs === option.value ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                border: '1px solid',
                                                borderColor: lifespanMs === option.value ? '#6366F1' : 'rgba(255,255,255,0.05)',
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: alpha('#6366F1', 0.05) }
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </RadioGroup>
                    </FormControl>
                    
                    <Box sx={{ mt: 4, p: 2, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Shield size={16} color={theme.palette.info.main} style={{ marginTop: 2 }} />
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                                Notes expire after the selected time, becoming inaccessible via their share link. However, you can still claim them from your sparks stash for up to 7 days from creation.
                            </Typography>
                        </Stack>
                    </Box>

                    <Button
                        fullWidth
                        onClick={() => setIsSettingsOpen(false)}
                        sx={{ 
                            mt: 4, 
                            borderRadius: '100px', 
                            py: 1.5, 
                            bgcolor: '#6366F1', 
                            color: 'white', 
                            fontWeight: 900,
                            '&:hover': { bgcolor: '#4F46E5' }
                        }}
                    >
                        APPLY SETTINGS
                    </Button>
                </DialogContent>
            </Dialog>
        </Container>
    );
};