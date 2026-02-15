import api from './axios';
import { API_ENDPOINTS } from '../constants';
import type { InventoryLog, CreateInventoryLogDto, PaginatedResponse } from '../types';

/**
 * Inventory Logs API
 * Handles inventory audit trail and logging
 */
export const inventoryLogsApi = {
  /**
   * Get all inventory logs
   */
  getAll: async (): Promise<InventoryLog[]> => {
    const response = await api.get<PaginatedResponse<InventoryLog> | InventoryLog[]>(API_ENDPOINTS.INVENTORY_LOGS.BASE);
    // Handle both paginated response and direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as PaginatedResponse<InventoryLog>).items;
  },

  /**
   * Get inventory logs for a specific product
   */
  getByProduct: async (productId: number): Promise<InventoryLog[]> => {
    const response = await api.get<PaginatedResponse<InventoryLog> | InventoryLog[]>(API_ENDPOINTS.INVENTORY_LOGS.BY_PRODUCT(productId));
    // Handle both paginated response and direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as PaginatedResponse<InventoryLog>).items;
  },

  /**
   * Get inventory logs for a specific container
   */
  getByContainer: async (containerId: number): Promise<InventoryLog[]> => {
    const response = await api.get<PaginatedResponse<InventoryLog> | InventoryLog[]>(API_ENDPOINTS.INVENTORY_LOGS.BY_CONTAINER(containerId));
    // Handle both paginated response and direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as PaginatedResponse<InventoryLog>).items;
  },

  /**
   * Create a single inventory log
   */
  create: async (data: CreateInventoryLogDto): Promise<InventoryLog> => {
    const response = await api.post(API_ENDPOINTS.INVENTORY_LOGS.BASE, data);
    return response.data;
  },

  /**
   * Create multiple inventory logs in bulk
   */
  createBulk: async (data: CreateInventoryLogDto[]): Promise<InventoryLog[]> => {
    const response = await api.post(API_ENDPOINTS.INVENTORY_LOGS.BULK, { data });
    return response.data;
  },
};
