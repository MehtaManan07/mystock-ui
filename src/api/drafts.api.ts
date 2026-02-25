import apiClient from './axios';
import { API_ENDPOINTS } from '../constants';
import type { Product, Container } from '../types';

export interface DraftItemData {
  productId: number;
  containerId: number;
  quantity: number;
  unitPrice: number | string;
}

export interface DraftData {
  transactionDate: string;
  contactId: number | null;
  items: DraftItemData[];
  taxPercent: number;
  discountAmount: number;
  paidAmount: number;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  productDetailsDisplayMode?: string;
}

export interface Draft {
  id: number;
  user_id: number;
  type: 'sale' | 'purchase';
  name: string;
  data: DraftData; // Now it's a proper object!
  created_at: string;
  updated_at: string;
}

export interface HydratedDraftItem {
  productId: number;
  containerId: number;
  quantity: number;
  unitPrice: number | string;
  product: Product;
  container: Container;
}

export interface CompleteDraft {
  id: number;
  user_id: number;
  type: 'sale' | 'purchase';
  name: string;
  created_at: string;
  updated_at: string;
  items: HydratedDraftItem[];
  transactionDate: string;
  contactId: number | null;
  taxPercent: number;
  discountAmount: number;
  paidAmount: number;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  productDetailsDisplayMode?: string;
}

export interface CreateDraftDto {
  type: 'sale' | 'purchase';
  name: string;
  data: DraftData; // Send as object, not string
}

export interface UpdateDraftDto {
  name?: string;
  data?: DraftData; // Send as object, not string
}

/**
 * Drafts API functions
 */
export const draftsApi = {
  /**
   * Create a new draft
   */
  create: async (dto: CreateDraftDto): Promise<Draft> => {
    const response = await apiClient.post<Draft>(API_ENDPOINTS.DRAFTS.BASE, dto);
    return response.data;
  },

  /**
   * Get all drafts for current user, optionally filtered by type
   */
  getAll: async (type?: 'sale' | 'purchase'): Promise<Draft[]> => {
    const params = type ? { type } : {};
    const response = await apiClient.get<Draft[]>(API_ENDPOINTS.DRAFTS.BASE, { params });
    return response.data;
  },

  /**
   * Get a single draft by ID
   */
  getById: async (id: number): Promise<Draft> => {
    const response = await apiClient.get<Draft>(API_ENDPOINTS.DRAFTS.BY_ID(id));
    return response.data;
  },

  /**
   * Update a draft
   */
  update: async (id: number, dto: UpdateDraftDto): Promise<Draft> => {
    const response = await apiClient.patch<Draft>(API_ENDPOINTS.DRAFTS.BY_ID(id), dto);
    return response.data;
  },

  /**
   * Delete a draft
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.DRAFTS.BY_ID(id));
  },

  /**
   * Get a draft with hydrated products and containers
   * Optimized endpoint that eliminates N+1 queries
   */
  getComplete: async (id: number): Promise<CompleteDraft> => {
    const response = await apiClient.get<CompleteDraft>(
      API_ENDPOINTS.DRAFTS.COMPLETE(id)
    );
    return response.data;
  },
};
