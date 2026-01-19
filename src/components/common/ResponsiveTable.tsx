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
  mobileLabel?: string; // Custom label for mobile view
  isAction?: boolean; // Special handling for action columns
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  mobileCardProps?: object; // Additional props for mobile cards
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  mobileCardProps = {},
}: ResponsiveTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (data.length === 0) {
    return (
      <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  // Mobile: Card-based layout
  if (isMobile) {
    const visibleColumns = columns.filter((col) => !col.hideOnMobile);
    const actionColumn = visibleColumns.find((col) => col.isAction);
    const dataColumns = visibleColumns.filter((col) => !col.isAction);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
        {data.map((row) => (
          <Card
            key={keyExtractor(row)}
            sx={{
              p: 2,
              cursor: onRowClick ? 'pointer' : 'default',
              transition: 'all 0.2s ease-in-out',
              '&:hover': onRowClick
                ? { 
                    bgcolor: 'action.hover',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  }
                : {},
              ...mobileCardProps,
            }}
            onClick={(e) => {
              // Don't trigger row click if clicking on action buttons
              if (!(e.target as HTMLElement).closest('button, a')) {
                onRowClick?.(row);
              }
            }}
          >
            {/* Action buttons at top right if they exist */}
            {actionColumn && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mb: dataColumns.length > 0 ? 1.5 : 0,
                  pb: dataColumns.length > 0 ? 1.5 : 0,
                  borderBottom: dataColumns.length > 0 ? `1px solid ${theme.palette.divider}` : 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {actionColumn.render(row)}
              </Box>
            )}
            
            {/* Data rows */}
            {dataColumns.map((col, index) => (
              <React.Fragment key={col.id}>
                {index > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2,
                    minHeight: 28,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      letterSpacing: '0.5px',
                      flexShrink: 0,
                      pt: 0.5,
                    }}
                  >
                    {col.mobileLabel || col.label}
                  </Typography>
                  <Box 
                    sx={{ 
                      textAlign: col.align || 'right',
                      flex: 1,
                      display: 'flex',
                      justifyContent: col.align === 'left' ? 'flex-start' : col.align === 'center' ? 'center' : 'flex-end',
                      flexWrap: 'wrap',
                      gap: 0.5,
                    }}
                  >
                    {col.render(row)}
                  </Box>
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
