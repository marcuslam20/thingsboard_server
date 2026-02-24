import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { DeviceInfo } from '@/models/device.model';

interface Props {
  device: DeviceInfo;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 180, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Box>
  );
}

export default function DeviceDetailsTab({ device }: Props) {
  const additionalInfo = device.additionalInfo as Record<string, unknown> | undefined;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Device Info
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <DetailRow label="Name" value={device.name} />
            <DetailRow label="Label" value={device.label} />
            <DetailRow label="Type" value={device.type} />
            <DetailRow label="Device Profile" value={device.deviceProfileName} />
            <DetailRow label="Status" value={device.active ? 'Active' : 'Inactive'} />
            <DetailRow label="Is Gateway" value={additionalInfo?.gateway ? 'Yes' : 'No' as string} />
            <DetailRow label="Created" value={new Date(device.createdTime).toLocaleString()} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Assignment
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <DetailRow label="Customer" value={device.customerTitle || 'Not assigned'} />
            <DetailRow label="Public" value={device.customerIsPublic ? 'Yes' : 'No'} />
            <DetailRow label="Device ID" value={device.id.id} />
          </CardContent>
        </Card>
        {additionalInfo?.description ? (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Description
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body2">{String(additionalInfo.description)}</Typography>
            </CardContent>
          </Card>
        ) : null}
      </Grid>
    </Grid>
  );
}
