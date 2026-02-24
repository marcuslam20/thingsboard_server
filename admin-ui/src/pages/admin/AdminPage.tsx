import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useAppSelector } from '@/store/store';
import { selectAuthority } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';
import GeneralSettingsTab from './tabs/GeneralSettingsTab';
import MailServerTab from './tabs/MailServerTab';
import NotificationsTab from './tabs/NotificationsTab';
import HomeSettingsTab from './tabs/HomeSettingsTab';
import RepositorySettingsTab from './tabs/RepositorySettingsTab';

interface TabDef {
  id: string;
  label: string;
  authorities: Authority[];
  component: React.ReactNode;
}

export default function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const authority = useAppSelector(selectAuthority);

  const tabs: TabDef[] = [
    {
      id: 'general',
      label: 'General',
      authorities: [Authority.SYS_ADMIN],
      component: <GeneralSettingsTab />,
    },
    {
      id: 'mail',
      label: 'Outgoing Mail',
      authorities: [Authority.SYS_ADMIN],
      component: <MailServerTab />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      authorities: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      component: <NotificationsTab />,
    },
    {
      id: 'home',
      label: 'Home',
      authorities: [Authority.TENANT_ADMIN],
      component: <HomeSettingsTab />,
    },
    {
      id: 'repository',
      label: 'Repository',
      authorities: [Authority.TENANT_ADMIN],
      component: <RepositorySettingsTab />,
    },
  ];

  const filteredTabs = tabs.filter((t) =>
    authority ? t.authorities.includes(authority) : false,
  );

  const pathSegment = location.pathname.split('/').pop() || '';
  const tabIndex = Math.max(0, filteredTabs.findIndex((t) => t.id === pathSegment));

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(`/settings/${filteredTabs[newValue].id}`);
  };

  if (filteredTabs.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">No settings available for your role.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        System Settings
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          {filteredTabs.map((tab) => (
            <Tab key={tab.id} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {filteredTabs[tabIndex]?.component}
    </Box>
  );
}
