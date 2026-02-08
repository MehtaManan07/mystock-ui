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
import type { ContainerProductInfo } from '../../../types';

export interface ProductStockDistributionCardProps {
  containers: ContainerProductInfo[];
  onContainerClick: (containerId: number) => void;
}

export const ProductStockDistributionCard: React.FC<ProductStockDistributionCardProps> = ({
  containers,
  onContainerClick,
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Stock Distribution ({containers.length} containers)
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {containers.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Container</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {containers.map((cp) => (
                <TableRow
                  key={cp.container.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onContainerClick(cp.container.id)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {cp.container.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={cp.container.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{cp.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary">
          This product is not stored in any containers yet.
        </Typography>
      )}
    </CardContent>
  </Card>
);
