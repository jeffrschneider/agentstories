import { proxy, useSnapshot } from 'valtio';
import type { AgentStory, StoryFormat, TriggerType } from '@/lib/schemas';
import { createEmptySkill } from '@/lib/schemas';

// Draft data type - flexible to handle both formats during editing
type StoryDraftData = Record<string, unknown>;

// Draft state for story being edited
interface StoryDraft {
  id: string | null;
  format: StoryFormat;
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
  format: 'light',
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
  initNewStory: (format: StoryFormat = 'light') => {
    const now = new Date().toISOString();
    const baseData = {
      format,
      version: '1.0',
      createdAt: now,
      updatedAt: now,
      autonomyLevel: 'supervised',
    };

    // For full format, initialize with an empty skill
    // For light format, initialize with simple trigger
    const data = format === 'full'
      ? { ...baseData, skills: [createEmptySkill()] }
      : { ...baseData, trigger: { type: 'message' as const, description: '' } };

    storyEditorStore.draft = {
      id: null,
      format,
      data,
      originalData: null,
      validationErrors: [],
      lastSavedAt: null,
    };
  },

  // Load existing story for editing
  loadStory: (story: AgentStory) => {
    storyEditorStore.draft = {
      id: story.id,
      format: story.format,
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

  // Change story format
  changeFormat: (format: StoryFormat) => {
    const currentData = storyEditorStore.draft.data as Record<string, unknown>;
    storyEditorStore.draft.format = format;
    storyEditorStore.draft.data.format = format;

    // When switching to full format, ensure skills exist
    if (format === 'full' && !currentData.skills) {
      // Convert light format to full by creating a skill from the simple statements
      const skill = createEmptySkill();
      if (currentData.action) {
        skill.description = currentData.action as string;
      }
      if (currentData.trigger) {
        const trigger = currentData.trigger as { type?: TriggerType; description?: string };
        skill.triggers = [{
          type: trigger.type || 'message',
          description: trigger.description || ''
        }];
      }
      if (currentData.outcome) {
        skill.acceptance = {
          successConditions: [currentData.outcome as string]
        };
      }
      storyEditorStore.draft.data.skills = [skill];
      // Set purpose from outcome if not already set
      if (!currentData.purpose && currentData.outcome) {
        storyEditorStore.draft.data.purpose = currentData.outcome;
      }
    }
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
