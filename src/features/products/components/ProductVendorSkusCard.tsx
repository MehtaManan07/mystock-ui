import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { VendorSkuInfo } from '../../../types';

export interface ProductVendorSkusCardProps {
  vendorSkus: VendorSkuInfo[];
  onAdd: () => void;
  onEdit: (vendorId: number, vendorSku: string) => void;
  onDelete: (vendorId: number, vendorName: string) => void;
}

export const ProductVendorSkusCard: React.FC<ProductVendorSkusCardProps> = ({
  vendorSkus,
  onAdd,
  onEdit,
  onDelete,
}) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Vendor SKU Mappings ({vendorSkus.length})</Typography>
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={onAdd}>
          Add Vendor SKU
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {vendorSkus.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Customer/Vendor Name</TableCell>
                <TableCell>Vendor SKU</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendorSkus.map((vs) => (
                <TableRow key={vs.vendor_id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {vs.vendor_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {vs.vendor_sku}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEdit(vs.vendor_id, vs.vendor_sku)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(vs.vendor_id, vs.vendor_name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No vendor SKU mappings yet. Add customer/marketplace-specific SKUs (e.g., deodap, meesho,
          amazon, flipkart).
        </Typography>
      )}
    </CardContent>
  </Card>
);
