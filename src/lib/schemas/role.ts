import { z } from 'zod';

// ============================================
// Role Schema
// ============================================

// A responsibility within a role
export const ResponsibilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  // Indicates if this responsibility is a good candidate for AI assistance
  aiCandidate: z.boolean().default(false),
  // Skill domains required to perform this responsibility (when AI-assisted)
  requiredSkillDomains: z.array(z.string()).default([])
});

export type Responsibility = z.infer<typeof ResponsibilitySchema>;

// Role definition
export const RoleSchema = z.object({
  id: z.string().uuid(),
  departmentId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),

  // List of responsibilities that define this role
  responsibilities: z.array(ResponsibilitySchema).default([]),

  // Skills/domains required (maps to skill domains from agent stories)
  requiredSkillDomains: z.array(z.string()).optional(),

  // Role level/seniority (optional, for filtering/grouping)
  level: z.enum(['entry', 'mid', 'senior', 'lead', 'manager', 'director', 'executive']).optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Role = z.infer<typeof RoleSchema>;

// ============================================
// Helper Functions
// ============================================

export function createEmptyRole(departmentId: string): Role {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    departmentId,
    name: '',
    responsibilities: [],
    createdAt: now,
    updatedAt: now
  };
}

export function createEmptyResponsibility(): Responsibility {
  return {
    id: crypto.randomUUID(),
    name: '',
    aiCandidate: false,
    requiredSkillDomains: []
  };
}

// ============================================
// Metadata for UI
// ============================================

export const ROLE_LEVEL_METADATA = {
  entry: {
    label: 'Entry Level',
    description: 'New to the field, learning fundamentals'
  },
  mid: {
    label: 'Mid Level',
    description: 'Independent contributor with solid experience'
  },
  senior: {
    label: 'Senior',
    description: 'Expert contributor, mentors others'
  },
  lead: {
    label: 'Lead',
    description: 'Technical leadership, guides team direction'
  },
  manager: {
    label: 'Manager',
    description: 'People management, team performance'
  },
  director: {
    label: 'Director',
    description: 'Department leadership, strategy'
  },
  executive: {
    label: 'Executive',
    description: 'C-level, organizational leadership'
  }
} as const;
