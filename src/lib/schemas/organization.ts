import { z } from 'zod';

// ============================================
// Business Domain Schema
// ============================================

export const BusinessDomainSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type BusinessDomain = z.infer<typeof BusinessDomainSchema>;

// ============================================
// Department Schema
// ============================================

export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  domainId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  managerId: z.string().uuid().optional(), // Links to Person
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Department = z.infer<typeof DepartmentSchema>;

// ============================================
// Helper Functions
// ============================================

export function createEmptyDomain(): BusinessDomain {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    createdAt: now,
    updatedAt: now
  };
}

export function createEmptyDepartment(domainId: string): Department {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    domainId,
    name: '',
    createdAt: now,
    updatedAt: now
  };
}

// ============================================
// Metadata for UI
// ============================================

// Common business domains for suggestions/templates
export const COMMON_BUSINESS_DOMAINS = [
  { name: 'Customer Service', description: 'Customer support, success, and experience' },
  { name: 'Sales', description: 'Sales development, account management, revenue' },
  { name: 'Marketing', description: 'Brand, demand generation, content, analytics' },
  { name: 'Engineering', description: 'Software development, infrastructure, QA' },
  { name: 'Product', description: 'Product management, design, research' },
  { name: 'Operations', description: 'Business operations, logistics, supply chain' },
  { name: 'Finance', description: 'Accounting, FP&A, treasury, tax' },
  { name: 'Human Resources', description: 'Recruiting, people ops, L&D, compensation' },
  { name: 'Legal', description: 'Contracts, compliance, IP, corporate' },
  { name: 'IT', description: 'IT support, security, infrastructure' }
] as const;
