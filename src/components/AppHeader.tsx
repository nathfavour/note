'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Tooltip,
  InputBase,
  Stack,
  alpha,
  Button,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  ListItemButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  X as CloseIcon,
  Wallet,
  Menu as MenuIcon,
  Sparkles,
  Settings,
  LogOut,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { IdentityAvatar, computeIdentityFlags } from './common/IdentityBadge';
import Logo from './common/Logo';
import { WalletSidebar } from './overlays/WalletSidebar';
import { AICommandModal } from '@/components/ai/AICommandModal';
import { getEcosystemUrl } from '@/constants/ecosystem';
import { useSidebar } from '@/components/ui/SidebarContext';
import { usePotato } from '@/components/providers/PotatoProvider';
import { searchUsers } from '@/lib/appwrite';
import { getUserProfilePicId } from '@/lib/utils';
import { useIsland } from '@/components/ui/DynamicIsland';

interface AppHeaderProps {
  className?: string;
}

export default function AppHeader({ className }: AppHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { setIsCollapsed } = useSidebar();
  const { activeNotification, panel, openPanel, closePanel } = useIsland();
  const potato = usePotato();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [anchorElAccount, setAnchorElAccount] = useState<null | HTMLElement>(null);
  const [anchorElIsland, setAnchorElIsland] = useState<null | HTMLElement>(null);
  const [smallProfileUrl, setSmallProfileUrl] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const profilePicId = getUserProfilePicId(user);
  const searchSurface = useMemo(() => potato.buildSearchSurface(searchQuery), [potato, searchQuery]);
  const quickSearchItems = useMemo(() => {
    const base = searchQuery.trim() ? [...searchSurface.searchTargets, ...searchSurface.quickActions] : searchSurface.quickActions;
    return base.slice(0, 6);
  }, [searchQuery, searchSurface.quickActions, searchSurface.searchTargets]);
  const shouldCollapseChrome = Boolean(activeNotification);
  const notificationTone = useMemo(() => {
    if (!activeNotification) return '#F59E0B';
    if (activeNotification.app === 'note') return '#EC4899';
    if (activeNotification.app === 'connect') return '#F59E0B';
    if (activeNotification.app === 'flow') return '#A855F7';
    if (activeNotification.app === 'vault') return '#10B981';
    if (activeNotification.app === 'root') return '#6366F1';
    switch (activeNotification.type) {
      case 'error':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      case 'suggestion':
      case 'pro':
        return '#A855F7';
      default:
        return '#6366F1';
    }
  }, [activeNotification]);
  const profileName = user?.name || user?.email || 'Note user';
  const profileUsername = (user as any)?.username || (user as any)?.prefs?.username || null;
  const identitySignals = computeIdentityFlags({
    createdAt: user?.$createdAt || null,
    lastUsernameEdit: (user as any)?.prefs?.last_username_edit || null,
    profilePicId: profilePicId || null,
    username: profileUsername || user?.name || null,
    bio: (user as any)?.bio || null,
    tier: (user as any)?.prefs?.tier || (user as any)?.tier || null,
    publicKey: (user as any)?.publicKey || null,
    emailVerified: Boolean((user as any)?.emailVerification),
  });

  useEffect(() => {
    if (searchParams.get('openWallet') === 'true') {
      setIsWalletOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('openWallet');
      const nextQuery = params.toString();
      router.replace(pathname + (nextQuery ? `?${nextQuery}` : ''));
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!profilePicId) {
      setSmallProfileUrl(null);
      return;
    }

    let mounted = true;
    const cached = getCachedProfilePreview(profilePicId);
    if (cached !== undefined) {
      setSmallProfileUrl(cached ?? null);
    }

    void fetchProfilePreview(profilePicId, 64, 64)
      .then((url) => {
        if (mounted) setSmallProfileUrl(url);
      })
      .catch(() => {
        if (mounted) setSmallProfileUrl(null);
      });

    return () => {
      mounted = false;
    };
  }, [profilePicId]);

  useEffect(() => {
    if (panel !== 'search') {
      setSearchQuery('');
      setPeopleResults([]);
      setSearchingPeople(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [panel]);

  useEffect(() => {
    if (panel !== 'search') return;

    const text = searchQuery.trim().toLowerCase();
    if (text.length < 2) {
      setPeopleResults([]);
      setSearchingPeople(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearchingPeople(true);
      try {
        const result = await searchUsers(text, 5);
        if (!active) return;
        const rows = Array.isArray(result)
          ? result.filter((candidate: any) => candidate.id !== user?.$id)
          : [];
        setPeopleResults(rows.slice(0, 5));
      } catch (error) {
        if (active) {
          console.warn('[AppHeader] People search failed:', error);
          setPeopleResults([]);
        }
      } finally {
        if (active) setSearchingPeople(false);
      }
    }, 260);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [panel, searchQuery, user?.$id]);

  useEffect(() => {
    if (!panel) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        !target ||
        (target instanceof Element && target.closest('[data-note-search-surface="true"]'))
      ) {
        return;
      }
      closePanel();
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => window.removeEventListener('pointerdown', handlePointerDown, true);
  }, [closePanel, panel]);

  const toggleSearch = useCallback(() => {
    openPanel('search');
  }, [openPanel]);

  const renderSearchSurface = () => {
    if (panel !== 'search') return null;

    const query = searchQuery.trim().toLowerCase();
    const hasQuery = query.length >= 2;

    return (
      <Box
        ref={searchRef}
        data-note-search-surface="true"
        sx={{
          width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          bgcolor: '#161412',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: '100%',
            px: { xs: 2, md: 4 },
            py: 1.5,
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <Search size={16} />
            </Box>
            <TextField
              inputRef={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search notes, tags, shared links, extensions, people"
              variant="standard"
              fullWidth
              InputProps={{
                disableUnderline: true,
                sx: {
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  '& input::placeholder': { color: 'rgba(255,255,255,0.42)', opacity: 1 },
                },
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mr: 0.5 }}>
                      Search
                    </Typography>
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      <CloseIcon size={16} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ flex: 1, minWidth: { xs: '100%', md: 320 } }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  closePanel();
                }
              }}
            />
          </Box>

          <Stack spacing={1.25}>
            {quickSearchItems.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  bgcolor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '20px',
                }}
              >
                <Stack spacing={0.75}>
                  {quickSearchItems.map((item) => (
                    <Button
                      key={item.id}
                      fullWidth
                      onClick={item.onSelect}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        px: 2,
                        py: 1.25,
                        borderRadius: '14px',
                        color: 'white',
                        bgcolor: alpha('#FFFFFF', 0.02),
                        border: '1px solid transparent',
                        '&:hover': {
                          bgcolor: alpha('#FFFFFF', 0.05),
                          borderColor: alpha('#FFFFFF', 0.08),
                        },
                      }}
                    >
                      <Stack spacing={0.25} sx={{ width: '100%' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.94rem' }}>
                          {item.title}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.82rem' }}>
                          {item.description}
                        </Typography>
                      </Stack>
                    </Button>
                  ))}
                </Stack>
              </Paper>
            )}

            <Paper
              elevation={0}
              sx={{
                p: 1,
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
              }}
            >
              <Stack spacing={0.75}>
                {hasQuery && (
                  <>
                    {searchingPeople ? (
                      <Stack spacing={1} sx={{ p: 1 }}>
                        <Skeleton variant="rounded" height={48} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                        <Skeleton variant="rounded" height={48} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                      </Stack>
                    ) : (
                      peopleResults.map((person) => (
                        <Button
                          key={person.id}
                          onClick={() => {
                            closePanel();
                            setSearchQuery('');
                          }}
                          sx={{
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            px: 2,
                            py: 1.25,
                            borderRadius: '14px',
                            color: 'white',
                            bgcolor: alpha('#FFFFFF', 0.02),
                            border: '1px solid transparent',
                            '&:hover': {
                              bgcolor: alpha('#FFFFFF', 0.05),
                              borderColor: alpha('#FFFFFF', 0.08),
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <IdentityAvatar
                              src={person.avatar || undefined}
                              alt={person.name}
                              fallback={(person.name || 'U').charAt(0).toUpperCase()}
                              size={34}
                              borderRadius="50%"
                            />
                            <Box>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.94rem' }}>
                                {person.name}
                              </Typography>
                              {person.email && (
                                <Typography sx={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.82rem' }}>
                                  {person.email}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Button>
                      ))
                    )}
                  </>
                )}

                {!hasQuery && (
                  <Box sx={{ px: 1.25, py: 1 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.84rem' }}>
                      Start typing to search notes, tags, shared links, extensions, and people.
                    </Typography>
                  </Box>
                )}

                {searchSurface.searchTargets.slice(0, 4).map((item) => (
                  <Button
                    key={item.id}
                    fullWidth
                    onClick={item.onSelect}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      px: 2,
                      py: 1.25,
                      borderRadius: '14px',
                      color: 'white',
                      bgcolor: alpha('#FFFFFF', 0.02),
                      border: '1px solid transparent',
                      '&:hover': {
                        bgcolor: alpha('#FFFFFF', 0.05),
                        borderColor: alpha('#FFFFFF', 0.08),
                      },
                    }}
                  >
                    <Stack spacing={0.25} sx={{ width: '100%' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.94rem' }}>{item.title}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.82rem' }}>
                        {item.description}
                      </Typography>
                    </Stack>
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>
    );
  };

  const renderProfileSurface = () => {
    if (panel !== 'profile') return null;

    const userId = user?.$id || null;
    const shortUserId = userId ? `${userId.slice(0, 6)}…${userId.slice(-4)}` : 'local';
    const profileBio = String((user as any)?.bio || (user as any)?.prefs?.bio || '').trim();
    const username = profileUsername ? String(profileUsername).replace(/^@+/, '').toLowerCase() : null;

    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          bgcolor: '#161412',
        }}
      >
        <Box sx={{ width: '100%', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Paper
            elevation={0}
            sx={{
              width: { xs: 'calc(100vw - 24px)', sm: 'min(680px, calc(100vw - 48px))' },
              maxWidth: '100%',
              borderRadius: '30px',
              bgcolor: '#161412',
              border: '1px solid rgba(99,102,241,0.28)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 0.5, mb: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '14px',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#6366F1',
                      bgcolor: alpha('#6366F1', 0.08),
                      border: `1px solid ${alpha('#6366F1', 0.24)}`,
                    }}
                  >
                    <Sparkles size={18} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '0.9rem', lineHeight: 1.1 }}>
                      {profileName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.52), fontWeight: 700 }}>
                      Profile commands
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={closePanel}
                  aria-label="Close profile panel"
                  size="small"
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '999px',
                    color: alpha('#fff', 0.9),
                    bgcolor: alpha('#fff', 0.06),
                    border: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                    '&:hover': { bgcolor: alpha('#fff', 0.12) },
                  }}
                >
                  <CloseIcon size={16} />
                </IconButton>
              </Box>

              <Box sx={{ display: 'grid', gap: 1.25, minWidth: 0, overflowX: 'hidden', overflowY: 'auto', maxHeight: '58vh', pr: 0.5, pb: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.25 }}>
                  <Box sx={{ width: 56, height: 6, borderRadius: 999, bgcolor: alpha('#fff', 0.14) }} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', minWidth: 0 }}>
                  <Box sx={{ flexShrink: 0 }}>
                    <IdentityAvatar
                      src={smallProfileUrl || undefined}
                      alt={profileName}
                      fallback={profileName.charAt(0).toUpperCase()}
                      verified={identitySignals.verified}
                      pro={identitySignals.pro}
                      size={104}
                      borderRadius="28px"
                    />
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.05 }} noWrap>
                      {profileName}
                    </Typography>
                    <Typography sx={{ color: alpha('#fff', 0.62), fontWeight: 700, fontSize: '0.86rem', lineHeight: 1.35 }} noWrap>
                      {username ? `@${username}` : 'profile'}
                    </Typography>
                    <Typography sx={{ color: alpha('#fff', 0.52), fontFamily: 'var(--font-mono)', fontSize: '0.72rem', mt: 0.75 }} noWrap>
                      {shortUserId}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ borderRadius: '22px', border: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, minWidth: 0 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.75 }}>
                    Bio
                  </Typography>
                  <Typography sx={{ color: 'white', fontSize: '0.88rem', lineHeight: 1.55, minHeight: 22, wordBreak: 'break-word' }}>
                    {profileBio || 'No bio yet.'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Button
                    onClick={async () => {
                      if (userId && navigator?.clipboard) {
                        await navigator.clipboard.writeText(userId);
                      }
                    }}
                    sx={{
                      minWidth: 0,
                      flex: '1 1 180px',
                      justifyContent: 'flex-start',
                      borderRadius: '16px',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      color: 'white',
                      px: 1.5,
                      py: 1.15,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                  >
                    {userId ? `Copy ${shortUserId}` : 'Copy profile id'}
                  </Button>
                  <Button
                    onClick={() => {
                      closePanel();
                      void logout();
                    }}
                    sx={{
                      minWidth: 0,
                      flex: '1 1 180px',
                      borderRadius: '16px',
                      bgcolor: 'rgba(255, 77, 77, 0.08)',
                      color: '#FF4D4D',
                      px: 1.5,
                      py: 1.15,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(255, 77, 77, 0.14)' },
                    }}
                  >
                    Sign out
                  </Button>
                </Stack>

                <Button
                  onClick={() => {
                    closePanel();
                    router.push('/settings');
                  }}
                  variant="contained"
                  sx={{
                    borderRadius: '16px',
                    px: 2,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 900,
                    bgcolor: '#6366F1',
                    color: '#000',
                    '&:hover': { bgcolor: alpha('#6366F1', 0.86) },
                  }}
                >
                  See full profile
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  };

  const renderEcosystemSurface = () => {
    if (panel !== 'ecosystem') return null;

    const apps = [
      { app: 'note' as const, label: 'Note', description: 'Secure notes and research.', href: getEcosystemUrl('note'), tone: '#EC4899' },
      { app: 'vault' as const, label: 'Vault', description: 'Passwords, 2FA, and keys.', href: getEcosystemUrl('vault'), tone: '#10B981' },
      { app: 'flow' as const, label: 'Flow', description: 'Tasks, plans, and follow-through.', href: getEcosystemUrl('flow'), tone: '#A855F7' },
      { app: 'connect' as const, label: 'Connect', description: 'Secure messages and sharing.', href: getEcosystemUrl('connect'), tone: '#F59E0B' },
      { app: 'root' as const, label: 'Accounts', description: 'Your Kylrix account.', href: getEcosystemUrl('accounts'), tone: '#6366F1' },
    ];

    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: '#161412' }}>
        <Box sx={{ width: '100%', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Paper
            elevation={0}
            sx={{
              width: { xs: 'calc(100vw - 24px)', sm: 'min(680px, calc(100vw - 48px))' },
              maxWidth: '100%',
              borderRadius: '30px',
              bgcolor: '#161412',
              border: '1px solid rgba(245,158,11,0.28)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 0.5, mb: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '14px',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#F59E0B',
                      bgcolor: alpha('#F59E0B', 0.08),
                      border: `1px solid ${alpha('#F59E0B', 0.24)}`,
                    }}
                  >
                    <Sparkles size={18} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '0.9rem', lineHeight: 1.1 }}>
                      Ecosystem apps
                    </Typography>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.52), fontWeight: 700 }}>
                      Jump between apps
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={closePanel}
                  aria-label="Close ecosystem panel"
                  size="small"
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '999px',
                    color: alpha('#fff', 0.9),
                    bgcolor: alpha('#fff', 0.06),
                    border: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                    '&:hover': { bgcolor: alpha('#fff', 0.12) },
                  }}
                >
                  <CloseIcon size={16} />
                </IconButton>
              </Box>
              <Box sx={{ display: 'grid', gap: 0.75 }}>
                {apps.map((app) => (
                  <ListItemButton
                    key={app.label}
                    onClick={() => {
                      closePanel();
                      window.location.assign(app.href);
                    }}
                    sx={{
                      borderRadius: '18px',
                      bgcolor: app.app === 'note' ? alpha(app.tone, 0.1) : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${app.app === 'note' ? alpha(app.tone, 0.28) : 'rgba(255,255,255,0.05)'}`,
                      px: 1.5,
                      py: 1.25,
                      gap: 1.25,
                      '&:hover': {
                        bgcolor: alpha(app.tone, 0.12),
                        borderColor: alpha(app.tone, 0.32),
                      },
                    }}
                  >
                    <Box sx={{ width: 34, height: 34, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: alpha(app.tone, 0.12), color: app.tone, flexShrink: 0 }}>
                      <Logo app={app.app} size={16} variant="icon" />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.88rem', lineHeight: 1.15 }}>
                        {app.label}
                        {app.app === 'note' ? ' • Current app' : ''}
                      </Typography>
                      <Typography sx={{ color: alpha('#fff', 0.56), fontWeight: 600, fontSize: '0.76rem', lineHeight: 1.35 }}>
                        {app.description}
                      </Typography>
                    </Box>
                  </ListItemButton>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  };

  const renderIslandDropdown = () => {
    if (!activeNotification) return null;

    return (
      <Menu
        anchorEl={anchorElIsland}
        open={Boolean(anchorElIsland)}
        onClose={() => setAnchorElIsland(null)}
        PaperProps={{
          sx: {
            mt: 1.5,
            bgcolor: '#161412',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            minWidth: 320,
            color: 'white',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, maxWidth: 360 }}>
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 900 }}>{activeNotification.title}</Typography>
            {activeNotification.message && (
              <Typography sx={{ color: 'rgba(255,255,255,0.64)', whiteSpace: 'pre-wrap' }}>
                {activeNotification.message}
              </Typography>
            )}
          </Stack>
          {activeNotification.action && (
            <Button
              fullWidth
              onClick={() => {
                activeNotification.action?.onClick();
                setAnchorElIsland(null);
              }}
              sx={{ mt: 1.5, bgcolor: notificationTone, color: '#000', fontWeight: 900, '&:hover': { bgcolor: alpha(notificationTone, 0.85) } }}
            >
              {activeNotification.action.label}
            </Button>
          )}
        </Box>
      </Menu>
    );
  };

  return (
    <>
      <AppBar
        className={className}
        position="fixed"
        elevation={0}
        sx={{
          zIndex: 1201,
          bgcolor: '#161412',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '0 0 28px 28px',
          boxShadow: '0 16px 42px rgba(0,0,0,0.42)',
          backgroundImage: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          height: panel ? 'auto' : '88px',
          minHeight: '88px',
        }}
      >
        <Toolbar
          sx={{
            gap: { xs: 2, md: 4 },
            px: { xs: 2, md: 4 },
            minHeight: '88px',
            width: '100%',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {!shouldCollapseChrome && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={() => setIsCollapsed((prev) => !prev)}
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' },
                }}
              >
                <MenuIcon size={16} />
              </IconButton>

              <Box
                component="button"
                onClick={() => openPanel('ecosystem')}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'transparent',
                  border: 'none',
                  p: 0,
                  cursor: 'pointer',
                }}
              >
                <Logo app="note" size={32} />
                <IconButton
                  size="small"
                  sx={{
                    ml: -1,
                    mt: 2.4,
                    width: 18,
                    height: 18,
                    bgcolor: '#0A0908',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.55)',
                    '&:hover': { bgcolor: '#161412', color: 'white' },
                  }}
                >
                  <ChevronDown size={11} />
                </IconButton>
              </Box>
            </Stack>
          )}

          {!shouldCollapseChrome && isAuthenticated && (
            <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
              {panel === 'search' ? (
                <Paper
                  elevation={0}
                  data-note-search-surface="true"
                  sx={{
                    width: { xs: 'calc(100vw - 32px)', sm: 420, md: 520 },
                    maxWidth: 'calc(100vw - 32px)',
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1.5,
                    py: 0,
                    border: '1px solid rgba(255,255,255,0.08)',
                    bgcolor: '#000',
                    color: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 0 26px rgba(0, 0, 0, 0.55)',
                  }}
                >
                  <Search size={16} strokeWidth={2.25} style={{ flexShrink: 0, opacity: 0.84 }} />
                  <InputBase
                    id="topbar-search-input"
                    inputRef={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search notes, tags, shared links, people"
                    sx={{
                      flex: 1,
                      color: 'white',
                      fontWeight: 800,
                      '& input::placeholder': { color: 'rgba(255,255,255,0.42)', opacity: 1 },
                    }}
                  />
                  <IconButton size="small" onClick={() => closePanel()} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    <CloseIcon size={16} />
                  </IconButton>
                </Paper>
              ) : (
                <Button
                  onClick={toggleSearch}
                  sx={{
                    width: { xs: 44, md: 170 },
                    minWidth: { xs: 44, md: 170 },
                    maxWidth: { xs: 44, md: 170 },
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    px: 1.25,
                    py: 0,
                    minHeight: 44,
                    border: '1px solid rgba(255,255,255,0.08)',
                    bgcolor: '#000',
                    color: 'white',
                    borderRadius: '999px',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 0 26px rgba(0, 0, 0, 0.55)',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#0f0f0f', transform: 'translateY(-1px)' },
                  }}
                >
                  <Search size={16} strokeWidth={2.25} />
                  <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 800 }}>
                    Search
                  </Typography>
                </Button>
              )}
            </Box>
          )}

          {shouldCollapseChrome && activeNotification && (
            <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <Button
                onClick={(event) => setAnchorElIsland(event.currentTarget)}
                sx={{
                  height: 44,
                  minHeight: 44,
                  px: 1.5,
                  borderRadius: '999px',
                  color: 'white',
                  bgcolor: alpha(notificationTone, 0.16),
                  border: `1px solid ${alpha(notificationTone, 0.28)}`,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 28px ${alpha(notificationTone, 0.18)}`,
                  textTransform: 'none',
                  '&:hover': { bgcolor: alpha(notificationTone, 0.22) },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Logo app={(activeNotification.app || 'note') as any} size={20} variant="icon" />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.88rem', lineHeight: 1.1 }}>
                      {activeNotification.title}
                    </Typography>
                    {activeNotification.message && (
                      <Typography sx={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.1, maxWidth: 260 }} noWrap>
                        {activeNotification.message}
                      </Typography>
                    )}
                  </Box>
                  <ChevronDown size={14} />
                </Stack>
              </Button>
            </Box>
          )}

          {!shouldCollapseChrome && (
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexShrink: 0 }}>
              {isAuthenticated && (
                <Tooltip title="Wallet">
                  <IconButton
                    onClick={() => setIsWalletOpen(true)}
                    sx={{
                      color: isWalletOpen ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                      bgcolor: alpha('#F59E0B', 0.03),
                      border: '1px solid',
                      borderColor: isWalletOpen ? alpha('#F59E0B', 0.3) : alpha('#F59E0B', 0.1),
                      borderRadius: '12px',
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                      '&:hover': { bgcolor: alpha('#F59E0B', 0.08) },
                    }}
                  >
                    <Wallet size={18} strokeWidth={1.5} />
                  </IconButton>
                </Tooltip>
              )}

              {isAuthenticated && (
                <Tooltip title="AI">
                  <IconButton
                    onClick={() => setIsAIModalOpen(true)}
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      bgcolor: alpha('#A855F7', 0.06),
                      border: '1px solid rgba(168,85,247,0.16)',
                      borderRadius: '12px',
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                    }}
                  >
                    <Sparkles size={18} strokeWidth={1.75} />
                  </IconButton>
                </Tooltip>
              )}

              {isAuthenticated ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Button
                    onClick={() => openPanel('profile')}
                    sx={{
                      minWidth: 0,
                      p: 0,
                      borderRadius: '16px',
                      textTransform: 'none',
                      color: 'white',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IdentityAvatar
                        src={smallProfileUrl || undefined}
                        alt={profileName}
                        fallback={profileName.charAt(0).toUpperCase()}
                        verified={identitySignals.verified}
                        pro={identitySignals.pro}
                        size={38}
                        borderRadius="12px"
                      />
                      <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                          {profileName}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.78rem', lineHeight: 1.1 }}>
                          {profileUsername ? `@${profileUsername}` : 'Open profile'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Button>
                </Box>
              ) : (
                <Button
                  component="a"
                  href={`${getEcosystemUrl('accounts')}/login?source=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
                  variant="contained"
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: '#6366F1',
                    color: '#000',
                    fontWeight: 800,
                    borderRadius: '10px',
                    '&:hover': { bgcolor: alpha('#6366F1', 0.8) },
                  }}
                >
                  Connect
                </Button>
              )}
            </Stack>
          )}
        </Toolbar>
        {renderSearchSurface()}
        {renderProfileSurface()}
        {renderEcosystemSurface()}
      </AppBar>

      {renderIslandDropdown()}

      <Menu
        anchorEl={anchorElAccount}
        open={Boolean(anchorElAccount)}
        onClose={() => setAnchorElAccount(null)}
        PaperProps={{
          sx: {
            mt: 1.5,
            bgcolor: '#161412',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            minWidth: 280,
            color: 'white',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IdentityAvatar
              src={smallProfileUrl || undefined}
              alt={profileName}
              fallback={profileName.charAt(0).toUpperCase()}
              verified={identitySignals.verified}
              pro={identitySignals.pro}
              size={44}
              borderRadius="14px"
            />
            <Box>
              <Typography sx={{ fontWeight: 900 }}>{profileName}</Typography>
              {profileUsername && (
                <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>
                  @{profileUsername}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        <MenuItem
          onClick={() => {
            setAnchorElAccount(null);
            closePanel();
            router.push('/settings');
          }}
        >
          <ListItemIcon><Settings size={16} /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorElAccount(null);
            void logout();
          }}
        >
          <ListItemIcon><LogOut size={16} /></ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorElAccount(null);
            router.push('/settings');
          }}
        >
          <ListItemIcon><Download size={16} /></ListItemIcon>
          <ListItemText>Export / backup</ListItemText>
        </MenuItem>
      </Menu>

      <WalletSidebar isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <AICommandModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </>
  );
}
