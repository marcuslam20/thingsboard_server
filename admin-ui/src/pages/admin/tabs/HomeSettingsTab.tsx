import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import { adminApi, HomeDashboardInfo } from '@/api/admin.api';
import { dashboardApi } from '@/api/dashboard.api';
import { DashboardInfo } from '@/models/dashboard.model';

export default function HomeSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dashboards, setDashboards] = useState<DashboardInfo[]>([]);
  const [dashboardId, setDashboardId] = useState('');
  const [hideDashboardToolbar, setHideDashboardToolbar] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getHomeDashboardInfo().catch(() => null),
      dashboardApi.getTenantDashboards({ page: 0, pageSize: 100, sortProperty: 'title', sortOrder: 'ASC' }).catch(() => null),
    ]).then(([homeInfo, dashboardResult]) => {
      if (homeInfo) {
        setDashboardId(homeInfo.dashboardId?.id || '');
        setHideDashboardToolbar(homeInfo.hideDashboardToolbar !== false);
      }
      if (dashboardResult) {
        setDashboards(dashboardResult.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const info: HomeDashboardInfo = {
        dashboardId: dashboardId ? { id: dashboardId, entityType: 'DASHBOARD' } : null,
        hideDashboardToolbar,
      };
      await adminApi.saveHomeDashboardInfo(info);
      setSuccess('Home settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save home settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Home Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a dashboard to display on the Home page for tenant users.
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Home Dashboard</InputLabel>
          <Select
            value={dashboardId}
            label="Home Dashboard"
            onChange={(e) => setDashboardId(e.target.value)}
          >
            <MenuItem value="">
              <em>None (use default home page)</em>
            </MenuItem>
            {dashboards.map((d) => (
              <MenuItem key={d.id.id} value={d.id.id}>
                {d.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={hideDashboardToolbar}
              onChange={(e) => setHideDashboardToolbar(e.target.checked)}
              size="small"
            />
          }
          label="Hide dashboard toolbar"
        />

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave} size="small">
            Save
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
