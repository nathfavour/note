'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { formatNoteCreatedDate, formatNoteUpdatedDate } from '@/lib/date-utils';
import type { Notes } from '@/types/appwrite.d';
import { ClockIcon, EyeIcon, TagIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/components/ui/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NoteContentRenderer } from '@/components/NoteContentRenderer';
import Image from 'next/image';
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
  Link as MuiLink,
  alpha
} from '@mui/material';
import Link from 'next/link';

interface SharedNoteClientProps {
   noteId: string;
}

function SharedNoteHeader() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
      sx={{ 
        bgcolor: 'rgba(0, 0, 0, 0.7)', 
        backdropFilter: 'blur(20px)', 
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
        <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
          <Box 
            component="img"
            src="/logo/whisperrnote.png" 
            alt="Whisperrnote Logo" 
            sx={{ width: 32, height: 32, borderRadius: 1, boxShadow: '0 4px 12px rgba(0, 240, 255, 0.2)' }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 900,
              fontFamily: 'var(--font-space-grotesk)',
              background: 'linear-gradient(90deg, #00F0FF 0%, #00A3FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Whisperrnote
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ThemeToggle size="sm" />

          <Button
            onClick={handleOpenMenu}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              color: 'text.primary',
              textTransform: 'none',
              px: 1.5,
              py: 0.75,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', borderColor: 'primary.main' }
            }}
            startIcon={
              <Avatar 
                sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: 'primary.main', 
                  color: 'background.default',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
              </Avatar>
            }
          >
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' }, fontWeight: 600 }}>
              {user?.name || user?.email || 'Account'}
            </Typography>
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 180,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem component={Link} href="/settings" onClick={handleCloseMenu} sx={{ py: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Settings</Typography>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default function SharedNoteClient({ noteId }: SharedNoteClientProps) {
  const [verifiedNote, setVerifiedNote] = useState<Notes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingNote, setIsLoadingNote] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const [isCopied, setIsCopied] = React.useState(false);

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
      setVerifiedNote(note);
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

  if (!verifiedNote) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyCenter: 'center', p: 4 }}>
        <Box sx={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Loading shared note</Typography>
          {error ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{error}</Typography>
              <Button
                variant="contained"
                onClick={fetchSharedNote}
                sx={{ borderRadius: '12px' }}
              >
                Retry loading note
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>Fetching the shared note. Please wait.</Typography>
          )}
          {isLoadingNote && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress size={32} sx={{ color: 'primary.main' }} />
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

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-bg">
        <SharedNoteHeader />
        <main className="max-w-4xl mx-auto px-6 py-8 pt-20">
          <article className="bg-card dark:bg-dark-card rounded-3xl border border-border dark:border-dark-border overflow-hidden">
            <header className="p-8 border-b border-border dark:border-dark-border">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-fg leading-tight">{verifiedNote.title || 'Untitled Note'}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>Created {formatNoteCreatedDate(verifiedNote, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4" />
                    <span>Public Note</span>
                  </div>
                </div>

                {verifiedNote.tags && verifiedNote.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-sm text-muted">
                    <TagIcon className="h-4 w-4" />
                    {verifiedNote.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-background dark:bg-dark-bg rounded-full text-xs">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </header>

            <div className="relative p-8 bg-background/70 dark:bg-dark-bg/40 rounded-xl">
              <button
                onClick={handleCopyContent}
                className={`absolute top-4 right-4 p-2 rounded-lg border transition-all duration-200 group ${
                  isCopied
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                    : 'bg-background dark:bg-dark-card border-border hover:bg-card dark:hover:bg-dark-card/80'
                }`}
                title={isCopied ? 'Copied!' : 'Copy content'}
              >
                {isCopied ? (
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 transition-colors" />
                ) : (
                  <svg className="h-5 w-5 text-foreground group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <NoteContentRenderer
                content={verifiedNote.content || ''}
                format={(verifiedNote.format as 'text' | 'doodle') || 'text'}
                textClassName="text-foreground dark:text-dark-fg"
                emptyFallback={<div className="text-muted italic">This note is empty.</div>}
              />
            </div>

            <footer className="p-6 bg-background/50 dark:bg-dark-bg/50 border-t border-border dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">Last updated {formatNoteUpdatedDate(verifiedNote, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="text-sm text-muted">Shared via Whisperrnote</div>
              </div>
            </footer>
          </article>

          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-8 border border-accent/20">
              <h2 className="text-2xl font-bold text-foreground dark:text-dark-fg mb-4">View Your Notes</h2>
              <p className="text-muted mb-6 max-w-lg mx-auto">Check out all your notes and continue organizing your thoughts.</p>
              <a href="/notes" className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-accent text-white font-semibold">
                Go to Your Notes
                <ArrowRightIcon className="h-5 w-5 ml-3" />
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <header className="border-b border-light-border dark:border-dark-border bg-white/50 dark:bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo/whisperrnote.png" alt="Whisperrnote" width={32} height={32} className="rounded-lg" />
            <h1 className="text-xl font-bold text-light-fg dark:text-dark-fg">Whisperrnote</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <a href="/" className="rounded-xl px-3 py-2 text-sm font-medium bg-accent/10">Home</a>
            <a href="/" className="rounded-xl px-3 py-2 text-sm font-medium bg-accent text-white">Join</a>
          </div>
        </div>
      </header>

      <section className="border-b border-light-border dark:border-dark-border bg-gradient-to-r from-accent/10 via-transparent to-accent/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-light-fg/70 dark:text-dark-fg/70">Organize unlimited notes, AI insights & secure sharing.</p>
          <a href="/" className="inline-flex items-center rounded-lg px-4 py-2 bg-accent text-white text-sm font-medium">
            Get Started Free <ArrowRightIcon className="h-4 w-4 ml-1" />
          </a>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <article className="bg-light-card dark:bg-dark-card rounded-3xl border-2 border-light-border dark:border-dark-border overflow-hidden">
          <header className="p-8 border-b border-light-border dark:border-dark-border">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-light-fg dark:text-dark-fg leading-tight">{verifiedNote.title || 'Untitled Note'}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-light-fg/60 dark:text-dark-fg/60">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>Created {formatNoteCreatedDate(verifiedNote, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeIcon className="h-4 w-4" />
                  <span>Public Note</span>
                </div>
              </div>

              {verifiedNote.tags && verifiedNote.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-sm text-light-fg/60 dark:text-dark-fg/60">
                  <TagIcon className="h-4 w-4" />
                  {verifiedNote.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-light-bg dark:bg-dark-bg rounded-full text-xs">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="p-8">
            <NoteContentRenderer
              content={verifiedNote.content || ''}
              format={(verifiedNote.format as 'text' | 'doodle') || 'text'}
              textClassName="text-light-fg dark:text-dark-fg"
              emptyFallback={<div className="text-light-fg/60 dark:text-dark-fg/60 italic">This note is empty.</div>}
            />
          </div>

          <footer className="p-6 bg-light-bg/50 dark:bg-dark-bg/50 border-t border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-light-fg/60 dark:text-dark-fg/60">Last updated {formatNoteUpdatedDate(verifiedNote, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className="text-sm text-light-fg/60 dark:text-dark-fg/60">Shared via Whisperrnote</div>
            </div>
          </footer>
        </article>

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-8 border border-accent/20">
            <h2 className="text-2xl font-bold text-light-fg dark:text-dark-fg mb-4">Create Your Own Notes</h2>
            <p className="text-light-fg/70 dark:text-dark-fg/70 mb-6 max-w-lg mx-auto">Join thousands of users who trust Whisperrnote to capture, organize, and share their thoughts.</p>
            <a href="/" className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-accent text-white font-semibold">
              Start Writing for Free
              <ArrowRightIcon className="h-5 w-5 ml-3" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
