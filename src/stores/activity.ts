import { proxy, useSnapshot } from 'valtio';

const STORAGE_KEY = 'agent-stories-activity';
const MAX_ACTIVITIES = 50;

export type ActivityType = 'view' | 'edit' | 'create' | 'delete' | 'duplicate' | 'export';

export interface Activity {
  id: string;
  type: ActivityType;
  storyId: string;
  storyName: string;
  timestamp: string;
}

interface ActivityState {
  activities: Activity[];
  isLoaded: boolean;
}

// Load activities from localStorage
function loadActivities(): Activity[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const activities = JSON.parse(stored);
    return Array.isArray(activities) ? activities : [];
  } catch {
    return [];
  }
}

// Save activities to localStorage
function saveActivities(activities: Activity[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch (error) {
    console.error('Failed to save activities:', error);
  }
}

// Generate activity ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const activityStore = proxy<ActivityState>({
  activities: [],
  isLoaded: false,
});

export const activityActions = {
  init: () => {
    if (!activityStore.isLoaded) {
      activityStore.activities = loadActivities();
      activityStore.isLoaded = true;
    }
  },

  log: (type: ActivityType, storyId: string, storyName: string) => {
    activityActions.init();

    const activity: Activity = {
      id: generateId(),
      type,
      storyId,
      storyName,
      timestamp: new Date().toISOString(),
    };

    // Add to beginning and limit size
    const updated = [activity, ...activityStore.activities].slice(0, MAX_ACTIVITIES);
    activityStore.activities = updated;
    saveActivities(updated);
  },

  getRecentForStory: (storyId: string, limit = 10): Activity[] => {
    activityActions.init();
    return activityStore.activities
      .filter(a => a.storyId === storyId)
      .slice(0, limit);
  },

  getRecent: (limit = 10): Activity[] => {
    activityActions.init();
    return activityStore.activities.slice(0, limit);
  },

  clear: () => {
    activityStore.activities = [];
    saveActivities([]);
  },

  removeForStory: (storyId: string) => {
    activityActions.init();
    const updated = activityStore.activities.filter(a => a.storyId !== storyId);
    activityStore.activities = updated;
    saveActivities(updated);
  },
};

export function useActivity() {
  const snapshot = useSnapshot(activityStore);

  return {
    activities: snapshot.activities,
    isLoaded: snapshot.isLoaded,
    log: activityActions.log,
    getRecentForStory: activityActions.getRecentForStory,
    getRecent: activityActions.getRecent,
    clear: activityActions.clear,
    removeForStory: activityActions.removeForStory,
  };
}
