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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Divider from '@mui/material/Divider';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/store';
import { selectAuthority, selectUserDetails } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';
import { tuyaColors } from '@/theme/theme';

interface ConsoleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  authorities?: Authority[];
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authority = useAppSelector(selectAuthority);
  const user = useAppSelector(selectUserDetails);

  const tutorialSteps = [
    { label: t('home.step-create-product'), description: t('home.step-create-product-desc') },
    { label: t('home.step-add-devices'), description: t('home.step-add-devices-desc') },
    { label: t('home.step-build-dashboard'), description: t('home.step-build-dashboard-desc') },
    { label: t('home.step-test-release'), description: t('home.step-test-release-desc') },
  ];

  const consoleCards: ConsoleCard[] = [
    {
      id: 'product',
      title: t('home.product-development'),
      description: t('home.product-development-desc'),
      icon: <DevicesOtherIcon sx={{ fontSize: 32 }} />,
      color: tuyaColors.orange,
      path: '/profiles/deviceProfiles',
      authorities: [Authority.TENANT_ADMIN],
    },
    {
      id: 'dashboard',
      title: t('home.app-development'),
      description: t('home.app-development-desc'),
      icon: <DashboardOutlinedIcon sx={{ fontSize: 32 }} />,
      color: '#1890FF',
      path: '/dashboards',
      authorities: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
    },
    {
      id: 'cloud',
      title: t('home.cloud-development'),
      description: t('home.cloud-development-desc'),
      icon: <CloudOutlinedIcon sx={{ fontSize: 32 }} />,
      color: '#52C41A',
      path: '/ruleChains',
      authorities: [Authority.TENANT_ADMIN],
    },
    {
      id: 'ai-agent',
      title: t('home.ai-agent'),
      description: t('home.ai-agent-desc'),
      icon: <SmartToyOutlinedIcon sx={{ fontSize: 32 }} />,
      color: '#722ED1',
      path: '/entities/assets',
      authorities: [Authority.TENANT_ADMIN],
    },
  ];

  const filteredCards = consoleCards.filter((card) => {
    if (!card.authorities) return true;
    return authority ? card.authorities.includes(authority) : false;
  });

  return (
    <Box>
      {/* Welcome Banner */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #FFF7F0 0%, #FFFFFF 50%, #F0F5FF 100%)',
          border: `1px solid ${tuyaColors.border}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${tuyaColors.orange} 0%, ${tuyaColors.orangeLight} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            TB
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('home.welcome')}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: tuyaColors.textSecondary, mb: 2, ml: 7 }}>
          {t('home.greeting', { name: user?.firstName || '' })}
        </Typography>
      </Paper>

      {/* Innovative Tutorials - Stepper */}
      <Paper sx={{ p: 3, mb: 3, border: `1px solid ${tuyaColors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          {t('home.innovative-tutorials')}
        </Typography>
        <Stepper activeStep={0} alternativeLabel>
          {tutorialSteps.map((step, index) => (
            <Step key={index}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-active': { color: tuyaColors.orange },
                    '&.Mui-completed': { color: tuyaColors.orange },
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {step.label}
                </Typography>
                <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/profiles/deviceProfiles')}
          >
            {t('home.get-started')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ borderColor: tuyaColors.border, color: tuyaColors.textSecondary }}
          >
            {t('home.read-document')}
          </Button>
        </Box>
      </Paper>

      {/* Developer Console */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left: Console cards */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            {t('home.developer-console')}
          </Typography>
          <Grid container spacing={2}>
            {filteredCards.map((card) => (
              <Grid item xs={12} sm={6} key={card.id}>
                <Card
                  sx={{
                    border: `1px solid ${tuyaColors.border}`,
                    '&:hover': {
                      borderColor: card.color,
                      boxShadow: `0 2px 12px ${card.color}20`,
                    },
                    transition: 'all 200ms ease',
                  }}
                >
                  <CardActionArea onClick={() => navigate(card.path)}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            bgcolor: `${card.color}10`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: card.color,
                            flexShrink: 0,
                          }}
                        >
                          {card.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {card.title}
                            </Typography>
                            <ArrowForwardIcon sx={{ fontSize: 16, color: tuyaColors.textHint }} />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: tuyaColors.textHint,
                              fontSize: '0.75rem',
                              mt: 0.5,
                            }}
                          >
                            {card.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Right: My Space sidebar */}
        <Paper
          sx={{
            width: 280,
            flexShrink: 0,
            p: 2.5,
            border: `1px solid ${tuyaColors.border}`,
            borderRadius: 2,
            alignSelf: 'flex-start',
            display: { xs: 'none', lg: 'block' },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            {t('home.my-space')}
          </Typography>

          {[
            { icon: <BusinessIcon sx={{ fontSize: 18 }} />, label: t('home.enterprise-info'), path: '/profile' },
            { icon: <SecurityIcon sx={{ fontSize: 18 }} />, label: t('home.authorization'), path: '/security-settings/general' },
            { icon: <ReceiptIcon sx={{ fontSize: 18 }} />, label: t('home.invoiced'), path: '/usage' },
            { icon: <CreditCardIcon sx={{ fontSize: 18 }} />, label: t('home.contract'), path: '/usage' },
          ].map((item, i) => (
            <Box
              key={i}
              onClick={() => navigate(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
                px: 1,
                borderRadius: 1,
                cursor: 'pointer',
                color: tuyaColors.textSecondary,
                '&:hover': { bgcolor: '#F5F5F5', color: tuyaColors.orange },
                transition: 'all 150ms',
              }}
            >
              {item.icon}
              <Typography variant="body2">{item.label}</Typography>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          {/* Service Expiration */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {t('home.service-status')}
          </Typography>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: '#FFF7F0',
              border: '1px solid #FFE4CC',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <NewReleasesIcon sx={{ fontSize: 16, color: tuyaColors.orange }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t('home.platform-active')}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
              {t('home.iot-core-running')}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Recommended */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {t('home.quick-actions')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            <Chip
              label={t('home.new-device')}
              size="small"
              onClick={() => navigate('/entities/devices')}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: tuyaColors.sidebarActive, color: tuyaColors.orange } }}
            />
            <Chip
              label={t('home.new-dashboard')}
              size="small"
              onClick={() => navigate('/dashboards')}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: tuyaColors.sidebarActive, color: tuyaColors.orange } }}
            />
            <Chip
              label={t('home.view-alarms')}
              size="small"
              onClick={() => navigate('/alarms')}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: tuyaColors.sidebarActive, color: tuyaColors.orange } }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
