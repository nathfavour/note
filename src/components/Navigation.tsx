"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthContext';
import { useSidebar } from '@/components/ui/SidebarContext';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { getUserProfilePicId } from '@/lib/utils';

import { 
  Box, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  IconButton, 
  Avatar, 
  Paper,
  Tooltip,
  alpha
} from '@mui/material';
import {
  FileText,
  Link2,
  Tag,
  Settings,
  Puzzle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet
} from 'lucide-react';
import { WalletSidebar } from '@/components/overlays/WalletSidebar';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const navLinks = [
    { icon: FileText, href: '/notes', label: 'Notes' },
    { icon: Link2, href: '/shared', label: 'Links' },
    { icon: Tag, href: '/tags', label: 'Tags' },
    { icon: Puzzle, href: '/extensions', label: 'Caps' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 1300,
        display: { xs: 'block', md: 'none' }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#161412',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          px: 2,
          py: 1.5,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 40px rgba(0,0,0,0.6)',
          backgroundImage: 'none'
        }}
      >
        {navLinks.map(({ icon: Icon, href }) => (
          <IconButton
            key={href}
            component={Link}
            href={href}
            sx={{
              color: isActive(href) ? '#000' : 'rgba(255, 255, 255, 0.6)',
              bgcolor: isActive(href) ? '#EC4899' : 'transparent',
              borderRadius: '16px',
              p: 1.5,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: isActive(href) ? '#EC4899' : 'rgba(255, 255, 255, 0.05)',
                transform: 'translateY(-2px)'
              },
              ...(isActive(href) && {
                boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)',
                transform: 'translateY(-4px)'
              })
            }}
          >
            <Icon size={24} strokeWidth={1.5} />
          </IconButton>
        ))}
        <IconButton
          onClick={() => setIsWalletOpen(true)}
          sx={{
            color: isWalletOpen ? '#000' : 'rgba(255, 255, 255, 0.6)',
            bgcolor: isWalletOpen ? '#EC4899' : 'transparent',
            borderRadius: '16px',
            p: 1.5,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: isWalletOpen ? '#EC4899' : 'rgba(255, 255, 255, 0.05)',
              transform: 'translateY(-2px)'
            },
            ...(isWalletOpen && {
              boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)',
              transform: 'translateY(-4px)'
            })
          }}
        >
          <Wallet size={24} strokeWidth={1.5} />
        </IconButton>
      </Paper>
      <WalletSidebar isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </Box>
  );
};

export const DesktopSidebar: React.FC = () => {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [smallProfileUrl, setSmallProfileUrl] = useState<string | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const profilePicId = getUserProfilePicId(user);
    const cached = getCachedProfilePreview(profilePicId || undefined);
    if (cached !== undefined && mounted) {
      setSmallProfileUrl(cached ?? null);
    }

    const fetchPreview = async () => {
      try {
        if (profilePicId) {
          const url = await fetchProfilePreview(profilePicId, 64, 64);
          if (mounted) setSmallProfileUrl(url as unknown as string);
        } else if (mounted) setSmallProfileUrl(null);
      } catch (_err: any) {
        if (mounted) setSmallProfileUrl(null);
      }
    };

    fetchPreview();
    return () => { mounted = false; };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_err) {
      // Ignore
    }
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const navItems = [
    { icon: FileText, label: 'Notes', path: '/notes' },
    { icon: Link2, label: 'Shared Links', path: '/shared' },
    { icon: Tag, label: 'Tags', path: '/tags' },
    { icon: Puzzle, label: 'Extensions', path: '/extensions' },
    { icon: Wallet, label: 'Wallet', path: 'wallet', action: () => setIsWalletOpen(true) },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        bgcolor: '#0A0908',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '10px 0 30px rgba(0,0,0,0.5), inset -1px 0 0 rgba(0, 0, 0, 0.4)',
        transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        width: isCollapsed ? '80px' : '280px',
        zIndex: 1200,
        pt: '88px' // Match AppHeader minHeight
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        p: 3,
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {!isCollapsed && (
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>
            Navigation
          </Typography>
        )}
        <IconButton 
          size="small" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.4)',
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)', color: 'white' }
          }}
        >
          {isCollapsed ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
        </IconButton>
      </Box>

      <List sx={{ flex: 1, px: 2, py: 3, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.action ? isWalletOpen : isActive(item.path);

          return (
            <Tooltip key={item.path} title={isCollapsed ? item.label : ''} placement="right">
              <ListItemButton
                {...(item.action ? { onClick: item.action } : { component: Link, href: item.path })}
                sx={{
                  borderRadius: '16px',
                  mb: 1.5,
                  px: isCollapsed ? 2 : 2.5,
                  py: 1.75,
                  transition: 'all 0.2s ease',
                  bgcolor: active ? alpha('#EC4899', 0.1) : 'transparent',
                  color: active ? '#EC4899' : 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid',
                  borderColor: active ? alpha('#EC4899', 0.2) : 'transparent',
                  boxShadow: active ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 'none',
                  '&:hover': {
                    bgcolor: active ? alpha('#EC4899', 0.15) : '#161412',
                    transform: 'translateX(4px)',
                    color: active ? '#EC4899' : 'white',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  },
                  justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: isCollapsed ? 0 : 40, 
                  color: 'inherit',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} strokeWidth={1.5} />
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      variant: 'body2', 
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      fontFamily: 'var(--font-satoshi)'
                    }} 
                  />
                )}
                {active && !isCollapsed && (
                  <Box sx={{ width: 4, height: 20, bgcolor: '#EC4899', borderRadius: '2px', ml: 'auto', boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)' }} />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
      <WalletSidebar isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />

      <Box sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        {isAuthenticated && user && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2, 
            borderRadius: '16px', 
            bgcolor: '#161412',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            mb: 2,
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}>
            <Avatar 
              src={smallProfileUrl || undefined}
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: '#0A0908',
                color: '#EC4899',
                fontSize: '0.875rem',
                fontWeight: 800,
                borderRadius: '10px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </Avatar>
            {!isCollapsed && (
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'white', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || user.email}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, bgcolor: '#00FF00', borderRadius: '50%', boxShadow: '0 0 8px #00FF00' }} />
                  <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '16px',
            px: isCollapsed ? 2 : 2.5,
            py: 1.5,
            color: 'rgba(255, 255, 255, 0.4)',
            '&:hover': {
              bgcolor: alpha('#FF4D4D', 0.05),
              color: '#FF4D4D'
            },
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}
        >
          <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 40, color: 'inherit', justifyContent: 'center' }}>
            <LogOut size={20} strokeWidth={1.5} />
          </ListItemIcon>
          {!isCollapsed && (
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ 
                variant: 'caption', 
                fontWeight: 800, 
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }} 
            />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default function Navigation() {
  return (
    <>
      <DesktopSidebar />
      <MobileBottomNav />
    </>
  );
}
