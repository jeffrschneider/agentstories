import type { AgentStory, Template, TemplateCategory } from '@/lib/schemas';
import { loadFromStorage, saveToStorage } from './storage';
import { mockStories, AGENT_STORY_IDS } from './mock-stories';
import { mockTemplates } from './mock-templates';

// Re-export for backwards compatibility
export { AGENT_STORY_IDS };

// Simulated delay for realistic async behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate UUID
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// In-memory storage with localStorage persistence
let stories: AgentStory[] = [];
let templates = [...mockTemplates];
let isInitialized = false;

// Initialize stories from localStorage or use defaults
function initializeStories(): void {
  if (isInitialized) return;

  const stored = loadFromStorage();
  if (stored && Array.isArray(stored) && stored.length > 0) {
    stories = stored as AgentStory[];
  } else {
    stories = [...mockStories];
    saveToStorage(stories);
  }
  isInitialized = true;
}

// Persist stories to localStorage
function persistStories(): void {
  saveToStorage(stories);
}

export const mockDataService = {
  // Stories
  stories: {
    list: async (params?: {
      search?: string;
      tags?: string[];
      autonomyLevel?: string;
    }): Promise<AgentStory[]> => {
      initializeStories();
      await delay(300);
      let result = [...stories];

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (s) =>
            s.name?.toLowerCase().includes(search) ||
            s.role?.toLowerCase().includes(search)
        );
      }

      if (params?.tags?.length) {
        result = result.filter((s) =>
          params.tags!.some((tag) => s.tags?.includes(tag))
        );
      }

      if (params?.autonomyLevel) {
        result = result.filter((s) => s.autonomyLevel === params.autonomyLevel);
      }

      return result;
    },

    get: async (id: string): Promise<AgentStory | null> => {
      initializeStories();
      await delay(200);
      return stories.find((s) => s.id === id) || null;
    },

    create: async (data: Omit<AgentStory, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentStory> => {
      initializeStories();
      await delay(400);
      const now = new Date().toISOString();
      const newStory = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      } as AgentStory;
      stories.push(newStory);
      persistStories();
      return newStory;
    },

    update: async (id: string, data: Partial<AgentStory>): Promise<AgentStory | null> => {
      initializeStories();
      await delay(400);
      const index = stories.findIndex((s) => s.id === id);
      if (index === -1) return null;

      stories[index] = {
        ...stories[index],
        ...data,
        updatedAt: new Date().toISOString(),
      } as AgentStory;
      persistStories();
      return stories[index];
    },

    delete: async (id: string): Promise<boolean> => {
      initializeStories();
      await delay(300);
      const index = stories.findIndex((s) => s.id === id);
      if (index === -1) return false;
      stories.splice(index, 1);
      persistStories();
      return true;
    },

    duplicate: async (id: string): Promise<AgentStory | null> => {
      initializeStories();
      await delay(400);
      const story = stories.find((s) => s.id === id);
      if (!story) return null;

      const now = new Date().toISOString();
      const duplicate = {
        ...story,
        id: uuid(),
        name: `${story.name} (Copy)`,
        identifier: story.identifier ? `${story.identifier}-copy-${Date.now()}` : undefined,
        createdAt: now,
        updatedAt: now,
      } as AgentStory;
      stories.push(duplicate);
      persistStories();
      return duplicate;
    },
  },

  // Templates
  templates: {
    list: async (params?: {
      category?: TemplateCategory;
      search?: string;
    }): Promise<Template[]> => {
      await delay(300);
      let result = [...templates];

      if (params?.category) {
        result = result.filter((t) => t.category === params.category);
      }

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.name.toLowerCase().includes(search) ||
            t.description.toLowerCase().includes(search)
        );
      }

      return result;
    },

    get: async (id: string): Promise<Template | null> => {
      await delay(200);
      return templates.find((t) => t.id === id) || null;
    },

    useTemplate: async (templateId: string): Promise<AgentStory> => {
      initializeStories();
      await delay(400);
      const template = templates.find((t) => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Increment usage count
      template.usageCount++;

      const now = new Date().toISOString();
      const newStory: AgentStory = {
        ...template.storyTemplate,
        id: uuid(),
        version: '1.0',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-1',
        identifier: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: `New ${template.name}`,
        purpose: 'Define the purpose of this agent',
        skills: [
          {
            id: uuid(),
            name: 'Primary Capability',
            description: 'Define what this skill does',
            domain: 'General',
            acquired: 'built_in',
            triggers: [{ type: 'manual', description: 'Triggered manually' }],
            acceptance: { successConditions: ['Define success criteria'] }
          }
        ],
      };

      stories.push(newStory);
      persistStories();
      return newStory;
    },
  },

  // Stats
  stats: {
    get: async () => {
      initializeStories();
      await delay(200);
      return {
        totalStories: stories.length,
        totalTemplates: templates.length,
        storiesByAutonomy: {
          full: stories.filter((s) => s.autonomyLevel === 'full').length,
          supervised: stories.filter((s) => s.autonomyLevel === 'supervised').length,
          collaborative: stories.filter((s) => s.autonomyLevel === 'collaborative').length,
          directed: stories.filter((s) => s.autonomyLevel === 'directed').length,
        },
      };
    },
  },
};
