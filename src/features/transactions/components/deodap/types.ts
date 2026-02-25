import type { Product } from '../../../../types';

export interface ExcelRow {
  sku: string;
  quantity: number;
}

export interface ContainerOption {
  id: number;
  name: string;
  type: string;
  availableQty: number;
}

export interface DeodapBillRow {
  sku: string;
  quantity: number;
  product: Product | null;
  lookupStatus: 'pending' | 'found' | 'not_found';
  selectedContainer: ContainerOption | null;
}
