import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import { NotificationTemplate, NotificationRule, Notification, notificationApi } from '@/api/notification.api';
import { PageLink } from '@/models/page.model';
import { useTranslation } from 'react-i18next';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [toDeleteName, setToDeleteName] = useState('');

  const refresh = () => setRefreshTrigger((n) => n + 1);

  // Inbox tab
  const inboxColumns: ColumnDef<Notification>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'type', label: 'Type', width: '12%' },
    { id: 'subject', label: 'Subject', width: '20%', render: (r) => r.subject || '' },
    { id: 'text', label: 'Message', width: '35%' },
    {
      id: 'status', label: 'Status', width: '10%',
      render: (r) => <Chip label={r.status} size="small" color={r.status === 'READ' ? 'default' : 'info'} variant="outlined" />,
    },
  ];

  const inboxActions: RowAction<Notification>[] = [
    {
      icon: <MarkEmailReadIcon fontSize="small" color="primary" />,
      tooltip: 'Mark as Read',
      onClick: async (r) => { await notificationApi.markNotificationAsRead(r.id.id); refresh(); },
      hidden: (r) => r.status === 'READ',
    },
    {
      icon: <DeleteIcon fontSize="small" color="error" />,
      tooltip: 'Delete',
      onClick: (r) => { setToDeleteId(r.id.id); setToDeleteName('this notification'); setDeleteDialogOpen(true); },
    },
  ];

  // Templates tab
  const templateColumns: ColumnDef<NotificationTemplate>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'name', label: 'Name', width: '25%' },
    { id: 'notificationType', label: 'Type', width: '15%', render: (r) => <Chip label={r.notificationType} size="small" variant="outlined" /> },
  ];

  const templateActions: RowAction<NotificationTemplate>[] = [
    {
      icon: <DeleteIcon fontSize="small" color="error" />,
      tooltip: 'Delete',
      onClick: (r) => { setToDeleteId(r.id.id); setToDeleteName(r.name); setDeleteDialogOpen(true); },
    },
  ];

  // Rules tab
  const ruleColumns: ColumnDef<NotificationRule>[] = [
    { id: 'createdTime', label: t('common.created-time'), width: '170px', render: (r) => new Date(r.createdTime).toLocaleString() },
    { id: 'name', label: 'Name', width: '25%' },
    { id: 'triggerType', label: 'Trigger', width: '15%', render: (r) => <Chip label={r.triggerType} size="small" variant="outlined" /> },
    {
      id: 'enabled', label: 'Enabled', width: '10%',
      render: (r) => <Chip label={r.enabled ? 'On' : 'Off'} size="small" color={r.enabled ? 'success' : 'default'} />,
    },
  ];

  const ruleActions: RowAction<NotificationRule>[] = [
    {
      icon: <DeleteIcon fontSize="small" color="error" />,
      tooltip: 'Delete',
      onClick: (r) => { setToDeleteId(r.id.id); setToDeleteName(r.name); setDeleteDialogOpen(true); },
    },
  ];

  const fetchInbox = useCallback((pl: PageLink) => notificationApi.getNotifications(pl), []);
  const fetchTemplates = useCallback((pl: PageLink) => notificationApi.getNotificationTemplates(pl), []);
  const fetchRules = useCallback((pl: PageLink) => notificationApi.getNotificationRules(pl), []);

  const handleDelete = async () => {
    if (!toDeleteId) return;
    try {
      if (tab === 0) await notificationApi.deleteNotification(toDeleteId);
      else if (tab === 1) await notificationApi.deleteNotificationTemplate(toDeleteId);
      else await notificationApi.deleteNotificationRule(toDeleteId);
    } finally {
      setDeleteDialogOpen(false);
      setToDeleteId(null);
      refresh();
    }
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => { setTab(v); setRefreshTrigger((n) => n + 1); }} sx={{ mb: 2 }}>
        <Tab label="Inbox" />
        <Tab label="Templates" />
        <Tab label="Rules" />
      </Tabs>

      {tab === 0 && (
        <EntityTable<Notification>
          title="Notifications"
          columns={inboxColumns}
          fetchData={fetchInbox}
          rowActions={inboxActions}
          getRowId={(r) => r.id.id}
          refreshTrigger={refreshTrigger}
        />
      )}

      {tab === 1 && (
        <EntityTable<NotificationTemplate>
          title="Notification Templates"
          columns={templateColumns}
          fetchData={fetchTemplates}
          rowActions={templateActions}
          getRowId={(r) => r.id.id}
          refreshTrigger={refreshTrigger}
        />
      )}

      {tab === 2 && (
        <EntityTable<NotificationRule>
          title="Notification Rules"
          columns={ruleColumns}
          fetchData={fetchRules}
          rowActions={ruleActions}
          getRowId={(r) => r.id.id}
          refreshTrigger={refreshTrigger}
        />
      )}

      <ConfirmDialog open={deleteDialogOpen} title="Delete"
        content={`Are you sure you want to delete "${toDeleteName}"?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteDialogOpen(false); setToDeleteId(null); }} />
    </Box>
  );
}
