import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ProductDetail } from '../../../types';

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export interface ProductInfoCardProps {
  product: ProductDetail;
  totalQuantity: number;
}

export const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ product, totalQuantity }) => (
  <Card>
    <CardContent>
      <h3 className="mb-2 text-base font-semibold">Product Information</h3>
      <Separator className="mb-4" />

      <div className="flex flex-col gap-4">
        <div>
          <span className="text-xs text-muted-foreground">Name</span>
          <p className="text-base font-semibold">{product.name}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Company SKU</span>
          <p className="font-mono text-base">{product.company_sku || '-'}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Display Name</span>
          <p className="text-base">{product.display_name || '-'}</p>
        </div>
        {product.product_type && (
          <div>
            <span className="text-xs text-muted-foreground">Product Type</span>
            <div className="mt-1">
              <Badge variant="outline" className="border-primary text-primary">
                {product.product_type}
              </Badge>
            </div>
          </div>
        )}
        {product.tags && product.tags.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Tags</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {product.description && (
          <div>
            <span className="text-xs text-muted-foreground">Description</span>
            <p className="mt-1 text-sm whitespace-pre-wrap">{product.description}</p>
          </div>
        )}
        <div>
          <span className="text-xs text-muted-foreground">Size</span>
          <p className="text-base">{product.size}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Packing</span>
          <p className="text-base">{product.packing}</p>
        </div>
        {product.dimensions && (
          <div>
            <span className="text-xs text-muted-foreground">Dimensions</span>
            <p className="text-base">
              {product.dimensions.width} × {product.dimensions.height} ×{' '}
              {product.dimensions.length} cm
            </p>
          </div>
        )}
        <div>
          <span className="text-xs text-muted-foreground">Default Sale Price</span>
          <p className="text-base">{formatCurrency(product.default_sale_price)}</p>
        </div>
        {product.mrp && (
          <div>
            <span className="text-xs text-muted-foreground">MRP</span>
            <div className="flex items-center gap-2">
              <p
                className={
                  product.default_sale_price && product.mrp > product.default_sale_price
                    ? 'text-base line-through'
                    : 'text-base'
                }
              >
                {formatCurrency(product.mrp)}
              </p>
              {product.default_sale_price && product.mrp > product.default_sale_price && (
                <Badge className="bg-success text-success-foreground">
                  {Math.round(((product.mrp - product.default_sale_price) / product.mrp) * 100)}%
                  off
                </Badge>
              )}
            </div>
          </div>
        )}

        <div>
          <span className="text-xs text-muted-foreground">Total Quantity</span>
          <div className="mt-1">
            <Badge variant={totalQuantity > 0 ? 'default' : 'secondary'}>{totalQuantity}</Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
