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
import type { Product, CreateProductDto } from '../../../types';
import { productFormSchema, type ProductFormData } from '../schemas/productSchema';

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
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: '',
      size: '',
      packing: '',
      company_sku: '',
      default_sale_price: '',
      default_purchase_price: '',
      display_name: '',
      description: '',
      mrp: '',
      tags: '',
      product_type: '',
      dimension_width: '',
      dimension_height: '',
      dimension_length: '',
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
          description: product.description || '',
          mrp: product.mrp?.toString() || '',
          tags: product.tags?.join(', ') || '',
          product_type: product.product_type || '',
          dimension_width: product.dimensions?.width?.toString() || '',
          dimension_height: product.dimensions?.height?.toString() || '',
          dimension_length: product.dimensions?.length?.toString() || '',
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
          description: '',
          mrp: '',
          tags: '',
          product_type: '',
          dimension_width: '',
          dimension_height: '',
          dimension_length: '',
        });
      }
    }
  }, [open, product, reset]);

  const handleFormSubmit = (data: ProductFormData) => {
    const salePrice = data.default_sale_price ? parseFloat(data.default_sale_price) : undefined;
    const purchasePrice = data.default_purchase_price ? parseFloat(data.default_purchase_price) : undefined;
    const displayName = data.display_name || '';
    const mrp = data.mrp ? parseFloat(data.mrp) : undefined;
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : undefined;
    const dimensions = (data.dimension_width && data.dimension_height && data.dimension_length) ? {
      width: parseFloat(data.dimension_width),
      height: parseFloat(data.dimension_height),
      length: parseFloat(data.dimension_length),
    } : undefined;
    
    onSubmit({
      name: data.name,
      size: data.size,
      packing: data.packing,
      company_sku: data.company_sku || undefined,
      default_sale_price: salePrice,
      default_purchase_price: purchasePrice,
      display_name: displayName,
      description: data.description || undefined,
      mrp: mrp,
      tags: tags,
      product_type: data.product_type || undefined,
      dimensions: dimensions,
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
            <Grid size={12}>
              <TextField
                {...register('description')}
                label="Description (Optional)"
                placeholder="Product description"
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
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
            <Grid size={12}>
              <TextField
                {...register('product_type')}
                label="Product Type (Optional)"
                placeholder="e.g., Home Decor, Wedding Gifts"
                error={!!errors.product_type}
                helperText={errors.product_type?.message}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('tags')}
                label="Tags (Optional)"
                placeholder="Comma-separated tags, e.g., Home Decor, Wedding Gifts"
                error={!!errors.tags}
                helperText={errors.tags?.message || 'Separate multiple tags with commas'}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('dimension_width')}
                label="Width (cm)"
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                placeholder="Width"
                error={!!errors.dimension_width}
                helperText={errors.dimension_width?.message}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('dimension_height')}
                label="Height (cm)"
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                placeholder="Height"
                error={!!errors.dimension_height}
                helperText={errors.dimension_height?.message}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('dimension_length')}
                label="Length (cm)"
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                placeholder="Length"
                error={!!errors.dimension_length}
                helperText={errors.dimension_length?.message}
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
                {...register('mrp')}
                label="MRP (Optional)"
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                error={!!errors.mrp}
                helperText={errors.mrp?.message || 'Maximum retail price'}
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
