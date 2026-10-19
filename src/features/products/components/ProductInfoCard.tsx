import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from 'cn';
import type { ProductDetail } from '../../../types';

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const stockToneClass = (quantity: number) => {
  if (quantity <= 0) return 'bg-destructive/10 text-destructive border-destructive/30';
  if (quantity < 10) return 'bg-warning/10 text-warning border-warning/40';
  return 'bg-success/10 text-success border-success/30';
};

const Field: React.FC<{
  label: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, className, children }) => (
  <div className={cn('min-w-0', className)}>
    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
      {label}
    </span>
    <div className="mt-1.5 text-sm">{children}</div>
  </div>
);

export interface ProductInfoCardProps {
  product: ProductDetail;
  totalQuantity: number;
}

export const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ product, totalQuantity }) => (
  <Card>
    <CardHeader className="border-b border-border/70 pb-5">
      <CardTitle className="text-base font-semibold">Product information</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Name">
        <p className="font-medium">{product.name}</p>
      </Field>

      <Field label="Company SKU">
        <p className="font-mono tabular-nums">{product.company_sku || '-'}</p>
      </Field>

      <Field label="Display name">
        <p>{product.display_name || '-'}</p>
      </Field>

      <Field label="Size">
        <p className="tabular-nums">{product.size}</p>
      </Field>

      <Field label="Packing">
        <p>{product.packing}</p>
      </Field>

      {product.dimensions && (
        <Field label="Dimensions">
          <p className="tabular-nums">
            {product.dimensions.width} × {product.dimensions.height} ×{' '}
            {product.dimensions.length} cm
          </p>
        </Field>
      )}

      <Field label="Default sale price">
        <p className="font-medium text-success tabular-nums">
          {formatCurrency(product.default_sale_price)}
        </p>
      </Field>

      {product.mrp && (
        <Field label="MRP">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'tabular-nums',
                product.default_sale_price && product.mrp > product.default_sale_price
                  ? 'text-muted-foreground line-through'
                  : undefined
              )}
            >
              {formatCurrency(product.mrp)}
            </p>
            {product.default_sale_price && product.mrp > product.default_sale_price && (
              <Badge
                variant="outline"
                className="border-success/30 bg-success/10 text-success tabular-nums"
              >
                {Math.round(((product.mrp - product.default_sale_price) / product.mrp) * 100)}% off
              </Badge>
            )}
          </div>
        </Field>
      )}

      <Field label="Total quantity">
        <Badge
          variant="outline"
          className={cn('tabular-nums', stockToneClass(totalQuantity))}
        >
          {totalQuantity}
        </Badge>
      </Field>

      {product.product_type && (
        <Field label="Product type">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary capitalize"
          >
            {product.product_type}
          </Badge>
        </Field>
      )}

      {product.tags && product.tags.length > 0 && (
        <Field label="Tags" className="sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </Field>
      )}

      {product.description && (
        <Field label="Description" className="sm:col-span-2 lg:col-span-3">
          <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {product.description}
          </p>
        </Field>
      )}
    </CardContent>
  </Card>
);
