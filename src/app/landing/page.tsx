"use client";

import React, { useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button as MuiButton, 
  Stack, 
  Grid, 
  AppBar, 
  Toolbar, 
  Link,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/components/ui/AuthContext';
import { AIHeroInput } from '@/components/AIHeroInput';
import {
  AutoAwesome as SparklesIcon,
  Memory as CpuChipIcon,
  VerifiedUser as ShieldCheckIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: <SparklesIcon style={{ height: 32, width: 32 }} />,
    title: 'AI-Powered Creation',
    description:
      "Generate comprehensive notes, research summaries, and creative content with advanced AI assistance in seconds.",
  },
  {
    icon: <CpuChipIcon style={{ height: 32, width: 32 }} />,
    title: 'Secure Synchronization',
    description:
      'Securely store and share your notes with professional-grade encryption and private access control.',
  },
  {
    icon: <ShieldCheckIcon style={{ height: 32, width: 32 }} />,
    title: 'Smart Collaboration',
    description:
      'Real-time collaborative editing with AI insights and secure note management.',
  },
];

export default function LandingPage() {
  const { openIDMWindow, isAuthenticated, user, isAuthenticating } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/notes');
      return;
    }
  }, [isAuthenticated, router]);

  // Generate user initials from name or email
  const getUserInitials = (user: any): string => {
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Handle AI prompt selection with smart routing
  const handlePromptSelect = async (prompt: string) => {
    if (isAuthenticated) {
      // User is logged in - go directly to notes with AI generation
      router.push(`/notes?ai-prompt=${encodeURIComponent(prompt)}`);
    } else {
      // User not logged in - show auth modal, then proceed
      openIDMWindow();
      // Store prompt in sessionStorage for after login
      sessionStorage.setItem('pending-ai-prompt', prompt);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: '#0A0A0A', 
      color: 'rgba(255, 255, 255, 0.9)',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 245, 255, 0.05) 0%, transparent 50%)'
    }}>
      <AppBar 
        position="sticky" 
        sx={{ 
          bgcolor: 'rgba(10, 10, 10, 0.8)', 
          backdropFilter: 'blur(25px) saturate(180%)', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
          backgroundImage: 'none'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 5 }, height: 80 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box 
              component="img"
              src="/logo/whisperrnote.png" 
              alt="Whisperrnote Logo" 
              sx={{ height: 32, width: 32, borderRadius: '8px' }}
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 900, 
                fontFamily: '"Space Grotesk", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#00F5FF'
              }}
            >
              Whisperrnote
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, justifyContent: 'center' }}>
            {['Product', 'Solutions', 'Resources', 'Pricing'].map((item) => (
              <Link
                key={item}
                href="#"
                underline="none"
                sx={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: '"Space Grotesk", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  transition: 'all 0.2s',
                  '&:hover': { color: '#00F5FF' }
                }}
              >
                {item}
              </Link>
            ))}
          </Stack>

          <Box>
            {isAuthenticated ? (
              <Avatar sx={{ 
                bgcolor: '#00F5FF', 
                color: '#000', 
                width: 36, 
                height: 36, 
                fontSize: '0.875rem', 
                fontWeight: 900,
                fontFamily: '"Space Grotesk", sans-serif'
              }}>
                {getUserInitials(user)}
              </Avatar>
            ) : (
              <Button 
                variant="text" 
                onClick={() => openIDMWindow()}
                isLoading={isAuthenticating}
                sx={{ 
                  color: '#00F5FF',
                  fontWeight: 900,
                  fontFamily: '"Space Grotesk", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1 }}>
        <Box sx={{ py: { xs: 12, md: 20 }, textAlign: 'center', position: 'relative' }}>
          <Container maxWidth="md">
            <Typography 
              variant="h1" 
              sx={{ 
                mb: 3, 
                fontSize: { xs: '3rem', md: '5rem' }, 
                fontWeight: 900, 
                lineHeight: 1,
                fontFamily: '"Space Grotesk", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to bottom, #FFF 0%, rgba(255,255,255,0.5) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Your notes, <br />
              <Box component="span" sx={{ color: '#00F5FF', WebkitTextFillColor: '#00F5FF' }}>elevated by AI</Box>
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 8, 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: { xs: '1.125rem', md: '1.35rem' }, 
                maxWidth: '700px', 
                mx: 'auto',
                fontFamily: '"Inter", sans-serif',
                lineHeight: 1.6
              }}
            >
              Transform your ideas with AI assistance and secure your notes. 
              Generate comprehensive content instantly, collaborate seamlessly, and own your data forever.
            </Typography>

            <Stack direction="column" alignItems="center" spacing={2} sx={{ mb: 10 }}>
              <Button 
                size="large" 
                sx={{ 
                  px: 8, 
                  py: 2.5, 
                  fontSize: '1.125rem', 
                  fontWeight: 900,
                  fontFamily: '"Space Grotesk", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  bgcolor: '#00F5FF',
                  color: '#000',
                  borderRadius: '100px',
                  boxShadow: '0 0 30px rgba(0, 245, 255, 0.3)',
                  '&:hover': {
                    bgcolor: '#00D1D9',
                    boxShadow: '0 0 40px rgba(0, 245, 255, 0.5)',
                  }
                }}
                onClick={() => openIDMWindow()}
                isLoading={isAuthenticating}
              >
                Get Started Free
              </Button>
            </Stack>
            
            <AIHeroInput onPromptSelectAction={handlePromptSelect} />
          </Container>
        </Box>

        <Box sx={{ py: { xs: 12, md: 20 }, bgcolor: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Container>
            <Box sx={{ textAlign: 'center', mb: 12, maxWidth: '800px', mx: 'auto' }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 900, 
                  fontFamily: '"Space Grotesk", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: { xs: '2rem', md: '3.5rem' }
                }}
              >
                AI-powered notes <br />
                <Box component="span" sx={{ color: '#00F5FF' }}>for the future</Box>
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '1.1rem'
                }}
              >
                Experience next-generation note-taking with intelligent content generation, 
                private cloud storage, and advanced security built-in.
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 3,
                    bgcolor: 'rgba(10, 10, 10, 0.95)',
                    backdropFilter: 'blur(25px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '32px',
                    p: 2,
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      borderColor: 'rgba(0, 245, 255, 0.3)',
                    }
                  }}>
                    <CardHeader>
                      <Box sx={{ 
                        display: 'flex', 
                        height: 64, 
                        width: 64, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '20px', 
                        bgcolor: 'rgba(0, 245, 255, 0.1)', 
                        color: '#00F5FF',
                        border: '1px solid rgba(0, 245, 255, 0.2)'
                      }}>
                        {feature.icon}
                      </Box>
                    </CardHeader>
                    <CardContent>
                      <CardTitle sx={{ 
                        mb: 2, 
                        fontWeight: 900, 
                        fontFamily: '"Space Grotesk", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '1.25rem'
                      }}>
                        {feature.title}
                      </CardTitle>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontFamily: '"Inter", sans-serif',
                          lineHeight: 1.6,
                          fontSize: '0.95rem'
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', py: 10, bgcolor: '#0A0A0A' }}>
        <Container>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={6}>
            <Stack direction="row" spacing={4} flexWrap="wrap" justifyContent="center">
              {['About', 'Contact', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  underline="none"
                  sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    fontFamily: '"Space Grotesk", sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(255, 255, 255, 0.4)',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#00F5FF' }
                  }}
                >
                  {item}
                </Link>
              ))}
            </Stack>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.2)',
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '0.7rem'
              }}
            >
              © 2025 Whisperrnote. All rights reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
