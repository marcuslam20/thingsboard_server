import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import api from '@/api/client';

interface RepositorySettings {
  repositoryUri: string;
  defaultBranch: string;
  authMethod: string;
  username?: string;
  password?: string;
  privateKeyFileName?: string;
  privateKey?: string;
  privateKeyPassword?: string;
  showMergeCommits?: boolean;
}

interface AutoCommitSettings {
  autoCommitEnabled: boolean;
}

const AUTH_METHODS = ['USERNAME_PASSWORD', 'PRIVATE_KEY'];

const repositoryApi = {
  getSettings(): Promise<RepositorySettings | null> {
    return api.get('/api/admin/repositorySettings').then((r) => r.data).catch(() => null);
  },
  saveSettings(settings: RepositorySettings): Promise<RepositorySettings> {
    return api.post('/api/admin/repositorySettings', settings).then((r) => r.data);
  },
  deleteSettings(): Promise<void> {
    return api.delete('/api/admin/repositorySettings').then(() => undefined);
  },
  testAccess(settings: RepositorySettings): Promise<void> {
    return api.post('/api/admin/repositorySettings/testAccess', settings).then(() => undefined);
  },
  getAutoCommitSettings(): Promise<AutoCommitSettings | null> {
    return api.get('/api/admin/autoCommitSettings').then((r) => r.data).catch(() => null);
  },
  saveAutoCommitSettings(settings: AutoCommitSettings): Promise<AutoCommitSettings> {
    return api.post('/api/admin/autoCommitSettings', settings).then((r) => r.data);
  },
  deleteAutoCommitSettings(): Promise<void> {
    return api.delete('/api/admin/autoCommitSettings').then(() => undefined);
  },
};

export default function RepositorySettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoCommit, setAutoCommit] = useState(false);
  const [hasSettings, setHasSettings] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm<RepositorySettings>({
    defaultValues: {
      repositoryUri: '',
      defaultBranch: 'main',
      authMethod: 'USERNAME_PASSWORD',
      username: '',
      password: '',
    },
  });

  const authMethod = watch('authMethod');

  useEffect(() => {
    Promise.all([repositoryApi.getSettings(), repositoryApi.getAutoCommitSettings()])
      .then(([repo, ac]) => {
        if (repo) {
          reset(repo);
          setHasSettings(true);
        }
        if (ac) {
          setAutoCommit(ac.autoCommitEnabled);
        }
      })
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: RepositorySettings) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await repositoryApi.saveSettings(data);
      await repositoryApi.saveAutoCommitSettings({ autoCommitEnabled: autoCommit });
      setHasSettings(true);
      setSuccess('Repository settings saved successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError('');
    setSuccess('');
    try {
      const data = watch() as RepositorySettings;
      await repositoryApi.testAccess(data);
      setSuccess('Repository access test successful');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Repository access test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleClear = async () => {
    setError('');
    setSuccess('');
    try {
      await repositoryApi.deleteSettings();
      await repositoryApi.deleteAutoCommitSettings();
      reset({ repositoryUri: '', defaultBranch: 'main', authMethod: 'USERNAME_PASSWORD', username: '', password: '' });
      setAutoCommit(false);
      setHasSettings(false);
      setSuccess('Repository settings cleared');
    } catch {
      setError('Failed to clear settings');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Version Control Repository</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller name="repositoryUri" control={control} rules={{ required: 'Repository URI is required' }}
          render={({ field }) => (
            <TextField {...field} label="Repository URI" fullWidth size="small" margin="normal"
              placeholder="https://github.com/user/repo.git" />
          )} />
        <Controller name="defaultBranch" control={control}
          render={({ field }) => (
            <TextField {...field} label="Default Branch" fullWidth size="small" margin="normal" />
          )} />
        <Controller name="authMethod" control={control}
          render={({ field }) => (
            <TextField {...field} select label="Authentication Method" fullWidth size="small" margin="normal">
              {AUTH_METHODS.map((m) => (
                <MenuItem key={m} value={m}>{m.replace(/_/g, ' ')}</MenuItem>
              ))}
            </TextField>
          )} />

        {authMethod === 'USERNAME_PASSWORD' && (
          <>
            <Controller name="username" control={control}
              render={({ field }) => (
                <TextField {...field} label="Username" fullWidth size="small" margin="normal" />
              )} />
            <Controller name="password" control={control}
              render={({ field }) => (
                <TextField {...field} label="Password / Token" fullWidth size="small" margin="normal" type="password" />
              )} />
          </>
        )}

        {authMethod === 'PRIVATE_KEY' && (
          <>
            <Controller name="privateKey" control={control}
              render={({ field }) => (
                <TextField {...field} label="Private Key" fullWidth size="small" margin="normal" multiline rows={4}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----" />
              )} />
            <Controller name="privateKeyPassword" control={control}
              render={({ field }) => (
                <TextField {...field} label="Private Key Password" fullWidth size="small" margin="normal" type="password" />
              )} />
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={autoCommit} onChange={(e) => setAutoCommit(e.target.checked)} />}
          label="Enable Auto-Commit"
        />
        <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
          Automatically commit changes to the repository when entities are modified.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outlined" onClick={handleTest} disabled={testing}>
            {testing ? 'Testing...' : 'Test Access'}
          </Button>
          {hasSettings && (
            <Button color="error" variant="outlined" onClick={handleClear}>Clear Settings</Button>
          )}
        </Box>
      </form>
    </Paper>
  );
}
