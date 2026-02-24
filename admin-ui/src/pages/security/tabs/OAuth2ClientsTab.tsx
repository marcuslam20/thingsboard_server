import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import { adminApi, OAuth2Client } from '@/api/admin.api';

interface ClientFormData {
  title: string;
  clientId: string;
  clientSecret: string;
  accessTokenUri: string;
  authorizationUri: string;
  scope: string;
  loginButtonLabel: string;
  clientAuthenticationMethod: string;
  userNameAttributeName: string;
}

export default function OAuth2ClientsTab() {
  const [clients, setClients] = useState<OAuth2Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<OAuth2Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<OAuth2Client | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    defaultValues: {
      title: '',
      clientId: '',
      clientSecret: '',
      accessTokenUri: '',
      authorizationUri: '',
      scope: 'openid,email,profile',
      loginButtonLabel: 'Login with OAuth2',
      clientAuthenticationMethod: 'POST',
      userNameAttributeName: 'email',
    },
  });

  const loadClients = useCallback(async () => {
    try {
      const data = await adminApi.getOAuth2Clients();
      setClients(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleAdd = () => {
    setEditClient(null);
    reset({
      title: '',
      clientId: '',
      clientSecret: '',
      accessTokenUri: '',
      authorizationUri: '',
      scope: 'openid,email,profile',
      loginButtonLabel: 'Login with OAuth2',
      clientAuthenticationMethod: 'POST',
      userNameAttributeName: 'email',
    });
    setDialogOpen(true);
  };

  const handleEdit = (client: OAuth2Client) => {
    setEditClient(client);
    reset({
      title: client.title,
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      accessTokenUri: client.accessTokenUri,
      authorizationUri: client.authorizationUri,
      scope: client.scope?.join(',') || '',
      loginButtonLabel: client.loginButtonLabel || '',
      clientAuthenticationMethod: client.clientAuthenticationMethod || 'POST',
      userNameAttributeName: client.userNameAttributeName || 'email',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ClientFormData) => {
    setSaving(true);
    setError('');
    try {
      const payload: OAuth2Client = {
        ...(editClient || {}),
        title: data.title,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        accessTokenUri: data.accessTokenUri,
        authorizationUri: data.authorizationUri,
        scope: data.scope.split(',').map((s) => s.trim()).filter(Boolean),
        loginButtonLabel: data.loginButtonLabel,
        clientAuthenticationMethod: data.clientAuthenticationMethod,
        userNameAttributeName: data.userNameAttributeName,
        platforms: editClient?.platforms || ['WEB'],
      };
      await adminApi.saveOAuth2Client(payload);
      setDialogOpen(false);
      loadClients();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save OAuth2 client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete?.id) return;
    try {
      await adminApi.deleteOAuth2Client(clientToDelete.id.id);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      loadClients();
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Paper variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>OAuth2 Clients</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} size="small">
            Add Client
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Client ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Scopes</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Platforms</TableCell>
                <TableCell sx={{ width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No OAuth2 clients configured</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id?.id || client.clientId}>
                    <TableCell>{client.title}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{client.clientId}</TableCell>
                    <TableCell>
                      {client.scope?.map((s) => <Chip key={s} label={s} size="small" sx={{ mr: 0.5, mb: 0.25 }} />)}
                    </TableCell>
                    <TableCell>
                      {client.platforms?.map((p) => <Chip key={p} label={p} size="small" variant="outlined" sx={{ mr: 0.5 }} />)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(client)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => { setClientToDelete(client); setDeleteDialogOpen(true); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editClient ? 'Edit OAuth2 Client' : 'Add OAuth2 Client'}</DialogTitle>
        {saving && <LinearProgress />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Controller name="title" control={control} rules={{ required: 'Title is required' }}
              render={({ field }) => <TextField {...field} label="Title" fullWidth size="small" margin="normal" error={!!errors.title} helperText={errors.title?.message} autoFocus />} />

            <Controller name="clientId" control={control} rules={{ required: 'Client ID is required' }}
              render={({ field }) => <TextField {...field} label="Client ID" fullWidth size="small" margin="normal" error={!!errors.clientId} helperText={errors.clientId?.message} />} />

            <Controller name="clientSecret" control={control} rules={{ required: 'Client Secret is required' }}
              render={({ field }) => <TextField {...field} label="Client Secret" fullWidth size="small" margin="normal" type="password" error={!!errors.clientSecret} helperText={errors.clientSecret?.message} />} />

            <Controller name="authorizationUri" control={control} rules={{ required: 'Required' }}
              render={({ field }) => <TextField {...field} label="Authorization URI" fullWidth size="small" margin="normal" error={!!errors.authorizationUri} helperText={errors.authorizationUri?.message} />} />

            <Controller name="accessTokenUri" control={control} rules={{ required: 'Required' }}
              render={({ field }) => <TextField {...field} label="Access Token URI" fullWidth size="small" margin="normal" error={!!errors.accessTokenUri} helperText={errors.accessTokenUri?.message} />} />

            <Controller name="scope" control={control}
              render={({ field }) => <TextField {...field} label="Scopes (comma-separated)" fullWidth size="small" margin="normal" helperText="e.g., openid,email,profile" />} />

            <Controller name="loginButtonLabel" control={control}
              render={({ field }) => <TextField {...field} label="Login Button Label" fullWidth size="small" margin="normal" />} />

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Controller name="clientAuthenticationMethod" control={control}
                render={({ field }) => (
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Auth Method</InputLabel>
                    <Select {...field} label="Auth Method">
                      <MenuItem value="POST">POST</MenuItem>
                      <MenuItem value="BASIC">BASIC</MenuItem>
                    </Select>
                  </FormControl>
                )} />

              <Controller name="userNameAttributeName" control={control}
                render={({ field }) => <TextField {...field} label="Username Attribute" size="small" sx={{ flex: 1 }} />} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editClient ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete OAuth2 Client"
        content={`Are you sure you want to delete "${clientToDelete?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialogOpen(false); setClientToDelete(null); }}
      />
    </Box>
  );
}
