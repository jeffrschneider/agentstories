// Storage utility for localStorage persistence
const STORAGE_KEY = 'agent-stories-data';

interface StorageData {
  stories: unknown[];
  version: string;
}

export function loadFromStorage(): unknown[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: StorageData = JSON.parse(stored);
    return data.stories;
  } catch {
    return null;
  }
}

export function saveToStorage(stories: unknown[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data: StorageData = {
      stories,
      version: '1.0',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function clearStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
