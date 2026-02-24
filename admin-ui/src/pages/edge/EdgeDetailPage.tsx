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
import { EdgeInfo, edgeApi } from '@/api/edge.api';
import { PageLink } from '@/models/page.model';
import EdgeDialog from './EdgeDialog';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import SubEntityTable, { SubColumnDef } from '@/components/entity/SubEntityTable';

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

const ruleChainColumns: SubColumnDef[] = [
  { id: 'createdTime', label: 'Created Time', width: '180px', render: (r) => r.createdTime ? new Date(r.createdTime as number).toLocaleString() : '' },
  { id: 'name', label: 'Name' },
  { id: 'root', label: 'Root', width: '80px', sortable: false, render: (r) => r.root ? 'Yes' : '' },
];

export default function EdgeDetailPage() {
  const { edgeId } = useParams<{ edgeId: string }>();
  const navigate = useNavigate();
  const [edge, setEdge] = useState<EdgeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadEdge = useCallback(() => {
    if (!edgeId) return;
    setLoading(true);
    edgeApi.getEdgeInfo(edgeId)
      .then(setEdge)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [edgeId]);

  useEffect(() => { loadEdge(); }, [loadEdge]);

  const fetchDevices = useCallback((pl: PageLink) => edgeApi.getEdgeDevices(edgeId!, pl), [edgeId]);
  const fetchAssets = useCallback((pl: PageLink) => edgeApi.getEdgeAssets(edgeId!, pl), [edgeId]);
  const fetchDashboards = useCallback((pl: PageLink) => edgeApi.getEdgeDashboards(edgeId!, pl), [edgeId]);
  const fetchRuleChains = useCallback((pl: PageLink) => edgeApi.getEdgeRuleChains(edgeId!, pl), [edgeId]);

  const handleDelete = async () => {
    if (!edgeId) return;
    await edgeApi.deleteEdge(edgeId);
    navigate('/edgeManagement/edges');
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!edge) {
    return (
      <Box>
        <Typography>Edge not found</Typography>
        <Button onClick={() => navigate('/edgeManagement/edges')}>Back to edges</Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/edgeManagement/edges')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>{edge.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {edge.type}{edge.label ? ` | ${edge.label}` : ''}{edge.customerTitle ? ` | Customer: ${edge.customerTitle}` : ''}
          </Typography>
        </Box>
        <Button startIcon={<EditIcon />} onClick={() => setEditOpen(true)} variant="outlined" size="small">Edit</Button>
        <Button startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} color="error" variant="outlined" size="small">Delete</Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Details" />
          <Tab label="Devices" />
          <Tab label="Assets" />
          <Tab label="Dashboards" />
          <Tab label="Rule Chains" />
        </Tabs>
      </Box>

      {/* Details */}
      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{edge.name}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Type</Typography><Typography>{edge.type}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Label</Typography><Typography>{edge.label || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Customer</Typography><Typography>{edge.customerTitle || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Routing Key</Typography><Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{edge.routingKey || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Secret</Typography><Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{edge.secret || '-'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography>{new Date(edge.createdTime).toLocaleString()}</Typography></Box>
          </Box>
        </Paper>
      )}

      {/* Sub-entity tabs */}
      {tab === 1 && <SubEntityTable fetchData={fetchDevices} columns={deviceColumns} />}
      {tab === 2 && <SubEntityTable fetchData={fetchAssets} columns={assetColumns} />}
      {tab === 3 && <SubEntityTable fetchData={fetchDashboards} columns={dashboardColumns} />}
      {tab === 4 && <SubEntityTable fetchData={fetchRuleChains} columns={ruleChainColumns} />}

      {/* Dialogs */}
      <EdgeDialog open={editOpen} edge={edge} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); loadEdge(); }} />
      <ConfirmDialog open={deleteOpen} title="Delete Edge" content={`Delete edge "${edge.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </Box>
  );
}
