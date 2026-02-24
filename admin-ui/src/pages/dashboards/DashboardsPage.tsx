import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EntityTable, { ColumnDef, RowAction } from '@/components/entity/EntityTable';
import ConfirmDialog from '@/components/entity/ConfirmDialog';
import DashboardDialog from './DashboardDialog';
import { Dashboard, DashboardInfo } from '@/models/dashboard.model';
import { dashboardApi } from '@/api/dashboard.api';
import { PageLink } from '@/models/page.model';

export default function DashboardsPage() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDashboard, setEditDashboard] = useState<Dashboard | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<DashboardInfo | null>(null);

  const refresh = () => setRefreshTrigger((n) => n + 1);

  const columns: ColumnDef<DashboardInfo>[] = [
    {
      id: 'createdTime',
      label: 'Created',
      width: '170px',
      render: (row) => new Date(row.createdTime).toLocaleString(),
    },
    {
      id: 'title',
      label: 'Title',
      width: '40%',
      render: (row) => row.title,
    },
    {
      id: 'assignedCustomers',
      label: 'Assigned Customers',
      sortable: false,
      render: (row) => row.assignedCustomers?.map((c) => c.title).join(', ') || '',
    },
  ];

  const rowActions: RowAction<DashboardInfo>[] = [
    {
      icon: <OpenInNewIcon fontSize="small" />,
      tooltip: 'Open dashboard',
      onClick: (row) => navigate(`/dashboards/${row.id.id}`),
    },
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      onClick: (row) => {
        dashboardApi.getDashboard(row.id.id).then((d) => {
          setEditDashboard(d);
          setDialogOpen(true);
        });
      },
    },
    {
      icon: <DeleteIcon fontSize="small" color="error" />,
      tooltip: 'Delete',
      onClick: (row) => {
        setDashboardToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  const fetchData = useCallback((pl: PageLink) => {
    return dashboardApi.getTenantDashboards(pl);
  }, []);

  const handleAdd = () => {
    setEditDashboard(null);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditDashboard(null);
    refresh();
  };

  const handleDelete = async () => {
    if (dashboardToDelete) {
      await dashboardApi.deleteDashboard(dashboardToDelete.id.id);
      setDeleteDialogOpen(false);
      setDashboardToDelete(null);
      refresh();
    }
  };

  const handleDeleteSelected = async (rows: DashboardInfo[]) => {
    await Promise.all(rows.map((r) => dashboardApi.deleteDashboard(r.id.id)));
    refresh();
  };

  const handleRowClick = (row: DashboardInfo) => {
    navigate(`/dashboards/${row.id.id}`);
  };

  return (
    <Box>
      <EntityTable<DashboardInfo>
        title="Dashboards"
        columns={columns}
        fetchData={fetchData}
        onAdd={handleAdd}
        addLabel="Add Dashboard"
        onRowClick={handleRowClick}
        rowActions={rowActions}
        onDeleteSelected={handleDeleteSelected}
        getRowId={(row) => row.id.id}
        refreshTrigger={refreshTrigger}
      />

      <DashboardDialog
        open={dialogOpen}
        dashboard={editDashboard}
        onClose={() => { setDialogOpen(false); setEditDashboard(null); }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Dashboard"
        content={`Are you sure you want to delete dashboard "${dashboardToDelete?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteDialogOpen(false); setDashboardToDelete(null); }}
      />
    </Box>
  );
}
