"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  AppBar, 
  Toolbar, 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  Tooltip, 
  Divider,
  ListItemIcon,
  ListItemText,
  Grid,
  Paper,
  alpha
} from '@mui/material';
import {
  Settings,
  LogOut,
  LayoutGrid,
  Download,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';

import { useOverlay } from '@/components/ui/OverlayContext';
import { getUserProfilePicId } from '@/lib/utils';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { ECOSYSTEM_APPS, getEcosystemUrl } from '@/constants/ecosystem';
import { TopBarSearch } from '@/components/TopBarSearch';
import { AICommandModal } from '@/components/ai/AICommandModal';
import { EcosystemPortal } from '@/components/common/EcosystemPortal';

interface AppHeaderProps {
  className?: string;
}

export default function AppHeader({ className }: AppHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { openOverlay, closeOverlay } = useOverlay();
  const [anchorElAccount, setAnchorElAccount] = useState<null | HTMLElement>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);

  const [currentSubdomain, setCurrentSubdomain] = useState<string | null>(null);
  const [smallProfileUrl, setSmallProfileUrl] = useState<string | null>(null);
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
      } catch (err) {
        console.warn('Failed to load profile preview', err);
        if (mounted) setSmallProfileUrl(null);
      }
    };
    fetchPreview();
    return () => { mounted = false; };
  }, [profilePicId]);

  const handleLogout = () => {
    setAnchorElAccount(null);
    logout();
  };

  if (!isAuthenticated) {
    return null;
  }


  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      className={className}
      sx={{ 
        zIndex: 1201,
        bgcolor: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(25px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundImage: 'none'
      }}
    >
      <Toolbar sx={{ gap: { xs: 2, md: 4 }, px: { xs: 2, md: 3 }, minHeight: '72px' }}>
        {/* Left: Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Box sx={{ 
            width: 42, 
            height: 42, 
            bgcolor: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <Image src="/logo/whisperrnote.png" alt="Logo" width={28} height={28} style={{ objectFit: 'contain' }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 900, 
              letterSpacing: '-0.05em',
              fontFamily: 'var(--font-space-grotesk)',
              color: 'white'
            }}
          >
            WHISPERR<Box component="span" sx={{ color: '#00F5FF' }}>NOTE</Box>
          </Typography>
        </Box>

        {/* Center: Search */}
        <Box sx={{ flexGrow: 1, maxWidth: 700 }}>
          <TopBarSearch />
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Tooltip title="Cognitive Link (AI)">
            <IconButton 
              onClick={() => setIsAIModalOpen(true)}
              sx={{ 
                color: '#00F5FF',
                bgcolor: alpha('#00F5FF', 0.03),
                border: '1px solid',
                borderColor: alpha('#00F5FF', 0.1),
                borderRadius: '12px',
                width: 42,
                height: 42,
                '&:hover': { 
                  bgcolor: alpha('#00F5FF', 0.08), 
                  boxShadow: '0 0 15px rgba(0, 245, 255, 0.2)' 
                }
              }}
            >
              <Sparkles size={20} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Whisperr Portal (Ctrl+Space)">
            <IconButton 
              onClick={() => setIsEcosystemPortalOpen(true)}
              sx={{ 
                color: '#00F5FF',
                bgcolor: alpha('#00F5FF', 0.05),
                border: '1px solid',
                borderColor: alpha('#00F5FF', 0.1),
                borderRadius: '12px',
                width: 42,
                height: 42,
                animation: 'pulse-slow 4s infinite ease-in-out',
                '@keyframes pulse-slow': {
                  '0%': { boxShadow: '0 0 0 0 rgba(0, 245, 255, 0.2)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(0, 245, 255, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(0, 245, 255, 0)' },
                },
                '&:hover': { 
                  bgcolor: alpha('#00F5FF', 0.1), 
                  borderColor: '#00F5FF',
                  boxShadow: '0 0 15px rgba(0, 245, 255, 0.3)' 
                }
              }}
            >
              <LayoutGrid size={22} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>

          <IconButton 
            onClick={(e) => setAnchorElAccount(e.currentTarget)}
            sx={{ 
              p: 0.5,
              '&:hover': { transform: 'scale(1.05)' },
              transition: 'transform 0.2s'
            }}
          >
            <Avatar 
              src={smallProfileUrl || undefined}
              sx={{ 
                width: 38, 
                height: 38, 
                bgcolor: '#00F5FF',
                fontSize: '0.875rem',
                fontWeight: 800,
                color: '#000',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
        </Box>

        {/* Account Menu */}
        <Menu
          anchorEl={anchorElAccount}
          open={Boolean(anchorElAccount)}
          onClose={() => setAnchorElAccount(null)}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: 280,
              bgcolor: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(25px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              backgroundImage: 'none',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }
          }}
        >
          <Box sx={{ px: 3, py: 2.5, bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Account Identity
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'white', mt: 0.5, opacity: 0.9 }}>
              {user?.email}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
          <Box sx={{ py: 1 }}>
            <MenuItem 
              onClick={() => {
                window.location.href = `https://${process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'id'}.${process.env.NEXT_PUBLIC_DOMAIN || 'whisperrnote.space'}/settings?source=${encodeURIComponent(window.location.origin)}`;
                setAnchorElAccount(null);
              }}
              sx={{ py: 1.5, px: 3, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}
            >
              <ListItemIcon><Settings size={18} strokeWidth={1.5} sx={{ color: 'rgba(255, 255, 255, 0.4)' }} /></ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ variant: 'caption', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white' }} />
            </MenuItem>
            <MenuItem 
              onClick={() => {
                alert('Exporting your data to Markdown...');
                setAnchorElAccount(null);
              }}
              sx={{ py: 1.5, px: 3, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}
            >
              <ListItemIcon><Download size={18} strokeWidth={1.5} sx={{ color: 'rgba(255, 255, 255, 0.4)' }} /></ListItemIcon>
              <ListItemText primary="Export Data" primaryTypographyProps={{ variant: 'caption', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white' }} />
            </MenuItem>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
          <MenuItem onClick={handleLogout} sx={{ py: 2, px: 3, color: '#FF4D4D', '&:hover': { bgcolor: alpha('#FF4D4D', 0.05) } }}>
            <ListItemIcon><LogOut size={18} strokeWidth={1.5} sx={{ color: '#FF4D4D' }} /></ListItemIcon>
            <ListItemText primary="Sign Out" primaryTypographyProps={{ variant: 'caption', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
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
      </Toolbar>
    </AppBar>
  );
}
