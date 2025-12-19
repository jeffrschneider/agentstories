import { proxy, useSnapshot } from 'valtio';

const STORAGE_KEY = 'agent-stories-favorites';

interface FavoritesState {
  favoriteIds: Set<string>;
  isLoaded: boolean;
}

// Load favorites from localStorage
function loadFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();

    const ids = JSON.parse(stored);
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

// Save favorites to localStorage
function saveFavorites(ids: Set<string>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
}

export const favoritesStore = proxy<FavoritesState>({
  favoriteIds: new Set(),
  isLoaded: false,
});

export const favoritesActions = {
  init: () => {
    if (!favoritesStore.isLoaded) {
      favoritesStore.favoriteIds = loadFavorites();
      favoritesStore.isLoaded = true;
    }
  },

  toggle: (storyId: string) => {
    favoritesActions.init();
    const newSet = new Set(favoritesStore.favoriteIds);

    if (newSet.has(storyId)) {
      newSet.delete(storyId);
    } else {
      newSet.add(storyId);
    }

    favoritesStore.favoriteIds = newSet;
    saveFavorites(newSet);
  },

  add: (storyId: string) => {
    favoritesActions.init();
    const newSet = new Set(favoritesStore.favoriteIds);
    newSet.add(storyId);
    favoritesStore.favoriteIds = newSet;
    saveFavorites(newSet);
  },

  remove: (storyId: string) => {
    favoritesActions.init();
    const newSet = new Set(favoritesStore.favoriteIds);
    newSet.delete(storyId);
    favoritesStore.favoriteIds = newSet;
    saveFavorites(newSet);
  },

  isFavorite: (storyId: string): boolean => {
    favoritesActions.init();
    return favoritesStore.favoriteIds.has(storyId);
  },

  clear: () => {
    favoritesStore.favoriteIds = new Set();
    saveFavorites(new Set());
  },
};

export function useFavorites() {
  const snapshot = useSnapshot(favoritesStore);

  return {
    favoriteIds: snapshot.favoriteIds,
    isLoaded: snapshot.isLoaded,
    isFavorite: (id: string) => snapshot.favoriteIds.has(id),
    toggle: favoritesActions.toggle,
    add: favoritesActions.add,
    remove: favoritesActions.remove,
    clear: favoritesActions.clear,
  };
}
