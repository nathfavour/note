import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Container, Stack, alpha } from '@mui/material';
import { Home as HomeIcon, Person as PersonIcon, Lock as LockIcon } from '@mui/icons-material';

export const metadata = {
  title: 'Admin Access Required'
};

export default function AdminUnauthorizedPage() {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(25px) saturate(180%)',
        color: 'white',
        textAlign: 'center',
        px: 3
      }}
    >
      <Container maxWidth="sm">
        <Box 
          sx={{ 
            mb: 4, 
            display: 'inline-flex', 
            p: 2, 
            borderRadius: '50%', 
            bgcolor: alpha('#ff4d4d', 0.1),
            border: '1px solid rgba(255, 77, 77, 0.2)'
          }}
        >
          <LockIcon sx={{ fontSize: 48, color: '#ff4d4d' }} />
        </Box>
        
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 900, 
            fontFamily: 'var(--font-space-grotesk)',
            mb: 2,
            background: 'linear-gradient(90deg, #fff, #ff4d4d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Access Restricted
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            mb: 6,
            fontSize: '1.1rem',
            lineHeight: 1.6
          }}
        >
          You attempted to access an administrative area. Your account does not have the required privileges.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            component={Link}
            href="/"
            variant="outlined"
            startIcon={<HomeIcon />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': {
                borderColor: '#00F5FF',
                bgcolor: alpha('#00F5FF', 0.05)
              }
            }}
          >
            Return Home
          </Button>
          <Button
            component={Link}
            href="/settings"
            variant="outlined"
            startIcon={<PersonIcon />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': {
                borderColor: '#00F5FF',
                bgcolor: alpha('#00F5FF', 0.05)
              }
            }}
          >
            View Profile
          </Button>
        </Stack>

        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 8, 
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'var(--font-inter)'
          }}
        >
          If you believe this is an error, contact support with your account ID.
        </Typography>
      </Container>
    </Box>
  );
}
