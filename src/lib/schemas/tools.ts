import { z } from 'zod';

// Tool permission levels
export const ToolPermissionEnum = z.enum([
  'read',
  'write',
  'execute',
  'admin'
]);

export type ToolPermission = z.infer<typeof ToolPermissionEnum>;

// Tool schema
export const ToolSchema = z.object({
  name: z.string().min(1).describe('Tool or MCP Server name'),
  purpose: z.string().min(1).describe('Why the agent uses this tool'),
  permissions: z.array(ToolPermissionEnum).min(1),
  conditions: z.string().optional().describe('When tool is available/used')
});

export type Tool = z.infer<typeof ToolSchema>;

// Tools collection
export const ToolsSchema = z.array(ToolSchema);

export type Tools = z.infer<typeof ToolsSchema>;

// Tool permission metadata for UI
export const TOOL_PERMISSION_METADATA = {
  read: {
    label: 'Read',
    description: 'Read-only access'
  },
  write: {
    label: 'Write',
    description: 'Can create and update data'
  },
  execute: {
    label: 'Execute',
    description: 'Can execute actions'
  },
  admin: {
    label: 'Admin',
    description: 'Full administrative access'
  }
} as const;
