"use client";

import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Tooltip, 
  Divider,
  ListItemIcon,
  ListItemText,

  alpha,
  Button
  } from '@mui/material';
  import {
  Settings,
  LogOut,
  LayoutGrid,
  Download,
  Sparkles,

  Wallet
  } from 'lucide-react';
  import { SubscriptionBadge } from '@/context/subscription/SubscriptionContext';
  import { useAuth } from '@/components/ui/AuthContext';
  import { usePathname, useRouter, useSearchParams } from 'next/navigation';
  import { useNotifications } from '@/context/NotificationContext';
  import { useIsland } from '@/components/ui/DynamicIsland';

  import { useOverlay } from '@/components/ui/OverlayContext';
import { getUserProfilePicId } from '@/lib/utils';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { TopBarSearch } from '@/components/TopBarSearch';
import { AICommandModal } from '@/components/ai/AICommandModal';
import { EcosystemPortal } from '@/components/common/EcosystemPortal';
import { WalletSidebar } from '@/components/overlays/WalletSidebar';
import Logo from '@/components/common/Logo';
import { getEcosystemUrl } from '@/constants/ecosystem';
import { useTheme } from '@/components/ThemeProvider';
import { AppwriteService } from '@/lib/appwrite';
import { IdentityAvatar, IdentityName, computeIdentityFlags } from './common/IdentityBadge';

interface AppHeaderProps {
  className?: string;
}

export default function AppHeader({ className }: AppHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { } = useTheme();
  const { } = useNotifications();
  const { } = useIsland();
  const { } = useOverlay();
  const [anchorElAccount, setAnchorElAccount] = useState<null | HTMLElement>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('openWallet') === 'true') {
      setIsWalletOpen(true);
      // Optional: Clean up URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('openWallet');
      const newQuery = params.toString();
      router.replace(pathname + (newQuery ? `?${newQuery}` : ''));
    }
  }, [searchParams, router, pathname]);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const [_currentSubdomain, setCurrentSubdomain] = useState<string | null>(null);
  const [smallProfileUrl, setSmallProfileUrl] = useState<string | null>(null);
  const [profileRecord, setProfileRecord] = useState<any>(null);
  const profilePicId = getUserProfilePicId(user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        setIsEcosystemPortalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    const segments = host.split('.');
    if (segments.length <= 2) {
      setCurrentSubdomain('app');
      return;
    }
    setCurrentSubdomain(segments[0]);
  }, [isAuthenticated, user]);

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
      } catch (err: any) {
        console.warn('Failed to load profile preview', err);
        if (mounted) setSmallProfileUrl(null);
      }
    };
    fetchPreview();
    return () => { mounted = false; };
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
    loadProfileRecord();
    return () => {
      mounted = false;
    };
  }, [user?.$id]);

  const identitySignals = computeIdentityFlags({
    createdAt: profileRecord?.$createdAt || profileRecord?.createdAt || (user as any)?.$createdAt || null,
    lastUsernameEdit: profileRecord?.last_username_edit || user?.prefs?.last_username_edit || null,
    profilePicId: profileRecord?.profilePicId || user?.prefs?.profilePicId || null,
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
        boxShadow: 'inset 0 -1px 0 rgba(0, 0, 0, 0.4)'
      }}
    >
      <Toolbar sx={{ 
        gap: 3, 
        px: { xs: 2, md: 4 }, 
        minHeight: '88px' 
      }}>
        {/* Left: Logo */}
        <Logo 
          app="note" 
          size={40} 
          variant="full"
          sx={{ 
            cursor: 'pointer', 
            '&:hover': { opacity: 0.8 }
          }}
          component="a"
          href="/"
        />

        {/* Center: Search */}
        <Box sx={{ flexGrow: 1, maxWidth: 600, display: { xs: 'none', md: 'block' } }}>
          <TopBarSearch />
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Tooltip title="Cognitive Link (AI)">
            <IconButton 
              onClick={() => setIsAIModalOpen(true)}
              sx={{ 
                color: '#6366F1',
                bgcolor: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid',
                borderColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '12px',
                width: 44,
                height: 44,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                '&:hover': { 
                  bgcolor: 'rgba(99, 102, 241, 0.08)', 
                  borderColor: '#6366F1',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 15px rgba(99, 102, 241, 0.2)' 
                }
              }}
            >
              <Sparkles size={20} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Secure Wallet">
            <IconButton 
              onClick={() => setIsWalletOpen(true)}
              sx={{ 
                color: '#EC4899',
                bgcolor: '#161412',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                width: 44,
                height: 44,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                '&:hover': { 
                  bgcolor: '#1C1A18', 
                  borderColor: '#EC4899',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 15px rgba(236, 72, 153, 0.1)' 
                }
              }}
            >
              <Wallet size={20} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Kylrix Portal (Ctrl+Space)">
            <IconButton 
              onClick={() => setIsEcosystemPortalOpen(true)}
              sx={{ 
                color: '#6366F1',
                bgcolor: '#161412',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                width: 44,
                height: 44,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                '&:hover': { 
                  bgcolor: '#1C1A18', 
                  borderColor: '#6366F1',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 15px rgba(99, 102, 241, 0.1)' 
                }
              }}
            >
              <LayoutGrid size={22} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>

          {isAuthenticated ? (
            <IconButton 
              onClick={(e) => setAnchorElAccount(e.currentTarget)}
              sx={{ 
                p: 0.5,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '14px',
                bgcolor: '#161412',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                '&:hover': { borderColor: 'rgba(99, 102, 241, 0.3)', bgcolor: '#1C1A18' },
                transition: 'all 0.2s'
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
                '&:hover': { background: 'linear-gradient(135deg, #F472B6 0%, #C084FC 100%)', transform: 'translateY(-1px)' }
              }}
            >
              Connect
            </Button>
          )}
        </Box>

        {/* Account Menu */}
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
              color: 'white'
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2.5, py: 2.5, bgcolor: '#0A0908', borderRadius: '20px', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-mono)' }}>
              Identity
            </Typography>
            <Box sx={{ mt: 1 }}>
              <IdentityName verified={identitySignals.verified} sx={{ fontWeight: 800, color: 'white', fontFamily: 'var(--font-satoshi)' }}>
                {user?.name || user?.email}
              </IdentityName>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', mt: 0.5, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
              {user?.email}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <SubscriptionBadge showFree />
            </Box>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />
          <Box sx={{ py: 0.5 }}>
            <MenuItem 
              onClick={() => {
                setAnchorElAccount(null);
                const domain = process.env.NEXT_PUBLIC_DOMAIN || 'kylrix.space';
                const idSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'accounts';
                window.location.href = `https://${idSubdomain}.${domain}/settings?source=${encodeURIComponent(window.location.origin)}&tab=profile`;
              }}
              sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: '#1C1A18' } }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><Settings size={18} strokeWidth={1.5} color="rgba(255, 255, 255, 0.6)" /></ListItemIcon>
              <ListItemText primary="Account Settings" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontFamily: 'var(--font-satoshi)' }} />
            </MenuItem>
            <MenuItem 
              onClick={() => {
                alert('Exporting your data to Markdown...');
                setAnchorElAccount(null);
              }}
              sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: '#1C1A18' } }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><Download size={18} strokeWidth={1.5} color="rgba(255, 255, 255, 0.6)" /></ListItemIcon>
              <ListItemText primary="Export Vault" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontFamily: 'var(--font-satoshi)' }} />
            </MenuItem>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />
          <MenuItem onClick={handleLogout} sx={{ py: 2, px: 2.5, borderRadius: '16px', color: '#FF4D4D', '&:hover': { bgcolor: alpha('#FF4D4D', 0.05) } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><LogOut size={18} strokeWidth={1.5} color="#FF4D4D" /></ListItemIcon>
            <ListItemText primary="Disconnect Session" primaryTypographyProps={{ variant: 'body2', fontWeight: 800, fontFamily: 'var(--font-satoshi)' }} />
          </MenuItem>
        </Menu>

        <AICommandModal 
          isOpen={isAIModalOpen} 
          onClose={() => setIsAIModalOpen(false)} 
        />

        <EcosystemPortal 
          open={isEcosystemPortalOpen} 
          onClose={() => setIsEcosystemPortalOpen(false)} 
        />

        <WalletSidebar
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
        />
      </Toolbar>
    </AppBar>
  );
}
