"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  
  
  Clock,
  Maximize2,
  Minimize2,
  
  Info,
  Layers,
  Zap
} from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useIsland } from '@/components/ui/DynamicIsland';
import { motion, AnimatePresence } from 'framer-motion';

import { useOverlay } from '@/components/ui/OverlayContext';
import { getUserProfilePicId } from '@/lib/utils';
import { fetchProfilePreview, getCachedProfilePreview } from '@/lib/profilePreview';
import { TopBarSearch } from '@/components/TopBarSearch';
import { AICommandModal } from '@/components/ai/AICommandModal';
import { EcosystemPortal } from '@/components/common/EcosystemPortal';
import Logo from '@/components/common/Logo';
import { getEcosystemUrl } from '@/constants/ecosystem';

interface AppHeaderProps {
  className?: string;
}

export default function AppHeader({ className }: AppHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { allNotifications: islandHistory } = useIsland();
  const { } = useOverlay();
  const [anchorElAccount, setAnchorElAccount] = useState<null | HTMLElement>(null);
  
  // Advanced Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifViewMode, setNotifViewMode] = useState<'dropdown' | 'sidebar'>('dropdown');
  const [notifTab, setNotifTab] = useState<'app' | 'island'>('app');

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isEcosystemPortalOpen, setIsEcosystemPortalOpen] = useState(false);

  const [_currentSubdomain, setCurrentSubdomain] = useState<string | null>(null);
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
      } catch (err: any) {
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
        bgcolor: 'rgba(5, 5, 5, 0.03)',
        backdropFilter: 'blur(25px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundImage: 'none'
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
            '&:hover': { opacity: 0.8 },
            fontFamily: 'var(--font-clash)',
            fontWeight: 900,
            letterSpacing: '-0.04em'
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
          <Tooltip title="Notifications">
            <IconButton 
              onClick={toggleNotifications}
              sx={{ 
                color: (unreadCount > 0 || isNotificationsOpen) ? '#6366F1' : 'rgba(255, 255, 255, 0.4)',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor: (unreadCount > 0 || isNotificationsOpen) ? alpha('#6366F1', 0.2) : 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                width: 44,
                height: 44,
                position: 'relative',
                zIndex: 1301,
                '&:hover': { 
                  bgcolor: 'rgba(255, 255, 255, 0.05)', 
                  borderColor: alpha('#6366F1', 0.4),
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)' 
                }
              }}
            >
              <Bell size={20} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  bgcolor: '#6366F1',
                  color: '#000',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #050505',
                  fontFamily: 'var(--font-mono)'
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
                  initial={notifViewMode === 'dropdown' ? { opacity: 0, scale: 0.9, y: -20, x: 'calc(100% - 480px)' } : { opacity: 0, x: 400 }}
                  animate={notifViewMode === 'dropdown' 
                    ? { opacity: 1, scale: 1, y: 100, x: 'calc(100% - 480px)', width: 400, height: 'auto', maxHeight: 640, borderRadius: 28, top: 0, right: 0 } 
                    : { opacity: 1, x: 0, y: 0, width: 440, height: '100vh', maxHeight: '100vh', borderRadius: 0, top: 0, right: 0 }
                  }
                  exit={notifViewMode === 'dropdown' ? { opacity: 0, scale: 0.9, y: -20 } : { opacity: 0, x: 400 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                  style={{
                    position: 'fixed',
                    zIndex: 1300,
                    background: 'rgba(5, 5, 5, 0.05)',
                    backdropFilter: 'blur(35px) saturate(200%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header */}
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Zap size={18} color="#6366F1" strokeWidth={2} />
                      <Typography variant="caption" sx={{ fontWeight: 900, color: 'white', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Intelligence Feed
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small" 
                        onClick={() => setNotifViewMode(notifViewMode === 'dropdown' ? 'sidebar' : 'dropdown')}
                        sx={{ color: 'rgba(255, 255, 255, 0.3)', '&:hover': { color: '#6366F1', bgcolor: 'rgba(99, 102, 241, 0.05)' } }}
                      >
                        {notifViewMode === 'dropdown' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                      </IconButton>
                    </Stack>
                  </Box>

                  {/* Tabs */}
                  <Box sx={{ display: 'flex', p: 1.5, gap: 1.5, bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                    <Box 
                      onClick={() => setNotifTab('app')}
                      sx={{ 
                        flex: 1, py: 1.2, textAlign: 'center', cursor: 'pointer', borderRadius: '14px',
                        bgcolor: notifTab === 'app' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: notifTab === 'app' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: notifTab === 'app' ? '#6366F1' : 'rgba(255, 255, 255, 0.3)', letterSpacing: '0.05em', fontFamily: 'var(--font-satoshi)' }}>
                        SYSTEM ({notifications.length})
                      </Typography>
                    </Box>
                    <Box 
                      onClick={() => setNotifTab('island')}
                      sx={{ 
                        flex: 1, py: 1.2, textAlign: 'center', cursor: 'pointer', borderRadius: '14px',
                        bgcolor: notifTab === 'island' ? 'rgba(168, 85, 247, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: notifTab === 'island' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: notifTab === 'island' ? '#A855F7' : 'rgba(255, 255, 255, 0.3)', letterSpacing: '0.05em', fontFamily: 'var(--font-satoshi)' }}>
                        ISLAND ({islandHistory.length})
                      </Typography>
                    </Box>
                  </Box>

                  {/* Content */}
                  <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 10 } }}>
                    <AnimatePresence mode="wait">
                      {notifTab === 'app' ? (
                        <motion.div
                          key="app-notifs"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                        >
                          {notifications.length === 0 ? (
                            <Box sx={{ py: 8, textAlign: 'center', opacity: 0.2 }}>
                              <Clock size={40} style={{ margin: '0 auto 16px' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'var(--font-satoshi)' }}>Silence in the void</Typography>
                            </Box>
                          ) : (
                            notifications.map((notif) => (
                              <Paper
                                key={notif.$id}
                                elevation={0}
                                sx={{ 
                                  p: 2.5, mb: 1.5, borderRadius: '18px', bgcolor: 'rgba(255, 255, 255, 0.02)', 
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)', borderColor: alpha('#6366F1', 0.2) },
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => markAsRead(notif.$id)}
                              >
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                  <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                    <Layers size={18} color="#6366F1" strokeWidth={1.5} />
                                  </Box>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'white', display: 'block', mb: 0.5, fontFamily: 'var(--font-satoshi)', letterSpacing: '0.02em' }}>
                                      {notif.action.toUpperCase()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', lineHeight: 1.4, fontFamily: 'var(--font-satoshi)' }}>
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
                            <Box sx={{ py: 8, textAlign: 'center', opacity: 0.2 }}>
                              <Sparkles size={40} style={{ margin: '0 auto 16px' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'var(--font-satoshi)' }}>Island has been quiet</Typography>
                            </Box>
                          ) : (
                            islandHistory.map((notif) => (
                              <Paper
                                key={notif.id}
                                elevation={0}
                                sx={{ 
                                  p: 2.5, mb: 1.5, borderRadius: '18px', bgcolor: 'rgba(255, 255, 255, 0.02)', 
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)', borderColor: alpha('#A855F7', 0.2) },
                                  cursor: 'pointer',
                                  position: 'relative'
                                }}
                              >
                                <Tooltip title="Copy Content">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(`${notif.title}: ${notif.message || ''}`);
                                    }}
                                    sx={{ 
                                      position: 'absolute', 
                                      top: 10, 
                                      right: 10, 
                                      color: 'rgba(255, 255, 255, 0.2)',
                                      '&:hover': { color: '#6366F1', bgcolor: 'rgba(255, 255, 255, 0.05)' }
                                    }}
                                  >
                                    <Download size={14} strokeWidth={1.5} />
                                  </IconButton>
                                </Tooltip>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                  <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: 'rgba(168, 85, 247, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                                    <Info size={18} color="#A855F7" strokeWidth={1.5} />
                                  </Box>
                                  <Box sx={{ minWidth: 0, pr: 3 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'white', display: 'block', mb: 0.5, fontFamily: 'var(--font-satoshi)' }}>
                                      {notif.title.toUpperCase()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', lineHeight: 1.4, fontFamily: 'var(--font-satoshi)' }}>
                                      {notif.message}
                                    </Typography>
                                    {notif.timestamp && (
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.65rem', mt: 1, display: 'block', fontFamily: 'var(--font-mono)' }}>
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
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Button 
                      fullWidth 
                      variant="text" 
                      onClick={() => markAllAsRead()}
                      sx={{ 
                        color: '#6366F1', 
                        fontWeight: 900, 
                        fontSize: '0.65rem',
                        letterSpacing: '0.1em',
                        fontFamily: 'var(--font-mono)',
                        '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.05)' } 
                      }}
                    >
                      REVEAL ALL ACTIVITY
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
                color: '#6366F1',
                bgcolor: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid',
                borderColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '12px',
                width: 44,
                height: 44,
                '&:hover': { 
                  bgcolor: 'rgba(99, 102, 241, 0.08)', 
                  borderColor: '#6366F1',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' 
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
              <LayoutGrid size={22} strokeWidth={1.5} />
            </IconButton>
          </Tooltip>

          {isAuthenticated ? (
            <IconButton 
              onClick={(e) => setAnchorElAccount(e.currentTarget)}
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

        {/* Account Menu */}
        <Menu
          anchorEl={anchorElAccount}
          open={Boolean(anchorElAccount)}
          onClose={() => setAnchorElAccount(null)}
          PaperProps={{
            sx: {
              mt: 2,
              width: 280,
              bgcolor: 'rgba(5, 5, 5, 0.05)',
              backdropFilter: 'blur(35px) saturate(180%)',
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
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block', mt: 0.5, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
              {user?.email}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />
          <Box sx={{ py: 0.5 }}>
            <MenuItem 
              component={Link}
              href="/settings"
              onClick={() => {
                setAnchorElAccount(null);
              }}
              sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><Settings size={18} strokeWidth={1.5} color="rgba(255, 255, 255, 0.6)" /></ListItemIcon>
              <ListItemText primary="Account Settings" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, fontFamily: 'var(--font-satoshi)' }} />
            </MenuItem>
            <MenuItem 
              onClick={() => {
                alert('Exporting your data to Markdown...');
                setAnchorElAccount(null);
              }}
              sx={{ py: 1.8, px: 2.5, borderRadius: '16px', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}
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
      </Toolbar>
    </AppBar>
  );
}
