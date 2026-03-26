"use client";

import React from 'react';
import { useSidebar } from '@/components/ui/SidebarContext';
import { useDynamicSidebar, DynamicSidebar } from '@/components/ui/DynamicSidebar';
import { DesktopSidebar, MobileBottomNav } from '@/components/Navigation';
import AppHeader from '@/components/AppHeader';
import { Box } from '@mui/material';

export default function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { isOpen: isDynamicSidebarOpen } = useDynamicSidebar();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'hidden' }}>
      {/* Header spans full width - Always Persistent */}
      <AppHeader />
      
      {/* Main layout container */}
      <Box sx={{ pt: '88px' }}> {/* Match actual header height */}
        {/* Sidebar - Persistent */}
        <DesktopSidebar />
        
        {/* Main content area - offset to account for fixed sidebar and dynamic sidebar */}
        <Box
          component="main"
          sx={{
            minWidth: 0,
            pb: { xs: 12, md: 4 },
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            ml: {
              md: isCollapsed ? '80px' : '280px' // Match Navigation.tsx widths exactly
            },
            mr: {
              md: isDynamicSidebarOpen ? { md: '28rem', lg: '32rem' } : 0
            }
          }}
        >
          {/* Content wrapper with proper padding */}
          <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, py: 3 }}>
            {children}
          </Box>
        </Box>
      </Box>
      
      {/* Dynamic Sidebar - Also persistent */}
      <DynamicSidebar />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </Box>
  );
}
