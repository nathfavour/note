"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Paper,
  InputBase,
  Stack,
  alpha,
  Button,
} from '@mui/material';
import { Search, Settings, LogOut, Download, Sparkles, Wallet, Menu as MenuIcon, X as CloseIcon } from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';
import { useSidebar } from '@/components/ui/SidebarContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { getUserProfilePicId } from '@/lib/utils';
import { AICommandModal } from '@/components/ai/AICommandModal';
import { WalletSidebar } from '@/components/overlays/WalletSidebar';
import Logo from '@/components/common/Logo';
import { getEcosystemUrl } from '@/constants/ecosystem';
import { AppwriteService } from '@/lib/appwrite';
import { IdentityAvatar, IdentityName, computeIdentityFlags } from './common/IdentityBadge';
import { usePotato } from '@/components/providers/PotatoProvider';

interface AppHeaderProps {
  className?: string;
}

export default function AppHeader({ className }: AppHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { setIsCollapsed } = useSidebar();
  const potato = usePotato();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [anchorElAccount, setAnchorElAccount] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [smallProfileUrl, setSmallProfileUrl] = useState<string | null>(null);
  const [profileRecord, setProfileRecord] = useState<any>(null);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const profilePicId = getUserProfilePicId(user);

  const searchSurface = useMemo(() => potato.buildSearchSurface(searchQuery), [potato, searchQuery]);
  const searchItems = useMemo(
    () => (searchQuery.trim() ? [...searchSurface.searchTargets, ...searchSurface.quickActions] : searchSurface.quickActions).slice(0, 6),
    [searchQuery, searchSurface.searchTargets, searchSurface.quickActions]
  );

  useEffect(() => {
    if (searchParams.get('openWallet') === 'true') {
      setIsWalletOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('openWallet');
      const newQuery = params.toString();
      router.replace(pathname + (newQuery ? `?${newQuery}` : ''));
    }
  }, [searchParams, router, pathname]);

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
        } else if (mounted) {
          setSmallProfileUrl(null);
        }
      } catch (error) {
        console.warn('[Note Header] Failed to load profile preview:', error);
        if (mounted) setSmallProfileUrl(null);
      }
    };

    void fetchPreview();
    return () => {
      mounted = false;
    };
  }, [profilePicId]);

  useEffect(() => {
    let mounted = true;
    const loadProfileRecord = async () => {
      if (!user?.$id) return;
      try {
        const status = await AppwriteService.getGlobalProfileStatus(user.$id);
        if (!mounted) return;
        setProfileRecord(status?.profile || null);
      } catch (error) {
        console.warn('[Note Header] Failed to load profile record:', error);
      }
    };

    void loadProfileRecord();
    return () => {
      mounted = false;
    };
  }, [user?.$id]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!searchOpen) return;
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const identitySignals = computeIdentityFlags({
    createdAt: profileRecord?.$createdAt || (user as any)?.$createdAt || null,
    lastUsernameEdit: profileRecord?.last_username_edit || user?.prefs?.last_username_edit || null,
    profilePicId: profileRecord?.profilePicId || profileRecord?.avatar || user?.prefs?.profilePicId || null,
    username: profileRecord?.username || user?.prefs?.username || user?.name || null,
    bio: profileRecord?.bio || user?.prefs?.bio || null,
    tier: profileRecord?.tier || user?.prefs?.tier || null,
    publicKey: profileRecord?.publicKey || null,
    emailVerified: Boolean((user as any)?.emailVerification),
  });

  const handleLogout = () => {
    setAnchorElAccount(null);
    logout();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      className={className}
      sx={{
        zIndex: 1201,
        bgcolor: 'var(--color-surface)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        backgroundImage: 'none',
        boxShadow: 'inset 0 -1px 0 rgba(0, 0, 0, 0.4)',
      }}
    >
      <Toolbar sx={{ gap: 2, px: { xs: 2, md: 4 }, minHeight: '88px' }}>
        <IconButton
          edge="start"
          aria-label="toggle sidebar"
          onClick={() => setIsCollapsed((prev) => !prev)}
          sx={{
            color: '#F2F2F2',
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)' },
          }}
        >
          <MenuIcon size={20} strokeWidth={1.5} />
        </IconButton>

        <Logo
          app="note"
          size={40}
          variant="full"
          sx={{ cursor: 'pointer', '&:hover': { opacity: 0.82 } }}
          component="a"
          href="/notes"
        />

        <Box
          ref={searchRef}
          sx={{ flexGrow: 1, maxWidth: 720, display: { xs: 'none', md: 'block' }, position: 'relative' }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              px: 2,
              py: 0.75,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderColor: alpha('#EC4899', 0.25),
                boxShadow: '0 0 18px rgba(236, 72, 153, 0.08)',
              },
              '&:focus-within': {
                borderColor: '#EC4899',
                boxShadow: '0 0 0 4px rgba(236, 72, 153, 0.08)',
              },
            }}
          >
            <Search size={18} strokeWidth={1.5} color="#A1A1AA" />
            <Box sx={{ width: 12 }} />
            <InputBase
              inputRef={searchInputRef}
              placeholder={`Search ${searchSurface.routeLabel.toLowerCase()}...`}
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                color: '#F2F2F2',
                fontFamily: 'var(--font-mono)',
                '& .MuiInputBase-input': {
                  padding: 0,
                  fontSize: '0.88rem',
                  fontWeight: 500,
                },
              }}
            />
            {searchQuery && (
              <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <CloseIcon size={16} strokeWidth={1.5} />
              </IconButton>
            )}
          </Box>

          {searchOpen && (
            <Paper
              elevation={0}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 'calc(100% + 12px)',
                bgcolor: 'rgba(11, 9, 8, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                overflow: 'hidden',
                zIndex: 1400,
                maxHeight: '50vh',
                overflowY: 'auto',
                boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
              }}
            >
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Potato Engine
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 0.5, fontWeight: 900, color: '#fff' }}>
                  {searchSurface.routeLabel}
                </Typography>
              </Box>
              <Stack spacing={1} sx={{ p: 1.5 }}>
                {searchItems.map((item) => (
                  <Box
                    key={item.id}
                    onClick={() => {
                      item.onSelect();
                      setSearchOpen(false);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      p: 1.6,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      bgcolor: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${alpha(item.accent, 0.12)}`,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderColor: alpha(item.accent, 0.28),
                      },
                    }}
                  >
                    <Box sx={{ width: 12, height: 12, borderRadius: '999px', bgcolor: item.accent, mt: 0.7, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>{item.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Tooltip title="Cognitive Link (AI)">
            <IconButton
              onClick={() => setIsAIModalOpen(true)}
              sx={{
                color: '#EC4899',
                bgcolor: 'rgba(236, 72, 153, 0.05)',
                border: '1px solid rgba(236, 72, 153, 0.12)',
                borderRadius: '12px',
                width: 44,
                height: 44,
                '&:hover': {
                  bgcolor: 'rgba(236, 72, 153, 0.09)',
                  borderColor: '#EC4899',
                  boxShadow: '0 0 15px rgba(236, 72, 153, 0.18)',
                },
              }}
            >
              <Sparkles size={20} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Secure Wallet">
            <IconButton
              onClick={() => setIsWalletOpen(true)}
              sx={{
                color: '#10B981',
                bgcolor: '#161412',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                width: 44,
                height: 44,
                '&:hover': {
                  bgcolor: '#1C1A18',
                  borderColor: '#10B981',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
                },
              }}
            >
              <Wallet size={20} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>

          {isAuthenticated ? (
            <Tooltip title="User Profile">
              <IconButton
                onClick={(e) => setAnchorElAccount(e.currentTarget)}
                sx={{
                  p: 0.5,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '14px',
                  bgcolor: '#161412',
                  '&:hover': { borderColor: 'rgba(236, 72, 153, 0.3)', bgcolor: '#1C1A18' },
                  transition: 'all 0.2s',
                }}
              >
                <IdentityAvatar
                  src={smallProfileUrl || undefined}
                  alt={user?.name || user?.email || 'profile'}
                  fallback={user?.name ? user.name[0].toUpperCase() : 'U'}
                  verified={identitySignals.verified}
                  pro={identitySignals.pro}
                  size={34}
                  borderRadius="10px"
                />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              href={`${getEcosystemUrl('accounts')}/login?source=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
              variant="contained"
              size="large"
              sx={{
                ml: 1,
                background: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
                color: '#fff',
                fontWeight: 800,
                fontFamily: 'var(--font-satoshi)',
                borderRadius: '14px',
                textTransform: 'none',
                px: 4,
                boxShadow: '0 8px 20px rgba(236, 72, 153, 0.15)',
                '&:hover': { background: 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)', transform: 'translateY(-1px)' },
              }}
            >
              Connect
            </Button>
          )}
        </Box>

        <Menu
          anchorEl={anchorElAccount}
          open={Boolean(anchorElAccount)}
          onClose={() => setAnchorElAccount(null)}
          PaperProps={{
            sx: {
              mt: 2,
              width: 280,
              bgcolor: '#161412',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '28px',
              backgroundImage: 'none',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 25px 50px rgba(0,0,0,0.7)',
              p: 1,
              color: 'white',
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2.5, py: 2.5, bgcolor: '#0A0908', borderRadius: '20px', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-mono)' }}>
              Identity
            </Typography>
            <Box sx={{ mt: 1 }}>
              <IdentityName verified={identitySignals.verified} sx={{ fontWeight: 800, color: 'white', fontFamily: 'var(--font-satoshi)' }}>
                {user?.name || user?.email}
              </IdentityName>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mt: 0.5, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
              {user?.email}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />
          <MenuItem
            onClick={() => {
              setAnchorElAccount(null);
              const domain = process.env.NEXT_PUBLIC_DOMAIN || 'kylrix.space';
              const idSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'accounts';
              window.location.href = `https://${idSubdomain}.${domain}/settings?source=${encodeURIComponent(window.location.origin)}&tab=profile`;
            }}
            sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: '#1C1A18' } }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}><Settings size={18} strokeWidth={1.5} color="rgba(255,255,255,0.6)" /></ListItemIcon>
            <ListItemText primary="Account Settings" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontFamily: 'var(--font-satoshi)' }} />
          </MenuItem>
          <MenuItem
            onClick={() => {
              alert('Exporting your notes...');
              setAnchorElAccount(null);
            }}
            sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: '#1C1A18' } }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}><Download size={18} strokeWidth={1.5} color="rgba(255,255,255,0.6)" /></ListItemIcon>
            <ListItemText primary="Export Notes" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontFamily: 'var(--font-satoshi)' }} />
          </MenuItem>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />
          <MenuItem onClick={handleLogout} sx={{ py: 2, px: 2.5, borderRadius: '16px', color: '#FF4D4D', '&:hover': { bgcolor: alpha('#FF4D4D', 0.05) } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><LogOut size={18} strokeWidth={1.5} color="#FF4D4D" /></ListItemIcon>
            <ListItemText primary="Disconnect Session" primaryTypographyProps={{ variant: 'body2', fontWeight: 800, fontFamily: 'var(--font-satoshi)' }} />
          </MenuItem>
        </Menu>

      </Toolbar>

      <AICommandModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      <WalletSidebar isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </AppBar>
  );
}
