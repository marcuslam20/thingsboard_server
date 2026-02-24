import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { attributeApi, AttributeScope, AttributeData } from '@/api/attribute.api';

interface Props {
  deviceId: string;
}

const SCOPES: { label: string; value: AttributeScope }[] = [
  { label: 'Server attributes', value: 'SERVER_SCOPE' },
  { label: 'Shared attributes', value: 'SHARED_SCOPE' },
  { label: 'Client attributes', value: 'CLIENT_SCOPE' },
];

export default function DeviceAttributesTab({ deviceId }: Props) {
  const [scope, setScope] = useState(0);
  const [attributes, setAttributes] = useState<AttributeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const currentScope = SCOPES[scope].value;

  const loadAttributes = useCallback(() => {
    setLoading(true);
    attributeApi.getEntityAttributes('DEVICE', deviceId, currentScope)
      .then((data) => {
        setAttributes(data.sort((a, b) => a.key.localeCompare(b.key)));
        setSelected(new Set());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [deviceId, currentScope]);

  useEffect(() => {
    loadAttributes();
  }, [loadAttributes]);

  const handleAdd = async () => {
    let parsedValue: unknown = newValue;
    try { parsedValue = JSON.parse(newValue); } catch { /* keep as string */ }
    await attributeApi.saveEntityAttributes('DEVICE', deviceId, currentScope, { [newKey]: parsedValue });
    setAddDialogOpen(false);
    setNewKey('');
    setNewValue('');
    loadAttributes();
  };

  const handleDeleteSelected = async () => {
    await attributeApi.deleteEntityAttributes('DEVICE', deviceId, currentScope, Array.from(selected));
    setSelected(new Set());
    loadAttributes();
  };

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isWritable = currentScope !== 'CLIENT_SCOPE';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Tabs value={scope} onChange={(_, v) => setScope(v)} sx={{ flex: 1 }}>
          {SCOPES.map((s) => <Tab key={s.value} label={s.label} />)}
        </Tabs>
        <Tooltip title="Refresh">
          <IconButton onClick={loadAttributes}><RefreshIcon /></IconButton>
        </Tooltip>
        {isWritable && (
          <>
            {selected.size > 0 && (
              <Tooltip title="Delete selected">
                <IconButton onClick={handleDeleteSelected} color="error"><DeleteIcon /></IconButton>
              </Tooltip>
            )}
            <Button startIcon={<AddIcon />} size="small" variant="contained" onClick={() => setAddDialogOpen(true)}>
              Add
            </Button>
          </>
        )}
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {isWritable && <TableCell padding="checkbox" sx={{ width: 48 }} />}
              <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 180 }}>Last updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isWritable ? 4 : 3} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : attributes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isWritable ? 4 : 3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No attributes</Typography>
                </TableCell>
              </TableRow>
            ) : (
              attributes.map((attr) => (
                <TableRow key={attr.key} hover>
                  {isWritable && (
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selected.has(attr.key)}
                        onChange={() => toggleSelect(attr.key)}
                      />
                    </TableCell>
                  )}
                  <TableCell>{attr.key}</TableCell>
                  <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof attr.value === 'object' ? JSON.stringify(attr.value) : String(attr.value)}
                  </TableCell>
                  <TableCell>{new Date(attr.lastUpdateTs).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Attribute Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Attribute</DialogTitle>
        <DialogContent>
          <TextField label="Key" value={newKey} onChange={(e) => setNewKey(e.target.value)} fullWidth margin="normal" autoFocus />
          <TextField label="Value" value={newValue} onChange={(e) => setNewValue(e.target.value)} fullWidth margin="normal" multiline rows={3}
            helperText="Enter a JSON value or plain string" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={!newKey.trim()}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
