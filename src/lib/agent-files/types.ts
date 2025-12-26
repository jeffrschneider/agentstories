/**
 * Agent Files - Virtual file system representation for agents
 */

export type AgentFileType =
  | 'agents'
  | 'skill'
  | 'skill-config'
  | 'prompt'
  | 'tool-impl'
  | 'example'
  | 'template'
  | 'mcp-config'
  | 'config'
  | 'unknown';

export interface AgentFile {
  path: string;           // e.g., "AGENTS.md", "skills/refunds/SKILL.md"
  content: string;        // File content (markdown, JSON)
  type: AgentFileType;
  lastModified: string;
}

export interface AgentFileSystem {
  id: string;
  name: string;
  files: AgentFile[];
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
  };
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  fileType?: AgentFileType;
}

/**
 * Infer file type from path
 */
export function inferFileType(path: string): AgentFileType {
  if (path === 'AGENTS.md' || path === 'agent.md') {
    return 'agents';
  }
  if (path.startsWith('skills/') && path.endsWith('/SKILL.md')) {
    return 'skill';
  }
  if (path.startsWith('skills/') && path.endsWith('/config.yaml')) {
    return 'skill-config';
  }
  if (path.startsWith('skills/') && path.includes('/prompts/')) {
    return 'prompt';
  }
  if (path.startsWith('skills/') && path.includes('/tools/')) {
    return 'tool-impl';
  }
  if (path.startsWith('skills/') && path.includes('/examples/')) {
    return 'example';
  }
  if (path.startsWith('skills/') && path.includes('/templates/')) {
    return 'template';
  }
  if (path.startsWith('skills/') && path.endsWith('.md')) {
    return 'skill';
  }
  if (path === 'tools/mcp-servers.json' || path.includes('mcp')) {
    return 'mcp-config';
  }
  if (path.startsWith('.agentstories/')) {
    return 'config';
  }
  return 'unknown';
}

/**
 * Build a tree structure from flat file list
 */
export function buildFileTree(files: AgentFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      let existing = currentLevel.find(n => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isLast ? 'file' : 'folder',
          children: isLast ? undefined : [],
          fileType: isLast ? file.type : undefined,
        };
        currentLevel.push(existing);
      }

      if (!isLast && existing.children) {
        currentLevel = existing.children;
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }).map(node => ({
      ...node,
      children: node.children ? sortNodes(node.children) : undefined,
    }));
  };

  return sortNodes(root);
}

/**
 * Generate a valid slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
}

/**
 * Convert slug back to title case name
 */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
