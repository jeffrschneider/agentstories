import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions {
  data: unknown;
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;

    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) return;

    isSavingRef.current = true;
    try {
      await onSave();
      lastSavedRef.current = currentData;
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Initialize lastSavedRef with initial data
  useEffect(() => {
    lastSavedRef.current = JSON.stringify(data);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { save };
}
