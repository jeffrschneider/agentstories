import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '@/services';
import { uiActions, activityActions } from '@/stores';
import type { AgentStory, AutonomyLevel } from '@/lib/schemas';

// Query keys
export const storyKeys = {
  all: ['stories'] as const,
  lists: () => [...storyKeys.all, 'list'] as const,
  list: (params?: StoryListParams) => [...storyKeys.lists(), params] as const,
  details: () => [...storyKeys.all, 'detail'] as const,
  detail: (id: string) => [...storyKeys.details(), id] as const,
};

interface StoryListParams {
  search?: string;
  tags?: string[];
  autonomyLevel?: AutonomyLevel;
}

// List stories
export function useStories(params?: StoryListParams) {
  return useQuery({
    queryKey: storyKeys.list(params),
    queryFn: () => mockDataService.stories.list(params),
  });
}

// Get single story with view tracking
export function useStory(id: string, options?: { trackView?: boolean }) {
  const query = useQuery({
    queryKey: storyKeys.detail(id),
    queryFn: async () => {
      const story = await mockDataService.stories.get(id);
      if (story && options?.trackView !== false) {
        activityActions.log('view', story.id, story.name || 'Untitled');
      }
      return story;
    },
    enabled: !!id,
  });

  return query;
}

// Create story
export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<AgentStory, 'id' | 'createdAt' | 'updatedAt'>) =>
      mockDataService.stories.create(data),
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      activityActions.log('create', newStory.id, newStory.name || 'Untitled');
      uiActions.addToast({
        type: 'success',
        title: 'Story created',
        message: `"${newStory.name}" has been created successfully.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create story',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Update story
export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentStory> }) =>
      mockDataService.stories.update(id, data),
    onSuccess: (updatedStory) => {
      if (updatedStory) {
        queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
        queryClient.setQueryData(storyKeys.detail(updatedStory.id), updatedStory);
        activityActions.log('edit', updatedStory.id, updatedStory.name || 'Untitled');
        uiActions.addToast({
          type: 'success',
          title: 'Story updated',
          message: 'Your changes have been saved.',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update story',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Delete story
export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const deleted = await mockDataService.stories.delete(id);
      return { deleted, id, name };
    },
    onSuccess: ({ id, name }) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      queryClient.removeQueries({ queryKey: storyKeys.detail(id) });
      activityActions.log('delete', id, name || 'Untitled');
      uiActions.addToast({
        type: 'success',
        title: 'Story deleted',
        message: 'The story has been deleted.',
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to delete story',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Duplicate story
export function useDuplicateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mockDataService.stories.duplicate(id),
    onSuccess: (duplicatedStory) => {
      if (duplicatedStory) {
        queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
        activityActions.log('duplicate', duplicatedStory.id, duplicatedStory.name || 'Untitled');
        uiActions.addToast({
          type: 'success',
          title: 'Story duplicated',
          message: `"${duplicatedStory.name}" has been created.`,
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to duplicate story',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Log export activity
export function useLogExport() {
  return (storyId: string, storyName: string) => {
    activityActions.log('export', storyId, storyName);
  };
}
