import { z } from 'zod';

// Form data type (uses strings for form inputs)
export interface ProductFormData {
  name: string;
  size: string;
  packing: string;
  company_sku: string;
  default_sale_price: string;
  default_purchase_price: string;
  display_name: string;
  description: string;
  mrp: string;
  tags: string;
  product_type: string;
  dimension_width: string;
  dimension_height: string;
  dimension_length: string;
}

// Validation schema for form (string-based inputs)
export const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  size: z.string().min(1, 'Size is required').max(255),
  packing: z.string().min(1, 'Packing is required').max(255),
  company_sku: z.string().max(100).optional(),
  default_sale_price: z.string(),
  default_purchase_price: z.string(),
  display_name: z.string(),
  description: z.string().optional(),
  mrp: z.string().optional(),
  tags: z.string().optional(),
  product_type: z.string().max(255).optional(),
  dimension_width: z.string().optional(),
  dimension_height: z.string().optional(),
  dimension_length: z.string().optional(),
});
