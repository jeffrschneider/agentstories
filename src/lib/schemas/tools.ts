import { z } from 'zod';

// Tool permission levels
export const ToolPermissionEnum = z.enum([
  'read',
  'write',
  'execute',
  'admin'
]);

export type ToolPermission = z.infer<typeof ToolPermissionEnum>;

// Skill-owned tool declaration
export const SkillToolSchema = z.object({
  name: z.string().min(1).describe('Tool or MCP Server name'),
  purpose: z.string().min(1).describe('Why this skill uses this tool'),
  permissions: z.array(ToolPermissionEnum).min(1),
  required: z.boolean().default(true).describe('Is this tool mandatory for skill execution?'),
  conditions: z.string().optional().describe('When/how tool is used')
});

export type SkillTool = z.infer<typeof SkillToolSchema>;

// Skills tools collection
export const SkillToolsSchema = z.array(SkillToolSchema);

export type SkillTools = z.infer<typeof SkillToolsSchema>;

// Tool permission metadata for UI
export const TOOL_PERMISSION_METADATA = {
  read: {
    label: 'Read',
    description: 'Read-only access',
    icon: 'Eye'
  },
  write: {
    label: 'Write',
    description: 'Can create and update data',
    icon: 'Edit'
  },
  execute: {
    label: 'Execute',
    description: 'Can execute actions',
    icon: 'Play'
  },
  admin: {
    label: 'Admin',
    description: 'Full administrative access',
    icon: 'Shield'
  }
} as const;
