'use client';

import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

const getDesignTokens = (): ThemeOptions => ({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00F0FF', // Electric Teal
      contrastText: '#000000',
    },
    secondary: {
      main: '#F2F2F2', // Titanium
    },
    background: {
      default: '#000000', // The Void
      paper: '#0A0A0A',   // The Surface
    },
    text: {
      primary: '#F2F2F2',   // Titanium
      secondary: '#A1A1AA', // Gunmetal
      disabled: '#404040',  // Carbon
    },
    divider: '#222222', // Subtle Border
  },
  typography: {
    fontFamily: 'var(--font-inter), "Inter", sans-serif',
    h1: {
      fontFamily: 'var(--font-mono), monospace',
      fontSize: '32px',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#F2F2F2',
    },
    h2: {
      fontFamily: 'var(--font-mono), monospace',
      fontSize: '24px',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: 'var(--font-mono), monospace',
      fontSize: '20px',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'var(--font-mono), monospace',
      fontSize: '18px',
      fontWeight: 600,
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
    },
    caption: {
      fontSize: '12px',
      color: '#A1A1AA',
    },
    button: {
      fontFamily: 'var(--font-mono), monospace',
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: Array(25).fill('none') as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#000000',
          color: '#F2F2F2',
          scrollbarColor: '#222222 transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 12,
            backgroundColor: '#222222',
            '&:hover': {
              backgroundColor: '#404040',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid #222222',
          '&:hover': {
            borderColor: '#404040',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        containedPrimary: {
          backgroundColor: '#00F0FF',
          color: '#000000',
          border: 'none',
          '&:hover': {
            backgroundColor: alpha('#00F0FF', 0.8),
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(10, 10, 10, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundImage: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: '#404040',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A0A0A',
          backgroundImage: 'none',
          border: '1px solid #222222',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #222222',
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundColor: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #222222',
          backgroundImage: 'none',
        },
      },
    },
  },
});

export const darkTheme = createTheme(getDesignTokens());
export const lightTheme = darkTheme;

export default darkTheme;
