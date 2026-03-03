'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Box, Typography, Stack, IconButton, useTheme, useMediaQuery, Button } from '@mui/material';
import { motion, AnimatePresence, useSpring, useTransform, useAnimation } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/ui/AuthContext';
import { 
  CheckCircle as SuccessIcon, 
  Error as ErrorIcon, 
  Info as InfoIcon, 
  Warning as WarningIcon,
  Close as CloseIcon,
  Star as ProIcon,
  AutoAwesome as SparklesIcon,
  EmojiObjects as IdeaIcon,
  Message as ConnectIcon,
  Assignment as TaskIcon,
  Description as NoteIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { getEcosystemUrl } from '@/constants/ecosystem';

export type IslandType = 'success' | 'error' | 'warning' | 'info' | 'pro' | 'system' | 'suggestion' | 'connect';

export interface IslandNotification {
  id: string;
  type: IslandType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  majestic?: boolean;
  shape?: 'island' | 'ball' | 'pill';
  personal?: boolean;
  timestamp?: number;
}

interface IslandContextType {
  showIsland: (notification: Omit<IslandNotification, 'id'>) => void;
  dismissIsland: (id: string) => void;
  allNotifications: IslandNotification[];
}

const IslandContext = createContext<IslandContextType | undefined>(undefined);

export function useIsland() {
  const context = useContext(IslandContext);
  if (!context) {
    throw new Error('useIsland must be used within an IslandProvider');
  }
  return context;
}

export const IslandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<IslandNotification[]>([]);
  const [allNotifications, setAllNotifications] = useState<IslandNotification[]>([]);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const showIsland = useCallback((notification: Omit<IslandNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newNotif = { 
      ...notification, 
      id, 
      duration: notification.duration || (notification.majestic ? 10000 : 6000),
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, newNotif]);
    
    // Add to history if not a duplicate (by title and message)
    setAllNotifications(prev => {
      const isDuplicate = prev.some(n => n.title === notification.title && n.message === notification.message);
      if (isDuplicate) return prev;
      return [newNotif, ...prev].slice(0, 50); // Keep last 50
    });
  }, []);

  const dismissIsland = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Track user activity
  useEffect(() => {
    const activityHandler = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keydown', activityHandler);
    window.addEventListener('click', activityHandler);
    
    return () => {
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      window.removeEventListener('click', activityHandler);
    };
  }, []);

  // Proactive suggestions when idle
  useEffect(() => {
    const idleInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivity;

      // If idle for more than 40 seconds and no active island
      if (idleTime > 40000 && notifications.length === 0) {
        const userName = user?.name?.split(' ')[0] || '';
        
        const suggestions = [
          {
            type: 'suggestion' as IslandType,
            title: userName || "Thinking time?",
            message: "You've been quiet. How about reviewing your latest notes?",
            action: { label: "Open Notes", onClick: () => window.location.href = '/notes' },
            personal: !!userName
          },
          {
            type: 'connect' as IslandType,
            title: userName || "Stay Connected",
            message: "Share a quick snippet of what you're working on with someone in Connect.",
            action: { label: "Go to Connect", onClick: () => window.location.href = getEcosystemUrl('connect') },
            majestic: true,
            personal: !!userName
          },
          {
            type: 'suggestion' as IslandType,
            title: "Focus Check",
            message: "Need to clear your head? Try organizing your tags.",
            action: { label: "Manage Tags", onClick: () => window.location.href = '/notes?tab=tags' }
          }
        ];
        
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        showIsland(randomSuggestion);
        setLastActivity(Date.now()); // Reset to avoid spam
      }
    }, 10000);

    return () => clearInterval(idleInterval);
  }, [lastActivity, notifications.length, showIsland, user]);

  return (
    <IslandContext.Provider value={{ showIsland, dismissIsland, allNotifications }}>
      {children}
      <DynamicIslandOverlay notifications={notifications} onDismiss={dismissIsland} isMobile={isMobile} />
    </IslandContext.Provider>
  );
};

const DynamicIslandOverlay: React.FC<{ 
  notifications: IslandNotification[], 
  onDismiss: (id: string) => void,
  isMobile: boolean 
}> = ({ notifications, onDismiss, isMobile }) => {
  const current = notifications[notifications.length - 1]; // Show most recent
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(false);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const pathname = usePathname();

  // Sync ref with state
  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  // Reset expansion ONLY when the notification ID actually changes
  useEffect(() => {
    if (current?.id && current.id !== lastSeenId) {
      setIsExpanded(false);
      setLastSeenId(current.id);
      setCopied(false);
    }
  }, [current?.id, lastSeenId]);

  // Handle outside click and ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && islandRef.current && !islandRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (isExpanded && event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isExpanded]);

  // Hide island if user is focusing on content
  const isHiddenRoute = pathname?.includes('/edit') || pathname?.includes('/n/');

  useEffect(() => {
    if (current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Auto-dismiss logic (only if not expanded)
      const startTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          // Use ref to avoid stale closure
          if (!isExpandedRef.current) {
            onDismiss(current.id);
          }
        }, current.duration || 6000);
      };

      if (!isExpanded) {
        startTimeout();
      }

      // Majestic entrance and pulsing logic
      if (current.majestic) {
        controls.start({
          y: [0, -4, 0],
          transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        });
      } else {
        controls.start({
          y: [0, -2, 0],
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        });
      }
    }
  }, [current?.id, onDismiss, controls, isExpanded]);

  if (!current || isHiddenRoute) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (current.message) {
      navigator.clipboard.writeText(current.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTypeStyle = () => {
    switch (current.type) {
      case 'success': return { color: '#00F5FF', icon: <SuccessIcon fontSize="small" /> };
      case 'error': return { color: '#FF3B30', icon: <ErrorIcon fontSize="small" /> };
      case 'pro': return { color: '#00F5FF', icon: <ProIcon fontSize="small" /> };
      case 'warning': return { color: '#FF9500', icon: <WarningIcon fontSize="small" /> };
      case 'suggestion': return { color: '#A855F7', icon: <IdeaIcon fontSize="small" /> };
      case 'connect': return { color: '#00F5FF', icon: <ConnectIcon fontSize="small" /> };
      default: return { color: '#00F5FF', icon: <InfoIcon fontSize="small" /> };
    }
  };

  const style = getTypeStyle();

  return (
    <>
      {/* Majestic Glow Effect */}
      {current.majestic && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      )}

      <Box
        sx={{
          position: 'fixed',
          top: isMobile ? 12 : 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          pointerEvents: 'none'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ y: -100, scale: 0.8, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -100, scale: 0.5, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30,
              mass: 0.8 
            }}
            onHoverStart={() => setIsExpanded(true)}
            onHoverEnd={() => {
              // Only auto-collapse if not mobile and NOT expanded via click/hover already
              // This is a bit tricky, but usually, we want it to collapse on hover end
              // UNLESS the user is actively interacting with it.
              if (!isMobile) setIsExpanded(false);
            }}
            onClick={(_e) => {
              e.stopPropagation();
              // Force expansion on click, making it "sticky"
              setIsExpanded(true);
            }}
            ref={islandRef}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          >
            <motion.div
              animate={controls}
              style={{
                width: isExpanded ? (isMobile ? '340px' : '420px') : (isMobile ? (current.shape === 'ball' ? '44px' : '180px') : (current.shape === 'ball' ? '50px' : '240px')),
                height: isExpanded ? 'auto' : (current.shape === 'ball' ? (isMobile ? '44px' : '50px') : '44px'),
                borderRadius: isExpanded ? '28px' : (current.shape === 'ball' ? '50%' : '22px'),
                background: 'rgba(10, 10, 10, 0.9)',
                backdropFilter: 'blur(32px) saturate(200%)',
                border: current.majestic ? '1.5px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: current.majestic ? '0 0 30px rgba(0, 240, 255, 0.3)' : '0 12px 48px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Internal Pulsing Dots */}
              {!isExpanded && current.shape !== 'ball' && (
                <Box sx={{ 
                  position: 'absolute', 
                  right: 16, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  gap: 0.6
                }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3] 
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: style.color
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Compressed Content */}
              <Box
                sx={{
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  gap: 1.5,
                  opacity: isExpanded ? 0 : 1,
                  transition: 'opacity 0.2s',
                  width: '100%',
                  position: isExpanded ? 'absolute' : 'relative',
                  justifyContent: current.shape === 'ball' ? 'center' : 'flex-start'
                }}
              >
                <Box sx={{ color: style.color, display: 'flex' }}>
                  {style.icon}
                </Box>
                {current.shape !== 'ball' && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.title}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-space-grotesk)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {current.personal ? `Hey, ${current.title}` : current.title}
                      </Typography>
                    </motion.div>
                  </AnimatePresence>
                )}
              </Box>

              {/* Expanded Reality */}
              <Box
                sx={{
                  p: 2.5,
                  opacity: isExpanded ? 1 : 0,
                  transition: 'opacity 0.3s 0.1s',
                  display: isExpanded ? 'block' : 'none'
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <motion.div
                      animate={current.majestic ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          bgcolor: `${style.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: style.color,
                          border: `1px solid ${style.color}30`,
                          boxShadow: current.majestic ? `0 0 15px ${style.color}40` : 'none'
                        }}
                      >
                        {style.icon}
                      </Box>
                    </motion.div>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          color: 'white',
                          fontWeight: 900,
                          letterSpacing: '-0.02em',
                          fontFamily: 'var(--font-space-grotesk)',
                          fontSize: '1.1rem'
                        }}
                      >
                        {current.title}
                      </Typography>
                      {current.message && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255,255,255,0.5)',
                            lineHeight: 1.4,
                            mt: 0.5,
                            fontFamily: 'Satoshi, sans-serif'
                          }}
                        >
                          {current.message}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {/* Actions Area */}
                  <Stack direction="row" spacing={1.5}>
                    {current.action && (
                      <Button
                        onClick={(_e) => {
                          e.stopPropagation();
                          current.action?.onClick();
                          onDismiss(current.id);
                        }}
                        variant="contained"
                        fullWidth
                        sx={{
                          borderRadius: '14px',
                          textTransform: 'none',
                          background: current.majestic ? `linear-gradient(45deg, ${style.color}, #00F5FF)` : 'white',
                          color: current.majestic ? 'black' : 'black',
                          fontWeight: 700,
                          height: 48,
                          '&:hover': {
                            background: current.majestic ? `linear-gradient(45deg, ${style.color}, #00F5FF)` : 'rgba(255,255,255,0.9)',
                            opacity: 0.9
                          }
                        }}
                      >
                        {current.action.label}
                      </Button>
                    )}
                    
                    {current.type === 'error' && (
                      <IconButton
                        onClick={handleCopy}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '14px',
                          bgcolor: 'rgba(255,255,255,0.05)',
                          color: copied ? '#00FF00' : 'rgba(255,255,255,0.4)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    )}

                    <IconButton
                      onClick={(_e) => {
                        e.stopPropagation();
                        onDismiss(current.id);
                      }}
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '14px',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </Box>
    </>
  );
};
