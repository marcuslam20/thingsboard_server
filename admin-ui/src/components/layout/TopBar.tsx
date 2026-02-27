import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AppsIcon from '@mui/icons-material/Apps';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SecurityIcon from '@mui/icons-material/Security';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { logout, selectUserDetails } from '@/store/auth.slice';
import { tuyaColors } from '@/theme/theme';

export default function TopBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUserDetails);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    setProfileAnchor(null);
    dispatch(logout()).then(() => navigate('/login'));
  };

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: tuyaColors.topBarBg,
        color: tuyaColors.textPrimary,
        borderBottom: `1px solid ${tuyaColors.border}`,
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ minHeight: '56px !important', px: 2, gap: 0.5 }}>
        {/* Left: platform name */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tuyaColors.textPrimary }}>
          Developer Platform
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* Right: nav links + actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button
            size="small"
            startIcon={<HelpOutlineIcon sx={{ fontSize: '18px !important' }} />}
            sx={{
              color: tuyaColors.textSecondary,
              fontSize: '0.8125rem',
              '&:hover': { color: tuyaColors.orange, bgcolor: 'transparent' },
            }}
          >
            Help
          </Button>
          <Button
            size="small"
            startIcon={<DescriptionOutlinedIcon sx={{ fontSize: '18px !important' }} />}
            sx={{
              color: tuyaColors.textSecondary,
              fontSize: '0.8125rem',
              '&:hover': { color: tuyaColors.orange, bgcolor: 'transparent' },
            }}
          >
            Documents
          </Button>
          <Button
            size="small"
            startIcon={<HeadsetMicOutlinedIcon sx={{ fontSize: '18px !important' }} />}
            sx={{
              color: tuyaColors.textSecondary,
              fontSize: '0.8125rem',
              '&:hover': { color: tuyaColors.orange, bgcolor: 'transparent' },
            }}
          >
            Tech Support
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />
          {/* Language */}
          <Tooltip title="Language">
            <Button
              size="small"
              startIcon={<LanguageIcon sx={{ fontSize: '18px !important' }} />}
              onClick={(e) => setLangAnchor(e.currentTarget)}
              sx={{
                color: tuyaColors.textSecondary,
                fontSize: '0.8125rem',
                '&:hover': { color: tuyaColors.orange, bgcolor: 'transparent' },
              }}
            >
              English(EN)
            </Button>
          </Tooltip>
          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
          >
            <MenuItem onClick={() => setLangAnchor(null)} selected>English</MenuItem>
            <MenuItem onClick={() => setLangAnchor(null)}>Tiếng Việt</MenuItem>
          </Menu>

          {/* My Space */}
          <Button
            size="small"
            sx={{
              color: tuyaColors.textSecondary,
              fontSize: '0.8125rem',
              '&:hover': { color: tuyaColors.orange, bgcolor: 'transparent' },
            }}
          >
            My Space
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton size="small" onClick={() => navigate('/notifications')}>
              <Badge badgeContent={0} color="error" variant="dot">
                <NotificationsNoneIcon sx={{ fontSize: 20, color: tuyaColors.textSecondary }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Apps grid */}
          <Tooltip title="Applications">
            <IconButton size="small">
              <AppsIcon sx={{ fontSize: 20, color: tuyaColors.textSecondary }} />
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <IconButton size="small" onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: tuyaColors.orange,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {userInitials}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { minWidth: 200, mt: 1 } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: tuyaColors.textHint, fontSize: '0.75rem' }}>
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setProfileAnchor(null); navigate('/profile'); }}>
              <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { setProfileAnchor(null); navigate('/security-settings/general'); }}>
              <ListItemIcon><SecurityIcon fontSize="small" /></ListItemIcon>
              Security
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: tuyaColors.error }}>
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: tuyaColors.error }} /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
