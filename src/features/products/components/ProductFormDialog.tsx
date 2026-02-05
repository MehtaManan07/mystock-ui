import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product, CreateProductDto } from '../../../types';

// Form data type
interface ProductFormData {
  name: string;
  size: string;
  packing: string;
  company_sku: string;
  default_sale_price: string;
  default_purchase_price: string;
  display_name: string;
}

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  size: z.string().min(1, 'Size is required').max(255),
  packing: z.string().min(1, 'Packing is required').max(255),
  company_sku: z.string().max(100).optional(),
  default_sale_price: z.string(),
  default_purchase_price: z.string(),
  display_name: z.string()
});

interface ProductFormDialogProps {
  open: boolean;
  product?: Product | null;
  isLoading?: boolean;
  onSubmit: (data: CreateProductDto) => void;
  onClose: () => void;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  product,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      size: '',
      packing: '',
      company_sku: '',
      default_sale_price: '',
      default_purchase_price: '',
      display_name: '',

    },
  });

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          size: product.size,
          packing: product.packing,
          company_sku: product.company_sku || '',
          default_sale_price: product.default_sale_price?.toString() || '',
          default_purchase_price: product.default_purchase_price?.toString() || '',
          display_name: product.display_name || '',
        });
      } else {
        reset({
          name: '',
          size: '',
          packing: '',
          company_sku: '',
          default_sale_price: '',
          default_purchase_price: '',
          display_name: '',
        });
      }
    }
  }, [open, product, reset]);

  const handleFormSubmit = (data: ProductFormData) => {
    const salePrice = data.default_sale_price ? parseFloat(data.default_sale_price) : undefined;
    const purchasePrice = data.default_purchase_price ? parseFloat(data.default_purchase_price) : undefined;
    const displayName = data.display_name || '';
    onSubmit({
      name: data.name,
      size: data.size,
      packing: data.packing,
      company_sku: data.company_sku || undefined,
      default_sale_price: salePrice,
      default_purchase_price: purchasePrice,
      display_name: displayName,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                {...register('name')}
                label="Product Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isLoading}
                autoFocus
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('company_sku')}
                label="Company SKU (Optional)"
                placeholder="e.g., SKU-001, PROD-ABC"
                error={!!errors.company_sku}
                helperText={errors.company_sku?.message || 'Unique identifier for this product'}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('display_name')}
                label="Display Name"
                error={!!errors.display_name}
                helperText={errors.display_name?.message}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('size')}
                label="Size"
                placeholder="e.g., 25kg, 1L, 500g"
                error={!!errors.size}
                helperText={errors.size?.message}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('packing')}
                label="Packing"
                placeholder="e.g., Bag, Box, Bottle"
                error={!!errors.packing}
                helperText={errors.packing?.message}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('default_sale_price')}
                label="Default Sale Price"
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                error={!!errors.default_sale_price}
                helperText={errors.default_sale_price?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('default_purchase_price')}
                label="Default Purchase Price"
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                error={!!errors.default_purchase_price}
                helperText={errors.default_purchase_price?.message}
                disabled={isLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={isLoading} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading} fullWidth={isMobile}>
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductFormDialog;
