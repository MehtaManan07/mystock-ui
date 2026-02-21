import { useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from '../utils/debounce';
import { useCreateDraft, useUpdateDraft, useDeleteDraft } from './useDrafts';
import type { DraftData } from '../api/drafts.api';

/**
 * Hook for auto-saving draft transactions to server
 *
 * @param type - Transaction type ('sale' or 'purchase')
 * @param data - Form data to save
 * @param enabled - Whether auto-save is enabled (default: true)
 * @returns Object with currentDraftId and saveNow function
 */
export const useDraftAutoSaveServer = (
  type: 'sale' | 'purchase',
  data: DraftData,
  enabled: boolean = true
) => {
  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();
  
  const currentDraftId = useRef<number | null>(null);
  const isFirstSave = useRef(true);
  const isSaving = useRef(false);
  const lastSavedData = useRef<string>('');

  // Stable save function that doesn't change on every render
  const saveDraft = useCallback(async (dataToSave: DraftData) => {
    if (!enabled || isSaving.current) return;

    // Avoid saving if data hasn't actually changed
    const dataStr = JSON.stringify(dataToSave);
    if (dataStr === lastSavedData.current) return;

    try {
      isSaving.current = true;

      if (isFirstSave.current || !currentDraftId.current) {
        // Create new draft
        const now = new Date();
        const name = `Draft ${type} - ${now.toLocaleDateString()}`;
        
        const draft = await createDraft.mutateAsync({
          type,
          name,
          data: dataToSave,
        });
        
        currentDraftId.current = draft.id;
        isFirstSave.current = false;
        lastSavedData.current = dataStr;
      } else {
        // Update existing draft
        await updateDraft.mutateAsync({
          id: currentDraftId.current,
          data: { data: dataToSave },
        });
        lastSavedData.current = dataStr;
      }
    } catch (error) {
      console.error('Failed to auto-save draft:', error);
    } finally {
      isSaving.current = false;
    }
  }, [type, enabled, createDraft.mutateAsync, updateDraft.mutateAsync]);

  // Create debounced version (memoized to avoid recreation)
  const debouncedSave = useMemo(
    () => debounce(saveDraft, 3000),
    [saveDraft]
  );

  // Auto-save on data changes
  useEffect(() => {
    // Only auto-save if there's meaningful data
    const hasMeaningfulData =
      data.contactId ||
      data.items.length > 0 ||
      (data.notes && data.notes.trim().length > 0);

    if (enabled && hasMeaningfulData) {
      // Check if data has actually changed before triggering save
      const dataStr = JSON.stringify(data);
      if (dataStr !== lastSavedData.current) {
        debouncedSave(data);
      }
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [data, enabled, debouncedSave]);

  // Manual save function (immediate)
  const saveNow = useCallback(async () => {
    if (!enabled || isSaving.current) return null;

    // Cancel any pending debounced saves
    debouncedSave.cancel();

    try {
      isSaving.current = true;
      const dataStr = JSON.stringify(data);

      if (isFirstSave.current || !currentDraftId.current) {
        const now = new Date();
        const name = `Draft ${type} - ${now.toLocaleDateString()}`;
        
        const draft = await createDraft.mutateAsync({
          type,
          name,
          data,
        });
        
        currentDraftId.current = draft.id;
        isFirstSave.current = false;
        lastSavedData.current = dataStr;
        return draft.id;
      } else {
        await updateDraft.mutateAsync({
          id: currentDraftId.current,
          data: { data },
        });
        lastSavedData.current = dataStr;
        return currentDraftId.current;
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      return null;
    } finally {
      isSaving.current = false;
    }
  }, [type, data, enabled, createDraft.mutateAsync, updateDraft.mutateAsync, debouncedSave]);

  // Cleanup: delete draft when component unmounts if requested
  const deleteDraftOnUnmount = useCallback(() => {
    if (currentDraftId.current) {
      deleteDraft.mutate(currentDraftId.current);
      currentDraftId.current = null;
      isFirstSave.current = true;
    }
  }, [deleteDraft]);

  return {
    currentDraftId: currentDraftId.current,
    saveNow,
    deleteDraftOnUnmount,
  };
};
