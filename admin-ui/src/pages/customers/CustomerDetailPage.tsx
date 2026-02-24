import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Customer, customerApi } from '@/api/customer.api';
import { PageLink } from '@/models/page.model';
import CustomerDialog from './CustomerDialog';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import SubEntityTable, { SubColumnDef } from '@/components/entity/SubEntityTable';

const userColumns: SubColumnDef[] = [
  { id: 'createdTime', label: 'Created Time', width: '180px', render: (r) => r.createdTime ? new Date(r.createdTime as number).toLocaleString() : '' },
  { id: 'email', label: 'Email' },
  { id: 'firstName', label: 'First Name' },
  { id: 'lastName', label: 'Last Name' },
];

const deviceColumns: SubColumnDef[] = [
  { id: 'createdTime', label: 'Created Time', width: '180px', render: (r) => r.createdTime ? new Date(r.createdTime as number).toLocaleString() : '' },
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type', width: '150px' },
  { id: 'label', label: 'Label' },
];

const assetColumns: SubColumnDef[] = [
  { id: 'createdTime', label: 'Created Time', width: '180px', render: (r) => r.createdTime ? new Date(r.createdTime as number).toLocaleString() : '' },
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type', width: '150px' },
  { id: 'label', label: 'Label' },
];

const dashboardColumns: SubColumnDef[] = [
  { id: 'createdTime', label: 'Created Time', width: '180px', render: (r) => r.createdTime ? new Date(r.createdTime as number).toLocaleString() : '' },
  { id: 'title', label: 'Title' },
];

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadCustomer = useCallback(() => {
    if (!customerId) return;
    setLoading(true);
    customerApi.getCustomer(customerId)
      .then(setCustomer)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => { loadCustomer(); }, [loadCustomer]);

  const fetchUsers = useCallback((pl: PageLink) => customerApi.getCustomerUsers(customerId!, pl), [customerId]);
  const fetchDevices = useCallback((pl: PageLink) => customerApi.getCustomerDevices(customerId!, pl), [customerId]);
  const fetchAssets = useCallback((pl: PageLink) => customerApi.getCustomerAssets(customerId!, pl), [customerId]);
  const fetchDashboards = useCallback((pl: PageLink) => customerApi.getCustomerDashboards(customerId!, pl), [customerId]);

  const handleDelete = async () => {
    if (!customerId) return;
    await customerApi.deleteCustomer(customerId);
    navigate('/customers');
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!customer) {
    return (
      <Box>
        <Typography>Customer not found</Typography>
        <Button onClick={() => navigate('/customers')}>Back to customers</Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/customers')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>{customer.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {[customer.email, customer.city, customer.country].filter(Boolean).join(' | ')}
          </Typography>
        </Box>
        <Button startIcon={<EditIcon />} onClick={() => setEditOpen(true)} variant="outlined" size="small">Edit</Button>
        <Button startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} color="error" variant="outlined" size="small">Delete</Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Details" />
          <Tab label="Users" />
          <Tab label="Devices" />
          <Tab label="Assets" />
          <Tab label="Dashboards" />
        </Tabs>
      </Box>

      {/* Details tab */}
      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box><Typography variant="caption" color="text.secondary">Title</Typography><Typography>{customer.title}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{customer.email || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{customer.phone || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Country</Typography><Typography>{customer.country || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">City</Typography><Typography>{customer.city || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Address</Typography><Typography>{customer.address || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography>{new Date(customer.createdTime).toLocaleString()}</Typography></Box>
          </Box>
        </Paper>
      )}

      {/* Sub-entity tabs */}
      {tab === 1 && <SubEntityTable fetchData={fetchUsers} columns={userColumns} />}
      {tab === 2 && <SubEntityTable fetchData={fetchDevices} columns={deviceColumns} />}
      {tab === 3 && <SubEntityTable fetchData={fetchAssets} columns={assetColumns} />}
      {tab === 4 && <SubEntityTable fetchData={fetchDashboards} columns={dashboardColumns} />}

      {/* Dialogs */}
      <CustomerDialog open={editOpen} customer={customer} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); loadCustomer(); }} />
      <ConfirmDialog open={deleteOpen} title="Delete Customer" content={`Delete customer "${customer.title}"?`} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </Box>
  );
}
