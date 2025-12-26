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
  const [localIsSaving, setLocalIsSaving] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = React.useRef<string | null>(null);
  const isSavingRef = React.useRef(false);

  // Extract only the content-related data (exclude metadata that changes during save)
  const contentSignature = React.useMemo(() => {
    const data = editor.draft.data as AgentStory;
    if (!data) return '';
    // Only track fields that represent actual content changes
    return JSON.stringify({
      name: data.name,
      identifier: data.identifier,
      purpose: data.purpose,
      role: data.role,
      autonomyLevel: data.autonomyLevel,
      skills: data.skills,
      guardrails: data.guardrails,
      humanInteraction: data.humanInteraction,
      collaboration: data.collaboration,
      memory: data.memory,
      tags: data.tags,
      notes: data.notes,
    });
  }, [editor.draft.data]);

  // Track dirty state by comparing current content to last saved
  const isDirty = React.useMemo(() => {
    if (!editor.draft.id) return false; // New unsaved story
    if (!lastSavedDataRef.current) {
      // Initialize with original data
      const originalData = editor.draft.originalData as AgentStory;
      if (originalData) {
        lastSavedDataRef.current = JSON.stringify({
          name: originalData.name,
          identifier: originalData.identifier,
          purpose: originalData.purpose,
          role: originalData.role,
          autonomyLevel: originalData.autonomyLevel,
          skills: originalData.skills,
          guardrails: originalData.guardrails,
          humanInteraction: originalData.humanInteraction,
          collaboration: originalData.collaboration,
          memory: originalData.memory,
          tags: originalData.tags,
          notes: originalData.notes,
        });
      }
    }
    return contentSignature !== lastSavedDataRef.current;
  }, [contentSignature, editor.draft.id, editor.draft.originalData]);

  // Save function - use refs to avoid stale closures
  const saveNow = React.useCallback(async () => {
    // Prevent concurrent saves
    if (isSavingRef.current) return;

    // Access store directly to get current data (not stale snapshot)
    const currentStore = storyEditorStore;
    if (!currentStore.draft.id) return;

    const storyData = currentStore.draft.data as AgentStory;
    if (!storyData?.id) return;

    try {
      isSavingRef.current = true;
      setLocalIsSaving(true);
      setSaveError(null);

      await updateStory.mutateAsync({
        id: storyData.id,
        data: storyData
      });

      // Update last saved reference
      lastSavedDataRef.current = JSON.stringify({
        name: storyData.name,
        identifier: storyData.identifier,
        purpose: storyData.purpose,
        role: storyData.role,
        autonomyLevel: storyData.autonomyLevel,
        skills: storyData.skills,
        guardrails: storyData.guardrails,
        humanInteraction: storyData.humanInteraction,
        collaboration: storyData.collaboration,
        memory: storyData.memory,
        tags: storyData.tags,
        notes: storyData.notes,
      });

      const now = new Date().toISOString();
      storyEditorActions.setLastSaved(now);

      onSaveSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed');
      setSaveError(error);
      onSaveError?.(error);
    } finally {
      isSavingRef.current = false;
      setLocalIsSaving(false);
    }
  }, [updateStory, onSaveSuccess, onSaveError]);

  // Debounced auto-save effect - only trigger on content changes
  React.useEffect(() => {
    if (!editor.autoSaveEnabled || !isDirty || !editor.draft.id || isSavingRef.current) {
      return;
    }

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
  }, [contentSignature, editor.autoSaveEnabled, isDirty, editor.draft.id, debounceMs, saveNow]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving: localIsSaving,
    isDirty,
    lastSavedAt: editor.draft.lastSavedAt,
    saveError,
    saveNow,
  };
}
