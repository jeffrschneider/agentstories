import { proxy, useSnapshot } from 'valtio';
import type { AgentStory } from '@/lib/schemas';

// Draft data type - flexible to handle editing
type StoryDraftData = Record<string, unknown>;

// Draft state for story being edited
interface StoryDraft {
  id: string | null;
  data: StoryDraftData;
  originalData: StoryDraftData | null;
  validationErrors: Array<{ path: string; message: string }>;
  lastSavedAt: string | null;
}

interface StoryEditorState {
  draft: StoryDraft;
  isLoading: boolean;
  isSaving: boolean;
  autoSaveEnabled: boolean;
}

const initialDraft: StoryDraft = {
  id: null,
  data: {},
  originalData: null,
  validationErrors: [],
  lastSavedAt: null,
};

export const storyEditorStore = proxy<StoryEditorState>({
  draft: { ...initialDraft },
  isLoading: false,
  isSaving: false,
  autoSaveEnabled: true,
});

// Actions
export const storyEditorActions = {
  // Initialize new story
  initNewStory: () => {
    const now = new Date().toISOString();
    storyEditorStore.draft = {
      id: null,
      data: {
        id: crypto.randomUUID(),
        version: '1.0',
        createdAt: now,
        updatedAt: now,
        name: '',
        skills: []
      },
      originalData: null,
      validationErrors: [],
      lastSavedAt: null,
    };
  },

  // Load existing story for editing
  loadStory: (story: AgentStory) => {
    storyEditorStore.draft = {
      id: story.id,
      data: { ...story },
      originalData: { ...story },
      validationErrors: [],
      lastSavedAt: story.updatedAt,
    };
  },

  // Update draft data
  updateDraft: <K extends keyof AgentStory>(field: K, value: AgentStory[K]) => {
    storyEditorStore.draft.data[field] = value;
    storyEditorStore.draft.data.updatedAt = new Date().toISOString();
  },

  // Update nested field using dot notation path
  updateNestedField: (path: string, value: unknown) => {
    const keys = path.split('.');
    let current: Record<string, unknown> = storyEditorStore.draft.data as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    storyEditorStore.draft.data.updatedAt = new Date().toISOString();
  },

  // Set validation errors
  setValidationErrors: (errors: StoryDraft['validationErrors']) => {
    storyEditorStore.draft.validationErrors = errors;
  },

  // Clear validation errors
  clearValidationErrors: () => {
    storyEditorStore.draft.validationErrors = [];
  },

  // Reset to original
  resetToOriginal: () => {
    if (storyEditorStore.draft.originalData) {
      storyEditorStore.draft.data = { ...storyEditorStore.draft.originalData };
      storyEditorStore.draft.validationErrors = [];
    }
  },

  // Clear draft
  clearDraft: () => {
    storyEditorStore.draft = { ...initialDraft };
  },

  // Check if draft has changes
  hasChanges: (): boolean => {
    if (!storyEditorStore.draft.originalData) {
      return Object.keys(storyEditorStore.draft.data).length > 0;
    }
    return JSON.stringify(storyEditorStore.draft.data) !==
           JSON.stringify(storyEditorStore.draft.originalData);
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    storyEditorStore.isLoading = loading;
  },

  // Set saving state
  setSaving: (saving: boolean) => {
    storyEditorStore.isSaving = saving;
  },

  // Update last saved timestamp
  setLastSaved: (timestamp: string) => {
    storyEditorStore.draft.lastSavedAt = timestamp;
  },

  // Toggle auto-save
  toggleAutoSave: () => {
    storyEditorStore.autoSaveEnabled = !storyEditorStore.autoSaveEnabled;
  },
};

// Hook for easy access
export function useStoryEditor() {
  return useSnapshot(storyEditorStore);
}
