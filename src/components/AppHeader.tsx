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
  Badge,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  Search,
  X as CloseIcon,
  Wallet,
  Menu as MenuIcon,
  LayoutGrid,
  Sparkles,
  Bell,
  Settings,
  LogOut,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { IdentityAvatar, IdentityName, computeIdentityFlags } from './common/IdentityBadge';
import Logo from './common/Logo';
import { WalletSidebar } from './overlays/WalletSidebar';
import { AICommandModal } from '@/components/ai/AICommandModal';
import { getEcosystemUrl } from '@/constants/ecosystem';
import { useSidebar } from '@/components/ui/SidebarContext';
import { useNotifications } from '@/context/NotificationContext';
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
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
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
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
              }}
            >
              <Search size={16} />
            </Box>
            <InputBase
              id="topbar-search-input"
              inputRef={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search notes, tags, shared links, extensions, people"
              sx={{
                flex: 1,
                minWidth: 220,
                color: 'white',
                fontWeight: 800,
                '& input::placeholder': {
                  color: 'rgba(255,255,255,0.42)',
                  opacity: 1,
                },
              }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                onClick={() => setSearchQuery('')}
                sx={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <CloseIcon size={16} />
              </IconButton>
            )}
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

    return (
      <Box
        sx={{
          width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          bgcolor: '#161412',
        }}
      >
        <Box sx={{ px: { xs: 2, md: 4 }, py: 1.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '24px',
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <IdentityAvatar
                src={smallProfileUrl || undefined}
                alt={profileName}
                fallback={profileName.charAt(0).toUpperCase()}
                verified={identitySignals.verified}
                pro={identitySignals.pro}
                size={56}
                borderRadius="16px"
              />
              <Box sx={{ flex: 1 }}>
                <IdentityName verified={identitySignals.verified}>
                  <Typography component="span" sx={{ fontWeight: 900, fontSize: '1.05rem' }}>
                    {profileName}
                  </Typography>
                </IdentityName>
                <Typography sx={{ color: 'rgba(255,255,255,0.58)', mt: 0.5 }}>
                  {profileUsername ? `@${profileUsername}` : 'Your Note profile'}
                </Typography>
                {user?.email && (
                  <Typography sx={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.9rem', mt: 0.25 }}>
                    {user.email}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={() => {
                    closePanel();
                    router.push('/settings');
                  }}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.12)',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.22)' },
                  }}
                >
                  Settings
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void logout()}
                  sx={{
                    bgcolor: '#EC4899',
                    color: '#fff',
                    '&:hover': { bgcolor: alpha('#EC4899', 0.85) },
                  }}
                >
                  Sign out
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Box>
    );
  };

  const renderEcosystemSurface = () => {
    if (panel !== 'ecosystem') return null;

    const apps = [
      { label: 'Note', href: getEcosystemUrl('note'), tone: '#EC4899' },
      { label: 'Vault', href: getEcosystemUrl('vault'), tone: '#10B981' },
      { label: 'Flow', href: getEcosystemUrl('flow'), tone: '#A855F7' },
      { label: 'Connect', href: getEcosystemUrl('connect'), tone: '#F59E0B' },
      { label: 'Accounts', href: getEcosystemUrl('accounts'), tone: '#6366F1' },
    ];

    return (
      <Box sx={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: '#161412' }}>
        <Box sx={{ px: { xs: 2, md: 4 }, py: 1.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '24px',
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Stack spacing={1.25}>
              <Typography sx={{ fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Kylrix Ecosystem
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {apps.map((app) => (
                  <Button
                    key={app.label}
                    component="a"
                    href={app.href}
                    onClick={() => closePanel()}
                    sx={{
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.08)',
                      bgcolor: alpha(app.tone, 0.12),
                      '&:hover': { bgcolor: alpha(app.tone, 0.18) },
                    }}
                  >
                    {app.label}
                  </Button>
                ))}
              </Stack>
            </Stack>
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

              {isAuthenticated && (
                <Tooltip title="Kylrix Portal">
                  <IconButton
                    onClick={() => openPanel('ecosystem')}
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      bgcolor: alpha('#6366F1', 0.06),
                      border: '1px solid rgba(99,102,241,0.16)',
                      borderRadius: '12px',
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                    }}
                  >
                    <LayoutGrid size={18} strokeWidth={1.75} />
                  </IconButton>
                </Tooltip>
              )}

              {isAuthenticated && (
                <Tooltip title="Notifications">
                  <IconButton
                    onClick={(event) => setAnchorElNotifications(event.currentTarget)}
                    sx={{
                      color: unreadCount > 0 ? '#EC4899' : 'rgba(255,255,255,0.4)',
                      bgcolor: alpha('#EC4899', 0.04),
                      border: '1px solid rgba(236,72,153,0.1)',
                      borderRadius: '12px',
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                    }}
                  >
                    <Badge badgeContent={unreadCount} color="error">
                      <Bell size={18} strokeWidth={1.75} />
                    </Badge>
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

      <Menu
        anchorEl={anchorElNotifications}
        open={Boolean(anchorElNotifications)}
        onClose={() => setAnchorElNotifications(null)}
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
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontWeight: 900 }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => void markAllAsRead()} sx={{ color: '#F59E0B' }}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        {notifications.slice(0, 6).map((notification: any) => (
          <MenuItem
            key={notification.$id}
            onClick={() => {
              void markAsRead(notification.$id);
              setAnchorElNotifications(null);
            }}
            sx={{ whiteSpace: 'normal', alignItems: 'flex-start', py: 1.25 }}
          >
            <ListItemText
              primary={notification.action || notification.targetType || notification.title || 'Update'}
              secondary={notification.details || notification.message || ''}
              primaryTypographyProps={{ sx: { fontWeight: 800 } }}
              secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.55)' } }}
            />
          </MenuItem>
        ))}
        {notifications.length === 0 && (
          <Box sx={{ px: 2, py: 2, color: 'rgba(255,255,255,0.55)' }}>
            No notifications yet.
          </Box>
        )}
      </Menu>

      <WalletSidebar open={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <AICommandModal open={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </>
  );
}
