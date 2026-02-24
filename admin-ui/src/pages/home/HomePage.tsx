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
import { useAppSelector } from '@/store/store';
import { selectAuthority, selectUserDetails } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';
import { tuyaColors } from '@/theme/theme';

const tutorialSteps = [
  { label: 'Create Product', description: 'Define device profiles and data points' },
  { label: 'Add Devices', description: 'Register and pair IoT devices' },
  { label: 'Build Dashboard', description: 'Create data visualization' },
  { label: 'Test & Release', description: 'Debug and deploy' },
];

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
  const navigate = useNavigate();
  const authority = useAppSelector(selectAuthority);
  const user = useAppSelector(selectUserDetails);

  const consoleCards: ConsoleCard[] = [
    {
      id: 'product',
      title: 'Product Development',
      description: 'Create and manage device profiles, data points, and firmware',
      icon: <DevicesOtherIcon sx={{ fontSize: 32 }} />,
      color: tuyaColors.orange,
      path: '/profiles/deviceProfiles',
      authorities: [Authority.TENANT_ADMIN],
    },
    {
      id: 'dashboard',
      title: 'App Development',
      description: 'Build dashboards and configure widgets for data visualization',
      icon: <DashboardOutlinedIcon sx={{ fontSize: 32 }} />,
      color: '#1890FF',
      path: '/dashboards',
      authorities: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
    },
    {
      id: 'cloud',
      title: 'Cloud Development',
      description: 'Configure rule chains, edge computing, and gateway management',
      icon: <CloudOutlinedIcon sx={{ fontSize: 32 }} />,
      color: '#52C41A',
      path: '/ruleChains',
      authorities: [Authority.TENANT_ADMIN],
    },
    {
      id: 'ai-agent',
      title: 'AI Agent',
      description: 'Manage assets, entity views, and intelligent automation',
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
            Welcome to the Developer Platform
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: tuyaColors.textSecondary, mb: 2, ml: 7 }}>
          Hello{user?.firstName ? ` ${user.firstName}` : ''}, how can we assist you?
        </Typography>
      </Paper>

      {/* Innovative Tutorials - Stepper */}
      <Paper sx={{ p: 3, mb: 3, border: `1px solid ${tuyaColors.border}`, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Innovative Tutorials
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
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ borderColor: tuyaColors.border, color: tuyaColors.textSecondary }}
          >
            Read Document
          </Button>
        </Box>
      </Paper>

      {/* Developer Console */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left: Console cards */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Developer Console
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
            My Space
          </Typography>

          {[
            { icon: <BusinessIcon sx={{ fontSize: 18 }} />, label: 'Enterprise Info', path: '/profile' },
            { icon: <SecurityIcon sx={{ fontSize: 18 }} />, label: 'Authorization', path: '/security-settings/general' },
            { icon: <ReceiptIcon sx={{ fontSize: 18 }} />, label: 'Invoiced', path: '/usage' },
            { icon: <CreditCardIcon sx={{ fontSize: 18 }} />, label: 'Contract', path: '/usage' },
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
            Service Status
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
                Platform Active
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: tuyaColors.textHint }}>
              IoT Core service is running
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Recommended */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            <Chip
              label="New Device"
              size="small"
              onClick={() => navigate('/entities/devices')}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: tuyaColors.sidebarActive, color: tuyaColors.orange } }}
            />
            <Chip
              label="New Dashboard"
              size="small"
              onClick={() => navigate('/dashboards')}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: tuyaColors.sidebarActive, color: tuyaColors.orange } }}
            />
            <Chip
              label="View Alarms"
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
