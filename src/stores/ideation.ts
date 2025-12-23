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

    // Merge skills (add new ones, update existing by name)
    if (agent.skills && agent.skills.length > 0) {
      agent.skills.forEach((newSkill) => {
        const existingIndex = ideationStore.ideatedAgent.skills.findIndex(
          (s) => s.name.toLowerCase() === newSkill.name.toLowerCase()
        );
        if (existingIndex >= 0) {
          // Update existing skill
          ideationStore.ideatedAgent.skills[existingIndex] = {
            ...ideationStore.ideatedAgent.skills[existingIndex],
            ...newSkill,
          };
        } else {
          // Add new skill
          ideationStore.ideatedAgent.skills.push(newSkill);
        }
      });
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

    // Merge guardrails (add new ones by name)
    if (agent.guardrails && agent.guardrails.length > 0) {
      agent.guardrails.forEach((newGuardrail) => {
        const exists = ideationStore.ideatedAgent.guardrails?.some(
          (g) => g.name.toLowerCase() === newGuardrail.name.toLowerCase()
        );
        if (!exists) {
          if (!ideationStore.ideatedAgent.guardrails) {
            ideationStore.ideatedAgent.guardrails = [];
          }
          ideationStore.ideatedAgent.guardrails.push(newGuardrail);
        }
      });
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
