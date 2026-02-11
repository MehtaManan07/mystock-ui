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
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import type { ContainerProductInfo } from '../../../types';

export interface ProductStockDistributionCardProps {
  containers: ContainerProductInfo[];
  onContainerClick: (containerId: number) => void;
  onManageClick?: () => void;
}

export const ProductStockDistributionCard: React.FC<ProductStockDistributionCardProps> = ({
  containers,
  onContainerClick,
  onManageClick,
}) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          Stock Distribution ({containers.length} containers)
        </Typography>
        {onManageClick && (
          <Tooltip title="Manage Containers">
            <IconButton
              color="primary"
              size="small"
              onClick={onManageClick}
            >
              <InventoryIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
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
