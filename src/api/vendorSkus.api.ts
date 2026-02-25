import apiClient from './axios';
import type {
  CreateVendorSkuDto,
  UpdateVendorSkuDto,
  VendorSkuResponse,
  VendorSkuDetailResponse,
} from '../types';

/**
 * Vendor SKU API functions
 */
export const vendorSkusApi = {
  /**
   * Create a new vendor SKU mapping
   */
  create: async (data: CreateVendorSkuDto): Promise<VendorSkuResponse> => {
    const response = await apiClient.post<VendorSkuResponse>('/vendor-skus', data);
    return response.data;
  },

  /**
   * Get all vendor SKUs for a product
   */
  getForProduct: async (productId: number): Promise<VendorSkuDetailResponse[]> => {
    const response = await apiClient.get<VendorSkuDetailResponse[]>(
      `/vendor-skus/products/${productId}`
    );
    return response.data;
  },

  /**
   * Get vendor SKU for a specific product-vendor combination
   */
  get: async (productId: number, vendorId: number): Promise<{ vendor_sku: string | null }> => {
    const response = await apiClient.get<{ vendor_sku: string | null }>(
      `/vendor-skus/products/${productId}/vendors/${vendorId}`
    );
    return response.data;
  },

  /**
   * Update a vendor SKU mapping
   */
  update: async (
    productId: number,
    vendorId: number,
    data: UpdateVendorSkuDto
  ): Promise<VendorSkuResponse> => {
    const response = await apiClient.patch<VendorSkuResponse>(
      `/vendor-skus/products/${productId}/vendors/${vendorId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a vendor SKU mapping (soft delete)
   */
  delete: async (productId: number, vendorId: number): Promise<void> => {
    await apiClient.delete(`/vendor-skus/products/${productId}/vendors/${vendorId}`);
  },
};
