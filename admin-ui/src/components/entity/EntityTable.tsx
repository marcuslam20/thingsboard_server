import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageData, PageLink } from '@/models/page.model';

export interface ColumnDef<T> {
  id: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface RowAction<T> {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
}

interface EntityTableProps<T> {
  title: string;
  columns: ColumnDef<T>[];
  fetchData: (pageLink: PageLink) => Promise<PageData<T>>;
  onAdd?: () => void;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction<T>[];
  onDeleteSelected?: (rows: T[]) => Promise<void>;
  getRowId: (row: T) => string;
  addLabel?: string;
  refreshTrigger?: number;
}

export default function EntityTable<T>({
  title,
  columns,
  fetchData,
  onAdd,
  onRowClick,
  rowActions,
  onDeleteSelected,
  getRowId,
  addLabel = 'Add',
  refreshTrigger = 0,
}: EntityTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortProperty, setSortProperty] = useState<string>('createdTime');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchData({
        page,
        pageSize,
        textSearch: search || undefined,
        sortProperty,
        sortOrder,
      });
      setData(result.data);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, pageSize, search, sortProperty, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleSort = (property: string) => {
    if (sortProperty === property) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortProperty(property);
      setSortOrder('ASC');
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(data.map(getRowId)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteSelected) return;
    const selectedRows = data.filter((row) => selected.has(getRowId(row)));
    await onDeleteSelected(selectedRows);
    setSelected(new Set());
    loadData();
  };

  const allSelected = data.length > 0 && data.every((row) => selected.has(getRowId(row)));
  const someSelected = data.some((row) => selected.has(getRowId(row))) && !allSelected;

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ pl: 2, pr: 1, gap: 1 }}>
        {selected.size > 0 ? (
          <>
            <Typography sx={{ flex: 1 }} color="inherit" variant="subtitle1">
              {selected.size} selected
            </Typography>
            {onDeleteSelected && (
              <Tooltip title="Delete selected">
                <IconButton onClick={handleDeleteSelected} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </>
        ) : (
          <>
            <Typography sx={{ flex: 1 }} variant="h6" component="div">
              {title}
            </Typography>
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 220 }}
            />
            <Tooltip title="Refresh">
              <IconButton onClick={loadData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {onAdd && (
              <Button variant="contained" onClick={onAdd} size="small">
                {addLabel}
              </Button>
            )}
          </>
        )}
      </Toolbar>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {onDeleteSelected && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someSelected}
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  sx={{ width: col.width, fontWeight: 600 }}
                  sortDirection={sortProperty === col.id ? (sortOrder === 'ASC' ? 'asc' : 'desc') : false}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={sortProperty === col.id}
                      direction={sortProperty === col.id ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
              {rowActions && rowActions.length > 0 && (
                <TableCell sx={{ width: rowActions.length * 48 + 16 }}>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onDeleteSelected ? 1 : 0) + (rowActions ? 1 : 0)} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onDeleteSelected ? 1 : 0) + (rowActions ? 1 : 0)} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No data found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selected.has(rowId);
                return (
                  <TableRow
                    key={rowId}
                    hover
                    selected={isSelected}
                    onClick={() => onRowClick?.(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {onDeleteSelected && (
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onChange={() => handleSelectRow(rowId)} />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.id] ?? '')}
                      </TableCell>
                    ))}
                    {rowActions && rowActions.length > 0 && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {rowActions.map((action, i) =>
                            action.hidden?.(row) ? null : (
                              <Tooltip key={i} title={action.tooltip}>
                                <IconButton size="small" onClick={() => action.onClick(row)}>
                                  {action.icon}
                                </IconButton>
                              </Tooltip>
                            ),
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalElements}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 15, 20, 50]}
      />
    </Paper>
  );
}
