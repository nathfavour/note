"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
    CardContent
} from '@mui/material';
import { 
    Copy as CopyIcon, 
    Check as CheckIcon,
    History as HistoryIcon,
    Zap,
    ExternalLink,
    Clock,
    Shield,
    Share2
} from 'lucide-react';
import { AppwriteService } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/ui/AuthContext';
import { Button } from '@/components/ui/Button';
import { buildAutoTitleFromContent } from '@/constants/noteTitle';
import { useToast } from '@/components/ui/Toast';

const GHOST_STORAGE_KEY = 'kylrix_ghost_notes_v2';
const GHOST_SECRET_KEY = 'kylrix_ghost_secret_v2';

interface GhostNoteRef {
    id: string;
    title: string;
    createdAt: string;
}

export const GhostEditor = () => {
    const theme = useTheme();
    const { openIDMWindow } = useAuth();
    const { showSuccess } = useToast();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [prevNotes, setPrevNotes] = useState<GhostNoteRef[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isContentCopied, setIsContentCopied] = useState(false);

    // Load history and secret
    useEffect(() => {
        const history = localStorage.getItem(GHOST_STORAGE_KEY);
        if (history) {
            try {
                setPrevNotes(JSON.parse(history));
            } catch (e) {
                console.error('Failed to parse ghost history', e);
            }
        }

        if (!localStorage.getItem(GHOST_SECRET_KEY)) {
            localStorage.setItem(GHOST_SECRET_KEY, crypto.randomUUID());
        }
    }, []);

    const handleCreateAndCopyLink = async () => {
        if (!content.trim()) {
            toast.error("Type something first!");
            return;
        }

        setIsCreating(true);
        try {
            const secret = localStorage.getItem(GHOST_SECRET_KEY) || crypto.randomUUID();
            
            // Auto-title logic
            let finalTitle = title.trim();
            if (!finalTitle) {
                finalTitle = buildAutoTitleFromContent(content.trim());
            }
            
            const note = await AppwriteService.createGhostNote({
                title: finalTitle,
                content: content.trim(),
                ghostSecret: secret
            });

            if (note) {
                const url = `${window.location.origin}/shared/${note.$id}`;
                await navigator.clipboard.writeText(url);
                
                setCopiedId(note.$id);
                showSuccess('Ghost Spark Shared', 'Live share link copied to your clipboard. It expires in 24 hours.');

                // Update history
                const newRef = { id: note.$id, title: finalTitle, createdAt: new Date().toISOString() };
                const updatedHistory = [newRef, ...prevNotes].slice(0, 10);
                setPrevNotes(updatedHistory);
                localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(updatedHistory));

                // Clear editor
                setTitle('');
                setContent('');

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
        await navigator.clipboard.writeText(content);
        setIsContentCopied(true);
        toast.success("Content copied");
        setTimeout(() => setIsContentCopied(false), 2000);
    };

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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Ghost Mode active. These notes expire in 24 hours.
                    </Typography>
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
                            <Tooltip title="Copy Content" placement="top">
                                <IconButton
                                    onClick={handleCopyContent}
                                    disabled={!content.trim()}
                                    sx={{ 
                                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                                        color: isContentCopied ? '#6366F1' : 'rgba(255, 255, 255, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                                    }}
                                >
                                    {isContentCopied ? <CheckIcon size={20} /> : <CopyIcon size={20} />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Create & Share Live Link" placement="top">
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
                            <TextField
                                fullWidth
                                placeholder="Note Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                variant="standard"
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { 
                                        fontSize: '2rem', 
                                        fontWeight: 900, 
                                        fontFamily: 'var(--font-clash)',
                                        color: 'white',
                                        pr: 12, // Avoid overlapping with buttons
                                        '&::placeholder': { opacity: 0.2 }
                                    }
                                }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                multiline
                                minRows={12}
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
                            </Stack>

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
                                        <Box component="span" sx={{ ml: 1 }}>SHARE LIVE LINK</Box>
                                    </>
                                )}
                            </Button>
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
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                                <HistoryIcon size={20} color={theme.palette.primary.main} />
                                <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)' }}>
                                    Your Recent Sparks
                                </Typography>
                            </Stack>

                            <Stack spacing={2}>
                                {prevNotes.map((note) => (
                                    <Card key={note.id} sx={{ 
                                        bgcolor: 'rgba(255, 255, 255, 0.03)', 
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateX(4px)',
                                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                                            borderColor: 'rgba(99, 102, 241, 0.2)'
                                        }
                                    }}>
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, mb: 0.5 }}>
                                                {note.title}
                                            </Typography>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="caption" sx={{ opacity: 0.4 }}>
                                                    {new Date(note.createdAt).toLocaleDateString()}
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

                            {/* Chronic User CTA */}
                            <Box sx={{ mt: 4, p: 3, borderRadius: '24px', bgcolor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#6366F1' }}>
                                    You're a frequent writer!
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 2, opacity: 0.8 }}>
                                    Don't let your genius expire. Secure these notes permanently in the Kylrix Mesh.
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
        </Container>
    );
};