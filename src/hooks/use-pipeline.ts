import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineDataService, type PipelineFilters } from '@/services/mock-pipeline-data';
import { uiActions } from '@/stores';
import type { PipelineItem, PipelineStage } from '@/lib/schemas';

// Query keys
export const pipelineKeys = {
  all: ['pipeline'] as const,
  lists: () => [...pipelineKeys.all, 'list'] as const,
  list: (params?: PipelineFilters) => [...pipelineKeys.lists(), params] as const,
  byStage: () => [...pipelineKeys.all, 'byStage'] as const,
  details: () => [...pipelineKeys.all, 'detail'] as const,
  detail: (id: string) => [...pipelineKeys.details(), id] as const,
  stats: () => [...pipelineKeys.all, 'stats'] as const,
};

// List pipeline items with optional filters
export function usePipelineItems(params?: PipelineFilters) {
  return useQuery({
    queryKey: pipelineKeys.list(params),
    queryFn: () => pipelineDataService.list(params),
  });
}

// Get pipeline items grouped by stage for Kanban view
export function usePipelineByStage() {
  return useQuery({
    queryKey: pipelineKeys.byStage(),
    queryFn: () => pipelineDataService.listByStage(),
  });
}

// Get single pipeline item
export function usePipelineItem(id: string) {
  return useQuery({
    queryKey: pipelineKeys.detail(id),
    queryFn: () => pipelineDataService.get(id),
    enabled: !!id,
  });
}

// Get pipeline statistics
export function usePipelineStats() {
  return useQuery({
    queryKey: pipelineKeys.stats(),
    queryFn: () => pipelineDataService.getStats(),
  });
}

// Create pipeline item
export function useCreatePipelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<PipelineItem, 'id' | 'createdAt' | 'updatedAt' | 'stageChangedAt'>) =>
      pipelineDataService.create(data),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.byStage() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.stats() });
      uiActions.addToast({
        type: 'success',
        title: 'Item created',
        message: `"${newItem.title}" has been added to the pipeline.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create item',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Update pipeline item
export function useUpdatePipelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PipelineItem> }) =>
      pipelineDataService.update(id, data),
    onSuccess: (updatedItem) => {
      if (updatedItem) {
        queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
        queryClient.invalidateQueries({ queryKey: pipelineKeys.byStage() });
        queryClient.invalidateQueries({ queryKey: pipelineKeys.stats() });
        queryClient.setQueryData(pipelineKeys.detail(updatedItem.id), updatedItem);
        uiActions.addToast({
          type: 'success',
          title: 'Item updated',
          message: 'Your changes have been saved.',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update item',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Move pipeline item to a different stage (or reorder within same stage)
export function useMovePipelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage, targetIndex }: { id: string; stage: PipelineStage; targetIndex?: number }) =>
      pipelineDataService.moveToStage(id, stage, targetIndex),
    onSuccess: (updatedItem) => {
      if (updatedItem) {
        queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
        queryClient.invalidateQueries({ queryKey: pipelineKeys.byStage() });
        queryClient.invalidateQueries({ queryKey: pipelineKeys.stats() });
        queryClient.setQueryData(pipelineKeys.detail(updatedItem.id), updatedItem);
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to move item',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Reorder items within a stage
export function useReorderPipelineItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stage, itemIds }: { stage: PipelineStage; itemIds: string[] }) =>
      pipelineDataService.reorderInStage(stage, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.byStage() });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to reorder items',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Delete pipeline item
export function useDeletePipelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const deleted = await pipelineDataService.delete(id);
      return { deleted, id, title };
    },
    onSuccess: ({ id, title }) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.byStage() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.stats() });
      queryClient.removeQueries({ queryKey: pipelineKeys.detail(id) });
      uiActions.addToast({
        type: 'success',
        title: 'Item deleted',
        message: `"${title}" has been removed from the pipeline.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to delete item',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
