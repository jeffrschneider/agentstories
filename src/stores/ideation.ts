import { proxy, useSnapshot } from 'valtio';
import { IdeatedAgent, createEmptyIdeatedAgent } from '@/lib/ideation/agent-context';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface IdeationState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  ideatedAgent: IdeatedAgent;
  isExtracting: boolean;
}

export const ideationStore = proxy<IdeationState>({
  messages: [],
  isLoading: false,
  error: null,
  ideatedAgent: createEmptyIdeatedAgent(),
  isExtracting: false,
});

export const ideationActions = {
  addMessage: (role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    ideationStore.messages.push(message);
    return message;
  },

  setLoading: (loading: boolean) => {
    ideationStore.isLoading = loading;
  },

  setError: (error: string | null) => {
    ideationStore.error = error;
  },

  updateIdeatedAgent: (agent: Partial<IdeatedAgent>) => {
    // Merge the new data with existing data
    if (agent.name !== undefined) ideationStore.ideatedAgent.name = agent.name;
    if (agent.identifier !== undefined) ideationStore.ideatedAgent.identifier = agent.identifier;
    if (agent.role !== undefined) ideationStore.ideatedAgent.role = agent.role;
    if (agent.purpose !== undefined) ideationStore.ideatedAgent.purpose = agent.purpose;
    if (agent.autonomyLevel !== undefined) ideationStore.ideatedAgent.autonomyLevel = agent.autonomyLevel;
    if (agent.notes !== undefined) ideationStore.ideatedAgent.notes = agent.notes;
    if (agent.tags !== undefined) ideationStore.ideatedAgent.tags = agent.tags;

    // Replace skills array entirely - extraction is authoritative
    // This allows skills to be removed and prevents duplicates from slight name variations
    if (agent.skills !== undefined) {
      ideationStore.ideatedAgent.skills = agent.skills;
    }

    // Merge human interaction
    if (agent.humanInteraction) {
      ideationStore.ideatedAgent.humanInteraction = {
        ...ideationStore.ideatedAgent.humanInteraction,
        ...agent.humanInteraction,
      };
    }

    // Merge collaboration
    if (agent.collaboration) {
      ideationStore.ideatedAgent.collaboration = {
        ...ideationStore.ideatedAgent.collaboration,
        ...agent.collaboration,
      };
    }

    // Merge memory
    if (agent.memory) {
      ideationStore.ideatedAgent.memory = {
        ...ideationStore.ideatedAgent.memory,
        ...agent.memory,
      };
    }

    // Replace guardrails array entirely - extraction is authoritative
    if (agent.guardrails !== undefined) {
      ideationStore.ideatedAgent.guardrails = agent.guardrails;
    }
  },

  setExtracting: (extracting: boolean) => {
    ideationStore.isExtracting = extracting;
  },

  clearChat: () => {
    ideationStore.messages = [];
    ideationStore.error = null;
    ideationStore.ideatedAgent = createEmptyIdeatedAgent();
  },

  resetAgent: () => {
    ideationStore.ideatedAgent = createEmptyIdeatedAgent();
  },
};

export function useIdeation() {
  return useSnapshot(ideationStore);
}
