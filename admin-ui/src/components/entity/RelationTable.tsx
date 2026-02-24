import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { EntityRelationInfo, EntitySearchDirection } from '@/models/relation.model';
import { relationApi } from '@/api/relation.api';
import ConfirmDialog from './ConfirmDialog';
import RelationDialog from './RelationDialog';

interface RelationTableProps {
  entityId: string;
  entityType: string;
}

export default function RelationTable({ entityId, entityType }: RelationTableProps) {
  const [relations, setRelations] = useState<EntityRelationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<EntitySearchDirection>('FROM');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EntityRelationInfo | null>(null);

  const loadRelations = useCallback(async () => {
    setLoading(true);
    try {
      const data = direction === 'FROM'
        ? await relationApi.findInfoByFrom(entityId, entityType)
        : await relationApi.findInfoByTo(entityId, entityType);
      setRelations(data);
    } catch (err) {
      console.error('Failed to load relations:', err);
      setRelations([]);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, direction]);

  useEffect(() => {
    loadRelations();
  }, [loadRelations]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await relationApi.deleteRelation(
        deleteTarget.from.id, deleteTarget.from.entityType,
        deleteTarget.type,
        deleteTarget.to.id, deleteTarget.to.entityType,
      );
      setDeleteTarget(null);
      loadRelations();
    } catch (err) {
      console.error('Failed to delete relation:', err);
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    loadRelations();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <ToggleButtonGroup
          value={direction}
          exclusive
          onChange={(_, val) => { if (val) setDirection(val); }}
          size="small"
        >
          <ToggleButton value="FROM">Outbound</ToggleButton>
          <ToggleButton value="TO">Inbound</ToggleButton>
        </ToggleButtonGroup>

        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setDialogOpen(true)}>
          Add Relation
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : relations.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No relations found</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{direction === 'FROM' ? 'Target Entity' : 'Source Entity'}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entity Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }} width={60}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {relations.map((rel, idx) => {
                const targetName = direction === 'FROM' ? (rel.toName || rel.to.id) : (rel.fromName || rel.from.id);
                const targetType = direction === 'FROM' ? rel.to.entityType : rel.from.entityType;
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Chip label={rel.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{targetName}</TableCell>
                    <TableCell>
                      <Chip label={targetType} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(rel)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <RelationDialog
        open={dialogOpen}
        entityId={entityId}
        entityType={entityType}
        direction={direction}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Relation"
        content={`Delete this ${deleteTarget?.type} relation?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
