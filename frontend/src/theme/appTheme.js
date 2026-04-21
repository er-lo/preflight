import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const fontStack = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c9cde',
      light: '#a8bcf0',
      dark: '#5a7ab8',
      contrastText: '#0b0d12',
    },
    secondary: {
      main: '#8b93a7',
      dark: '#6a7288',
    },
    background: {
      default: '#0b0d12',
      paper: '#12161f',
    },
    divider: alpha('#e8eaf6', 0.08),
    text: {
      primary: alpha('#f4f6ff', 0.94),
      secondary: alpha('#c5cbe0', 0.72),
    },
    error: {
      main: '#f87171',
    },
    success: {
      main: '#4ade80',
    },
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: fontStack,
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.035em',
      lineHeight: 1.15,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b0d12',
          backgroundImage: `
            radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha('#5a7ab8', 0.22)}, transparent 55%),
            radial-gradient(ellipse 60% 50% at 100% 0%, ${alpha('#7c9cde', 0.08)}, transparent 45%)
          `,
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          paddingInline: 10,
        },
        containedPrimary: {
          boxShadow: `0 2px 12px ${alpha('#7c9cde', 0.35)}`,
          '&:hover': {
            boxShadow: `0 4px 18px ${alpha('#7c9cde', 0.45)}`,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 1,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});
