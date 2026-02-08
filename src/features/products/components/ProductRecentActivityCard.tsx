import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import type { InventoryLogInfo } from '../../../types';

const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM yyyy, HH:mm');

export interface ProductRecentActivityCardProps {
  logs: InventoryLogInfo[];
  onContainerClick: (containerId: number) => void;
}

export const ProductRecentActivityCard: React.FC<ProductRecentActivityCardProps> = ({
  logs,
  onContainerClick,
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Recent Activity ({logs.length} logs)
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {logs.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Container</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.slice(0, 10).map((log) => (
                <TableRow
                  key={log.id}
                  hover
                  sx={{ cursor: log.container ? 'pointer' : 'default' }}
                  onClick={() => log.container && onContainerClick(log.container.id)}
                >
                  <TableCell>
                    <Chip
                      label={log.action}
                      size="small"
                      color={
                        log.action === 'add' || log.action === 'purchase'
                          ? 'success'
                          : log.action === 'remove' || log.action === 'sale'
                            ? 'error'
                            : 'default'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {log.container ? (
                      <Chip
                        label={log.container.name}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">{log.quantity}</TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDate(log.created_at)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No activity logs for this product.
        </Typography>
      )}
    </CardContent>
  </Card>
);
