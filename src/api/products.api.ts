import apiClient from './axios';
import { API_ENDPOINTS } from '../constants';
import type {
  Product,
  ProductDetail,
  ProductImage,
  CreateProductDto,
  UpdateProductDto,
} from '../types';

/**
 * Products API functions
 */
export const productsApi = {
  /**
   * Get all products with optional search
   */
  getAll: async (search?: string): Promise<Product[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.BASE, { params });
    return response.data;
  },

  /**
   * Get single product by ID with details (containers + logs)
   */
  getById: async (id: number): Promise<ProductDetail> => {
    const response = await apiClient.get<ProductDetail>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
    return response.data;
  },

  /**
   * Create a new product
   */
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.BASE, data);
    return response.data;
  },

  /**
   * Create multiple products in bulk
   */
  createBulk: async (data: CreateProductDto[]): Promise<Product[]> => {
    const response = await apiClient.post<Product[]>(API_ENDPOINTS.PRODUCTS.BULK, { data });
    return response.data;
  },

  /**
   * Update a product
   */
  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    const response = await apiClient.patch<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id), data);
    return response.data;
  },

  /**
   * Delete a product (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  },

  /**
   * Upload images for a product (multipart)
   */
  uploadProductImages: async (productId: number, files: File[]): Promise<ProductImage[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await apiClient.post<ProductImage[]>(
      API_ENDPOINTS.PRODUCTS.IMAGES(productId),
      formData
    );
    return response.data;
  },

  /**
   * Copy images from another product. Pass imageIds to copy only those; omit to copy all.
   */
  copyProductImagesFrom: async (
    productId: number,
    sourceProductId: number,
    imageIds?: number[]
  ): Promise<ProductImage[]> => {
    const body: { source_product_id: number; image_ids?: number[] } = {
      source_product_id: sourceProductId,
    };
    if (imageIds !== undefined) body.image_ids = imageIds;
    const response = await apiClient.post<ProductImage[]>(
      API_ENDPOINTS.PRODUCTS.IMAGES_COPY_FROM(productId),
      body
    );
    return response.data;
  },

  /**
   * Delete an image from a product
   */
  deleteProductImage: async (productId: number, imageId: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.IMAGE_BY_ID(productId, imageId));
  },

  /**
   * Reorder product images
   */
  reorderProductImages: async (productId: number, order: number[]): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.PRODUCTS.IMAGES_REORDER(productId), { order });
  },
};
