import apiClient from './axios';
import type { CompanySettings, UpdateCompanySettingsDto } from '../types';

/**
 * Company Settings API functions
 */
export const settingsApi = {
  /**
   * Get active company settings
   */
  get: async (): Promise<CompanySettings> => {
    const response = await apiClient.get<CompanySettings>('/api/settings');
    return response.data;
  },

  /**
   * Update company settings
   */
  update: async (data: UpdateCompanySettingsDto): Promise<CompanySettings> => {
    const response = await apiClient.patch<CompanySettings>('/api/settings', data);
    return response.data;
  },
};
