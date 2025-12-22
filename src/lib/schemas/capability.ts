import { z } from 'zod';

// ============================================
// Capability Schema
// ============================================
// Capability is the lingua franca - the shared vocabulary that connects
// organizational requirements (what responsibilities need) with
// agent/human offerings (what they can provide).

export const CapabilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),

  // Optional domain categorization (e.g., "Recruiting", "Customer Service")
  domain: z.string().max(100).optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Capability = z.infer<typeof CapabilitySchema>;

// ============================================
// Capability Gap Schema
// ============================================
// Tracks capabilities that are required by the organization
// but not yet available from any agent or person.

export const CapabilityGapStatusEnum = z.enum([
  'open',        // Gap identified, not being addressed
  'in_progress', // Agent story being developed
  'resolved'     // Capability now available
]);

export type CapabilityGapStatus = z.infer<typeof CapabilityGapStatusEnum>;

export const CapabilityDemandSourceSchema = z.object({
  roleId: z.string().uuid(),
  roleName: z.string().optional(),
  responsibilityId: z.string().uuid(),
  responsibilityName: z.string().optional()
});

export type CapabilityDemandSource = z.infer<typeof CapabilityDemandSourceSchema>;

export const CapabilityGapSchema = z.object({
  id: z.string().uuid(),
  capabilityId: z.string().uuid(),

  // Which responsibilities need this capability
  demandingSources: z.array(CapabilityDemandSourceSchema),

  status: CapabilityGapStatusEnum,

  // When resolved, which agent story provides it
  resolvedByAgentStoryId: z.string().uuid().optional(),
  resolvedBySkillId: z.string().uuid().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type CapabilityGap = z.infer<typeof CapabilityGapSchema>;

// ============================================
// Helper Functions
// ============================================

export function createEmptyCapability(): Capability {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    createdAt: now,
    updatedAt: now
  };
}

export function createCapability(
  name: string,
  description?: string,
  domain?: string
): Capability {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    description,
    domain,
    createdAt: now,
    updatedAt: now
  };
}

// ============================================
// Analysis Types
// ============================================

export interface CapabilityDemand {
  capability: Capability;
  sources: CapabilityDemandSource[];
}

export interface CapabilitySupply {
  capability: Capability;
  agents: Array<{
    storyId: string;
    storyName: string;
    skillId: string;
    skillName: string;
  }>;
  people: Array<{
    personId: string;
    personName: string;
  }>;
}

export interface CapabilityAnalysis {
  capability: Capability;
  demand: CapabilityDemandSource[];
  supply: {
    agents: Array<{
      storyId: string;
      storyName: string;
      skillId: string;
      skillName: string;
    }>;
    people: Array<{
      personId: string;
      personName: string;
    }>;
  };
  isMatched: boolean;  // Has at least one supplier
  isGap: boolean;      // Has demand but no supply
}

// ============================================
// Metadata for UI
// ============================================

export const CAPABILITY_GAP_STATUS_METADATA = {
  open: {
    label: 'Open',
    description: 'Gap identified, not being addressed',
    color: 'red',
    icon: 'alert-circle'
  },
  in_progress: {
    label: 'In Progress',
    description: 'Agent story being developed',
    color: 'yellow',
    icon: 'loader'
  },
  resolved: {
    label: 'Resolved',
    description: 'Capability now available',
    color: 'green',
    icon: 'check-circle'
  }
} as const;

// Common capability domains for UI suggestions
export const CAPABILITY_DOMAINS = [
  'Recruiting',
  'Customer Service',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
  'Engineering',
  'Product',
  'Legal',
  'HR',
  'Data & Analytics',
  'IT Support'
] as const;
