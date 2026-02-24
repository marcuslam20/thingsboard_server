import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MessageIcon from '@mui/icons-material/Message';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import CodeIcon from '@mui/icons-material/Code';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import AlarmIcon from '@mui/icons-material/Alarm';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import { usageApi, UsageInfo } from '@/api/usage.api';

interface UsageMetric {
  label: string;
  icon: React.ReactNode;
  count: number;
  limit: number;
  state: string;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function getStateColor(state: string): 'success' | 'warning' | 'error' | 'default' {
  switch (state) {
    case 'ENABLED': return 'success';
    case 'WARNING': return 'warning';
    case 'DISABLED': return 'error';
    default: return 'default';
  }
}

function getProgressColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 90) return 'error';
  if (pct >= 70) return 'warning';
  return 'success';
}

export default function ApiUsagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);

  useEffect(() => {
    usageApi.getUsageInfo()
      .then((info: UsageInfo) => {
        const m: UsageMetric[] = [
          {
            label: 'Transport Messages',
            icon: <MessageIcon />,
            count: info.transportMsgCount || 0,
            limit: info.transportMsgLimit || 0,
            state: info.transportApiState || 'ENABLED',
          },
          {
            label: 'Transport Data Points',
            icon: <DataUsageIcon />,
            count: info.transportDataPointsCount || 0,
            limit: info.transportDataPointsLimit || 0,
            state: info.transportApiState || 'ENABLED',
          },
          {
            label: 'Storage Data Points',
            icon: <StorageIcon />,
            count: info.storageDataPointsCount || 0,
            limit: info.storageDataPointsLimit || 0,
            state: info.dbApiState || 'ENABLED',
          },
          {
            label: 'Rule Engine Executions',
            icon: <SettingsIcon />,
            count: info.ruleEngineExecutionCount || 0,
            limit: info.ruleEngineExecutionLimit || 0,
            state: info.ruleEngineApiState || 'ENABLED',
          },
          {
            label: 'JavaScript Executions',
            icon: <CodeIcon />,
            count: info.jsExecutionCount || 0,
            limit: info.jsExecutionLimit || 0,
            state: info.jsExecutionApiState || 'ENABLED',
          },
          {
            label: 'TBEL Executions',
            icon: <CodeIcon />,
            count: info.tbelExecutionCount || 0,
            limit: info.tbelExecutionLimit || 0,
            state: info.tbelExecutionApiState || 'ENABLED',
          },
          {
            label: 'Emails Sent',
            icon: <EmailIcon />,
            count: info.emailCount || 0,
            limit: info.emailLimit || 0,
            state: info.emailApiState || 'ENABLED',
          },
          {
            label: 'SMS Sent',
            icon: <SmsIcon />,
            count: info.smsCount || 0,
            limit: info.smsLimit || 0,
            state: info.notificationApiState || 'ENABLED',
          },
          {
            label: 'Alarms Created',
            icon: <AlarmIcon />,
            count: info.createdAlarmsCount || 0,
            limit: info.createdAlarmsLimit || 0,
            state: info.alarmApiState || 'ENABLED',
          },
        ];
        setMetrics(m);
      })
      .catch(() => setError('Failed to load API usage data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>API Usage</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Usage Statistics</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Current billing cycle API usage and limits for your tenant.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {metrics.map((metric, index) => {
            const pct = metric.limit > 0 ? Math.min(100, (metric.count / metric.limit) * 100) : 0;
            const unlimited = metric.limit === 0;

            return (
              <Box key={metric.label}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{ color: 'text.secondary', display: 'flex' }}>{metric.icon}</Box>
                  <Typography sx={{ flex: 1, fontWeight: 500 }}>{metric.label}</Typography>
                  <Chip
                    label={metric.state}
                    size="small"
                    color={getStateColor(metric.state)}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 5 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={unlimited ? 0 : pct}
                      color={getProgressColor(pct)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'right', fontFamily: 'monospace' }}>
                    {formatNumber(metric.count)} / {unlimited ? 'Unlimited' : formatNumber(metric.limit)}
                  </Typography>
                  {!unlimited && (
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50 }}>
                      {pct.toFixed(0)}%
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
