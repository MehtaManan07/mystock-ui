import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Custom color palette - Deep teal with warm amber accents
const palette = {
  primary: {
    main: '#0D7377',
    light: '#14919B',
    dark: '#095658',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#E8AA42',
    light: '#F5C469',
    dark: '#C78F2E',
    contrastText: '#000000',
  },
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828',
  },
  warning: {
    main: '#ED6C02',
    light: '#FF9800',
    dark: '#E65100',
  },
  info: {
    main: '#0288D1',
    light: '#03A9F4',
    dark: '#01579B',
  },
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20',
  },
};

// Common theme options
const commonOptions: ThemeOptions = {
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: 'clamp(1.375rem, 3.5vw, 1.75rem)',
    },
    h4: {
      fontWeight: 600,
      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
    },
    h5: {
      fontWeight: 600,
      fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
    },
    h6: {
      fontWeight: 600,
      fontSize: 'clamp(1rem, 2vw, 1rem)',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 600,
          '@media (max-width: 600px)': {
            padding: '8px 16px',
            fontSize: '0.875rem',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            padding: 8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          '@media (max-width: 600px)': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
        root: {
          '@media (max-width: 600px)': {
            padding: '12px 8px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          '@media (max-width: 600px)': {
            borderRadius: 0,
            margin: 16,
            maxHeight: 'calc(100% - 32px)',
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            padding: '16px',
            fontSize: '1.25rem',
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            padding: '16px',
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            padding: '16px',
            gap: '8px',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
  },
};

// Light theme
export const lightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'light',
    ...palette,
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2027',
      secondary: '#637381',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'dark',
    ...palette,
    primary: {
      main: '#14919B',
      light: '#32B4BD',
      dark: '#0D7377',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F5C469',
      light: '#FFDA8A',
      dark: '#E8AA42',
      contrastText: '#000000',
    },
    background: {
      default: '#0A1929',
      paper: '#132F4C',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B2BAC2',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
});
