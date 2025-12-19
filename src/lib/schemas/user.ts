import { z } from 'zod';
import { AutonomyLevelEnum } from './story';

// User roles
export const UserRoleEnum = z.enum([
  'owner',
  'admin',
  'editor',
  'viewer'
]);

export type UserRole = z.infer<typeof UserRoleEnum>;

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional()
});

export type User = z.infer<typeof UserSchema>;

// Organization schema
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  plan: z.enum(['free', 'team', 'enterprise']),
  createdAt: z.string().datetime(),
  settings: z.object({
    defaultAutonomyLevel: AutonomyLevelEnum.optional(),
    requireApprovalForFull: z.boolean().default(false),
    allowedExportFormats: z.array(z.enum(['markdown', 'json', 'pdf'])).optional()
  }).optional()
});

export type Organization = z.infer<typeof OrganizationSchema>;

// Organization member schema
export const OrganizationMemberSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: UserRoleEnum,
  joinedAt: z.string().datetime()
});

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

// User role metadata for UI
export const USER_ROLE_METADATA = {
  owner: {
    label: 'Owner',
    description: 'Full access to organization settings'
  },
  admin: {
    label: 'Admin',
    description: 'Manage users and settings'
  },
  editor: {
    label: 'Editor',
    description: 'Create and edit stories'
  },
  viewer: {
    label: 'Viewer',
    description: 'View stories only'
  }
} as const;
