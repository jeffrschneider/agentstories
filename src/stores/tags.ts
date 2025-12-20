import { proxy, useSnapshot } from 'valtio';

const STORAGE_KEY = 'agent-stories-tags';

export interface TagInfo {
  name: string;
  color?: string;
  count: number;
}

interface TagsState {
  tags: Map<string, TagInfo>;
  isLoaded: boolean;
}

// Predefined tag colors
export const TAG_COLORS = [
  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
];

// Get consistent color for a tag name
export function getTagColor(tagName: string): string {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// Load tags from localStorage
function loadTags(): Map<string, TagInfo> {
  if (typeof window === 'undefined') return new Map();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();

    const arr = JSON.parse(stored);
    return new Map(Array.isArray(arr) ? arr : []);
  } catch {
    return new Map();
  }
}

// Save tags to localStorage
function saveTags(tags: Map<string, TagInfo>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tags.entries()]));
  } catch (error) {
    console.error('Failed to save tags:', error);
  }
}

export const tagsStore = proxy<TagsState>({
  tags: new Map(),
  isLoaded: false,
});

export const tagsActions = {
  init: () => {
    if (!tagsStore.isLoaded) {
      tagsStore.tags = loadTags();
      tagsStore.isLoaded = true;
    }
  },

  // Update tag counts from stories array
  syncFromStories: (stories: { tags?: string[] }[]) => {
    tagsActions.init();

    // Count tag occurrences
    const counts = new Map<string, number>();
    stories.forEach(story => {
      story.tags?.forEach(tag => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    // Update or create tag entries
    const newTags = new Map<string, TagInfo>();
    counts.forEach((count, name) => {
      const existing = tagsStore.tags.get(name);
      newTags.set(name, {
        name,
        color: existing?.color || getTagColor(name),
        count,
      });
    });

    tagsStore.tags = newTags;
    saveTags(newTags);
  },

  // Add a custom tag
  addTag: (name: string, color?: string) => {
    tagsActions.init();

    if (!tagsStore.tags.has(name)) {
      const newTags = new Map(tagsStore.tags);
      newTags.set(name, {
        name,
        color: color || getTagColor(name),
        count: 0,
      });
      tagsStore.tags = newTags;
      saveTags(newTags);
    }
  },

  // Update tag color
  setTagColor: (name: string, color: string) => {
    tagsActions.init();

    const tag = tagsStore.tags.get(name);
    if (tag) {
      const newTags = new Map(tagsStore.tags);
      newTags.set(name, { ...tag, color });
      tagsStore.tags = newTags;
      saveTags(newTags);
    }
  },

  // Get all tags sorted by count
  getAllTags: (): TagInfo[] => {
    tagsActions.init();
    return [...tagsStore.tags.values()].sort((a, b) => b.count - a.count);
  },

  // Get popular tags
  getPopularTags: (limit = 10): TagInfo[] => {
    return tagsActions.getAllTags().slice(0, limit);
  },

  // Search tags by prefix
  searchTags: (prefix: string): TagInfo[] => {
    tagsActions.init();
    const lower = prefix.toLowerCase();
    return [...tagsStore.tags.values()]
      .filter(t => t.name.toLowerCase().includes(lower))
      .sort((a, b) => b.count - a.count);
  },

  clear: () => {
    tagsStore.tags = new Map();
    saveTags(new Map());
  },
};

export function useTags() {
  const snapshot = useSnapshot(tagsStore);

  return {
    tags: snapshot.tags,
    isLoaded: snapshot.isLoaded,
    getAllTags: tagsActions.getAllTags,
    getPopularTags: tagsActions.getPopularTags,
    searchTags: tagsActions.searchTags,
    syncFromStories: tagsActions.syncFromStories,
    addTag: tagsActions.addTag,
    setTagColor: tagsActions.setTagColor,
    getTagColor,
    clear: tagsActions.clear,
  };
}
