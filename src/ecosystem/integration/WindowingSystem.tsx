"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Box, Paper, IconButton, Typography, Stack, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  GripHorizontal
} from 'lucide-react';

interface WindowInstance {
  id: string;
  title: string;
  url: string;
  isOpen: boolean;
  isMaximized?: boolean;
}

interface WindowContextType {
  windows: WindowInstance[];
  openWindow: (title: string, url: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export const useWindowing = () => {
  const context = useContext(WindowContext);
  if (!context) throw new Error('useWindowing must be used within WindowProvider');
  return context;
};

export const WindowProvider = ({ children }: { children: ReactNode }) => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);

  const openWindow = (title: string, url: string) => {
    const id = Math.random().toString(36).substring(7);
    setWindows(prev => [...prev, { id, title, url, isOpen: true }]);
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const focusWindow = (id: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;
      return [...prev.filter(w => w.id !== id), target];
    });
  };

  return (
    <WindowContext.Provider value={{ windows, openWindow, closeWindow, focusWindow }}>
      {children}
      <div id="whisperr-window-root" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        pointerEvents: 'none', 
        zIndex: 9999 
      }}>
        <AnimatePresence>
          {windows.map((win, idx) => (
            <MiniWindow 
              key={win.id} 
              window={win} 
              index={idx}
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </WindowContext.Provider>
  );
};

const MiniWindow = ({ 
  window, 
  onClose,
  onFocus,
  index 
}: { 
  window: WindowInstance, 
  onClose: () => void,
  onFocus: () => void,
  index: number
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        zIndex: 1000 + index
      }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      drag={!isMaximized}
      dragMomentum={false}
      onMouseDown={onFocus}
      style={{
        position: 'absolute',
        pointerEvents: 'auto',
        top: 100 + (index * 40),
        left: 100 + (index * 40),
        width: isMaximized ? '90vw' : '480px',
        height: isMaximized ? '85vh' : '600px',
        transition: 'width 0.3s, height 0.3s, top 0.3s, left 0.3s'
      }}
    >
      <Paper
        elevation={24}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 4,
          background: alpha('#000', 0.8),
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        {/* Header/Titlebar */}
        <Box
          className="window-handle"
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.05)',
            cursor: isMaximized ? 'default' : 'grab',
            '&:active': { cursor: isMaximized ? 'default' : 'grabbing' }
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <GripHorizontal size={14} style={{ opacity: 0.3 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
              {window.title}
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => setIsMaximized(!isMaximized)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </IconButton>
            <IconButton size="small" onClick={() => window.open(window.url, '_blank')} sx={{ color: 'rgba(255,255,255,0.4)' }}>
              <ExternalLink size={14} />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ '&:hover': { color: '#ff4444' }, color: 'rgba(255,255,255,0.4)' }}>
              <X size={14} />
            </IconButton>
          </Stack>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, position: 'relative', background: '#0a0a0a' }}>
           <iframe 
            src={window.url}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              borderRadius: '0 0 16px 16px'
            }}
            title={window.title}
           />
        </Box>
      </Paper>
    </motion.div>
  );
};
