import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { EntitySearchDirection } from '@/models/relation.model';
import { EntityType } from '@/models/entity-type.model';
import { relationApi } from '@/api/relation.api';

interface RelationDialogProps {
  open: boolean;
  entityId: string;
  entityType: string;
  direction: EntitySearchDirection;
  onClose: () => void;
  onSaved: () => void;
}

const RELATION_TYPES = ['Contains', 'Manages', 'Uses', 'Provides', 'DependsOn', 'Controls', 'MonitorsFrom'];
const ENTITY_TYPES = [
  EntityType.DEVICE,
  EntityType.ASSET,
  EntityType.ENTITY_VIEW,
  EntityType.DASHBOARD,
  EntityType.USER,
  EntityType.CUSTOMER,
  EntityType.TENANT,
  EntityType.EDGE,
];

export default function RelationDialog({ open, entityId, entityType, direction, onClose, onSaved }: RelationDialogProps) {
  const [relationType, setRelationType] = useState('Contains');
  const [targetEntityType, setTargetEntityType] = useState<string>(EntityType.DEVICE);
  const [targetEntityId, setTargetEntityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!targetEntityId.trim()) {
      setError('Target entity ID is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const from = direction === 'FROM'
        ? { id: entityId, entityType }
        : { id: targetEntityId.trim(), entityType: targetEntityType };
      const to = direction === 'FROM'
        ? { id: targetEntityId.trim(), entityType: targetEntityType }
        : { id: entityId, entityType };

      await relationApi.saveRelation({
        from,
        to,
        type: relationType,
        typeGroup: 'COMMON',
      });
      handleClose();
      onSaved();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save relation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRelationType('Contains');
    setTargetEntityType(EntityType.DEVICE);
    setTargetEntityId('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add {direction === 'FROM' ? 'Outbound' : 'Inbound'} Relation</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          select
          label="Relation Type"
          value={relationType}
          onChange={(e) => setRelationType(e.target.value)}
          fullWidth
          margin="normal"
        >
          {RELATION_TYPES.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label={direction === 'FROM' ? 'Target Entity Type' : 'Source Entity Type'}
          value={targetEntityType}
          onChange={(e) => setTargetEntityType(e.target.value)}
          fullWidth
          margin="normal"
        >
          {ENTITY_TYPES.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>

        <TextField
          label={direction === 'FROM' ? 'Target Entity ID' : 'Source Entity ID'}
          value={targetEntityId}
          onChange={(e) => setTargetEntityId(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="Enter entity UUID"
          helperText="Enter the UUID of the target entity"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
