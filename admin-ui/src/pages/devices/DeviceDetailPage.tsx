import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { DeviceInfo, Device } from '@/models/device.model';
import { deviceApi } from '@/api/device.api';
import DeviceDialog from './DeviceDialog';
import DeviceCredentialsDialog from './DeviceCredentialsDialog';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DeviceDetailsTab from './tabs/DeviceDetailsTab';
import DeviceAttributesTab from './tabs/DeviceAttributesTab';
import DeviceTelemetryTab from './tabs/DeviceTelemetryTab';
import DeviceAlarmsTab from './tabs/DeviceAlarmsTab';
import DeviceEventsTab from './tabs/DeviceEventsTab';
import RelationTable from '@/components/entity/RelationTable';

export default function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDeviceFull, setEditDeviceFull] = useState<Device | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);

  const loadDevice = () => {
    if (!deviceId) return;
    setLoading(true);
    deviceApi.getDeviceInfo(deviceId)
      .then(setDevice)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDevice();
  }, [deviceId]);

  const handleEdit = async () => {
    if (!deviceId) return;
    const full = await deviceApi.getDevice(deviceId);
    setEditDeviceFull(full);
    setEditDialogOpen(true);
  };

  const handleSaved = () => {
    setEditDialogOpen(false);
    setEditDeviceFull(null);
    loadDevice();
  };

  const handleDelete = async () => {
    if (!deviceId) return;
    await deviceApi.deleteDevice(deviceId);
    navigate('/entities/devices');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!device) {
    return (
      <Box>
        <Typography>Device not found</Typography>
        <Button onClick={() => navigate('/entities/devices')}>Back to devices</Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/entities/devices')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              {device.name}
            </Typography>
            <Chip
              label={device.active ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                bgcolor: device.active ? 'rgba(25, 128, 56, 0.08)' : 'rgba(209, 39, 48, 0.08)',
                color: device.active ? '#198038' : '#d12730',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {device.deviceProfileName} {device.label ? `| ${device.label}` : ''}
          </Typography>
        </Box>
        <Button startIcon={<VpnKeyIcon />} onClick={() => setCredentialsDialogOpen(true)} variant="outlined" size="small">
          Credentials
        </Button>
        <Button startIcon={<EditIcon />} onClick={handleEdit} variant="outlined" size="small">
          Edit
        </Button>
        <Button startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)} color="error" variant="outlined" size="small">
          Delete
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Details" />
          <Tab label="Attributes" />
          <Tab label="Latest Telemetry" />
          <Tab label="Alarms" />
          <Tab label="Events" />
          <Tab label="Relations" />
        </Tabs>
      </Box>

      {/* Tab content */}
      {tab === 0 && <DeviceDetailsTab device={device} />}
      {tab === 1 && <DeviceAttributesTab deviceId={device.id.id} />}
      {tab === 2 && <DeviceTelemetryTab deviceId={device.id.id} />}
      {tab === 3 && <DeviceAlarmsTab deviceId={device.id.id} />}
      {tab === 4 && <DeviceEventsTab deviceId={device.id.id} />}
      {tab === 5 && <RelationTable entityId={device.id.id} entityType="DEVICE" />}

      {/* Dialogs */}
      <DeviceDialog
        open={editDialogOpen}
        device={editDeviceFull}
        onClose={() => { setEditDialogOpen(false); setEditDeviceFull(null); }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Device"
        content={`Are you sure you want to delete device "${device.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <DeviceCredentialsDialog
        open={credentialsDialogOpen}
        deviceId={device.id.id}
        onClose={() => setCredentialsDialogOpen(false)}
      />
    </Box>
  );
}
