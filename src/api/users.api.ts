import apiClient from './axios';
import { API_ENDPOINTS } from '../constants';
import type { User, CreateUserDto, UpdateUserDto, PaginatedResponse } from '../types';

/**
 * Users API functions
 */
export const usersApi = {
  /**
   * Get all users with optional search
   */
  getAll: async (search?: string): Promise<User[]> => {
    const params = search ? { search } : {};
    const response = await apiClient.get<PaginatedResponse<User> | User[]>(API_ENDPOINTS.USERS.BASE, { params });
    // Handle both paginated response and direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as PaginatedResponse<User>).items;
  },

  /**
   * Get single user by ID
   */
  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(API_ENDPOINTS.USERS.BY_ID(id));
    return response.data;
  },

  /**
   * Create a new user (admin only)
   * Uses the register endpoint but doesn't auto-login
   */
  create: async (data: CreateUserDto): Promise<User> => {
    const response = await apiClient.post<{ user: User }>(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data.user;
  },

  /**
   * Update a user
   */
  update: async (id: number, data: UpdateUserDto): Promise<User> => {
    const response = await apiClient.patch<User>(API_ENDPOINTS.USERS.BY_ID(id), data);
    return response.data;
  },

  /**
   * Delete a user (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USERS.BY_ID(id));
  },
};
