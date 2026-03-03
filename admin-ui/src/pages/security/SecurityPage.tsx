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
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useAppSelector } from '@/store/store';
import { selectAuthority } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';
import SecuritySettingsTab from './tabs/SecuritySettingsTab';
import TwoFactorAuthTab from './tabs/TwoFactorAuthTab';
import OAuth2ClientsTab from './tabs/OAuth2ClientsTab';

interface TabDef {
  id: string;
  label: string;
  authorities: Authority[];
  component: React.ReactNode;
}

export default function SecurityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const authority = useAppSelector(selectAuthority);

  const tabs: TabDef[] = [
    {
      id: 'general',
      label: 'Security',
      authorities: [Authority.SYS_ADMIN],
      component: <SecuritySettingsTab />,
    },
    {
      id: '2fa',
      label: 'Two Factor Auth',
      authorities: [Authority.SYS_ADMIN],
      component: <TwoFactorAuthTab />,
    },
    {
      id: 'oauth2',
      label: 'OAuth2 Clients',
      authorities: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      component: <OAuth2ClientsTab />,
    },
  ];

  const filteredTabs = tabs.filter((t) =>
    authority ? t.authorities.includes(authority) : false,
  );

  const pathSegment = location.pathname.split('/').pop() || '';
  const tabIndex = Math.max(0, filteredTabs.findIndex((t) => t.id === pathSegment));

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(`/security-settings/${filteredTabs[newValue].id}`);
  };

  if (filteredTabs.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">No security settings available for your role.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Security Settings
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
