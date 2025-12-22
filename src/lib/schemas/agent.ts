import { z } from 'zod';

// Agent Lifecycle States
export const AgentLifecycleEnum = z.enum([
  'planned',     // Slot reserved for future agent; requirements/stories being gathered
  'development', // Agent is being developed or tested
  'operational', // Agent is or can be active and running
  'sunset'       // Agent is deprecated or decommissioned
]);

export type AgentLifecycle = z.infer<typeof AgentLifecycleEnum>;

// External Link Types
export const ExternalLinkTypeEnum = z.enum([
  'tracing',       // Agent execution tracing and observability
  'reputation',    // Agent quality and trust metrics
  'repository',    // Source code repository
  'monitoring',    // Runtime monitoring dashboards
  'documentation', // External documentation
  'ticketing',     // Issue tracking
  'other'          // Other links
]);

export type ExternalLinkType = z.infer<typeof ExternalLinkTypeEnum>;

// External Link Schema
export const ExternalLinkSchema = z.object({
  id: z.string().uuid(),
  type: ExternalLinkTypeEnum,
  label: z.string().min(1).max(100),
  url: z.string().url(),
});

export type ExternalLink = z.infer<typeof ExternalLinkSchema>;

// Planned Capability Priority
export const CapabilityPriorityEnum = z.enum([
  'must-have',
  'should-have',
  'nice-to-have'
]);

export type CapabilityPriority = z.infer<typeof CapabilityPriorityEnum>;

// Planned Capability Schema (for agents in planned state)
export const PlannedCapabilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priority: CapabilityPriorityEnum.optional(),
});

export type PlannedCapability = z.infer<typeof PlannedCapabilitySchema>;

// Agent Schema
export const AgentSchema = z.object({
  // Identity
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  identifier: z.string()
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/, {
      message: 'Identifier must start with lowercase letter and contain only lowercase letters, numbers, and hyphens'
    })
    .optional(),

  // Lifecycle
  lifecycleState: AgentLifecycleEnum,
  lifecycleNotes: z.string().max(1000).optional(),

  // Relationships
  agentStoryId: z.string().uuid().optional(), // Link to detailed agent story
  departmentId: z.string().uuid().optional(), // Organizational context

  // Capabilities (high-level summary for planned agents)
  plannedCapabilities: z.array(PlannedCapabilitySchema).optional(),

  // External Links
  externalLinks: z.array(ExternalLinkSchema).optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().optional(),
});

export type Agent = z.infer<typeof AgentSchema>;

// Helper to create an empty agent
export function createEmptyAgent(userId?: string): Agent {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    lifecycleState: 'planned',
    plannedCapabilities: [],
    externalLinks: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
  };
}

// Helper to create a planned capability
export function createPlannedCapability(
  name: string,
  description?: string,
  priority?: CapabilityPriority
): PlannedCapability {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    priority,
  };
}

// Helper to create an external link
export function createExternalLink(
  type: ExternalLinkType,
  label: string,
  url: string
): ExternalLink {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    url,
  };
}

// Lifecycle State Metadata
export const LIFECYCLE_STATE_METADATA = {
  planned: {
    label: 'Planned',
    description: 'Slot reserved for future agent; requirements/stories being gathered',
    color: 'blue',
    variant: 'default' as const,
  },
  development: {
    label: 'Development',
    description: 'Agent is being developed or tested',
    color: 'yellow',
    variant: 'secondary' as const,
  },
  operational: {
    label: 'Operational',
    description: 'Agent is or can be active and running',
    color: 'green',
    variant: 'default' as const,
  },
  sunset: {
    label: 'Sunset',
    description: 'Agent is deprecated or decommissioned',
    color: 'gray',
    variant: 'outline' as const,
  },
} as const;

// External Link Type Metadata
export const EXTERNAL_LINK_TYPE_METADATA = {
  tracing: {
    label: 'Tracing',
    description: 'Agent execution tracing and observability',
    icon: 'Activity',
  },
  reputation: {
    label: 'Reputation',
    description: 'Agent quality and trust metrics',
    icon: 'Star',
  },
  repository: {
    label: 'Repository',
    description: 'Source code repository',
    icon: 'GitBranch',
  },
  monitoring: {
    label: 'Monitoring',
    description: 'Runtime monitoring dashboards',
    icon: 'BarChart2',
  },
  documentation: {
    label: 'Documentation',
    description: 'External documentation',
    icon: 'FileText',
  },
  ticketing: {
    label: 'Ticketing',
    description: 'Issue tracking',
    icon: 'Ticket',
  },
  other: {
    label: 'Other',
    description: 'Other external links',
    icon: 'ExternalLink',
  },
} as const;

// Capability Priority Metadata
export const CAPABILITY_PRIORITY_METADATA = {
  'must-have': {
    label: 'Must Have',
    description: 'Essential capability required for the agent',
    color: 'red',
  },
  'should-have': {
    label: 'Should Have',
    description: 'Important capability that should be included',
    color: 'yellow',
  },
  'nice-to-have': {
    label: 'Nice to Have',
    description: 'Optional capability that would be beneficial',
    color: 'green',
  },
} as const;
