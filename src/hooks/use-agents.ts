import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentDataService, type AgentFilters } from '@/services/mock-agent-data';
import { uiActions, activityActions } from '@/stores';
import type { Agent } from '@/lib/schemas';

// Query keys
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (params?: AgentFilters) => [...agentKeys.lists(), params] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  stats: () => [...agentKeys.all, 'stats'] as const,
  tags: () => [...agentKeys.all, 'tags'] as const,
};

// List agents with optional filters
export function useAgents(params?: AgentFilters) {
  return useQuery({
    queryKey: agentKeys.list(params),
    queryFn: () => agentDataService.list(params),
  });
}

// Get single agent with view tracking
export function useAgent(id: string, options?: { trackView?: boolean }) {
  const query = useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: async () => {
      const agent = await agentDataService.get(id);
      if (agent && options?.trackView !== false) {
        activityActions.log('view', agent.id, agent.name || 'Untitled Agent');
      }
      return agent;
    },
    enabled: !!id,
  });

  return query;
}

// Get agent statistics
export function useAgentStats() {
  return useQuery({
    queryKey: agentKeys.stats(),
    queryFn: () => agentDataService.getStats(),
  });
}

// Get all unique tags
export function useAgentTags() {
  return useQuery({
    queryKey: agentKeys.tags(),
    queryFn: () => agentDataService.getTags(),
  });
}

// Create agent
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) =>
      agentDataService.create(data),
    onSuccess: (newAgent) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: agentKeys.tags() });
      activityActions.log('create', newAgent.id, newAgent.name || 'Untitled Agent');
      uiActions.addToast({
        type: 'success',
        title: 'Agent created',
        message: `"${newAgent.name}" has been added to the catalog.`,
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to create agent',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Update agent
export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) =>
      agentDataService.update(id, data),
    onSuccess: (updatedAgent) => {
      if (updatedAgent) {
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
        queryClient.invalidateQueries({ queryKey: agentKeys.tags() });
        queryClient.setQueryData(agentKeys.detail(updatedAgent.id), updatedAgent);
        activityActions.log('edit', updatedAgent.id, updatedAgent.name || 'Untitled Agent');
        uiActions.addToast({
          type: 'success',
          title: 'Agent updated',
          message: 'Your changes have been saved.',
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update agent',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Delete agent
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const deleted = await agentDataService.delete(id);
      return { deleted, id, name };
    },
    onSuccess: ({ id, name }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: agentKeys.tags() });
      queryClient.removeQueries({ queryKey: agentKeys.detail(id) });
      activityActions.log('delete', id, name || 'Untitled Agent');
      uiActions.addToast({
        type: 'success',
        title: 'Agent deleted',
        message: 'The agent has been removed from the catalog.',
      });
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to delete agent',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}

// Update agent lifecycle state
export function useUpdateAgentLifecycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      lifecycleState,
      lifecycleNotes,
    }: {
      id: string;
      lifecycleState: Agent['lifecycleState'];
      lifecycleNotes?: string;
    }) => {
      return agentDataService.update(id, { lifecycleState, lifecycleNotes });
    },
    onSuccess: (updatedAgent) => {
      if (updatedAgent) {
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        queryClient.invalidateQueries({ queryKey: agentKeys.stats() });
        queryClient.setQueryData(agentKeys.detail(updatedAgent.id), updatedAgent);
        uiActions.addToast({
          type: 'success',
          title: 'Lifecycle updated',
          message: `Agent moved to "${updatedAgent.lifecycleState}" state.`,
        });
      }
    },
    onError: (error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Failed to update lifecycle',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
