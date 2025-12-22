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
  // Capabilities required to perform this responsibility (the lingua franca)
  requiredCapabilityIds: z.array(z.string().uuid()).optional().default([]),
  // Legacy: Skill domains required (kept for backwards compatibility)
  requiredSkillDomains: z.array(z.string()).optional().default([])
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
    requiredCapabilityIds: [],
    requiredSkillDomains: []
  };
}

// ============================================
// Skill Coverage Analysis
// ============================================

export interface SkillCoverageResult {
  responsibilityId: string;
  responsibilityName: string;
  requiredSkills: string[];
  coveredSkills: string[];
  missingSkills: string[];
  coveragePercent: number;
  isCovered: boolean;
}

export interface RoleSkillCoverage {
  roleId: string;
  totalAiCandidates: number;
  fullyCovered: number;
  partiallyCovered: number;
  notCovered: number;
  overallCoveragePercent: number;
  responsibilities: SkillCoverageResult[];
}

/**
 * Analyzes skill coverage for a responsibility given available skills
 */
export function analyzeResponsibilitySkillCoverage(
  responsibility: Responsibility,
  availableSkills: string[]
): SkillCoverageResult {
  const requiredSkills = responsibility.requiredSkillDomains || [];
  const coveredSkills = requiredSkills.filter(skill => availableSkills.includes(skill));
  const missingSkills = requiredSkills.filter(skill => !availableSkills.includes(skill));
  const coveragePercent = requiredSkills.length > 0
    ? Math.round((coveredSkills.length / requiredSkills.length) * 100)
    : 100;

  return {
    responsibilityId: responsibility.id,
    responsibilityName: responsibility.name,
    requiredSkills,
    coveredSkills,
    missingSkills,
    coveragePercent,
    isCovered: missingSkills.length === 0
  };
}

/**
 * Analyzes skill coverage for all AI-candidate responsibilities in a role
 */
export function analyzeRoleSkillCoverage(
  role: Role,
  availableSkills: string[]
): RoleSkillCoverage {
  const aiCandidates = role.responsibilities.filter(r => r.aiCandidate);
  const coverageResults = aiCandidates.map(r =>
    analyzeResponsibilitySkillCoverage(r, availableSkills)
  );

  const fullyCovered = coverageResults.filter(r => r.isCovered).length;
  const partiallyCovered = coverageResults.filter(r => !r.isCovered && r.coveragePercent > 0).length;
  const notCovered = coverageResults.filter(r => r.coveragePercent === 0 && r.requiredSkills.length > 0).length;

  const overallCoveragePercent = coverageResults.length > 0
    ? Math.round(coverageResults.reduce((sum, r) => sum + r.coveragePercent, 0) / coverageResults.length)
    : 100;

  return {
    roleId: role.id,
    totalAiCandidates: aiCandidates.length,
    fullyCovered,
    partiallyCovered,
    notCovered,
    overallCoveragePercent,
    responsibilities: coverageResults
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
