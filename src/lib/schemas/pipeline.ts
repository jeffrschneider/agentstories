import { z } from 'zod';

// Pipeline Item Types
export const PipelineItemTypeEnum = z.enum([
  'new-agent',        // Proposal for a new agent
  'capability-add',   // Add new capability to existing agent
  'capability-modify', // Modify existing capability
  'capability-remove', // Remove capability from agent
  'agent-update',     // General update to agent configuration
]);

export type PipelineItemType = z.infer<typeof PipelineItemTypeEnum>;

// Pipeline Stages for Kanban
export const PipelineStageEnum = z.enum([
  'proposed',     // Initial proposal
  'under-review', // Being reviewed by stakeholders
  'approved',     // Approved, ready to implement
  'in-progress',  // Currently being implemented
  'completed',    // Done
  'rejected',     // Rejected/closed
]);

export type PipelineStage = z.infer<typeof PipelineStageEnum>;

// Priority levels
export const PipelinePriorityEnum = z.enum([
  'critical',
  'high',
  'medium',
  'low',
]);

export type PipelinePriority = z.infer<typeof PipelinePriorityEnum>;

// Pipeline Item Schema
export const PipelineItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: PipelineItemTypeEnum,
  stage: PipelineStageEnum,
  priority: PipelinePriorityEnum,

  // Related entities
  agentId: z.string().uuid().optional(), // For changes to existing agents
  agentName: z.string().optional(),      // Cached agent name for display

  // For new agent proposals
  proposedAgentName: z.string().max(100).optional(),
  proposedCapabilities: z.array(z.string()).optional(),

  // For capability changes
  capabilityName: z.string().max(100).optional(),
  capabilityDescription: z.string().max(500).optional(),

  // Metadata
  requestedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  stageChangedAt: z.string().datetime().optional(),
});

export type PipelineItem = z.infer<typeof PipelineItemSchema>;

// Helper to create an empty pipeline item
export function createEmptyPipelineItem(type: PipelineItemType = 'new-agent'): PipelineItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '',
    type,
    stage: 'proposed',
    priority: 'medium',
    createdAt: now,
    updatedAt: now,
    stageChangedAt: now,
  };
}

// Pipeline Stage Metadata
export const PIPELINE_STAGE_METADATA = {
  'proposed': {
    label: 'Proposed',
    description: 'Initial proposal waiting for review',
    color: 'gray',
  },
  'under-review': {
    label: 'Under Review',
    description: 'Being reviewed by stakeholders',
    color: 'blue',
  },
  'approved': {
    label: 'Approved',
    description: 'Approved and ready for implementation',
    color: 'green',
  },
  'in-progress': {
    label: 'In Progress',
    description: 'Currently being implemented',
    color: 'yellow',
  },
  'completed': {
    label: 'Completed',
    description: 'Successfully completed',
    color: 'emerald',
  },
  'rejected': {
    label: 'Rejected',
    description: 'Rejected or cancelled',
    color: 'red',
  },
} as const;

// Pipeline Item Type Metadata
export const PIPELINE_ITEM_TYPE_METADATA = {
  'new-agent': {
    label: 'New Agent',
    description: 'Proposal for a new agent',
    icon: 'Plus',
  },
  'capability-add': {
    label: 'Add Capability',
    description: 'Add new capability to existing agent',
    icon: 'PlusCircle',
  },
  'capability-modify': {
    label: 'Modify Capability',
    description: 'Modify an existing capability',
    icon: 'Edit',
  },
  'capability-remove': {
    label: 'Remove Capability',
    description: 'Remove capability from agent',
    icon: 'MinusCircle',
  },
  'agent-update': {
    label: 'Agent Update',
    description: 'General update to agent configuration',
    icon: 'Settings',
  },
} as const;

// Pipeline Priority Metadata
export const PIPELINE_PRIORITY_METADATA = {
  'critical': {
    label: 'Critical',
    color: 'red',
  },
  'high': {
    label: 'High',
    color: 'orange',
  },
  'medium': {
    label: 'Medium',
    color: 'yellow',
  },
  'low': {
    label: 'Low',
    color: 'gray',
  },
} as const;

// Ordered stages for Kanban display (excluding rejected)
export const KANBAN_STAGES: PipelineStage[] = [
  'proposed',
  'under-review',
  'approved',
  'in-progress',
  'completed',
];
