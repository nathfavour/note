'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { formatNoteCreatedDate, formatNoteUpdatedDate } from '@/lib/date-utils';
import type { Notes } from '@/types/appwrite';
import { 
  AccessTime as ClockIcon, 
  Visibility as EyeIcon, 
  LocalOffer as TagIcon, 
  ArrowForward as ArrowRightIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  LibraryAdd as DuplicateIcon
} from '@mui/icons-material';
import { 
  LayoutGrid, 
  LogOut, 
  Settings 
} from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';
import { NoteContentRenderer } from '@/components/NoteContentRenderer';
import { createNote, listNotes } from '@/lib/appwrite';
import { useToast } from '@/components/ui/Toast';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  CircularProgress,
  AppBar,
  Toolbar,
  Stack,
  Tooltip,
  ListItemIcon,
  ListItemText,
  alpha
} from '@mui/material';
import Link from 'next/link';
import CommentsSection from '@/app/(app)/notes/Comments';
import NoteReactions from '@/app/(app)/notes/NoteReactions';

import Logo from '@/components/common/Logo';
import { getEcosystemUrl } from '@/constants/ecosystem';
import { getEffectiveDisplayName, getUserProfilePicId } from '@/lib/utils';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { EcosystemPortal } from '@/components/common/EcosystemPortal';

interface SharedNoteClientProps {
   noteId: string;
}

function SharedNoteHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);
  const [smallProfileUrl, setSmallProfileUrl] = useState<string | null>(null);
  const profilePicId = getUserProfilePicId(user);

  useEffect(() => {
    let mounted = true;
    const cached = getCachedProfilePreview(profilePicId || undefined);
    if (cached !== undefined) {
      setSmallProfileUrl(cached ?? null);
    }

    const fetchPreview = async () => {
      try {
        if (profilePicId) {
          const url = await fetchProfilePreview(profilePicId, 64, 64);
          if (mounted) setSmallProfileUrl(url as unknown as string);
        } else {
          if (mounted) setSmallProfileUrl(null);
        }
      } catch (_err) {
        if (mounted) setSmallProfileUrl(null);
      }
    };
    fetchPreview();
    return () => { mounted = false; };
  }, [profilePicId]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        zIndex: 1201,
        bgcolor: '#161412',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundImage: 'none'
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        px: { xs: 2, md: 4 }, 
        minHeight: '88px' 
      }}>
        <Logo 
          app="note" 
          size={40} 
          variant="full"
          sx={{ 
            cursor: 'pointer', 
            '&:hover': { opacity: 0.8 },
            fontFamily: 'var(--font-clash)',
            fontWeight: 900,
            letterSpacing: '-0.04em'
          }}
          component={Link}
          href="/"
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Kylrix Portal">
            <IconButton 
              onClick={() => setIsEcosystemPortalOpen(true)}
              sx={{ 
                color: '#6366F1',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                width: 44,
                height: 44,
                '&:hover': { 
                  bgcolor: 'rgba(255, 255, 255, 0.05)', 
                  borderColor: '#6366F1',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)' 
                }
              }}
            >
              <LayoutGrid size={22} />
            </IconButton>
          </Tooltip>

          {isAuthenticated ? (
            <>
              <IconButton 
                onClick={handleOpenMenu}
                sx={{ 
                  p: 0.5,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  '&:hover': { borderColor: 'rgba(99, 102, 241, 0.3)', bgcolor: 'rgba(255, 255, 255, 0.05)' },
                  transition: 'all 0.2s'
                }}
              >
                <Avatar 
                  src={smallProfileUrl || undefined}
                  sx={{ 
                    width: 34, 
                    height: 34, 
                    bgcolor: '#050505',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    color: '#6366F1',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                  sx: {
                    mt: 2,
                    width: 280,
                    bgcolor: '#161412',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '28px',
                    backgroundImage: 'none',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
                    p: 1,
                    color: 'white'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2.5, py: 2.5, bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: '20px', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-mono)' }}>
                    Identity
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'white', mt: 1, fontFamily: 'var(--font-satoshi)' }}>
                    {user?.name || user?.email}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />
                <Box sx={{ py: 0.5 }}>
                  <MenuItem component={Link} href="/notes" onClick={handleCloseMenu} sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><LayoutGrid size={18} color="rgba(255, 255, 255, 0.6)" /></ListItemIcon>
                    <ListItemText primary="My Dashboard" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontFamily: 'var(--font-satoshi)' }} />
                  </MenuItem>
                  <MenuItem component={Link} href="/settings" onClick={handleCloseMenu} sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><Settings size={18} color="rgba(255, 255, 255, 0.6)" /></ListItemIcon>
                    <ListItemText primary="Settings" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontFamily: 'var(--font-satoshi)' }} />
                  </MenuItem>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />
                <MenuItem onClick={handleLogout} sx={{ py: 2, px: 2.5, borderRadius: '16px', color: '#FF4D4D', '&:hover': { bgcolor: alpha('#FF4D4D', 0.05) } }}>
                  <ListItemIcon sx={{ minWidth: 40 }}><LogOut size={18} color="#FF4D4D" /></ListItemIcon>
                  <ListItemText primary="Disconnect Session" primaryTypographyProps={{ variant: 'body2', fontWeight: 800, fontFamily: 'var(--font-satoshi)' }} />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              href={`${getEcosystemUrl('accounts')}/login?source=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
              variant="contained"
              size="large"
              sx={{
                ml: 1,
                background: 'linear-gradient(135deg, #6366F1 0%, #00D1DA 100%)',
                color: '#000',
                fontWeight: 800,
                fontFamily: 'var(--font-satoshi)',
                borderRadius: '14px',
                textTransform: 'none',
                px: 4,
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.15)',
                '&:hover': { background: 'linear-gradient(135deg, #00E5FF 0%, #00C1CA 100%)', transform: 'translateY(-1px)' }
              }}
            >
              Connect
            </Button>
          )}
        </Box>
      </Toolbar>
      <EcosystemPortal 
        open={isEcosystemPortalOpen} 
        onClose={() => setIsEcosystemPortalOpen(false)} 
      />
    </AppBar>
  );
}

export default function SharedNoteClient({ noteId }: SharedNoteClientProps) {
  const [verifiedNote, setVerifiedNote] = useState<Notes | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingNote, setIsLoadingNote] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [alreadyDuplicated, setAlreadyDuplicated] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCopied, setIsCopied] = React.useState(false);
  const { showSuccess, showError } = useToast();

  const fetchSharedNote = useCallback(async () => {
    setIsLoadingNote(true);
    setError(null);
    try {
      const res = await fetch(`/api/shared/${noteId}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load shared note');
      }
      const note = await res.json();
      
      if (note.metadata) {
        try {
          const meta = JSON.parse(note.metadata);
          if (meta.isGhost && meta.expiresAt) {
            const expiryDate = new Date(meta.expiresAt);
            if (expiryDate < new Date()) {
              throw new Error('This temporary note has expired after 7 days and is no longer available.');
            }
          }
        } catch (e: any) {
          if (e.message.includes('expired')) throw e;
        }
      }

      setVerifiedNote(note);

      if (note.userId) {
        try {
          const profileRes = await fetch('/api/shared/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: [note.userId] }),
          });
          if (profileRes.ok) {
            const profilesPayload = await profileRes.json();
            const author = profilesPayload.documents?.[0];
            if (author) {
              setAuthorProfile(author);
            }
          }
        } catch (profileErr) {
          console.warn('Failed to resolve author profile:', profileErr);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'An error occurred';
      setError(message);
    } finally {
      setIsLoadingNote(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchSharedNote();
  }, [fetchSharedNote]);

  // Check if note is already duplicated in user collection
  useEffect(() => {
    if (!isAuthenticated || !verifiedNote || !user) return;

    const checkDuplicate = async () => {
      try {
        // Since metadata is encrypted, we fetch recent notes and check in memory
        const res = await listNotes([], 100);
        const duplicated = res.documents.some(n => {
          try {
            const meta = JSON.parse(n.metadata || '{}');
            return meta.originId === verifiedNote.$id;
          } catch (e) { return false; }
        });
        setAlreadyDuplicated(duplicated);
      } catch (e) {
        console.warn('Failed to check for existing duplication', e);
      }
    };
    checkDuplicate();
  }, [isAuthenticated, verifiedNote, user]);

  if (!verifiedNote) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Box sx={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, fontFamily: 'var(--font-clash)', color: 'white' }}>
            Loading shared note
          </Typography>
          {error ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 3 }}>{error}</Typography>
              <Button
                variant="contained"
                onClick={fetchSharedNote}
                sx={{ 
                  borderRadius: '12px',
                  bgcolor: '#6366F1',
                  color: '#000',
                  fontWeight: 700,
                  '&:hover': { bgcolor: alpha('#6366F1', 0.8) }
                }}
              >
                Retry loading note
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 3 }}>Fetching the shared note. Please wait.</Typography>
          )}
          {isLoadingNote && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress size={32} sx={{ color: '#6366F1' }} />
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  const handleCopyContent = () => {
    navigator.clipboard.writeText(verifiedNote?.content || '');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDuplicate = async () => {
    if (!verifiedNote || isDuplicating) return;
    
    setIsDuplicating(true);
    try {
      // Prepare duplicate data
      let metadata: any = {};
      if (verifiedNote.metadata) {
        try {
          metadata = JSON.parse(verifiedNote.metadata);
          // Strip ghost metadata
          delete metadata.isGhost;
          delete metadata.expiresAt;
          delete metadata.guestId;
        } catch (e) {}
      }
      
      // Store origin ID to prevent re-duplication and track provenance
      metadata.originId = verifiedNote.$id;

      const newNote = await createNote({
        title: `${verifiedNote.title} (Duplicate)`,
        content: verifiedNote.content,
        format: verifiedNote.format,
        tags: verifiedNote.tags,
        isPublic: true, // Public by default
        metadata: JSON.stringify(metadata)
      });

      if (newNote) {
        showSuccess('Note Duplicated', 'This note has been added to your collection.');
        setAlreadyDuplicated(true);
      }
    } catch (err: any) {
      showError('Duplication Failed', err.message || 'Failed to duplicate note.');
    } finally {
      setIsDuplicating(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#6366F1' }} />
      </Box>
    );
  }

  const NoteContent = () => (
    <Paper 
      elevation={0}
      sx={{ 
        borderRadius: '32px', 
        border: '1px solid rgba(255, 255, 255, 0.05)',
        bgcolor: '#161412',
        overflow: 'hidden',
        color: 'white',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.5)'
      }}
    >
      <Box sx={{ p: { xs: 4, md: 6 }, borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 900, 
                fontFamily: 'var(--font-clash)', 
                lineHeight: 1.1,
                background: 'linear-gradient(to bottom, #FFF 0%, rgba(255,255,255,0.7) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {verifiedNote.title || 'Untitled Note'}
            </Typography>

            {/* Duplicate Button Logic */}
            {(!user || user.$id !== verifiedNote.userId) && (
              <Box>
                {isAuthenticated ? (
                  alreadyDuplicated ? (
                    <Chip 
                      icon={<CheckIcon sx={{ color: '#10B981 !important' }} />} 
                      label="Note Duplicated" 
                      sx={{ 
                        borderRadius: '12px', 
                        bgcolor: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10B981',
                        fontWeight: 800,
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        height: 44,
                        px: 1
                      }} 
                    />
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleDuplicate}
                      disabled={isDuplicating}
                      startIcon={isDuplicating ? <CircularProgress size={16} color="inherit" /> : <DuplicateIcon />}
                      sx={{
                        borderRadius: '14px',
                        bgcolor: '#6366F1',
                        color: '#000',
                        fontWeight: 800,
                        textTransform: 'none',
                        px: 3,
                        height: 44,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 8px 20px rgba(99, 102, 241, 0.15)',
                        '&:hover': { bgcolor: alpha('#6366F1', 0.8) }
                      }}
                    >
                      {isDuplicating ? 'Duplicating...' : 'Duplicate to My Collection'}
                    </Button>
                  )
                ) : (
                  <Tooltip title="Login to duplicate note into your collection">
                    <Button
                      component={Link}
                      href={`${getEcosystemUrl('accounts')}/login?source=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin + window.location.pathname) : ''}`}
                      variant="outlined"
                      startIcon={<DuplicateIcon />}
                      sx={{
                        borderRadius: '14px',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 3,
                        height: 44,
                        whiteSpace: 'nowrap',
                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.03)' }
                      }}
                    >
                      Login to Duplicate
                    </Button>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255, 255, 255, 0.4)' }}>
              <ClockIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'var(--font-satoshi)' }}>
                Created {formatNoteCreatedDate(verifiedNote, { month: 'long', day: 'numeric', year: 'numeric' })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255, 255, 255, 0.4)' }}>
              <EyeIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'var(--font-satoshi)' }}>Public Note</Typography>
            </Box>
            {authorProfile && (
              <Link 
                href={authorProfile.username ? `${getEcosystemUrl('connect')}/u/${authorProfile.username}` : '#'} 
                target="_blank"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  textDecoration: 'none',
                  bgcolor: '#1C1A18',
                  py: 0.5,
                  px: 1.5,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    bgcolor: '#252220',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Avatar 
                  src={authorProfile.avatar} 
                  sx={{ width: 20, height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: '#6366F1', color: '#000' }}
                >
                  {getEffectiveDisplayName(authorProfile)[0].toUpperCase()}
                </Avatar>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#6366F1', fontFamily: 'var(--font-satoshi)' }}>
                  {authorProfile.username ? `@${authorProfile.username}` : getEffectiveDisplayName(authorProfile)}
                </Typography>
              </Link>
            )}
          </Box>

          {verifiedNote.tags && verifiedNote.tags.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <TagIcon sx={{ fontSize: 16, color: 'rgba(99, 102, 241, 0.3)' }} />
              {verifiedNote.tags.map((tag: string, i: number) => (
                <Chip 
                  key={i} 
                  label={tag} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(99, 102, 241, 0.05)', 
                    color: '#6366F1',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-satoshi)',
                    border: '1px solid rgba(99, 102, 241, 0.1)'
                  }} 
                />
              ))}
            </Box>
          )}
        </Stack>
      </Box>

      <Box sx={{ position: 'relative', p: { xs: 4, md: 6 }, bgcolor: 'rgba(0, 0, 0, 0.1)' }}>
        <IconButton
          onClick={handleCopyContent}
          sx={{
            position: 'absolute',
            top: 24,
            right: 24,
            bgcolor: isCopied ? alpha('#6366F1', 0.1) : '#1C1A18',
            border: '1px solid',
            borderColor: isCopied ? '#6366F1' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            color: isCopied ? '#6366F1' : 'rgba(255, 255, 255, 0.4)',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: '#252220', color: 'white' }
          }}
          title={isCopied ? 'Copied!' : 'Copy content'}
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </IconButton>
        <NoteContentRenderer
          content={verifiedNote.content || ''}
          format={(verifiedNote.format as 'text' | 'doodle') || 'text'}
          emptyFallback={<Typography sx={{ color: 'rgba(255, 255, 255, 0.2)', fontStyle: 'italic', fontFamily: 'var(--font-satoshi)' }}>This note is empty.</Typography>}
        />
      </Box>

      <Box sx={{ p: 3, bgcolor: '#161412', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700 }}>
            UPDATED {formatNoteUpdatedDate(verifiedNote, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6366F1', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-clash)' }}>
            Shared via Kylrix Note
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  if (isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', color: 'white' }}>
        <SharedNoteHeader />
        <Container maxWidth="md" sx={{ py: 8, pt: 12 }}>
          <NoteContent />
          
          <Box sx={{ mt: 4 }}>
            <NoteReactions targetId={noteId} />
          </Box>

          <Box sx={{ mt: 4 }}>
            <CommentsSection noteId={noteId} />
          </Box>

          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Paper
              sx={{
                p: 6,
                borderRadius: '32px',
                bgcolor: '#161412',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, fontFamily: 'var(--font-clash)', color: 'white' }}>
                View Your Notes
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4, maxWidth: 500, mx: 'auto' }}>
                Check out all your notes and continue organizing your thoughts.
              </Typography>
              <Button
                component={Link}
                href="/notes"
                variant="contained"
                size="large"
                endIcon={<ArrowRightIcon />}
                sx={{ 
                  borderRadius: '16px', 
                  px: 4, 
                  py: 1.5,
                  bgcolor: '#6366F1',
                  color: '#000',
                  fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
                  '&:hover': { bgcolor: alpha('#6366F1', 0.8) }
                }}
              >
                Go to Your Notes
              </Button>
            </Paper>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', color: 'white' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          bgcolor: '#161412',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.02)',
          backgroundImage: 'none'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 'lg', mx: 'auto', width: '100%', minHeight: '88px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Logo 
              app="note" 
              size={40} 
              variant="full"
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { opacity: 0.8 },
                fontFamily: 'var(--font-clash)',
                fontWeight: 900,
                letterSpacing: '-0.04em'
              }}
              component={Link}
              href="/"
            />
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
            <Button component={Link} href="/" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700, textTransform: 'none' }}>Home</Button>
            <Button 
              component={Link} 
              href="/" 
              variant="contained" 
              sx={{ 
                borderRadius: '12px', 
                fontWeight: 800, 
                bgcolor: '#6366F1', 
                color: '#000',
                textTransform: 'none',
                '&:hover': { bgcolor: alpha('#6366F1', 0.8) }
              }}
            >
              Join Now
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ pt: 12, pb: 4, bgcolor: alpha('#6366F1', 0.02), borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.5), fontWeight: 600, fontFamily: 'var(--font-satoshi)' }}>
              Organize unlimited notes, AI insights & secure sharing.
            </Typography>
            <Button 
              component={Link} 
              href="/" 
              endIcon={<ArrowRightIcon />}
              sx={{ fontWeight: 800, color: '#6366F1', textTransform: 'none' }}
            >
              Get Started Free
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <NoteContent />

        <Box sx={{ mt: 4 }}>
          <NoteReactions targetId={noteId} />
        </Box>

        <Box sx={{ mt: 4 }}>
          <CommentsSection noteId={noteId} />
        </Box>

          <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Paper
            sx={{
              p: 6,
              borderRadius: '32px',
              bgcolor: '#161412',
              border: '1px solid rgba(99, 102, 241, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, fontFamily: 'var(--font-clash)', color: 'white' }}>
              Create Your Own Notes
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4, maxWidth: 500, mx: 'auto' }}>
              Join thousands of users who trust Kylrix Note to capture, organize, and share their thoughts.
            </Typography>
            <Button
              component={Link}
              href="/"
              variant="contained"
              size="large"
              endIcon={<ArrowRightIcon />}
              sx={{ 
                borderRadius: '16px', 
                px: 4, 
                py: 1.5,
                bgcolor: '#6366F1',
                color: '#000',
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
                '&:hover': { bgcolor: alpha('#6366F1', 0.8) }
              }}
            >
              Start Writing for Free
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
