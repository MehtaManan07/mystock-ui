import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import type { Contact } from '../../../types';

export interface VendorSkuDialogProps {
  open: boolean;
  editingVendorSku: { vendor_id: number; vendor_sku: string } | null;
  selectedVendorId: number | '';
  vendorSkuValue: string;
  customers: Contact[];
  isPending: boolean;
  onClose: () => void;
  onVendorChange: (vendorId: number | '') => void;
  onSkuChange: (value: string) => void;
  onSubmit: () => void;
}

export const VendorSkuDialog: React.FC<VendorSkuDialogProps> = ({
  open,
  editingVendorSku,
  selectedVendorId,
  vendorSkuValue,
  customers,
  isPending,
  onClose,
  onVendorChange,
  onSkuChange,
  onSubmit,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>{editingVendorSku ? 'Edit Vendor SKU' : 'Add Vendor SKU'}</DialogTitle>
    <DialogContent>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          select
          label="Customer/Vendor"
          value={selectedVendorId}
          onChange={(e) => onVendorChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={!!editingVendorSku}
          fullWidth
        >
          <MenuItem value="">Select a customer/vendor</MenuItem>
          {customers.map((customer) => (
            <MenuItem key={customer.id} value={customer.id}>
              {customer.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Vendor SKU"
          value={vendorSkuValue}
          onChange={(e) => onSkuChange(e.target.value)}
          placeholder="Enter vendor's/customer's SKU for this product"
          helperText="The SKU used by this customer/marketplace for this product"
          fullWidth
        />
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={!selectedVendorId || !vendorSkuValue || isPending}
      >
        {isPending ? 'Saving...' : 'Save'}
      </Button>
    </DialogActions>
  </Dialog>
);
