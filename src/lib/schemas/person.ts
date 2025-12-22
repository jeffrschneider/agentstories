import { z } from 'zod';

// ============================================
// Person Schema
// ============================================

// Role assignment - links a person to a role with allocation
export const RoleAssignmentSchema = z.object({
  roleId: z.string().uuid(),
  // Percentage of time allocated to this role (for people wearing multiple hats)
  allocation: z.number().min(0).max(100).default(100),
  // When this assignment started
  startDate: z.string().datetime().optional(),
  // Primary role flag (one role should be primary)
  isPrimary: z.boolean().default(false)
});

export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>;

// Person (employee) schema
export const PersonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  title: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),

  // Primary department (for org chart purposes)
  departmentId: z.string().uuid(),

  // Role assignments - supports multiple roles ("wearing many hats")
  roleAssignments: z.array(RoleAssignmentSchema).default([]),

  // Capabilities this person has (the lingua franca)
  capabilityIds: z.array(z.string().uuid()).optional().default([]),

  // Legacy: Skills this person has (maps to skill domains)
  // Kept for backwards compatibility
  skills: z.array(z.string()).optional().default([]),

  // Employment status
  status: z.enum(['active', 'inactive', 'onboarding', 'offboarding']).default('active'),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Person = z.infer<typeof PersonSchema>;

// ============================================
// Helper Functions
// ============================================

export function createEmptyPerson(departmentId: string): Person {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    email: '',
    departmentId,
    roleAssignments: [],
    capabilityIds: [],
    skills: [],
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
}

export function createRoleAssignment(roleId: string, isPrimary = false): RoleAssignment {
  return {
    roleId,
    allocation: 100,
    isPrimary
  };
}

// ============================================
// Metadata for UI
// ============================================

export const PERSON_STATUS_METADATA = {
  active: {
    label: 'Active',
    description: 'Currently employed and working',
    color: 'green'
  },
  inactive: {
    label: 'Inactive',
    description: 'Not currently active (leave, etc.)',
    color: 'gray'
  },
  onboarding: {
    label: 'Onboarding',
    description: 'New hire in onboarding process',
    color: 'blue'
  },
  offboarding: {
    label: 'Offboarding',
    description: 'In offboarding process',
    color: 'yellow'
  }
} as const;
