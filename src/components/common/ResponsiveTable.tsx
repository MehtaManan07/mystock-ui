import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Card,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';

interface Column<T> {
  id: string;
  label: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
  minWidth?: number;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  // Mobile: Card-based layout
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((row) => (
          <Card
            key={keyExtractor(row)}
            sx={{
              p: 2,
              cursor: onRowClick ? 'pointer' : 'default',
              '&:hover': onRowClick
                ? { bgcolor: 'action.hover' }
                : {},
            }}
            onClick={() => onRowClick?.(row)}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col, index) => (
                <React.Fragment key={col.id}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {col.label}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>{col.render(row)}</Box>
                  </Box>
                </React.Fragment>
              ))}
          </Card>
        ))}
      </Box>
    );
  }

  // Desktop: Standard table with horizontal scroll
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.id}
                align={col.align || 'left'}
                sx={{ minWidth: col.minWidth, whiteSpace: 'nowrap' }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={keyExtractor(row)}
              hover
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align || 'left'}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
