import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '@/services';
import { uiActions } from '@/stores';
import type { AgentStory, AutonomyLevel, StoryFormat } from '@/lib/schemas';

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
  format?: StoryFormat;
}

// List stories
export function useStories(params?: StoryListParams) {
  return useQuery({
    queryKey: storyKeys.list(params),
    queryFn: () => mockDataService.stories.list(params),
  });
}

// Get single story
export function useStory(id: string) {
  return useQuery({
    queryKey: storyKeys.detail(id),
    queryFn: () => mockDataService.stories.get(id),
    enabled: !!id,
  });
}

// Create story
export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<AgentStory, 'id' | 'createdAt' | 'updatedAt'>) =>
      mockDataService.stories.create(data),
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
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
    mutationFn: (id: string) => mockDataService.stories.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      queryClient.removeQueries({ queryKey: storyKeys.detail(id) });
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
