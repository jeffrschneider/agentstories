import { z } from 'zod';

// ============================================
// Human Collaboration Schema
// ============================================

// Human interaction mode
export const HumanInteractionModeEnum = z.enum([
  'in_the_loop',   // Human approval for every decision
  'on_the_loop',   // Human monitors, intervenes on exceptions
  'out_of_loop'    // Fully autonomous within boundaries
]);

export type HumanInteractionMode = z.infer<typeof HumanInteractionModeEnum>;

// Checkpoint types
export const CheckpointTypeEnum = z.enum([
  'approval',    // Requires explicit approval to proceed
  'input',       // Requires human input/data
  'review',      // Human reviews but doesn't block
  'escalation'   // Escalates to human for resolution
]);

export type CheckpointType = z.infer<typeof CheckpointTypeEnum>;

// Checkpoint schema
export const CheckpointSchema = z.object({
  name: z.string().min(1),
  trigger: z.string().min(1).describe('When human involvement is required'),
  type: CheckpointTypeEnum,
  timeout: z.string().optional().describe('What happens if human does not respond')
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;

// Escalation configuration
export const EscalationConfigSchema = z.object({
  conditions: z.string().min(1).describe('When to escalate to human'),
  channel: z.string().min(1).describe('How escalation occurs')
});

export type EscalationConfig = z.infer<typeof EscalationConfigSchema>;

// Complete human interaction schema
export const HumanInteractionSchema = z.object({
  mode: HumanInteractionModeEnum,
  checkpoints: z.array(CheckpointSchema).optional(),
  escalation: EscalationConfigSchema.optional()
});

export type HumanInteraction = z.infer<typeof HumanInteractionSchema>;

// ============================================
// Agent Collaboration Schema
// ============================================

// Agent collaboration role
export const AgentCollaborationRoleEnum = z.enum([
  'supervisor',   // Coordinates and orchestrates other agents
  'worker',       // Executes specific tasks as directed
  'peer'          // Collaborates as equals with defined patterns
]);

export type AgentCollaborationRole = z.infer<typeof AgentCollaborationRoleEnum>;

// Interaction pattern for peers
export const PeerInteractionEnum = z.enum([
  'request_response',   // Synchronous request/response
  'pub_sub',            // Publish/subscribe messaging
  'shared_state'        // Shared state coordination
]);

export type PeerInteraction = z.infer<typeof PeerInteractionEnum>;

// Coordination entry (for supervisors)
export const CoordinationEntrySchema = z.object({
  agent: z.string().min(1).describe('Worker Agent ID/Type'),
  via: z.string().min(1).describe('Communication protocol'),
  for: z.string().min(1).describe('What tasks are delegated')
});

export type CoordinationEntry = z.infer<typeof CoordinationEntrySchema>;

// Peer entry
export const PeerEntrySchema = z.object({
  agent: z.string().min(1).describe('Peer Agent ID/Type'),
  interaction: PeerInteractionEnum
});

export type PeerEntry = z.infer<typeof PeerEntrySchema>;

// Complete agent collaboration schema
export const AgentCollaborationSchema = z.object({
  role: AgentCollaborationRoleEnum,
  // For supervisors
  coordinates: z.array(CoordinationEntrySchema).optional(),
  // For workers
  reportsTo: z.string().optional().describe('Supervisor Agent ID/Type'),
  // For all roles
  peers: z.array(PeerEntrySchema).optional()
});

export type AgentCollaboration = z.infer<typeof AgentCollaborationSchema>;

// ============================================
// Metadata for UI
// ============================================

export const HUMAN_INTERACTION_MODE_METADATA = {
  in_the_loop: {
    label: 'In the Loop',
    description: 'Human approval for every decision'
  },
  on_the_loop: {
    label: 'On the Loop',
    description: 'Human monitors, intervenes on exceptions'
  },
  out_of_loop: {
    label: 'Out of Loop',
    description: 'Fully autonomous within boundaries'
  }
} as const;

export const CHECKPOINT_TYPE_METADATA = {
  approval: {
    label: 'Approval',
    description: 'Requires explicit approval to proceed'
  },
  input: {
    label: 'Input',
    description: 'Requires human input/data'
  },
  review: {
    label: 'Review',
    description: 'Human reviews but doesn\'t block'
  },
  escalation: {
    label: 'Escalation',
    description: 'Escalates to human for resolution'
  }
} as const;

export const AGENT_COLLABORATION_ROLE_METADATA = {
  supervisor: {
    label: 'Supervisor',
    description: 'Coordinates and orchestrates other agents'
  },
  worker: {
    label: 'Worker',
    description: 'Executes specific tasks as directed'
  },
  peer: {
    label: 'Peer',
    description: 'Collaborates as equals with defined patterns'
  }
} as const;

export const PEER_INTERACTION_METADATA = {
  request_response: {
    label: 'Request/Response',
    description: 'Synchronous request/response'
  },
  pub_sub: {
    label: 'Pub/Sub',
    description: 'Publish/subscribe messaging'
  },
  shared_state: {
    label: 'Shared State',
    description: 'Shared state coordination'
  }
} as const;
