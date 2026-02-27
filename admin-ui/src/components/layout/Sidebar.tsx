import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

// Module icons
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

import { useAppSelector } from '@/store/store';
import { selectAuthority } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';
import { tuyaColors } from '@/theme/theme';

// --- Types ---

interface SubMenuItem {
  id: string;
  label: string;
  path: string;
  authorities?: Authority[];
}

interface CategoryItem {
  id: string;
  label: string;
  children: SubMenuItem[];
}

interface ModuleItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string; // direct navigation (no flyout)
  categories?: CategoryItem[];
  authorities?: Authority[];
}

// --- Constants ---

export const SIDEBAR_WIDTH = 72;
const FLYOUT_WIDTH = 200;

// --- Module definitions matching Tuya Platform ---

const modules: ModuleItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <HomeOutlinedIcon />,
    path: '/home',
  },
  {
    id: 'ai-product',
    label: 'AI Product',
    icon: <DevicesOtherIcon />,
    authorities: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
    categories: [
      {
        id: 'product',
        label: 'Product',
        children: [
          { id: 'development', label: 'Development', path: '/profiles/deviceProfiles' },
        ],
      },
      {
        id: 'device',
        label: 'Device',
        children: [
          { id: 'all-devices', label: 'Sold Device Details', path: '/entities/devices' },
          { id: 'device-logs', label: 'Device Logs', path: '/security-settings/auditLogs' },
          { id: 'firmware-update', label: 'Firmware Update', path: '/otaUpdates' },
          { id: 'device-debug', label: 'Device Debug', path: '/entities/devices' },
        ],
      },
      {
        id: 'voice',
        label: 'Voice Platform',
        children: [
          { id: 'voice-integration', label: 'Voice Integration', path: '/entities/entityViews' },
        ],
      },
    ],
  },
  {
    id: 'app',
    label: 'App',
    icon: <DashboardOutlinedIcon />,
    authorities: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
    categories: [
      {
        id: 'app-dev',
        label: 'App Development',
        children: [
          { id: 'dashboards', label: 'Dashboards', path: '/dashboards' },
          { id: 'widgets', label: 'Widget Library', path: '/widgets-bundles', authorities: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN] },
        ],
      },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud',
    icon: <CloudOutlinedIcon />,
    authorities: [Authority.TENANT_ADMIN],
    categories: [
      {
        id: 'cloud-dev',
        label: 'Cloud Development',
        children: [
          { id: 'rule-chains', label: 'Rule Chains', path: '/ruleChains' },
          { id: 'edges', label: 'Edge Management', path: '/edgeManagement/edges' },
          { id: 'gateways', label: 'Gateways', path: '/gateways' },
        ],
      },
    ],
  },
  {
    id: 'ai-agent',
    label: 'AI Agent',
    icon: <SmartToyOutlinedIcon />,
    authorities: [Authority.TENANT_ADMIN],
    categories: [
      {
        id: 'assets-mgmt',
        label: 'Asset Management',
        children: [
          { id: 'assets', label: 'Assets', path: '/entities/assets' },
          { id: 'asset-profiles', label: 'Asset Profiles', path: '/profiles/assetProfiles' },
        ],
      },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: <BarChartOutlinedIcon />,
    authorities: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
    categories: [
      {
        id: 'analytics',
        label: 'Analytics',
        children: [
          { id: 'alarms', label: 'Alarms', path: '/alarms' },
          { id: 'api-usage', label: 'API Usage', path: '/usage', authorities: [Authority.TENANT_ADMIN] },
        ],
      },
    ],
  },
  {
    id: 'operation',
    label: 'Operation',
    icon: <SettingsOutlinedIcon />,
    authorities: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
    categories: [
      {
        id: 'system',
        label: 'System',
        children: [
          { id: 'settings', label: 'Settings', path: '/settings/general', authorities: [Authority.SYS_ADMIN] },
          { id: 'security', label: 'Security', path: '/security-settings/general', authorities: [Authority.SYS_ADMIN] },
          { id: 'queues', label: 'Queues', path: '/queues', authorities: [Authority.SYS_ADMIN] },
          { id: 'resources', label: 'Resources', path: '/resources', authorities: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN] },
          { id: 'notifications', label: 'Notifications', path: '/notifications' },
        ],
      },
      {
        id: 'user-mgmt',
        label: 'User Management',
        children: [
          { id: 'tenants', label: 'Tenants', path: '/tenants', authorities: [Authority.SYS_ADMIN] },
          { id: 'tenant-profiles', label: 'Tenant Profiles', path: '/tenantProfiles', authorities: [Authority.SYS_ADMIN] },
          { id: 'customers', label: 'Customers', path: '/customers', authorities: [Authority.TENANT_ADMIN] },
          { id: 'users', label: 'Users', path: '/users' },
        ],
      },
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

// --- Component ---

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const authority = useAppSelector(selectAuthority);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const flyoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setHoveredModule(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter by authority
  const filterModules = (items: ModuleItem[]): ModuleItem[] =>
    items
      .filter((item) => {
        if (!item.authorities) return true;
        return authority ? item.authorities.includes(authority) : false;
      })
      .map((item) => {
        if (!item.categories) return item;
        return {
          ...item,
          categories: item.categories
            .map((cat) => ({
              ...cat,
              children: cat.children.filter((child) => {
                if (!child.authorities) return true;
                return authority ? child.authorities.includes(authority) : false;
              }),
            }))
            .filter((cat) => cat.children.length > 0),
        };
      })
      .filter((item) => !item.categories || item.categories.length > 0);

  const filteredModules = filterModules(modules);

  const isModuleActive = (mod: ModuleItem): boolean => {
    if (mod.path) {
      return location.pathname === mod.path || location.pathname.startsWith(mod.path + '/');
    }
    return mod.categories?.some((cat) =>
      cat.children.some(
        (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/'),
      ),
    ) || false;
  };

  const isSubItemActive = (path: string): boolean =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleModuleEnter = (modId: string, hasFlyout: boolean) => {
    if (flyoutTimer.current) clearTimeout(flyoutTimer.current);
    if (hasFlyout) {
      setHoveredModule(modId);
    }
  };

  const handleModuleLeave = () => {
    flyoutTimer.current = setTimeout(() => setHoveredModule(null), 150);
  };

  const handleFlyoutEnter = () => {
    if (flyoutTimer.current) clearTimeout(flyoutTimer.current);
  };

  const handleFlyoutLeave = () => {
    flyoutTimer.current = setTimeout(() => setHoveredModule(null), 150);
  };

  const handleModuleClick = (mod: ModuleItem) => {
    if (mod.path && !mod.categories) {
      navigate(mod.path);
      setHoveredModule(null);
    }
  };

  const handleSubItemClick = (path: string) => {
    navigate(path);
    setHoveredModule(null);
  };

  const activeModule = filteredModules.find((m) => m.id === hoveredModule);

  return (
    <Box ref={sidebarRef} sx={{ position: 'fixed', top: 0, left: 0, zIndex: 1300, display: 'flex', height: '100vh' }}>
      {/* Icon sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          height: '100%',
          bgcolor: 'background.paper',
          borderRight: `1px solid ${tuyaColors.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1301,
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            width: '100%',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${tuyaColors.border}`,
            flexShrink: 0,
          }}
        >
          <img
            src="/osprey-logo.svg"
            alt="Osprey"
            style={{ width: 52, height: 52, objectFit: 'contain' }}
          />
        </Box>

        {/* Module icons */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 0.5, width: '100%' }}>
          {filteredModules.map((mod) => {
            const active = isModuleActive(mod);
            const isHovered = hoveredModule === mod.id;
            const hasFlyout = !!mod.categories && mod.categories.length > 0;

            return (
              <Box
                key={mod.id}
                onClick={() => handleModuleClick(mod)}
                onMouseEnter={() => handleModuleEnter(mod.id, hasFlyout)}
                onMouseLeave={handleModuleLeave}
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 1,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  color: active ? tuyaColors.orangeDark : tuyaColors.sidebarText,
                  bgcolor: isHovered && !active ? tuyaColors.sidebarHoverBg : 'transparent',
                  '& .MuiSvgIcon-root': { fontSize: 22 },
                  '&:hover': {
                    bgcolor: active ? 'transparent' : tuyaColors.sidebarHoverBg,
                  },
                }}
              >
                {mod.icon}
                <Typography
                  sx={{
                    fontSize: '0.6rem',
                    mt: 0.25,
                    lineHeight: 1.2,
                    fontWeight: active ? 600 : 400,
                    color: 'inherit',
                    textAlign: 'center',
                    px: 0.25,
                  }}
                >
                  {mod.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Flyout panel — appears on hover */}
      {activeModule && activeModule.categories && (
        <Box
          onMouseEnter={handleFlyoutEnter}
          onMouseLeave={handleFlyoutLeave}
          sx={{
            width: FLYOUT_WIDTH,
            height: '100%',
            bgcolor: 'background.paper',
            borderRight: `1px solid ${tuyaColors.border}`,
            boxShadow: '4px 0 12px rgba(0,0,0,0.06)',
            overflowY: 'auto',
            zIndex: 1300,
          }}
        >
          {/* Flyout header */}
          <Box
            sx={{
              height: 56,
              display: 'flex',
              alignItems: 'center',
              px: 2,
              borderBottom: `1px solid ${tuyaColors.border}`,
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tuyaColors.textPrimary }}>
              {activeModule.label}
            </Typography>
          </Box>

          {/* Categories + sub-items */}
          <Box sx={{ py: 1 }}>
            {activeModule.categories.map((category, catIdx) => (
              <Box key={category.id}>
                {catIdx > 0 && <Divider sx={{ my: 0.5, mx: 2 }} />}

                {/* Category label */}
                <Typography
                  sx={{
                    px: 2,
                    py: 0.75,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: tuyaColors.textHint,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {category.label}
                </Typography>

                {/* Sub-items */}
                {category.children.map((item) => {
                  const active = isSubItemActive(item.path);
                  return (
                    <Box
                      key={item.id}
                      onClick={() => handleSubItemClick(item.path)}
                      sx={{
                        px: 2,
                        py: 0.75,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.8125rem',
                        color: active ? tuyaColors.orange : tuyaColors.textPrimary,
                        fontWeight: active ? 600 : 400,
                        bgcolor: active ? tuyaColors.sidebarActive : 'transparent',
                        transition: 'all 100ms ease',
                        '&:hover': {
                          color: active ? tuyaColors.orange : tuyaColors.textPrimary,
                          bgcolor: active ? tuyaColors.sidebarActive : tuyaColors.sidebarHoverBg,
                        },
                      }}
                    >
                      {item.label}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
