import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { TenantInfo, tenantApi } from '@/api/tenant.api';
import { PageLink } from '@/models/page.model';
import TenantDialog from './TenantDialog';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import SubEntityTable, { SubColumnDef } from '@/components/entity/SubEntityTable';

const userColumns: SubColumnDef[] = [
  { id: 'createdTime', label: 'Created Time', width: '180px', render: (r) => r.createdTime ? new Date(r.createdTime as number).toLocaleString() : '' },
  { id: 'email', label: 'Email' },
  { id: 'firstName', label: 'First Name' },
  { id: 'lastName', label: 'Last Name' },
  { id: 'authority', label: 'Authority', width: '140px', sortable: false, render: (r) => <Chip label={String(r.authority || '')} size="small" variant="outlined" /> },
];

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadTenant = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    tenantApi.getTenant(tenantId)
      .then(setTenant)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => { loadTenant(); }, [loadTenant]);

  const fetchUsers = useCallback((pl: PageLink) => tenantApi.getTenantUsers(tenantId!, pl), [tenantId]);

  const handleDelete = async () => {
    if (!tenantId) return;
    await tenantApi.deleteTenant(tenantId);
    navigate('/tenants');
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!tenant) {
    return (
      <Box>
        <Typography>Tenant not found</Typography>
        <Button onClick={() => navigate('/tenants')}>Back to tenants</Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/tenants')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>{tenant.title}</Typography>
            {tenant.tenantProfileName && <Chip label={tenant.tenantProfileName} size="small" variant="outlined" />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {[tenant.email, tenant.city, tenant.country].filter(Boolean).join(' | ')}
          </Typography>
        </Box>
        <Button startIcon={<EditIcon />} onClick={() => setEditOpen(true)} variant="outlined" size="small">Edit</Button>
        <Button startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} color="error" variant="outlined" size="small">Delete</Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Details" />
          <Tab label="Admins" />
        </Tabs>
      </Box>

      {/* Details */}
      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box><Typography variant="caption" color="text.secondary">Title</Typography><Typography>{tenant.title}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Profile</Typography><Typography>{tenant.tenantProfileName || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{tenant.email || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{tenant.phone || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Country</Typography><Typography>{tenant.country || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">City</Typography><Typography>{tenant.city || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Address</Typography><Typography>{tenant.address || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography>{new Date(tenant.createdTime).toLocaleString()}</Typography></Box>
          </Box>
        </Paper>
      )}

      {/* Users */}
      {tab === 1 && <SubEntityTable fetchData={fetchUsers} columns={userColumns} />}

      {/* Dialogs */}
      <TenantDialog open={editOpen} tenant={tenant} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); loadTenant(); }} />
      <ConfirmDialog open={deleteOpen} title="Delete Tenant" content={`Delete tenant "${tenant.title}"? All tenant data will be lost.`} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </Box>
  );
}
