'use client';

import * as React from 'react';
import { useSnapshot } from 'valtio';
import { storyEditorStore, storyEditorActions } from '@/stores/story-editor';
import { useUpdateStory } from './use-stories';
import type { AgentStory } from '@/lib/schemas';

interface UseAutoSaveOptions {
  /** Debounce delay in milliseconds (default: 1500ms) */
  debounceMs?: number;
  /** Called when auto-save succeeds */
  onSaveSuccess?: () => void;
  /** Called when auto-save fails */
  onSaveError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  /** Whether a save is in progress */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Last saved timestamp */
  lastSavedAt: string | null;
  /** Any save error */
  saveError: Error | null;
  /** Force an immediate save */
  saveNow: () => Promise<void>;
}

/**
 * Auto-save hook that debounces changes and saves to the API
 */
export function useAutoSave(options: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const { debounceMs = 1500, onSaveSuccess, onSaveError } = options;

  const editor = useSnapshot(storyEditorStore);
  const updateStory = useUpdateStory();

  const [saveError, setSaveError] = React.useState<Error | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = React.useRef<string | null>(null);

  // Track dirty state by comparing current data to last saved
  const currentDataString = JSON.stringify(editor.draft.data);
  const isDirty = React.useMemo(() => {
    if (!editor.draft.id) return false; // New unsaved story
    if (!lastSavedDataRef.current) {
      lastSavedDataRef.current = JSON.stringify(editor.draft.originalData);
    }
    return currentDataString !== lastSavedDataRef.current;
  }, [currentDataString, editor.draft.id, editor.draft.originalData]);

  // Save function
  const saveNow = React.useCallback(async () => {
    if (!editor.draft.id || editor.isSaving) return;

    const storyData = editor.draft.data as AgentStory;
    if (!storyData.id) return;

    try {
      storyEditorActions.setSaving(true);
      setSaveError(null);

      await updateStory.mutateAsync({
        id: storyData.id,
        data: storyData
      });

      const now = new Date().toISOString();
      storyEditorActions.setLastSaved(now);
      lastSavedDataRef.current = JSON.stringify(storyData);

      onSaveSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed');
      setSaveError(error);
      onSaveError?.(error);
    } finally {
      storyEditorActions.setSaving(false);
    }
  }, [editor.draft.id, editor.draft.data, editor.isSaving, updateStory, onSaveSuccess, onSaveError]);

  // Debounced auto-save effect
  React.useEffect(() => {
    if (!editor.autoSaveEnabled || !isDirty || !editor.draft.id) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveNow();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentDataString, editor.autoSaveEnabled, isDirty, editor.draft.id, debounceMs, saveNow]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving: editor.isSaving,
    isDirty,
    lastSavedAt: editor.draft.lastSavedAt,
    saveError,
    saveNow,
  };
}
