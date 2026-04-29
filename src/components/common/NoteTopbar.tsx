'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  alpha,
  AppBar,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  InputAdornment,
  InputBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ChevronDown,
  Close as CloseIcon,
  LogOut,
  Search,
  RefreshCw,
  Settings,
  Wallet,
} from 'lucide-react';

import Logo from '@/components/common/Logo';
import { WalletSidebar } from '@/components/overlays/WalletSidebar';
import { useAuth } from '@/components/ui/AuthContext';
import { searchUsers } from '@/lib/appwrite';
import { getProfilePicturePreview } from '@/lib/appwrite';
import { IdentityAvatar } from '@/components/common/IdentityBadge';
import { getUserProfilePicId } from '@/lib/utils';
import { TOPBAR_LAYOUT, getAppTone } from '@/lib/sdk/design';
import { createProfilePreviewManager, getUserProfilePicId as getSdkUserProfilePicId } from '@/lib/sdk/appwrite';

interface NoteTopbarProps {
  className?: string;
  mode?: 'app' | 'shared';
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function isRenderableImageSrc(value?: string | null) {
  if (!value) return false;
  return /^(https?:)?\/\//.test(value) || value.startsWith('data:') || value.startsWith('blob:');
}

export default function NoteTopbar({
  className,
  mode = 'app',
  onRefresh,
  isRefreshing = false,
}: NoteTopbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [appMenuAnchorEl, setAppMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const profilePicId = getUserProfilePicId(user) || getSdkUserProfilePicId(user);
  const tone = getAppTone('note');
  const profileName = user?.name || user?.email || 'Note user';
  const profileUsername = (user as any)?.username || (user as any)?.prefs?.username || null;

  const previewManager = useMemo(
    () =>
      createProfilePreviewManager(async (fileId, width, height) => {
        const preview = await getProfilePicturePreview(fileId, width, height);
        return typeof preview === 'string' ? preview : null;
      }),
    [],
  );

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
    let mounted = true;

    const resolveProfilePreview = async () => {
      if (!profilePicId) {
        if (mounted) setProfileAvatarUrl(null);
        return;
      }

      const cached = previewManager.getCachedProfilePreview(profilePicId);
      if (cached !== undefined) {
        if (mounted) setProfileAvatarUrl(cached ?? null);
        return;
      }

      try {
        const url = await previewManager.fetchProfilePreview(profilePicId, 64, 64);
        if (mounted) setProfileAvatarUrl(url);
      } catch {
        if (mounted) setProfileAvatarUrl(null);
      }
    };

    void resolveProfilePreview();
    return () => {
      mounted = false;
    };
  }, [previewManager, profilePicId]);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
      setPeopleResults([]);
      setSearchingPeople(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

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
        const resolved = await Promise.all(
          rows.slice(0, 5).map(async (candidate: any) => {
            const rawAvatar = candidate.avatar || null;
            if (!rawAvatar || isRenderableImageSrc(rawAvatar)) {
              return candidate;
            }

            const cachedPreview = previewManager.getCachedProfilePreview(rawAvatar);
            if (cachedPreview !== undefined) {
              return { ...candidate, avatar: cachedPreview };
            }

            try {
              const preview = await previewManager.fetchProfilePreview(rawAvatar, 40, 40);
              return { ...candidate, avatar: preview };
            } catch {
              return { ...candidate, avatar: null };
            }
          }),
        );
        if (active) setPeopleResults(resolved);
      } catch (error) {
        if (active) {
          console.warn('[NoteTopbar] People search failed:', error);
          setPeopleResults([]);
        }
      } finally {
        if (active) setSearchingPeople(false);
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [previewManager, searchOpen, searchQuery, user?.$id]);

  const handleCloseAll = useCallback(() => {
    setSearchOpen(false);
    setProfileMenuAnchorEl(null);
    setAppMenuAnchorEl(null);
  }, []);

  const openSearch = useCallback(() => {
    setProfileMenuAnchorEl(null);
    setAppMenuAnchorEl(null);
    setSearchOpen(true);
  }, []);

  const openAppMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSearchOpen(false);
    setAppMenuAnchorEl(event.currentTarget);
  }, []);

  const openProfileMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSearchOpen(false);
    setProfileMenuAnchorEl(event.currentTarget);
  }, []);

  const noteApps = useMemo(
    () => [
      { label: 'Notes', href: '/notes', description: 'Your private graph' },
      { label: 'Shared', href: '/shared', description: 'Links and public notes' },
      { label: 'Tags', href: '/tags', description: 'Organize by topic' },
      { label: 'Extensions', href: '/extensions', description: 'Tools and add-ons' },
      { label: 'Settings', href: '/settings', description: 'Identity and privacy' },
    ],
    [],
  );

  const renderSearchPanel = () => {
    if (!searchOpen) return null;

    const query = searchQuery.trim().toLowerCase();
    const hasQuery = query.length >= 2;

    return (
      <Box
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
            maxHeight: TOPBAR_LAYOUT.searchDockMaxHeight,
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
              placeholder="Search notes, tags, shared links, people"
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
                  handleCloseAll();
                }
              }}
            />
          </Box>

          <Stack spacing={1.25} sx={{ mt: 1.25 }}>
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
                {!hasQuery && (
                  <Box sx={{ px: 1.25, py: 1 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.84rem' }}>
                      Start typing to search notes, tags, shared links, and people.
                    </Typography>
                  </Box>
                )}

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
                            handleCloseAll();
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

                {noteApps.map((item) => (
                  <Button
                    key={item.href}
                    fullWidth
                    onClick={() => {
                      handleCloseAll();
                      router.push(item.href);
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
                    <Stack spacing={0.25} sx={{ width: '100%' }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.94rem' }}>{item.label}</Typography>
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

  const renderProfileMenu = () => {
    const open = Boolean(profileMenuAnchorEl);
    return (
      <Menu
        anchorEl={profileMenuAnchorEl}
        open={open}
        onClose={handleCloseAll}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 292,
            bgcolor: '#161412',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
            p: 1,
            color: 'white',
          },
        }}
      >
        <Box sx={{ px: 1, py: 0.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={
                isRenderableImageSrc(profileAvatarUrl)
                  ? profileAvatarUrl || undefined
                  : undefined
              }
              sx={{
                width: 44,
                height: 44,
                bgcolor: tone.secondary,
                color: '#fff',
                fontWeight: 900,
                borderRadius: '14px',
              }}
            >
              {profileName.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap>
                {profileName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.82rem' }} noWrap>
                {profileUsername ? `@${String(profileUsername).replace(/^@+/, '')}` : 'Signed in'}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
        <MenuItem onClick={() => { handleCloseAll(); router.push('/settings'); }}>
          <ListItemIcon>
            <Settings size={16} />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <MenuItem onClick={() => { handleCloseAll(); void logout(); }}>
          <ListItemIcon>
            <LogOut size={16} />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </MenuItem>
      </Menu>
    );
  };

  const renderAppMenu = () => (
    <Menu
      anchorEl={appMenuAnchorEl}
      open={Boolean(appMenuAnchorEl)}
      onClose={handleCloseAll}
      PaperProps={{
        sx: {
          mt: 1.5,
          width: 260,
          bgcolor: '#161412',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '22px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
          p: 1,
          color: 'white',
        },
      }}
    >
      {noteApps.map((item) => (
        <MenuItem
          key={item.href}
          onClick={() => {
            handleCloseAll();
            router.push(item.href);
          }}
          sx={{ borderRadius: '14px', mb: 0.5 }}
        >
          <ListItemText primary={item.label} secondary={item.description} />
        </MenuItem>
      ))}
    </Menu>
  );

  return (
    <>
      <AppBar
        className={className}
        position="fixed"
        elevation={0}
        sx={{
          zIndex: 1201,
          bgcolor: '#161412',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '0 0 28px 28px',
          boxShadow: '0 16px 42px rgba(0,0,0,0.42)',
          backgroundImage: 'none',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4 }, width: '100%' }}>
          <Box
            sx={{
              minHeight: TOPBAR_LAYOUT.height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 1.25, md: 2 },
            }}
          >
            <Box
              component="button"
              onClick={openAppMenu}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <Logo app="note" size={32} />
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  right: -6,
                  bottom: -6,
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

            {isAuthenticated ? (
              <Box
                sx={{
                  width: { xs: 44, md: 114 },
                  minWidth: { xs: 44, md: 114 },
                  maxWidth: { xs: 44, md: 114 },
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {searchOpen ? (
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
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 0 26px rgba(0,0,0,0.55)',
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
                    <IconButton size="small" onClick={() => setSearchOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      <CloseIcon size={16} />
                    </IconButton>
                  </Paper>
                ) : (
                  <Button
                    onClick={openSearch}
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
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 0 26px rgba(0,0,0,0.55)',
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
            ) : (
              <Box sx={{ flex: 1 }} />
            )}

            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flexShrink: 0 }}>
              {mode === 'shared' && onRefresh && (
                <Tooltip title="Refresh note">
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
                        color: 'white',
                      },
                    }}
                  >
                    <RefreshCw size={18} />
                  </IconButton>
                </Tooltip>
              )}

              {isAuthenticated && (
                <>
                  <Tooltip title="Wallet">
                    <IconButton
                      onClick={() => setIsWalletOpen(true)}
                      sx={{
                        color: '#F59E0B',
                        bgcolor: alpha('#F59E0B', 0.03),
                        border: '1px solid',
                        borderColor: alpha('#F59E0B', 0.1),
                        borderRadius: '12px',
                        width: 42,
                        height: 42,
                        '&:hover': { bgcolor: alpha('#F59E0B', 0.08) },
                      }}
                    >
                      <Wallet size={18} strokeWidth={1.5} />
                    </IconButton>
                  </Tooltip>

                  <ButtonBase
                    onClick={openProfileMenu}
                    sx={{
                      p: 0,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      '&:hover': { transform: 'scale(1.05)' },
                      transition: 'transform 0.2s',
                    }}
                  >
                    <Avatar
                      src={isRenderableImageSrc(profileAvatarUrl) ? profileAvatarUrl || undefined : undefined}
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: profileAvatarUrl ? 'rgba(255,255,255,0.04)' : getAppTone('note').secondary,
                        color: '#fff',
                        fontWeight: 900,
                        borderRadius: '12px',
                      }}
                    >
                      {profileName.slice(0, 1).toUpperCase()}
                    </Avatar>
                  </ButtonBase>
                </>
              )}
            </Stack>
          </Box>
        </Box>

        {renderSearchPanel()}
      </AppBar>

      {renderAppMenu()}
      {renderProfileMenu()}
      <WalletSidebar open={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </>
  );
}
