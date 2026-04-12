'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { formatNoteCreatedDate, formatNoteUpdatedDate } from '@/lib/date-utils';
import type { Notes } from '@/types/appwrite';
import { 
  AccessTime as ClockIcon, 
  Visibility as EyeIcon, 
  LocalOffer as TagIcon, 
  ArrowForward as ArrowRightIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  LibraryAdd as DuplicateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { 
  LayoutGrid, 
  LogOut, 
  Settings 
} from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';
import { NoteContentRenderer } from '@/components/NoteContentRenderer';
import { 
  createNote, 
  listNotes,
  realtime,
  APPWRITE_DATABASE_ID,
  APPWRITE_TABLE_ID_NOTES,
  isNoteEditableByAnyone
} from '@/lib/appwrite';
import { useToast } from '@/components/ui/Toast';
import {
  Box,
  Chip,
  Typography,
  Button,
  Container,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  AppBar,
  Toolbar,
  Stack,
  Tooltip,
  ListItemIcon,
  ListItemText,
  alpha,
  Link as MuiLink,
  keyframes
} from '@mui/material';
import NextLink from 'next/link';
import CommentsSection from '@/app/(app)/notes/Comments';
import NoteReactions from '@/app/(app)/notes/NoteReactions';

import Logo from '@/components/common/Logo';
import { getEcosystemUrl } from '@/constants/ecosystem';
import { getEffectiveDisplayName, getUserProfilePicId } from '@/lib/utils';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { EcosystemPortal } from '@/components/common/EcosystemPortal';
import { useDataNexus } from '@/context/DataNexusContext';
import { ecosystemSecurity } from '@/lib/ecosystem/security';
import { decryptGhostData } from '@/lib/encryption/ghost-crypto';
import { useParams } from 'next/navigation';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

interface SharedNoteClientProps {
   noteId: string;
   initialKey?: string;
}

function decodeUrlSafeBase64ToBuffer(key: string): Uint8Array {
  const normalized = key.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(Buffer.from(padded, 'base64'));
}

interface SharedNoteHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function SharedNoteHeader({ onRefresh, isRefreshing }: SharedNoteHeaderProps) {
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
          component={NextLink}
          href="/"
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {onRefresh && (
            <Tooltip title="Refresh Note">
              <IconButton 
                onClick={onRefresh}
                disabled={isRefreshing}
                sx={{ 
                  color: isRefreshing ? '#EC4899' : 'rgba(255, 255, 255, 0.4)',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: isRefreshing ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  width: 44,
                  height: 44,
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.05)', 
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  },
                  '& svg': {
                    animation: isRefreshing ? `${spin} 1s linear infinite` : 'none',
                  }
                }}
              >
                <RefreshIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}

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
                  <MenuItem component={NextLink} href="/notes" onClick={handleCloseMenu} sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><LayoutGrid size={18} color="rgba(255, 255, 255, 0.6)" /></ListItemIcon>
                    <ListItemText primary="My Dashboard" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontFamily: 'var(--font-satoshi)' }} />
                  </MenuItem>
                  <MenuItem component={NextLink} href="/settings" onClick={handleCloseMenu} sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}>
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

export default function SharedNoteClient({ noteId, initialKey }: SharedNoteClientProps) {
  const params = useParams();
  const rawKey = params.key;
  const key = initialKey || (Array.isArray(rawKey) ? rawKey.join('/') : (rawKey as string));
  const [verifiedNote, setVerifiedNote] = useState<Notes | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingNote, setIsLoadingNote] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [alreadyDuplicated, setAlreadyDuplicated] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCopied, setIsCopied] = React.useState(false);
  const { showSuccess, showError } = useToast();
  const { setCachedData, getCachedData, invalidate } = useDataNexus();

  const CACHE_KEY = useMemo(() => `public_note_${noteId}`, [noteId]);
  const SHARED_NOTE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days standard
  const GHOST_NOTE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days "infinite" for ghosts
  const isEditableByAnyone = useMemo(() => isNoteEditableByAnyone(verifiedNote as Notes), [verifiedNote]);

  const parseSharedNoteMeta = useCallback((note: Notes) => {
    const meta = (() => {
      try {
        return JSON.parse(note.metadata || '{}');
      } catch {
        return {};
      }
    })();
    return meta;
  }, []);

  const decryptSharedNote = useCallback(async (note: Notes) => {
    const meta = parseSharedNoteMeta(note);
    const isT4EncryptedPublicNote = meta.isEncrypted && meta.encryptionVersion === 'T4';
    const isGhostNote = !!meta.isGhost;

    if (!isT4EncryptedPublicNote && !isGhostNote) {
      return note;
    }

    if (!key) {
      throw new Error('This note is encrypted and requires a valid decryption key in the URL to view its contents.');
    }

    if (isT4EncryptedPublicNote) {
      const keyBuffer = decodeUrlSafeBase64ToBuffer(key);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer as any,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );

      return {
        ...note,
        title: await ecosystemSecurity.decryptWithKey(meta.encryptedTitle || note.title || '', cryptoKey),
        content: await ecosystemSecurity.decryptWithKey(note.content || '', cryptoKey),
      };
    }

    return {
      ...note,
      title: await decryptGhostData(note.title || '', key),
      content: await decryptGhostData(note.content || '', key),
    };
  }, [key, parseSharedNoteMeta]);

  const normalizeSharedNote = useCallback(async (note: Notes) => {
    const decrypted = await decryptSharedNote(note);
    const meta = parseSharedNoteMeta(decrypted);
    return {
      ...decrypted,
      metadata: JSON.stringify({ ...meta, clientDecrypted: true }),
    };
  }, [decryptSharedNote, parseSharedNoteMeta]);

  const fetchSharedNote = useCallback(async (forceRefresh: boolean = false) => {
      if (!forceRefresh) {
      // 1. Owner Detection: Check if we already have this note in our private notes cache
      if (isAuthenticated && user?.$id) {
        const privateCached = getCachedData<Notes>(`note_${noteId}`);
        if (privateCached && (privateCached.userId === user.$id || (privateCached as any).owner_id === user.$id)) {
          let handledFromPrivateCache = false;
          try {
            setVerifiedNote(await normalizeSharedNote(privateCached));
            handledFromPrivateCache = true;
          } catch (_e) {
            const privateMeta = parseSharedNoteMeta(privateCached);
            if (!(privateMeta.isEncrypted && privateMeta.encryptionVersion === 'T4')) {
              setVerifiedNote(privateCached);
              handledFromPrivateCache = true;
            }
          }
          if (handledFromPrivateCache) {
            setIsLoadingNote(false);
            // If we are the owner, we definitely have the latest state (via Realtime in NotesContext)
            return;
          }
        }
      }

      // 2. Check DataNexus public cache
      const cached = getCachedData<Notes>(CACHE_KEY);
      if (cached) {
          try {
            const finalNote = await normalizeSharedNote(cached);
            setVerifiedNote(finalNote);
          } catch (_e) {
            console.error("Cache decryption failed", _e);
          }
          setIsLoadingNote(false);
          // If it's a ghost note, we're mathematically sure it hasn't changed
          try {
            const meta = JSON.parse(cached.metadata || '{}');
            if (meta.isGhost) return; // Skip background refresh for ghosts
          } catch(_e) {}
      }

      // 3. Spark Detection: Check if we have this in our local ghost history for instant title/meta
      if (!cached && typeof window !== 'undefined') {
        try {
          const history = localStorage.getItem('kylrix_ghost_notes_v2');
          if (history) {
            const parsed = JSON.parse(history);
            const spark = parsed.find((n: any) => n.id === noteId);
            if (spark) {
              // Provide instant partial UI from spark metadata while fetching content
              setVerifiedNote({
                $id: spark.id,
                title: spark.title,
                content: '', // Still need to fetch full content
                createdAt: spark.createdAt,
                updatedAt: spark.createdAt,
                metadata: JSON.stringify({ isGhost: true, expiresAt: spark.expiresAt, isEncrypted: !!spark.decryptionKey }),
                userId: null,
                isPublic: true,
                tags: [],
                format: 'markdown'
              } as any);
              setIsLoadingNote(false);
            }
          }
        } catch (_e) {}
      }
    } else {
      setIsLoadingNote(true);
    }

    setError(null);
    try {
      const fetcher = async () => {
        const res = await fetch(`/api/shared/${noteId}`, { cache: 'no-store' });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message = payload.error || 'Failed to load shared note';
          const err: any = new Error(message);
          err.status = res.status;
          throw err;
        }
        return await res.json();
      };

      // Perform fetch
      let note = await fetcher();

      // Determine TTL: Ghosts are immutable
      let ttl = SHARED_NOTE_TTL;
      try {
        const meta = parseSharedNoteMeta(note);

        if (meta.isGhost) {
          ttl = GHOST_NOTE_TTL;
          if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) {
             throw new Error('This temporary note has expired after 7 days and is no longer available.');
          }
        }

        const shouldNormalize = (meta.isEncrypted && meta.encryptionVersion === 'T4') || meta.isGhost;

        if (shouldNormalize) {
          try {
            const decrypted = await normalizeSharedNote(note);
            note = decrypted;
          } catch (decErr) {
            console.error('Decryption failed', decErr);
            throw new Error('This note is encrypted and the provided key is invalid.');
          }
        }
      } catch (_e: any) {
        if (_e.message.includes('expired') || _e.message.includes('encrypted')) throw _e;
      }

      // Update DataNexus with appropriate TTL
      setCachedData(CACHE_KEY, note, ttl);
      setVerifiedNote(note);

      if (note.userId) {        try {
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
      if (forceRefresh && (err?.status === 404 || message.toLowerCase().includes('not found') || message.toLowerCase().includes('not public'))) {
        setVerifiedNote(null);
        setAuthorProfile(null);
        invalidate(CACHE_KEY);
      }
    } finally {
      setIsLoadingNote(false);
    }
  }, [
    noteId,
    CACHE_KEY,
    getCachedData,
    SHARED_NOTE_TTL,
    GHOST_NOTE_TTL,
    isAuthenticated,
    setCachedData,
    user?.$id,
    invalidate,
    normalizeSharedNote,
    parseSharedNoteMeta,
  ]);

  useEffect(() => {
    fetchSharedNote();
  }, [fetchSharedNote, CACHE_KEY, invalidate]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      invalidate(CACHE_KEY);
      setError(null);
      setVerifiedNote(null);
      await fetchSharedNote(true);
    } finally {
      // Small delay for visual feedback
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [fetchSharedNote, CACHE_KEY, invalidate]);

  // Realtime subscription for aggressive live updates
  useEffect(() => {
    if (!noteId) return;

    const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TABLE_ID_NOTES}.documents.${noteId}`;

    const sub = realtime.subscribe(channel, (response) => {
      const isUpdate = response.events.some(e => e.endsWith('.update'));
      const isDelete = response.events.some(e => e.endsWith('.delete'));

      if (isUpdate) {
        void (async () => {
          const payload = response.payload as Notes;
          try {
            const decrypted = await normalizeSharedNote(payload);
            setVerifiedNote(decrypted);
            setCachedData(CACHE_KEY, decrypted);
          } catch (error) {
            console.error('Failed to normalize shared note update', error);
          }
        })();
      } else if (isDelete) {
        setError('This note has been deleted by the owner.');
        setVerifiedNote(null);
        // Invalidate cache
        setCachedData(CACHE_KEY, null);
      }
    });

    return () => {
      if (typeof sub === 'function') {
        (sub as any)();
      } else if (sub && typeof (sub as any).unsubscribe === 'function') {
        (sub as any).unsubscribe();
      }
    };
  }, [noteId, CACHE_KEY, setCachedData, normalizeSharedNote]);

  // Check if note is already duplicated in user collection
  useEffect(() => {    if (!isAuthenticated || !verifiedNote || !user) return;

    const checkDuplicate = async () => {
      try {
        // Since metadata is encrypted, we fetch recent notes and check in memory
        const res = await listNotes([], 100);
        const duplicated = res.documents.some(n => {
          try {
          const meta = JSON.parse(n.metadata || '{}');
          return meta.originId === verifiedNote.$id;
          } catch (_e) { return false; }        });
        setAlreadyDuplicated(duplicated);
      } catch (_e) {
        console.warn('Failed to check for existing duplication', _e);
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
                onClick={() => fetchSharedNote(true)}
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

  const verifiedNoteMeta = parseSharedNoteMeta(verifiedNote);
  const noteLooksEncrypted = (verifiedNoteMeta.isEncrypted && verifiedNoteMeta.encryptionVersion === 'T4') || verifiedNoteMeta.isGhost;
  if (!verifiedNoteMeta.clientDecrypted && noteLooksEncrypted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0A0908', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Box sx={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, fontFamily: 'var(--font-clash)', color: 'white' }}>
            Decrypting shared note
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 3 }}>
            The shared note is encrypted and is being resolved before display.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={32} sx={{ color: '#6366F1' }} />
          </Box>
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
        } catch (_e) {}
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
                      component={MuiLink}
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
            {isEditableByAnyone && (
              <Chip
                label="Editable"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  fontWeight: 800,
                  fontFamily: 'var(--font-satoshi)',
                }}
              />
            )}
            {authorProfile && (
              <MuiLink 
                component={NextLink}
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
              </MuiLink>
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
        <SharedNoteHeader onRefresh={handleManualRefresh} isRefreshing={isRefreshing} />
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
                component={NextLink}
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
              component={MuiLink}
              href="/"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Refresh Note">
              <IconButton 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                sx={{ 
                  color: isRefreshing ? '#EC4899' : 'rgba(255, 255, 255, 0.4)',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: isRefreshing ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  width: 44,
                  height: 44,
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.05)', 
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  },
                  '& svg': {
                    animation: isRefreshing ? `${spin} 1s linear infinite` : 'none',
                  }
                }}
              >
                <RefreshIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
              <Button component={NextLink} href="/" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 700, textTransform: 'none' }}>Home</Button>
              <Button 
                component={NextLink}
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
              component={NextLink}
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
              component={MuiLink}
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
