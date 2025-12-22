import type { PipelineItem, PipelineStage, PipelineItemType, PipelinePriority } from '@/lib/schemas';

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

// Storage keys
const STORAGE_KEY_PIPELINE = 'agent-stories-pipeline';
const CURRENT_VERSION = '1.1'; // Updated for order field

interface PipelineStorageData {
  items: PipelineItem[];
  version: string;
}

// Mock data timestamps
const now = new Date().toISOString();
const dayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const mockPipelineItems: PipelineItem[] = [
  // Proposed - New agents
  {
    id: uuid(),
    title: 'HR Onboarding Assistant',
    description: 'An agent to assist with employee onboarding processes, including document collection, training scheduling, and IT setup coordination.',
    type: 'new-agent',
    stage: 'proposed',
    priority: 'high',
    proposedAgentName: 'HR Onboarding Assistant',
    proposedCapabilities: ['Document collection', 'Training scheduling', 'IT provisioning requests', 'Welcome email generation'],
    requestedBy: 'Sarah Johnson',
    createdAt: dayAgo,
    updatedAt: dayAgo,
    stageChangedAt: dayAgo,
    order: 0,
  },
  {
    id: uuid(),
    title: 'Meeting Scheduler Agent',
    description: 'Agent that helps coordinate meetings across time zones, find optimal meeting times, and manage calendar conflicts.',
    type: 'new-agent',
    stage: 'proposed',
    priority: 'medium',
    proposedAgentName: 'Meeting Scheduler',
    proposedCapabilities: ['Calendar integration', 'Timezone management', 'Conflict resolution', 'Room booking'],
    requestedBy: 'Mike Chen',
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
    stageChangedAt: twoDaysAgo,
    order: 1,
  },
  // Under Review
  {
    id: uuid(),
    title: 'Add Sentiment Analysis to Customer Support Agent',
    description: 'Enhance the customer support agent with real-time sentiment analysis to better route frustrated customers to human agents.',
    type: 'capability-add',
    stage: 'under-review',
    priority: 'high',
    agentId: 'd1e2f3a4-b5c6-4789-defg-hij0123456789',
    agentName: 'Customer Support Agent',
    capabilityName: 'Sentiment Analysis',
    capabilityDescription: 'Real-time analysis of customer sentiment during conversations',
    requestedBy: 'Emily Davis',
    assignedTo: 'Tech Review Board',
    createdAt: weekAgo,
    updatedAt: dayAgo,
    stageChangedAt: twoDaysAgo,
    order: 0,
  },
  {
    id: uuid(),
    title: 'Compliance Checking Agent',
    description: 'New agent to review documents and communications for compliance with regulatory requirements.',
    type: 'new-agent',
    stage: 'under-review',
    priority: 'critical',
    proposedAgentName: 'Compliance Checker',
    proposedCapabilities: ['Document scanning', 'Regulation matching', 'Risk flagging', 'Audit trail generation'],
    requestedBy: 'Legal Team',
    assignedTo: 'Compliance Committee',
    createdAt: weekAgo,
    updatedAt: twoDaysAgo,
    stageChangedAt: twoDaysAgo,
    order: 1,
  },
  // Approved
  {
    id: uuid(),
    title: 'Update Code Review Assistant prompts',
    description: 'Modify the system prompts for the Code Review Assistant to better handle TypeScript and React patterns.',
    type: 'agent-update',
    stage: 'approved',
    priority: 'medium',
    agentId: 'e2f3a4b5-c6d7-4890-efgh-ijk1234567890',
    agentName: 'Code Review Assistant',
    requestedBy: 'Dev Team',
    assignedTo: 'Alex Rivera',
    createdAt: weekAgo,
    updatedAt: dayAgo,
    stageChangedAt: dayAgo,
    order: 0,
  },
  // In Progress
  {
    id: uuid(),
    title: 'Add multi-language support to Sales Assistant',
    description: 'Extend the Sales Assistant agent to support Spanish and French for international sales team.',
    type: 'capability-add',
    stage: 'in-progress',
    priority: 'high',
    agentId: 'f3a4b5c6-d7e8-4901-fghi-jkl2345678901',
    agentName: 'Sales Assistant Agent',
    capabilityName: 'Multi-language Support',
    capabilityDescription: 'Support for Spanish and French languages',
    requestedBy: 'International Sales',
    assignedTo: 'Maria Garcia',
    createdAt: weekAgo,
    updatedAt: now,
    stageChangedAt: twoDaysAgo,
    order: 0,
  },
  {
    id: uuid(),
    title: 'Expense Report Agent',
    description: 'Agent to process expense reports, validate receipts, and route for approvals.',
    type: 'new-agent',
    stage: 'in-progress',
    priority: 'medium',
    proposedAgentName: 'Expense Report Agent',
    proposedCapabilities: ['Receipt OCR', 'Policy validation', 'Approval routing', 'Reimbursement tracking'],
    requestedBy: 'Finance Team',
    assignedTo: 'Tom Wilson',
    createdAt: weekAgo,
    updatedAt: now,
    stageChangedAt: dayAgo,
    order: 1,
  },
  // Completed
  {
    id: uuid(),
    title: 'Add Slack integration to Customer Support Agent',
    description: 'Allow the Customer Support Agent to receive and respond to tickets via Slack channels.',
    type: 'capability-add',
    stage: 'completed',
    priority: 'high',
    agentId: 'd1e2f3a4-b5c6-4789-defg-hij0123456789',
    agentName: 'Customer Support Agent',
    capabilityName: 'Slack Integration',
    capabilityDescription: 'Bi-directional Slack channel integration for support tickets',
    requestedBy: 'Support Team',
    assignedTo: 'Dev Team',
    createdAt: weekAgo,
    updatedAt: twoDaysAgo,
    stageChangedAt: twoDaysAgo,
    order: 0,
  },
];

// In-memory storage
let pipelineItems: PipelineItem[] = [];
let isInitialized = false;

// Load from localStorage
function loadPipelineData(): PipelineStorageData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_PIPELINE);
    if (!stored) return null;

    const data: PipelineStorageData = JSON.parse(stored);
    if (data.version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY_PIPELINE);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Save to localStorage
function savePipelineData(): void {
  if (typeof window === 'undefined') return;

  try {
    const data: PipelineStorageData = {
      items: pipelineItems,
      version: CURRENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY_PIPELINE, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save pipeline data to localStorage:', error);
  }
}

// Initialize data
function initializePipelineData(): void {
  if (isInitialized) return;

  const stored = loadPipelineData();
  if (stored) {
    pipelineItems = stored.items;
  } else {
    pipelineItems = [...mockPipelineItems];
    savePipelineData();
  }
  isInitialized = true;
}

export interface PipelineFilters {
  search?: string;
  stage?: PipelineStage | 'all';
  type?: PipelineItemType | 'all';
  priority?: PipelinePriority | 'all';
  agentId?: string;
}

export interface PipelineStats {
  total: number;
  proposed: number;
  underReview: number;
  approved: number;
  inProgress: number;
  completed: number;
  rejected: number;
  byType: Record<PipelineItemType, number>;
}

export const pipelineDataService = {
  // List pipeline items with optional filters
  list: async (filters?: PipelineFilters): Promise<PipelineItem[]> => {
    initializePipelineData();
    await delay(200);

    let result = [...pipelineItems];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.agentName?.toLowerCase().includes(searchLower) ||
          item.proposedAgentName?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.stage && filters.stage !== 'all') {
      result = result.filter(item => item.stage === filters.stage);
    }

    if (filters?.type && filters.type !== 'all') {
      result = result.filter(item => item.type === filters.type);
    }

    if (filters?.priority && filters.priority !== 'all') {
      result = result.filter(item => item.priority === filters.priority);
    }

    if (filters?.agentId) {
      result = result.filter(item => item.agentId === filters.agentId);
    }

    // Sort by priority (critical first) then by updated date
    const priorityOrder: Record<PipelinePriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    result.sort((a, b) => {
      const priorityCompare = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityCompare !== 0) return priorityCompare;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  },

  // Get items grouped by stage for Kanban view
  listByStage: async (): Promise<Record<PipelineStage, PipelineItem[]>> => {
    initializePipelineData();
    await delay(200);

    const grouped: Record<PipelineStage, PipelineItem[]> = {
      'proposed': [],
      'under-review': [],
      'approved': [],
      'in-progress': [],
      'completed': [],
      'rejected': [],
    };

    for (const item of pipelineItems) {
      grouped[item.stage].push(item);
    }

    // Sort each group by order (if set), then by priority as fallback
    for (const stage of Object.keys(grouped) as PipelineStage[]) {
      grouped[stage].sort((a, b) => {
        // If both have order, sort by order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // Items with order come before items without
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Fallback to date
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return grouped;
  },

  // Get a single pipeline item by ID
  get: async (id: string): Promise<PipelineItem | null> => {
    initializePipelineData();
    await delay(100);
    return pipelineItems.find(item => item.id === id) || null;
  },

  // Create a new pipeline item
  create: async (data: Omit<PipelineItem, 'id' | 'createdAt' | 'updatedAt' | 'stageChangedAt'>): Promise<PipelineItem> => {
    initializePipelineData();
    await delay(300);

    const now = new Date().toISOString();
    const newItem: PipelineItem = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
      stageChangedAt: now,
    };

    pipelineItems.push(newItem);
    savePipelineData();
    return newItem;
  },

  // Update an existing pipeline item
  update: async (id: string, data: Partial<PipelineItem>): Promise<PipelineItem | null> => {
    initializePipelineData();
    await delay(300);

    const index = pipelineItems.findIndex(item => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const updates: Partial<PipelineItem> = {
      ...data,
      updatedAt: now,
    };

    // Track stage changes
    if (data.stage && data.stage !== pipelineItems[index].stage) {
      updates.stageChangedAt = now;
    }

    pipelineItems[index] = {
      ...pipelineItems[index],
      ...updates,
    };

    savePipelineData();
    return pipelineItems[index];
  },

  // Move item to a different stage (or reorder within same stage)
  moveToStage: async (id: string, stage: PipelineStage, targetIndex?: number): Promise<PipelineItem | null> => {
    initializePipelineData();
    await delay(100);

    const item = pipelineItems.find(i => i.id === id);
    if (!item) return null;

    const isChangingStage = item.stage !== stage;

    // Get items in the target stage (excluding the moving item)
    const stageItems = pipelineItems
      .filter(i => i.stage === stage && i.id !== id)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Determine the new order
    let newOrder: number;
    if (targetIndex !== undefined && targetIndex >= 0) {
      newOrder = targetIndex;
    } else {
      // Add to end of stage
      newOrder = stageItems.length;
    }

    // Update orders for items that need to shift
    for (const stageItem of stageItems) {
      if ((stageItem.order ?? 0) >= newOrder) {
        stageItem.order = (stageItem.order ?? 0) + 1;
      }
    }

    // Update the item
    const now = new Date().toISOString();
    item.stage = stage;
    item.order = newOrder;
    item.updatedAt = now;
    if (isChangingStage) {
      item.stageChangedAt = now;
    }

    savePipelineData();
    return item;
  },

  // Reorder items within a stage
  reorderInStage: async (stage: PipelineStage, itemIds: string[]): Promise<void> => {
    initializePipelineData();
    await delay(100);

    // Update order for each item based on position in array
    for (let i = 0; i < itemIds.length; i++) {
      const item = pipelineItems.find(p => p.id === itemIds[i] && p.stage === stage);
      if (item) {
        item.order = i;
      }
    }

    savePipelineData();
  },

  // Delete a pipeline item
  delete: async (id: string): Promise<boolean> => {
    initializePipelineData();
    await delay(200);

    const index = pipelineItems.findIndex(item => item.id === id);
    if (index === -1) return false;

    pipelineItems.splice(index, 1);
    savePipelineData();
    return true;
  },

  // Get pipeline statistics
  getStats: async (): Promise<PipelineStats> => {
    initializePipelineData();
    await delay(200);

    const stats: PipelineStats = {
      total: pipelineItems.length,
      proposed: pipelineItems.filter(item => item.stage === 'proposed').length,
      underReview: pipelineItems.filter(item => item.stage === 'under-review').length,
      approved: pipelineItems.filter(item => item.stage === 'approved').length,
      inProgress: pipelineItems.filter(item => item.stage === 'in-progress').length,
      completed: pipelineItems.filter(item => item.stage === 'completed').length,
      rejected: pipelineItems.filter(item => item.stage === 'rejected').length,
      byType: {
        'new-agent': pipelineItems.filter(item => item.type === 'new-agent').length,
        'capability-add': pipelineItems.filter(item => item.type === 'capability-add').length,
        'capability-modify': pipelineItems.filter(item => item.type === 'capability-modify').length,
        'capability-remove': pipelineItems.filter(item => item.type === 'capability-remove').length,
        'agent-update': pipelineItems.filter(item => item.type === 'agent-update').length,
      },
    };

    return stats;
  },
};
