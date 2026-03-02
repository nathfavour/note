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
  alpha,
  Button,
  Stack
} from '@mui/material';
import {
  Settings,
  LogOut,
  LayoutGrid,
  Download,
  Sparkles,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Maximize2,
  Minimize2,
  ChevronRight,
  Info,
  Layers,
  Zap
} from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useIsland, IslandNotification } from '@/components/ui/DynamicIsland';
import { motion, AnimatePresence } from 'framer-motion';

import { useOverlay } from '@/components/ui/OverlayContext';
import { getUserProfilePicId } from '@/lib/utils';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { ECOSYSTEM_APPS, getEcosystemUrl } from '@/constants/ecosystem';
import { TopBarSearch } from '@/components/TopBarSearch';
import { AICommandModal } from '@/components/ai/AICommandModal';
import { EcosystemPortal } from '@/components/common/EcosystemPortal';
import Logo from '@/components/common/Logo';

interface AppHeaderProps {
  className?: string;
}

export default function AppHeader({ className }: AppHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { allNotifications: islandHistory } = useIsland();
  const { openOverlay, closeOverlay } = useOverlay();
  const [anchorElAccount, setAnchorElAccount] = useState<null | HTMLElement>(null);
  
  // Advanced Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifViewMode, setNotifViewMode] = useState<'dropdown' | 'sidebar'>('dropdown');
  const [notifTab, setNotifTab] = useState<'app' | 'island'>('app');

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

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen) setNotifViewMode('dropdown');
  };


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
      <Toolbar sx={{ 
        gap: 2, 
        '@media (min-width: 900px)': { gap: 4 },
        px: { xs: 2, md: 3 }, 
        minHeight: '72px' 
      }}>
        {/* Left: Logo */}
        <Logo 
          app="note" 
          size={40} 
          variant="full"
          sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
          component="a"
          href="/"
        />

        {/* Center: Search */}
        <Box sx={{ flexGrow: 1, maxWidth: 700 }}>
          <TopBarSearch />
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Tooltip title="Notifications">
            <IconButton 
              onClick={toggleNotifications}
              sx={{ 
                color: (unreadCount > 0 || isNotificationsOpen) ? '#00F5FF' : 'rgba(255, 255, 255, 0.4)',
                bgcolor: isNotificationsOpen ? alpha('#00F5FF', 0.1) : alpha('#00F5FF', 0.03),
                border: '1px solid',
                borderColor: (unreadCount > 0 || isNotificationsOpen) ? alpha('#00F5FF', 0.3) : alpha('#00F5FF', 0.1),
                borderRadius: '12px',
                width: 42,
                height: 42,
                position: 'relative',
                zIndex: 1301,
                '&:hover': { 
                  bgcolor: alpha('#00F5FF', 0.08), 
                  boxShadow: '0 0 15px rgba(0, 245, 255, 0.2)' 
                }
              }}
            >
              <Bell size={20} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  bgcolor: '#FF4D4D',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #0A0A0A',
                  boxShadow: '0 0 10px rgba(255, 77, 77, 0.4)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Box>
              )}
            </IconButton>
          </Tooltip>

          {/* Advanced Notifications Portal */}
          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                {/* Backdrop for click-away */}
                <Box 
                  onClick={() => setIsNotificationsOpen(false)}
                  sx={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    zIndex: 1299,
                    cursor: 'default'
                  }} 
                />
                
                <motion.div
                  initial={notifViewMode === 'dropdown' ? { opacity: 0, scale: 0.9, y: -20, x: 'calc(100% - 460px)' } : { opacity: 0, x: 400 }}
                  animate={notifViewMode === 'dropdown' 
                    ? { opacity: 1, scale: 1, y: 80, x: 'calc(100% - 460px)', width: 380, height: 'auto', maxHeight: 600, borderRadius: 24, top: 0, right: 0 } 
                    : { opacity: 1, x: 0, y: 0, width: 400, height: '100vh', maxHeight: '100vh', borderRadius: 0, top: 0, right: 0 }
                  }
                  exit={notifViewMode === 'dropdown' ? { opacity: 0, scale: 0.9, y: -20 } : { opacity: 0, x: 400 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  style={{
                    position: 'fixed',
                    zIndex: 1300,
                    background: 'rgba(10, 10, 10, 0.98)',
                    backdropFilter: 'blur(30px) saturate(200%)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header */}
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Zap size={18} color="#00F5FF" />
                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'white', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        Intelligence Feed
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small" 
                        onClick={() => setNotifViewMode(notifViewMode === 'dropdown' ? 'sidebar' : 'dropdown')}
                        sx={{ color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: '#00F5FF', bgcolor: alpha('#00F5FF', 0.1) } }}
                      >
                        {notifViewMode === 'dropdown' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                      </IconButton>
                    </Stack>
                  </Box>

                  {/* Tabs */}
                  <Box sx={{ display: 'flex', p: 1, gap: 1, bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                    <Box 
                      onClick={() => setNotifTab('app')}
                      sx={{ 
                        flex: 1, py: 1, textAlign: 'center', cursor: 'pointer', borderRadius: '12px',
                        bgcolor: notifTab === 'app' ? alpha('#00F5FF', 0.1) : 'transparent',
                        border: '1px solid',
                        borderColor: notifTab === 'app' ? alpha('#00F5FF', 0.2) : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: notifTab === 'app' ? '#00F5FF' : 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.05em' }}>
                        SYSTEM ({notifications.length})
                      </Typography>
                    </Box>
                    <Box 
                      onClick={() => setNotifTab('island')}
                      sx={{ 
                        flex: 1, py: 1, textAlign: 'center', cursor: 'pointer', borderRadius: '12px',
                        bgcolor: notifTab === 'island' ? alpha('#A855F7', 0.1) : 'transparent',
                        border: '1px solid',
                        borderColor: notifTab === 'island' ? alpha('#A855F7', 0.2) : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: notifTab === 'island' ? '#A855F7' : 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.05em' }}>
                        ISLAND ({islandHistory.length})
                      </Typography>
                    </Box>
                  </Box>

                  {/* Content */}
                  <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                    <AnimatePresence mode="wait">
                      {notifTab === 'app' ? (
                        <motion.div
                          key="app-notifs"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                        >
                          {notifications.length === 0 ? (
                            <Box sx={{ py: 8, textAlign: 'center', opacity: 0.3 }}>
                              <Clock size={40} style={{ margin: '0 auto 16px' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>No system activity</Typography>
                            </Box>
                          ) : (
                            notifications.map((notif) => (
                              <Paper
                                key={notif.$id}
                                elevation={0}
                                sx={{ 
                                  p: 2, mb: 1, borderRadius: '16px', bgcolor: 'rgba(10, 10, 10, 0.4)', 
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', borderColor: alpha('#00F5FF', 0.2) },
                                  cursor: 'pointer'
                                }}
                                onClick={() => markAsRead(notif.$id)}
                              >
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#00F5FF', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Layers size={18} color="#00F5FF" />
                                  </Box>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'white', display: 'block', mb: 0.5 }}>
                                      {notif.action.toUpperCase()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                      {notif.details || notif.targetId}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Paper>
                            ))
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="island-notifs"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                        >
                          {islandHistory.length === 0 ? (
                            <Box sx={{ py: 8, textAlign: 'center', opacity: 0.3 }}>
                              <Sparkles size={40} style={{ margin: '0 auto 16px' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Island has been quiet</Typography>
                            </Box>
                          ) : (
                            islandHistory.map((notif) => (
                              <Paper
                                key={notif.id}
                                elevation={0}
                                sx={{ 
                                  p: 2, mb: 1, borderRadius: '16px', bgcolor: 'rgba(10, 10, 10, 0.4)', 
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', borderColor: alpha('#A855F7', 0.2) },
                                  cursor: 'pointer'
                                }}
                              >
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha('#A855F7', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Info size={18} color="#A855F7" />
                                  </Box>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'white', display: 'block', mb: 0.5 }}>
                                      {notif.title.toUpperCase()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                      {notif.message}
                                    </Typography>
                                    {notif.timestamp && (
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.6rem', mt: 1, display: 'block' }}>
                                        {new Date(notif.timestamp).toLocaleTimeString()}
                                      </Typography>
                                    )}
                                  </Box>
                                </Stack>
                              </Paper>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>

                  {/* Footer */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Button 
                      fullWidth 
                      variant="text" 
                      onClick={() => markAllAsRead()}
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.4)', 
                        fontWeight: 800, 
                        fontSize: '0.7rem',
                        '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' } 
                      }}
                    >
                      Clear system feed
                    </Button>
                  </Box>
                </motion.div>
              </>
            )}
          </AnimatePresence>

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

          <Tooltip title="Kylrix Portal (Ctrl+Space)">
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
                const domain = process.env.NEXT_PUBLIC_DOMAIN || 'kylrix.space';
                const idSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'id';
                window.location.href = `https://${idSubdomain}.${domain}/settings?source=${encodeURIComponent(window.location.origin)}`;
                setAnchorElAccount(null);
              }}
              sx={{ py: 1.5, px: 3, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}
            >
              <ListItemIcon><Settings size={18} strokeWidth={1.5} color="rgba(255, 255, 255, 0.4)" /></ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ variant: 'caption', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white' }} />
            </MenuItem>
            <MenuItem 
              onClick={() => {
                alert('Exporting your data to Markdown...');
                setAnchorElAccount(null);
              }}
              sx={{ py: 1.5, px: 3, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}
            >
              <ListItemIcon><Download size={18} strokeWidth={1.5} color="rgba(255, 255, 255, 0.4)" /></ListItemIcon>
              <ListItemText primary="Export Data" primaryTypographyProps={{ variant: 'caption', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white' }} />
            </MenuItem>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
          <MenuItem onClick={handleLogout} sx={{ py: 2, px: 3, color: '#FF4D4D', '&:hover': { bgcolor: alpha('#FF4D4D', 0.05) } }}>
            <ListItemIcon><LogOut size={18} strokeWidth={1.5} color="#FF4D4D" /></ListItemIcon>
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
