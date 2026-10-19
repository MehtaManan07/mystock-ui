import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col max-sm:inset-0 max-sm:h-full max-sm:max-h-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none sm:max-w-xl">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mt-1 grid grid-cols-12 gap-4 px-1">
              <div className="col-span-12 grid gap-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                  disabled={isLoading}
                  autoFocus
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2">
                <Label htmlFor="product-company-sku">Company SKU (Optional)</Label>
                <Input
                  id="product-company-sku"
                  {...register('company_sku')}
                  placeholder="e.g., SKU-001, PROD-ABC"
                  aria-invalid={!!errors.company_sku}
                  disabled={isLoading}
                />
                {errors.company_sku ? (
                  <p className="text-sm text-destructive">{errors.company_sku.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Unique identifier for this product
                  </p>
                )}
              </div>

              <div className="col-span-12 grid gap-2">
                <Label htmlFor="product-display-name">Display Name</Label>
                <Input
                  id="product-display-name"
                  {...register('display_name')}
                  aria-invalid={!!errors.display_name}
                  disabled={isLoading}
                />
                {errors.display_name && (
                  <p className="text-sm text-destructive">{errors.display_name.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2">
                <Label htmlFor="product-description">Description (Optional)</Label>
                <Textarea
                  id="product-description"
                  {...register('description')}
                  placeholder="Product description"
                  rows={3}
                  aria-invalid={!!errors.description}
                  disabled={isLoading}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="product-size">Size</Label>
                <Input
                  id="product-size"
                  {...register('size')}
                  placeholder="e.g., 25kg, 1L, 500g"
                  aria-invalid={!!errors.size}
                  disabled={isLoading}
                />
                {errors.size && (
                  <p className="text-sm text-destructive">{errors.size.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="product-packing">Packing</Label>
                <Input
                  id="product-packing"
                  {...register('packing')}
                  placeholder="e.g., Bag, Box, Bottle"
                  aria-invalid={!!errors.packing}
                  disabled={isLoading}
                />
                {errors.packing && (
                  <p className="text-sm text-destructive">{errors.packing.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2">
                <Label htmlFor="product-type">Product Type (Optional)</Label>
                <Input
                  id="product-type"
                  {...register('product_type')}
                  placeholder="e.g., Home Decor, Wedding Gifts"
                  aria-invalid={!!errors.product_type}
                  disabled={isLoading}
                />
                {errors.product_type && (
                  <p className="text-sm text-destructive">{errors.product_type.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2">
                <Label htmlFor="product-tags">Tags (Optional)</Label>
                <Input
                  id="product-tags"
                  {...register('tags')}
                  placeholder="Comma-separated tags, e.g., Home Decor, Wedding Gifts"
                  aria-invalid={!!errors.tags}
                  disabled={isLoading}
                />
                {errors.tags ? (
                  <p className="text-sm text-destructive">{errors.tags.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Separate multiple tags with commas
                  </p>
                )}
              </div>

              <div className="col-span-12 grid gap-2 sm:col-span-4">
                <Label htmlFor="product-dimension-width">Width (cm)</Label>
                <Input
                  id="product-dimension-width"
                  {...register('dimension_width')}
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="Width"
                  aria-invalid={!!errors.dimension_width}
                  disabled={isLoading}
                />
                {errors.dimension_width && (
                  <p className="text-sm text-destructive">{errors.dimension_width.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2 sm:col-span-4">
                <Label htmlFor="product-dimension-height">Height (cm)</Label>
                <Input
                  id="product-dimension-height"
                  {...register('dimension_height')}
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="Height"
                  aria-invalid={!!errors.dimension_height}
                  disabled={isLoading}
                />
                {errors.dimension_height && (
                  <p className="text-sm text-destructive">{errors.dimension_height.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2 sm:col-span-4">
                <Label htmlFor="product-dimension-length">Length (cm)</Label>
                <Input
                  id="product-dimension-length"
                  {...register('dimension_length')}
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="Length"
                  aria-invalid={!!errors.dimension_length}
                  disabled={isLoading}
                />
                {errors.dimension_length && (
                  <p className="text-sm text-destructive">{errors.dimension_length.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="product-sale-price">Default Sale Price</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="product-sale-price"
                    {...register('default_sale_price')}
                    type="number"
                    step="0.01"
                    min={0}
                    className="pl-7"
                    aria-invalid={!!errors.default_sale_price}
                    disabled={isLoading}
                  />
                </div>
                {errors.default_sale_price && (
                  <p className="text-sm text-destructive">{errors.default_sale_price.message}</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="product-mrp">MRP (Optional)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="product-mrp"
                    {...register('mrp')}
                    type="number"
                    step="0.01"
                    min={0}
                    className="pl-7"
                    aria-invalid={!!errors.mrp}
                    disabled={isLoading}
                  />
                </div>
                {errors.mrp ? (
                  <p className="text-sm text-destructive">{errors.mrp.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Maximum retail price</p>
                )}
              </div>

              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="product-purchase-price">Default Purchase Price</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="product-purchase-price"
                    {...register('default_purchase_price')}
                    type="number"
                    step="0.01"
                    min={0}
                    className="pl-7"
                    aria-invalid={!!errors.default_purchase_price}
                    disabled={isLoading}
                  />
                </div>
                {errors.default_purchase_price && (
                  <p className="text-sm text-destructive">
                    {errors.default_purchase_price.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="max-sm:w-full"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="max-sm:w-full">
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
