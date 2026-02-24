import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import { resourceApi, TbResourceInfo } from '@/api/resource.api';
import { PageLink } from '@/models/page.model';

const NULL_UUID = '13814000-1dd2-11b2-8080-808080808080';
const RESOURCE_TYPES = ['JS_MODULE', 'LWM2M_MODEL', 'PKCS_12', 'JKS'];

interface ResourceFormData {
  title: string;
  resourceType: string;
}

export default function ResourcesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editResource, setEditResource] = useState<TbResourceInfo | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TbResourceInfo | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<ResourceFormData>({
    defaultValues: { title: '', resourceType: 'JS_MODULE' },
  });

  const columns: ColumnDef<TbResourceInfo>[] = [
    { id: 'createdTime', label: 'Created Time', width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'title', label: 'Title' },
    { id: 'resourceType', label: 'Type', width: '130px', render: (r) => <Chip label={r.resourceType} size="small" variant="outlined" /> },
    { id: 'resourceKey', label: 'Key', width: '200px', render: (r) => r.resourceKey || '' },
    { id: 'system', label: 'System', width: '80px', sortable: false, render: (r) =>
      r.tenantId?.id === NULL_UUID ? <Chip label="System" size="small" color="info" variant="outlined" /> : null },
  ];

  const rowActions: RowAction<TbResourceInfo>[] = [
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Download',
      onClick: async (r) => {
        const blob = await resourceApi.downloadResource(r.id.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = r.fileName || r.title;
        a.click();
        URL.revokeObjectURL(url);
      },
    },
    { icon: <EditIcon fontSize="small" />, tooltip: 'Edit', onClick: (r) => openEdit(r) },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: 'Delete', onClick: (r) => { setToDelete(r); setDeleteOpen(true); },
      hidden: (r) => r.tenantId?.id === NULL_UUID },
  ];

  const fetchData = useCallback((pl: PageLink) => resourceApi.getResources(pl), []);

  const openAdd = () => {
    setEditResource(null);
    setSelectedFile(null);
    reset({ title: '', resourceType: 'JS_MODULE' });
    setDialogOpen(true);
  };

  const openEdit = (r: TbResourceInfo) => {
    setEditResource(r);
    setSelectedFile(null);
    reset({ title: r.title, resourceType: r.resourceType });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ResourceFormData) => {
    setSaving(true);
    setError('');
    try {
      let fileData: string | undefined;
      let fileName: string | undefined;
      if (selectedFile) {
        const buffer = await selectedFile.arrayBuffer();
        fileData = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        fileName = selectedFile.name;
      }
      await resourceApi.saveResource({
        ...(editResource || {}),
        title: data.title,
        resourceType: data.resourceType,
        ...(fileData ? { data: fileData, fileName } : {}),
      });
      setDialogOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete?.id) return;
    await resourceApi.deleteResource(toDelete.id.id);
    setDeleteOpen(false);
    setToDelete(null);
    setRefreshTrigger((p) => p + 1);
  };

  return (
    <Box>
      <EntityTable<TbResourceInfo>
        title="Resources Library"
        columns={columns}
        fetchData={fetchData}
        onAdd={openAdd}
        addLabel="Add Resource"
        rowActions={rowActions}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
        onDeleteSelected={async (selected) => {
          const deletable = selected.filter((r) => r.tenantId?.id !== NULL_UUID);
          for (const r of deletable) await resourceApi.deleteResource(r.id.id);
          setRefreshTrigger((p) => p + 1);
        }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
        {saving && <LinearProgress />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Controller name="title" control={control} rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <TextField {...field} label="Title" fullWidth size="small" margin="normal" autoFocus
                  error={!!formErrors.title} helperText={formErrors.title?.message} />
              )} />
            <Controller name="resourceType" control={control}
              render={({ field }) => (
                <TextField {...field} select label="Resource Type" fullWidth size="small" margin="normal"
                  disabled={!!editResource}>
                  {RESOURCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                </TextField>
              )} />
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" component="label" size="small">
                {selectedFile ? selectedFile.name : 'Choose File'}
                <input type="file" hidden onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{editResource ? 'Save' : 'Add'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog open={deleteOpen} title="Delete Resource"
        content={`Delete resource "${toDelete?.title}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteOpen(false); setToDelete(null); }} />
    </Box>
  );
}
