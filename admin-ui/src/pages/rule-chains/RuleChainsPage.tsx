import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import { rulechainApi, RuleChain } from '@/api/rulechain.api';
import { PageData, PageLink } from '@/models/page.model';

interface RuleChainFormData {
  name: string;
  description: string;
}

export default function RuleChainsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editChain, setEditChain] = useState<RuleChain | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [chainToDelete, setChainToDelete] = useState<RuleChain | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<RuleChainFormData>({
    defaultValues: { name: '', description: '' },
  });

  const fetchData = useCallback((pl: PageLink): Promise<PageData<RuleChain>> => {
    return rulechainApi.getRuleChains(pl);
  }, []);

  const columns: ColumnDef<RuleChain>[] = [
    {
      id: 'createdTime',
      label: 'Created Time',
      render: (row) => row.createdTime ? new Date(row.createdTime).toLocaleString() : '',
      width: '180px',
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {row.name}
          {row.root && (
            <Tooltip title="Root rule chain">
              <StarIcon fontSize="small" color="warning" />
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      sortable: false,
      render: (row) => row.additionalInfo?.description || '',
    },
    {
      id: 'root',
      label: 'Root',
      width: '80px',
      sortable: false,
      render: (row) =>
        row.root ? <Chip label="Root" size="small" color="warning" /> : null,
    },
  ];

  const handleExport = async (chain: RuleChain) => {
    if (!chain.id) return;
    try {
      const data = await rulechainApi.exportRuleChain(chain.id.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chain.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  };

  const handleSetRoot = async (chain: RuleChain) => {
    if (!chain.id) return;
    try {
      await rulechainApi.setRootRuleChain(chain.id.id);
      setRefreshTrigger((p) => p + 1);
    } catch {
      // Ignore
    }
  };

  const rowActions: RowAction<RuleChain>[] = [
    {
      icon: <StarIcon fontSize="small" />,
      tooltip: 'Set as Root',
      onClick: handleSetRoot,
      hidden: (row) => !!row.root,
    },
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Export',
      onClick: handleExport,
    },
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      onClick: (row) => handleEdit(row),
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete',
      onClick: (row) => {
        setChainToDelete(row);
        setDeleteOpen(true);
      },
      hidden: (row) => !!row.root,
    },
  ];

  const handleAdd = () => {
    setEditChain(null);
    reset({ name: '', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (chain: RuleChain) => {
    setEditChain(chain);
    reset({
      name: chain.name,
      description: chain.additionalInfo?.description || '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: RuleChainFormData) => {
    setSaving(true);
    setError('');
    try {
      await rulechainApi.saveRuleChain({
        ...(editChain || {}),
        name: data.name,
        additionalInfo: {
          ...(editChain?.additionalInfo || {}),
          description: data.description || undefined,
        },
      });
      setDialogOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save rule chain');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!chainToDelete?.id) return;
    try {
      await rulechainApi.deleteRuleChain(chainToDelete.id.id);
      setDeleteOpen(false);
      setChainToDelete(null);
      setRefreshTrigger((p) => p + 1);
    } catch {
      // Ignore
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.ruleChain) {
          delete data.ruleChain.id;
          delete data.ruleChain.tenantId;
          data.ruleChain.root = false;
          await rulechainApi.importRuleChain(data);
          setRefreshTrigger((p) => p + 1);
        }
      } catch {
        setError('Failed to import rule chain');
      }
    };
    input.click();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ flex: 1, fontWeight: 500 }}>Rule Chains</Typography>
        <Tooltip title="Import rule chain">
          <IconButton onClick={handleImport} size="small" sx={{ mr: 1 }}>
            <UploadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <EntityTable<RuleChain>
        title="Rule Chains"
        columns={columns}
        fetchData={fetchData}
        onAdd={handleAdd}
        rowActions={rowActions}
        getRowId={(row) => row.id?.id || row.name}
        refreshTrigger={refreshTrigger}
        onDeleteSelected={async (selected) => {
          const deletable = selected.filter((r) => !r.root);
          for (const r of deletable) {
            if (r.id) await rulechainApi.deleteRuleChain(r.id.id);
          }
          setRefreshTrigger((p) => p + 1);
        }}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editChain ? 'Edit Rule Chain' : 'Add Rule Chain'}</DialogTitle>
        {saving && <LinearProgress />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Controller name="name" control={control} rules={{ required: 'Name is required' }}
              render={({ field }) => (
                <TextField {...field} label="Name" fullWidth size="small" margin="normal" autoFocus
                  error={!!errors.name} helperText={errors.name?.message} />
              )} />
            <Controller name="description" control={control}
              render={({ field }) => (
                <TextField {...field} label="Description" fullWidth size="small" margin="normal"
                  multiline rows={3} />
              )} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editChain ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Rule Chain"
        content={`Are you sure you want to delete "${chainToDelete?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setChainToDelete(null); }}
      />
    </Box>
  );
}
