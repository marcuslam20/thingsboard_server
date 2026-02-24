import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useDashboardContext } from '../context/DashboardContext';
import { EntityAlias } from '@/models/dashboard.model';

interface EntityAliasDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function EntityAliasDialog({ open, onClose }: EntityAliasDialogProps) {
  const { state, dispatch } = useDashboardContext();
  const config = state.dashboard?.configuration;
  const [aliases, setAliases] = useState<Record<string, EntityAlias>>({});
  const [editAlias, setEditAlias] = useState<EntityAlias | null>(null);
  const [aliasName, setAliasName] = useState('');
  const [filterType, setFilterType] = useState('singleEntity');
  const [entityType, setEntityType] = useState('DEVICE');

  useEffect(() => {
    if (open) {
      setAliases({ ...(config?.entityAliases || {}) });
      setEditAlias(null);
    }
  }, [open, config]);

  const handleAddAlias = () => {
    setEditAlias(null);
    setAliasName('');
    setFilterType('singleEntity');
    setEntityType('DEVICE');
  };

  const handleEditAlias = (alias: EntityAlias) => {
    setEditAlias(alias);
    setAliasName(alias.alias);
    setFilterType(alias.filter.type || 'singleEntity');
    setEntityType(alias.filter.entityType || 'DEVICE');
  };

  const handleSaveAlias = () => {
    if (!aliasName.trim()) return;

    const id = editAlias?.id || `alias_${Date.now()}`;
    const alias: EntityAlias = {
      id,
      alias: aliasName.trim(),
      filter: {
        type: filterType,
        entityType,
        resolveMultiple: filterType !== 'singleEntity',
      },
    };

    setAliases({ ...aliases, [id]: alias });
    setEditAlias(null);
    setAliasName('');
  };

  const handleDeleteAlias = (id: string) => {
    const copy = { ...aliases };
    delete copy[id];
    setAliases(copy);
  };

  const handleApply = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { entityAliases: aliases },
    });
    onClose();
  };

  const aliasList = Object.values(aliases);
  const isEditing = aliasName.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Entity Aliases</DialogTitle>
      <DialogContent>
        {aliasList.length > 0 ? (
          <List dense>
            {aliasList.map((alias) => (
              <ListItem
                key={alias.id}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleEditAlias(alias)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteAlias(alias.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={alias.alias}
                  secondary={`${alias.filter.type} - ${alias.filter.entityType || 'any'}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No entity aliases configured
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {editAlias ? 'Edit Alias' : 'Add Alias'}
        </Typography>

        <TextField
          size="small"
          label="Alias Name"
          value={aliasName}
          onChange={(e) => setAliasName(e.target.value)}
          fullWidth
          sx={{ mb: 1.5 }}
        />

        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel>Filter Type</InputLabel>
          <Select value={filterType} label="Filter Type" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="singleEntity">Single Entity</MenuItem>
            <MenuItem value="entityList">Entity List</MenuItem>
            <MenuItem value="entityName">Entity Name</MenuItem>
            <MenuItem value="entityType">Entity Type</MenuItem>
            <MenuItem value="stateEntity">State Entity</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel>Entity Type</InputLabel>
          <Select value={entityType} label="Entity Type" onChange={(e) => setEntityType(e.target.value)}>
            <MenuItem value="DEVICE">Device</MenuItem>
            <MenuItem value="ASSET">Asset</MenuItem>
            <MenuItem value="ENTITY_VIEW">Entity View</MenuItem>
            <MenuItem value="TENANT">Tenant</MenuItem>
            <MenuItem value="CUSTOMER">Customer</MenuItem>
            <MenuItem value="DASHBOARD">Dashboard</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={isEditing ? handleSaveAlias : handleAddAlias}
          disabled={!aliasName.trim()}
        >
          {editAlias ? 'Update Alias' : 'Add Alias'}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleApply}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}
