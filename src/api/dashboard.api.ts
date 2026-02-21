import apiClient from './axios';
import { API_ENDPOINTS } from '../constants';

/**
 * Dashboard data response types
 */
export interface DashboardStats {
  total_products: number;
  total_containers: number;
  total_contacts: number;
  total_inventory: number;
}

export interface DashboardFinancialOverview {
  total_income: number;
  total_expenses: number;
  net_balance: number;
}

export interface DashboardTransaction {
  id: number;
  transaction_number: string;
  type: string;
  payment_status: string;
  total_amount: number;
  transaction_date: string;
  contact: {
    id: number;
    name: string;
  } | null;
}

export interface DashboardContact {
  id: number;
  name: string;
  type: string;
  balance: number;
}

export interface DashboardData {
  stats: DashboardStats;
  financial_overview: DashboardFinancialOverview;
  recent_transactions: DashboardTransaction[];
  outstanding_contacts: DashboardContact[];
}

/**
 * Dashboard API functions
 */
export const dashboardApi = {
  /**
   * Get all dashboard data in a single API call
   */
  getData: async (): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>(API_ENDPOINTS.DASHBOARD.BASE);
    return response.data;
  },
};
