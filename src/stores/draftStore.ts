import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

export interface DraftData {
  transactionDate: string;
  contactId: number | null;
  items: Array<{
    productId: number;
    containerId: number | null;
    quantity: number;
    unitPrice: number;
  }>;
  taxPercent: number;
  discountAmount: number;
  paidAmount: number;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
}

export interface Draft {
  id: string; // UUID for frontend-only drafts
  type: 'sale' | 'purchase';
  name: string; // Auto-generated or user-provided
  data: DraftData;
  createdAt: string;
  updatedAt: string;
}

interface DraftState {
  // State
  drafts: Draft[];

  // Actions
  saveDraft: (type: 'sale' | 'purchase', data: DraftData, name?: string) => Draft;
  updateDraft: (id: string, data: Partial<DraftData>) => void;
  deleteDraft: (id: string) => void;
  getDraft: (id: string) => Draft | undefined;
  listDrafts: (type?: 'sale' | 'purchase') => Draft[];
  clearOldDrafts: (daysOld: number) => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      // Initial state
      drafts: [],

      // Save a new draft
      saveDraft: (type, data, name) => {
        const now = new Date().toISOString();
        const draft: Draft = {
          id: crypto.randomUUID(),
          type,
          name: name || `Draft ${type} - ${new Date().toLocaleDateString()}`,
          data,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          drafts: [...state.drafts, draft],
        }));

        return draft;
      },

      // Update an existing draft
      updateDraft: (id, partialData) => {
        set((state) => ({
          drafts: state.drafts.map((draft) =>
            draft.id === id
              ? {
                  ...draft,
                  data: { ...draft.data, ...partialData },
                  updatedAt: new Date().toISOString(),
                }
              : draft
          ),
        }));
      },

      // Delete a draft
      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter((draft) => draft.id !== id),
        }));
      },

      // Get a single draft by ID
      getDraft: (id) => {
        return get().drafts.find((draft) => draft.id === id);
      },

      // List all drafts, optionally filtered by type
      listDrafts: (type) => {
        const drafts = get().drafts;
        if (!type) return drafts;
        return drafts.filter((d) => d.type === type);
      },

      // Clear drafts older than specified days
      clearOldDrafts: (daysOld) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        set((state) => ({
          drafts: state.drafts.filter(
            (draft) => new Date(draft.createdAt) > cutoffDate
          ),
        }));
      },
    }),
    {
      name: STORAGE_KEYS.TRANSACTION_DRAFTS,
      version: 1,
    }
  )
);
