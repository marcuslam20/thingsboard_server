import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import ExpandLess from '@mui/icons-material/ExpandLess';

// Module icons - matching Tuya Platform sidebar
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

// Sub-menu icons
import CategoryIcon from '@mui/icons-material/Category';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DescriptionIcon from '@mui/icons-material/Description';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import WidgetsIcon from '@mui/icons-material/Widgets';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RouterIcon from '@mui/icons-material/Router';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import QueueIcon from '@mui/icons-material/Queue';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';

import { useAppSelector } from '@/store/store';
import { selectAuthority } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';
import { tuyaColors } from '@/theme/theme';

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  authorities?: Authority[];
}

interface ModuleItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: SubMenuItem[];
  authorities?: Authority[];
}

const SIDEBAR_WIDTH_COLLAPSED = 72;
const SIDEBAR_WIDTH_EXPANDED = 240;

export { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED };

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const authority = useAppSelector(selectAuthority);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  // Tuya-style module grouping - maps existing pages to Tuya structure
  const modules: ModuleItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <HomeOutlinedIcon />,
      path: '/home',
    },
    {
      id: 'product',
      label: 'Product',
      icon: <DevicesOtherIcon />,
      authorities: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      children: [
        { id: 'all-products', label: 'All Products', icon: <CategoryIcon />, path: '/profiles/deviceProfiles' },
        { id: 'devices', label: 'Devices', icon: <ListAltIcon />, path: '/entities/devices' },
        { id: 'device-logs', label: 'Device Logs', icon: <DescriptionIcon />, path: '/security-settings/auditLogs' },
        { id: 'firmware-update', label: 'Firmware Update', icon: <SystemUpdateIcon />, path: '/otaUpdates' },
        { id: 'voice-integration', label: 'Voice Integration', icon: <RecordVoiceOverIcon />, path: '/entities/entityViews' },
      ],
    },
    {
      id: 'app',
      label: 'App',
      icon: <DashboardOutlinedIcon />,
      authorities: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      children: [
        { id: 'dashboards', label: 'Dashboards', icon: <DashboardOutlinedIcon />, path: '/dashboards' },
        { id: 'widgets', label: 'Widget Library', icon: <WidgetsIcon />, path: '/widgets-bundles', authorities: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN] },
      ],
    },
    {
      id: 'cloud',
      label: 'Cloud',
      icon: <CloudOutlinedIcon />,
      authorities: [Authority.TENANT_ADMIN],
      children: [
        { id: 'rule-chains', label: 'Rule Chains', icon: <AccountTreeIcon />, path: '/ruleChains' },
        { id: 'edges', label: 'Edge Management', icon: <RouterIcon />, path: '/edgeManagement/edges' },
        { id: 'gateways', label: 'Gateways', icon: <RouterIcon />, path: '/gateways' },
      ],
    },
    {
      id: 'ai-agent',
      label: 'AI Agent',
      icon: <SmartToyOutlinedIcon />,
      authorities: [Authority.TENANT_ADMIN],
      children: [
        { id: 'assets', label: 'Assets', icon: <CategoryIcon />, path: '/entities/assets' },
        { id: 'asset-profiles', label: 'Asset Profiles', icon: <AssessmentIcon />, path: '/profiles/assetProfiles' },
      ],
    },
    {
      id: 'data',
      label: 'Data',
      icon: <BarChartOutlinedIcon />,
      authorities: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      children: [
        { id: 'alarms', label: 'Alarms', icon: <WarningAmberIcon />, path: '/alarms' },
        { id: 'api-usage', label: 'API Usage', icon: <DataUsageIcon />, path: '/usage', authorities: [Authority.TENANT_ADMIN] },
      ],
    },
    {
      id: 'operation',
      label: 'Operation',
      icon: <SettingsOutlinedIcon />,
      authorities: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      children: [
        { id: 'settings', label: 'Settings', icon: <SettingsOutlinedIcon />, path: '/settings/general', authorities: [Authority.SYS_ADMIN] },
        { id: 'security', label: 'Security', icon: <SecurityIcon />, path: '/security-settings/general', authorities: [Authority.SYS_ADMIN] },
        { id: 'customers', label: 'Customers', icon: <PeopleOutlinedIcon />, path: '/customers', authorities: [Authority.TENANT_ADMIN] },
        { id: 'users', label: 'Users', icon: <PeopleOutlinedIcon />, path: '/users' },
        { id: 'tenants', label: 'Tenants', icon: <BusinessIcon />, path: '/tenants', authorities: [Authority.SYS_ADMIN] },
        { id: 'tenant-profiles', label: 'Tenant Profiles', icon: <BusinessIcon />, path: '/tenantProfiles', authorities: [Authority.SYS_ADMIN] },
        { id: 'queues', label: 'Queues', icon: <QueueIcon />, path: '/queues', authorities: [Authority.SYS_ADMIN] },
        { id: 'notifications', label: 'Notifications', icon: <NotificationsOutlinedIcon />, path: '/notifications' },
        { id: 'resources', label: 'Resources', icon: <FolderOutlinedIcon />, path: '/resources', authorities: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN] },
      ],
    },
    {
      id: 'purchase',
      label: 'Purchase',
      icon: <ShoppingCartOutlinedIcon />,
      path: '/usage',
      authorities: [Authority.TENANT_ADMIN],
    },
    {
      id: 'vas',
      label: 'VAS',
      icon: <StorefrontOutlinedIcon />,
      path: '/resources',
      authorities: [Authority.TENANT_ADMIN],
    },
  ];

  const filterByAuthority = (items: ModuleItem[]): ModuleItem[] =>
    items
      .filter((item) => {
        if (!item.authorities) return true;
        return authority ? item.authorities.includes(authority) : false;
      })
      .map((item) =>
        item.children
          ? {
              ...item,
              children: item.children.filter((child) => {
                if (!child.authorities) return true;
                return authority ? child.authorities.includes(authority) : false;
              }),
            }
          : item,
      )
      .filter((item) => !item.children || item.children.length > 0);

  const filteredModules = filterByAuthority(modules);

  const isModuleActive = (mod: ModuleItem): boolean => {
    if (mod.path && (location.pathname === mod.path || location.pathname.startsWith(mod.path + '/'))) {
      return true;
    }
    return mod.children?.some(
      (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/'),
    ) || false;
  };

  const isSubItemActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleModuleClick = (mod: ModuleItem) => {
    if (mod.path && !mod.children) {
      navigate(mod.path);
      setExpandedModule(null);
      return;
    }
    setExpandedModule(expandedModule === mod.id ? null : mod.id);
  };

  const handleSubItemClick = (path: string) => {
    navigate(path);
  };

  const isExpanded = expandedModule !== null;

  return (
    <Box
      sx={{
        width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
        minWidth: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1200,
        bgcolor: 'background.paper',
        borderRight: `1px solid ${tuyaColors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo area */}
      <Box
        sx={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          px: isExpanded ? 2 : 0,
          borderBottom: `1px solid ${tuyaColors.border}`,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${tuyaColors.orange} 0%, ${tuyaColors.orangeLight} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          TB
        </Box>
        {isExpanded && (
          <Typography
            variant="subtitle1"
            sx={{
              ml: 1.5,
              fontWeight: 600,
              color: tuyaColors.textPrimary,
              whiteSpace: 'nowrap',
            }}
          >
            Developer Platform
          </Typography>
        )}
      </Box>

      {/* Module list */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {!isExpanded ? (
          // Collapsed: icon-only vertical module list
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, px: 0.5 }}>
            {filteredModules.map((mod) => {
              const active = isModuleActive(mod);
              return (
                <Tooltip key={mod.id} title={mod.label} placement="right" arrow>
                  <Box
                    onClick={() => handleModuleClick(mod)}
                    onMouseEnter={() => setHoveredModule(mod.id)}
                    onMouseLeave={() => setHoveredModule(null)}
                    sx={{
                      width: 56,
                      height: 56,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      color: active ? tuyaColors.sidebarActiveText : tuyaColors.textSecondary,
                      bgcolor: active
                        ? tuyaColors.sidebarActive
                        : hoveredModule === mod.id
                          ? '#F5F5F5'
                          : 'transparent',
                      '& .MuiSvgIcon-root': {
                        fontSize: 22,
                      },
                    }}
                  >
                    {mod.icon}
                    <Typography
                      sx={{
                        fontSize: '0.625rem',
                        mt: 0.25,
                        lineHeight: 1.2,
                        fontWeight: active ? 600 : 400,
                        color: 'inherit',
                      }}
                    >
                      {mod.label}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        ) : (
          // Expanded: show sub-menu of selected module
          <List component="nav" disablePadding sx={{ px: 1 }}>
            {/* Back to collapsed view */}
            <ListItemButton
              onClick={() => setExpandedModule(null)}
              sx={{
                borderRadius: '8px',
                mb: 1,
                py: 0.75,
                color: tuyaColors.textSecondary,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ExpandLess sx={{ transform: 'rotate(-90deg)' }} />
              </ListItemIcon>
              <ListItemText
                primary={filteredModules.find((m) => m.id === expandedModule)?.label || 'Back'}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }}
              />
            </ListItemButton>

            {/* Sub-items */}
            {filteredModules
              .find((m) => m.id === expandedModule)
              ?.children?.map((child) => {
                const active = isSubItemActive(child.path);
                return (
                  <ListItemButton
                    key={child.id}
                    onClick={() => handleSubItemClick(child.path)}
                    selected={active}
                    sx={{
                      borderRadius: '8px',
                      mb: 0.5,
                      py: 0.75,
                      pl: 2,
                      color: active ? tuyaColors.sidebarActiveText : tuyaColors.textPrimary,
                      bgcolor: active ? tuyaColors.sidebarActive : 'transparent',
                      '&.Mui-selected': {
                        bgcolor: tuyaColors.sidebarActive,
                        color: tuyaColors.sidebarActiveText,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                      {child.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={child.label}
                      primaryTypographyProps={{ fontSize: '0.8125rem' }}
                    />
                  </ListItemButton>
                );
              })}
          </List>
        )}
      </Box>
    </Box>
  );
}
