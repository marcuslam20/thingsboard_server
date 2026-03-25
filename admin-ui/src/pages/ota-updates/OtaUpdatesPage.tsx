/*
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import OtaUpdateDialog from './OtaUpdateDialog';
import { OtaPackageInfo, otaUpdateApi } from '@/api/ota-update.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OtaUpdatesPage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<OtaPackageInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<OtaPackageInfo | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<OtaPackageInfo>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '160px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'title', label: t('ota-update.title'), width: '22%' },
    { id: 'version', label: t('ota-update.version'), width: '10%' },
    {
      id: 'type', label: t('ota-update.type'), width: '10%',
      render: (r) => <Chip label={r.type} size="small" color={r.type === 'FIRMWARE' ? 'primary' : 'secondary'} variant="outlined" />,
    },
    { id: 'deviceProfileName', label: t('ota-update.device-profile'), width: '15%', render: (r) => r.deviceProfileName || '' },
    { id: 'tag', label: t('ota-update.tag'), width: '10%', render: (r) => r.tag || '' },
    {
      id: 'hasData', label: t('ota-update.data'), width: '10%', sortable: false,
      render: (r) => r.hasData ? <Chip label={formatBytes(r.dataSize)} size="small" color="success" variant="outlined" /> : <Chip label={t('ota-update.no-data')} size="small" variant="outlined" />,
    },
  ];

  const rowActions: RowAction<OtaPackageInfo>[] = [
    { icon: <EditIcon fontSize="small" />, tooltip: t('action.edit'), onClick: (r) => { setEditPkg(r); setDialogOpen(true); } },
    { icon: <DeleteIcon fontSize="small" color="error" />, tooltip: t('action.delete'), onClick: (r) => { setToDelete(r); setDeleteDialogOpen(true); } },
  ];

  const fetchData = useCallback((pl: PageLink) => otaUpdateApi.getOtaPackagesV2(pl), []);

  const handleSaved = () => { setDialogOpen(false); setEditPkg(null); refresh(); };
  const handleDelete = async () => {
    if (toDelete) { await otaUpdateApi.deleteOtaPackage(toDelete.id.id); setDeleteDialogOpen(false); setToDelete(null); refresh(); }
  };
  const handleDeleteSelected = async (rows: OtaPackageInfo[]) => {
    await Promise.all(rows.map((r) => otaUpdateApi.deleteOtaPackage(r.id.id))); refresh();
  };

  return (
    <Box>
      <EntityTable<OtaPackageInfo>
        title={t('ota-update.ota-updates')}
        columns={columns}
        fetchData={fetchData}
        onAdd={() => { setEditPkg(null); setDialogOpen(true); }}
        addLabel={t('ota-update.add')}
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(r) => r.id.id}
        refreshTrigger={refreshTrigger}
      />
      <OtaUpdateDialog open={dialogOpen} otaPackage={editPkg}
        onClose={() => { setDialogOpen(false); setEditPkg(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={deleteDialogOpen} title={t('ota-update.delete-title')}
        content={t('ota-update.delete-confirm', { title: toDelete?.title, version: toDelete?.version })}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDelete(null); }} />
    </Box>
  );
}
