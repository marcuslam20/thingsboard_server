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
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageData, PageLink } from '@/models/page.model';

export interface SubColumnDef {
  id: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

interface SubEntityTableProps {
  fetchData: (pl: PageLink) => Promise<PageData<unknown>>;
  columns: SubColumnDef[];
  getRowId?: (row: Record<string, unknown>) => string;
}

export default function SubEntityTable({ fetchData, columns, getRowId }: SubEntityTableProps) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortProperty, setSortProperty] = useState('createdTime');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [loading, setLoading] = useState(false);

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
      setData((result.data || []) as Record<string, unknown>[]);
      setTotalElements(result.totalElements);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, pageSize, search, sortProperty, sortOrder]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSort = (property: string) => {
    if (sortProperty === property) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortProperty(property);
      setSortOrder('ASC');
    }
  };

  const getId = (row: Record<string, unknown>) => {
    if (getRowId) return getRowId(row);
    const id = row.id as { id?: string } | undefined;
    return id?.id || String(row.name || Math.random());
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
          sx={{ width: 220 }}
        />
        <Tooltip title="Refresh">
          <IconButton onClick={loadData} size="small"><RefreshIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} sx={{ width: col.width, fontWeight: 600 }}>
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={sortProperty === col.id}
                      direction={sortProperty === col.id ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No data found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={getId(row)} hover>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      {col.render ? col.render(row) : String(row[col.id] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 15, 20]}
      />
    </Box>
  );
}
