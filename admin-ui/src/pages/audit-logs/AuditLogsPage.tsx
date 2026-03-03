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
import { useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EntityTable, { ColumnDef } from '@/components/entity/EntityTable';
import { AuditLog, auditLogApi } from '@/api/audit-log.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

const ACTION_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  ADDED: 'success',
  DELETED: 'error',
  UPDATED: 'info',
  ATTRIBUTES_UPDATED: 'info',
  ATTRIBUTES_DELETED: 'warning',
  RPC_CALL: 'default',
  CREDENTIALS_UPDATED: 'warning',
  ASSIGNED_TO_CUSTOMER: 'info',
  UNASSIGNED_FROM_CUSTOMER: 'warning',
  LOGIN: 'success',
  LOGOUT: 'default',
  LOCKOUT: 'error',
  ASSIGNED_FROM_TENANT: 'info',
  ASSIGNED_TO_TENANT: 'info',
};

export default function AuditLogsPage() {
  const { t } = useTranslation();

  const columns: ColumnDef<AuditLog>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'entityName', label: 'Entity', width: '18%', render: (r) => `${r.entityName} (${r.entityId?.entityType || ''})` },
    { id: 'userName', label: 'User', width: '15%' },
    {
      id: 'actionType', label: 'Action', width: '15%',
      render: (r) => <Chip label={r.actionType.replace(/_/g, ' ')} size="small" color={ACTION_COLORS[r.actionType] || 'default'} />,
    },
    {
      id: 'actionStatus', label: 'Status', width: '10%',
      render: (r) => (
        <Chip
          label={r.actionStatus}
          size="small"
          color={r.actionStatus === 'SUCCESS' ? 'success' : 'error'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'actionFailureDetails', label: 'Details', width: '20%', sortable: false,
      render: (r) => r.actionFailureDetails || '',
    },
  ];

  const fetchData = useCallback((pl: PageLink) => auditLogApi.getAuditLogs(pl), []);

  return (
    <Box>
      <EntityTable<AuditLog>
        title={t('audit-log.audit-logs')}
        columns={columns}
        fetchData={fetchData}
        getRowId={(r) => r.id.id}
      />
    </Box>
  );
}
