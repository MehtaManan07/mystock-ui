import { useEffect, useRef, useCallback } from 'react';
import { debounce } from '../utils/debounce';
import { useDraftStore } from '../stores/draftStore';
import type { DraftData } from '../stores/draftStore';

/**
 * Hook for auto-saving draft transactions to localStorage
 *
 * @param type - Transaction type ('sale' or 'purchase')
 * @param data - Form data to save
 * @param enabled - Whether auto-save is enabled (default: true)
 * @returns Object with currentDraftId and saveNow function
 */
export const useDraftAutoSave = (
  type: 'sale' | 'purchase',
  data: DraftData,
  enabled: boolean = true
) => {
  const { saveDraft, updateDraft } = useDraftStore();
  const currentDraftId = useRef<string | null>(null);
  const isFirstSave = useRef(true);

  // Debounced save function (saves 3 seconds after last change)
  const debouncedSave = useCallback(
    debounce((dataToSave: DraftData) => {
      if (!enabled) return;

      if (isFirstSave.current || !currentDraftId.current) {
        // Create new draft
        const draft = saveDraft(type, dataToSave);
        currentDraftId.current = draft.id;
        isFirstSave.current = false;
      } else {
        // Update existing draft
        updateDraft(currentDraftId.current, dataToSave);
      }
    }, 3000),
    [type, enabled, saveDraft, updateDraft]
  );

  // Auto-save on data changes
  useEffect(() => {
    // Only auto-save if there's meaningful data
    const hasMeaningfulData =
      data.contactId ||
      data.items.length > 0 ||
      (data.notes && data.notes.trim().length > 0);

    if (enabled && hasMeaningfulData) {
      debouncedSave(data);
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [data, enabled, debouncedSave]);

  // Manual save function (immediate)
  const saveNow = useCallback(() => {
    if (!enabled) return null;

    if (isFirstSave.current || !currentDraftId.current) {
      const draft = saveDraft(type, data);
      currentDraftId.current = draft.id;
      isFirstSave.current = false;
      return draft.id;
    } else {
      updateDraft(currentDraftId.current, data);
      return currentDraftId.current;
    }
  }, [type, data, enabled, saveDraft, updateDraft]);

  return {
    currentDraftId: currentDraftId.current,
    saveNow,
  };
};
