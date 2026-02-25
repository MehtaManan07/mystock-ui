import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as FoundIcon, Error as NotFoundIcon } from '@mui/icons-material';
import { ContainerSelector } from './ContainerSelector';
import type { DeodapBillRow, ContainerOption } from './types';

interface BillItemsTableProps {
  rows: DeodapBillRow[];
  onContainerChange: (index: number, container: ContainerOption | null) => void;
}

export const BillItemsTable: React.FC<BillItemsTableProps> = ({ rows, onContainerChange }) => {
  const foundCount = rows.filter((r) => r.lookupStatus === 'found').length;
  const notFoundRows = rows.filter((r) => r.lookupStatus === 'not_found');

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Step 2 — Assign Containers</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={`${foundCount} found`} color="success" size="small" />
            {notFoundRows.length > 0 && (
              <Chip label={`${notFoundRows.length} not found`} color="error" size="small" />
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          For each product found, select the container from which stock will be used. If a product
          has no stock, use <strong>Assign Container</strong> to add it first.
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sr No.</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>Container</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  sx={{
                    opacity: row.lookupStatus === 'not_found' ? 0.5 : 1,
                    bgcolor: row.lookupStatus === 'not_found' ? 'action.hover' : undefined,
                  }}
                >
                  <TableCell>{idx + 1}</TableCell>

                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {row.sku}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {row.lookupStatus === 'pending' ? (
                      <CircularProgress size={16} />
                    ) : row.lookupStatus === 'found' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FoundIcon fontSize="small" color="success" />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {row.product!.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.product!.size} • {row.product!.packing}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <NotFoundIcon fontSize="small" color="error" />
                        <Typography variant="body2" color="error.main">
                          SKU not found
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={500}>
                      {row.quantity}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {row.lookupStatus === 'found' ? (
                      <ContainerSelector
                        productId={row.product!.id}
                        productName={row.product!.name}
                        value={row.selectedContainer}
                        onChange={(c) => onContainerChange(idx, c)}
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {notFoundRows.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {notFoundRows.length} SKU(s) not matched and will be skipped:{' '}
            {notFoundRows.map((r) => r.sku).join(', ')}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
