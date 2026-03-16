import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

/**
 * KYLRIX ECOSYSTEM DESIGN SYSTEM v3
 * Intelligent Theme Architecture
 * 
 * Concept: 
 * 1. Semantic Tokens: We use standard MUI palette names but bind them to Ecosystem roles.
 * 2. Primary = Ecosystem Identity (Indigo/Flow)
 * 3. Secondary = App Identity (Pink/Note)
 * 4. Surface System = Glassmorphic layers that adapt to background luminance.
 */

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: '#6366F1', // Ecosystem Indigo
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EC4899', // App Pink
      light: '#F472B6',
      dark: '#DB2777',
      contrastText: '#FFFFFF',
    },
    background: {
      default: mode === 'dark' ? '#000000' : '#F1F5F9', // Slightly cooler slate for light mode
      paper: mode === 'dark' ? '#0A0A0B' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#F8FAFC' : '#0F172A',
      secondary: mode === 'dark' ? '#94A3B8' : '#475569', // Darker slate for light mode contrast
    },
    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
  },
  typography: {
    fontFamily: 'var(--font-satoshi), "Satoshi", sans-serif',
    h1: { fontFamily: 'var(--font-clash), sans-serif', fontWeight: 900 },
    h2: { fontFamily: 'var(--font-clash), sans-serif', fontWeight: 900 },
    h3: { fontFamily: 'var(--font-clash), sans-serif', fontWeight: 900 },
    h4: { fontFamily: 'var(--font-clash), sans-serif', fontWeight: 900 },
    button: { fontFamily: 'var(--font-clash), sans-serif', fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          backgroundColor: theme.palette.background.default,
          backgroundImage: mode === 'dark' 
            ? `radial-gradient(circle at 50% -20%, ${alpha('#6366F1', 0.15)} 0%, transparent 70%)`
            : `radial-gradient(circle at 50% -20%, ${alpha('#6366F1', 0.05)} 0%, transparent 70%)`,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      }),
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 14,
          padding: '10px 24px',
          fontWeight: 700,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: `0 8px 20px -8px ${alpha(theme.palette.primary.main, 0.4)}`,
          },
        }),
        containedPrimary: ({ theme }) => ({
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
        }),
        containedSecondary: ({ theme }) => ({
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 28,
          background: mode === 'dark' 
            ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`
            : `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
          backdropFilter: 'blur(20px) saturate(160%)',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: mode === 'dark'
            ? `0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 1px ${alpha('#FFFFFF', 0.05)}`
            : `0 10px 30px -10px ${alpha(theme.palette.text.primary, 0.1)}, inset 0 1px 1px ${alpha('#FFFFFF', 0.8)}`,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '&:hover': {
            transform: 'translateY(-6px) scale(1.01)',
            borderColor: theme.palette.secondary.main,
            boxShadow: mode === 'dark'
              ? `0 25px 50px -12px rgba(0,0,0,0.7), 0 0 15px ${alpha(theme.palette.primary.main, 0.2)}`
              : `0 25px 50px -12px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
  },
});

export const darkTheme = createTheme(getDesignTokens('dark'));
export const lightTheme = createTheme(getDesignTokens('light'));

export default darkTheme;
