/*
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AppsIcon from '@mui/icons-material/Apps';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SecurityIcon from '@mui/icons-material/Security';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { logout, selectUserDetails } from '@/store/auth.slice';
import { tuyaColors } from '@/theme/theme';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TopBar() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUserDetails);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    setProfileAnchor(null);
    dispatch(logout()).then(() => navigate('/login'));
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: tuyaColors.topBarBg,
        color: tuyaColors.textPrimary,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        zIndex: 1302,
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: '44px !important', px: 1.5, pl: '12px', gap: 0.5 }}>
        {/* Left: logo + platform name */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
          <Box component="img" src="/osprey-logo.svg" alt="Osprey" sx={{ height: 28, position: 'relative', top: 4 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tuyaColors.textPrimary }}>
            {t('login.developer-platform')}
          </Typography>
        </Box>

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
            {t('topbar.help')}
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
            {t('topbar.documents')}
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
            {t('topbar.tech-support')}
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />

          {/* Language */}
          <LanguageSwitcher color={tuyaColors.textSecondary} />

          {/* My Space */}
          <Button
            size="small"
            sx={{
              color: tuyaColors.textSecondary,
              fontSize: '0.8125rem',
              '&:hover': { color: tuyaColors.orange, bgcolor: 'transparent' },
            }}
          >
            {t('topbar.my-space')}
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />

          {/* Notifications */}
          <Tooltip title={t('notification.notifications')}>
            <IconButton size="small" onClick={() => navigate('/notifications')}>
              <Badge badgeContent={0} color="error" variant="dot">
                <NotificationsNoneIcon sx={{ fontSize: 20, color: tuyaColors.textSecondary }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Apps grid */}
          <Tooltip title={t('topbar.applications')}>
            <IconButton size="small">
              <AppsIcon sx={{ fontSize: 20, color: tuyaColors.textSecondary }} />
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <IconButton size="small" onClick={(e) => setProfileAnchor(e.currentTarget)}>
            <PersonOutlineIcon sx={{ fontSize: 20, color: tuyaColors.textSecondary }} />
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
              {t('profile.profile')}
            </MenuItem>
            <MenuItem onClick={() => { setProfileAnchor(null); navigate('/security-settings/general'); }}>
              <ListItemIcon><SecurityIcon fontSize="small" /></ListItemIcon>
              {t('security.security')}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: tuyaColors.error }}>
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: tuyaColors.error }} /></ListItemIcon>
              {t('login.logout')}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
