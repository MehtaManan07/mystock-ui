import React from 'react';
import { Box, Card, CardContent, Typography, Divider, Chip } from '@mui/material';
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
      <Typography variant="h6" gutterBottom>
        Product Information
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Name
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {product.name}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Company SKU
          </Typography>
          <Typography variant="body1" fontFamily="monospace">
            {product.company_sku || '-'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Display Name
          </Typography>
          <Typography variant="body1">{product.display_name || '-'}</Typography>
        </Box>
        {product.product_type && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Product Type
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={product.product_type} size="small" color="primary" variant="outlined" />
            </Box>
          </Box>
        )}
        {product.tags && product.tags.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Tags
            </Typography>
            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {product.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
        {product.description && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {product.description}
            </Typography>
          </Box>
        )}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Size
          </Typography>
          <Typography variant="body1">{product.size}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Packing
          </Typography>
          <Typography variant="body1">{product.packing}</Typography>
        </Box>
        {product.dimensions && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Dimensions
            </Typography>
            <Typography variant="body1">
              {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.length} cm
            </Typography>
          </Box>
        )}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Default Sale Price
          </Typography>
          <Typography variant="body1">{formatCurrency(product.default_sale_price)}</Typography>
        </Box>
        {product.mrp && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              MRP
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  textDecoration:
                    product.default_sale_price && product.mrp > product.default_sale_price
                      ? 'line-through'
                      : 'none',
                }}
              >
                {formatCurrency(product.mrp)}
              </Typography>
              {product.default_sale_price && product.mrp > product.default_sale_price && (
                <Chip
                  label={`${Math.round(((product.mrp - product.default_sale_price) / product.mrp) * 100)}% off`}
                  size="small"
                  color="success"
                />
              )}
            </Box>
          </Box>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary">
            Total Quantity
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip label={totalQuantity} color={totalQuantity > 0 ? 'primary' : 'default'} />
          </Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);
