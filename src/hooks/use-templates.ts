import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '@/services';
import { uiActions } from '@/stores';
import { storyKeys } from './use-stories';
import type { TemplateCategory } from '@/lib/schemas';

// Query keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (params?: TemplateListParams) => [...templateKeys.lists(), params] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

interface TemplateListParams {
  category?: TemplateCategory;
  search?: string;
}

// List templates
export function useTemplates(params?: TemplateListParams) {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => mockDataService.templates.list(params),
  });
}

// Get single template
export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => mockDataService.templates.get(id),
    enabled: !!id,
  });
}

// Use template to create a new story
export function useCreateFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => mockDataService.templates.useTemplate(templateId),
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() }); // Usage count changed
      uiActions.addToast({
        type: 'success',
        title: 'Story created from template',
        message: `"${newStory.name}" has been created. You can now customize it.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create from template',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
