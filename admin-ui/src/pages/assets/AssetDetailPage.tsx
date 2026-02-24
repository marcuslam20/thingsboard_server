import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { AssetInfo, Asset, assetApi } from '@/api/asset.api';
import { attributeApi, AttributeScope, AttributeData } from '@/api/attribute.api';
import AssetDialog from './AssetDialog';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import RelationTable from '@/components/entity/RelationTable';

function AssetDetailsTab({ asset }: { asset: AssetInfo }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Name</Typography>
          <Typography>{asset.name}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Asset Profile</Typography>
          <Typography>{asset.assetProfileName || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Label</Typography>
          <Typography>{asset.label || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Customer</Typography>
          <Typography>{asset.customerTitle || 'Unassigned'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Type</Typography>
          <Typography>{asset.type || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Created</Typography>
          <Typography>{new Date(asset.createdTime).toLocaleString()}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function AssetAttributesTab({ assetId }: { assetId: string }) {
  const [attributes, setAttributes] = useState<AttributeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<AttributeScope>('SERVER_SCOPE');

  const loadAttrs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await attributeApi.getEntityAttributes('ASSET', assetId, scope);
      setAttributes(data);
    } catch (err) {
      console.error('Failed to load attributes:', err);
    } finally {
      setLoading(false);
    }
  }, [assetId, scope]);

  useEffect(() => { loadAttrs(); }, [loadAttrs]);

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Chip label="Server" variant={scope === 'SERVER_SCOPE' ? 'filled' : 'outlined'} onClick={() => setScope('SERVER_SCOPE')} color="primary" size="small" />
        <Chip label="Shared" variant={scope === 'SHARED_SCOPE' ? 'filled' : 'outlined'} onClick={() => setScope('SHARED_SCOPE')} color="primary" size="small" />
        <Chip label="Client" variant={scope === 'CLIENT_SCOPE' ? 'filled' : 'outlined'} onClick={() => setScope('CLIENT_SCOPE')} color="primary" size="small" />
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
      ) : attributes.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No attributes</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attributes.map((attr) => (
                <TableRow key={attr.key}>
                  <TableCell>{attr.key}</TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {typeof attr.value === 'object' ? JSON.stringify(attr.value) : String(attr.value)}
                  </TableCell>
                  <TableCell>{new Date(attr.lastUpdateTs).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<AssetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAssetFull, setEditAssetFull] = useState<Asset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadAsset = useCallback(() => {
    if (!assetId) return;
    setLoading(true);
    assetApi.getAssetInfo(assetId)
      .then(setAsset)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [assetId]);

  useEffect(() => { loadAsset(); }, [loadAsset]);

  const handleEdit = async () => {
    if (!assetId) return;
    const full = await assetApi.getAsset(assetId);
    setEditAssetFull(full);
    setEditDialogOpen(true);
  };

  const handleSaved = () => {
    setEditDialogOpen(false);
    setEditAssetFull(null);
    loadAsset();
  };

  const handleDelete = async () => {
    if (!assetId) return;
    await assetApi.deleteAsset(assetId);
    navigate('/entities/assets');
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!asset) {
    return (
      <Box>
        <Typography>Asset not found</Typography>
        <Button onClick={() => navigate('/entities/assets')}>Back to assets</Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/entities/assets')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>{asset.name}</Typography>
            {asset.assetProfileName && <Chip label={asset.assetProfileName} size="small" variant="outlined" />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {[asset.label, asset.customerTitle].filter(Boolean).join(' | ')}
          </Typography>
        </Box>
        <Button startIcon={<EditIcon />} onClick={handleEdit} variant="outlined" size="small">Edit</Button>
        <Button startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)} color="error" variant="outlined" size="small">Delete</Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Details" />
          <Tab label="Attributes" />
          <Tab label="Relations" />
        </Tabs>
      </Box>

      {/* Tab content */}
      {tab === 0 && <AssetDetailsTab asset={asset} />}
      {tab === 1 && <AssetAttributesTab assetId={asset.id.id} />}
      {tab === 2 && <RelationTable entityId={asset.id.id} entityType="ASSET" />}

      {/* Dialogs */}
      <AssetDialog
        open={editDialogOpen}
        asset={editAssetFull}
        onClose={() => { setEditDialogOpen(false); setEditAssetFull(null); }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Asset"
        content={`Are you sure you want to delete asset "${asset.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}
