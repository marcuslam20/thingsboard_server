import { createTheme } from '@mui/material/styles';

// Osprey Platform color scheme — from logo gradient #008BD5 → #202A6B
const TUYA_ORANGE = '#008BD5';
const TUYA_ORANGE_LIGHT = '#33A2DD';
const TUYA_ORANGE_DARK = '#00498E';
const TUYA_SIDEBAR_BG = '#FFFFFF';
const TUYA_SIDEBAR_ACTIVE = '#E6F3FB';
const TUYA_SIDEBAR_ACTIVE_TEXT = '#008BD5';
const TUYA_SIDEBAR_TEXT = '#999999';
const TUYA_SIDEBAR_HOVER_BG = '#F0F0F0';
const TUYA_TOP_BAR_BG = '#FFFFFF';
const TUYA_BODY_BG = '#FFFFFF';
const TUYA_BORDER = '#E8E8E8';
const TUYA_TEXT_PRIMARY = '#272e3b';
const TUYA_TEXT_SECONDARY = '#666666';
const TUYA_TEXT_HINT = '#999999';

export const tuyaColors = {
  orange: TUYA_ORANGE,
  orangeLight: TUYA_ORANGE_LIGHT,
  orangeDark: TUYA_ORANGE_DARK,
  sidebarBg: TUYA_SIDEBAR_BG,
  sidebarActive: TUYA_SIDEBAR_ACTIVE,
  sidebarActiveText: TUYA_SIDEBAR_ACTIVE_TEXT,
  sidebarText: TUYA_SIDEBAR_TEXT,
  sidebarHoverBg: TUYA_SIDEBAR_HOVER_BG,
  topBarBg: TUYA_TOP_BAR_BG,
  bodyBg: TUYA_BODY_BG,
  border: TUYA_BORDER,
  textPrimary: TUYA_TEXT_PRIMARY,
  textSecondary: TUYA_TEXT_SECONDARY,
  textHint: TUYA_TEXT_HINT,
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  info: '#008BD5',
};

export const theme = createTheme({
  palette: {
    primary: {
      main: TUYA_ORANGE,
      light: TUYA_ORANGE_LIGHT,
      dark: TUYA_ORANGE_DARK,
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#044488',
      light: '#1A6BB5',
      dark: '#202A6B',
      contrastText: '#ffffff',
    },
    background: {
      default: TUYA_BODY_BG,
      paper: '#ffffff',
    },
    text: {
      primary: TUYA_TEXT_PRIMARY,
      secondary: TUYA_TEXT_SECONDARY,
    },
    divider: TUYA_BORDER,
    success: { main: '#52C41A' },
    warning: { main: '#FAAD14' },
    error: { main: '#FF4D4F' },
    info: { main: '#008BD5' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    h4: { fontWeight: 400, fontSize: '28px', lineHeight: '38px', color: TUYA_TEXT_PRIMARY },
    h5: { fontWeight: 400, fontSize: '28px', lineHeight: '38px', color: TUYA_TEXT_PRIMARY },
    h6: { fontWeight: 500, fontSize: '18px', lineHeight: '26px', color: TUYA_TEXT_PRIMARY },
    subtitle1: { fontWeight: 500, fontSize: '14px' },
    subtitle2: { fontWeight: 500, fontSize: '13px' },
    body1: { fontSize: '14px', color: TUYA_TEXT_PRIMARY },
    body2: { fontSize: '13px', color: TUYA_TEXT_SECONDARY },
    caption: { fontSize: '12px', color: TUYA_TEXT_HINT },
    button: { fontSize: '14px', fontWeight: 500, textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: TUYA_ORANGE_DARK,
          '&:hover': {
            background: '#003A70',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${TUYA_BORDER}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiInputBase: {
      styleOverrides: {
        sizeSmall: {
          height: 32,
          fontSize: '13px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontSize: '13px',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: TUYA_ORANGE,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: TUYA_ORANGE,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 12px',
          fontSize: '13px',
          lineHeight: '20px',
          borderBottom: `1px solid #e0e0e0`,
          whiteSpace: 'nowrap',
          backgroundColor: '#ffffff',
        },
        head: {
          fontWeight: 500,
          backgroundColor: '#f4f4f4',
          color: '#1a1a1a',
          fontSize: '13px',
          lineHeight: '17px',
          padding: '8px 12px',
          borderTop: `1px solid #e0e0e0`,
          borderBottom: `1px solid #e0e0e0`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover td': {
            backgroundColor: '#fafafa',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          '&.Mui-selected': {
            color: TUYA_ORANGE,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: TUYA_ORANGE,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: TUYA_SIDEBAR_BG,
          color: TUYA_TEXT_PRIMARY,
          borderRight: `1px solid ${TUYA_BORDER}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&:hover': {
            backgroundColor: '#F5F5F5',
          },
          '&.Mui-selected': {
            backgroundColor: TUYA_SIDEBAR_ACTIVE,
            color: TUYA_SIDEBAR_ACTIVE_TEXT,
            '&:hover': {
              backgroundColor: TUYA_SIDEBAR_ACTIVE,
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
          minWidth: 36,
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: TUYA_TOP_BAR_BG,
          color: TUYA_TEXT_PRIMARY,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});
