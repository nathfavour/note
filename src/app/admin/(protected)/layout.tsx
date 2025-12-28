'use server';
import React from 'react';
import { redirect } from 'next/navigation';
import { getServerAdminUser } from '@/lib/admin/server';
import { Box } from '@mui/material';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAdminUser();
  if (!user) {
    redirect('/admin/unauthorized');
  }
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: 'rgba(10, 10, 10, 0.95)',
        color: 'white'
      }}
    >
      {children}
    </Box>
  );
}
