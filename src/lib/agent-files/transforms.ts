/**
 * Transform between AgentStory and AgentFiles
 */

import type { AgentStory } from '@/lib/schemas/story';
import type { Skill } from '@/lib/schemas/skill';
import type { AgentFile, AgentFileSystem } from './types';
import { generateSlug, inferFileType } from './types';

// ============================================================================
// Story → Files (Serialization)
// ============================================================================

export function storyToFiles(story: AgentStory): AgentFile[] {
  const files: AgentFile[] = [];
  const now = story.updatedAt || new Date().toISOString();

  // agent.md - Core agent definition and behavior
  files.push({
    path: 'agent.md',
    content: generateAgentMd(story),
    type: 'agents',
    lastModified: now,
  });

  // config.yaml - Agent configuration settings
  files.push({
    path: 'config.yaml',
    content: generateAgentConfig(story),
    type: 'config',
    lastModified: now,
  });

  // Directory structure with placeholders
  // skills/ folder
  files.push({
    path: 'skills/.gitkeep',
    content: '',
    type: 'unknown',
    lastModified: now,
  });

  // memory/ folder structure
  files.push({
    path: 'memory/short_term/.gitkeep',
    content: '',
    type: 'unknown',
    lastModified: now,
  });

  files.push({
    path: 'memory/long_term/.gitkeep',
    content: '',
    type: 'unknown',
    lastModified: now,
  });

  // tools/ folder (agent-level tools)
  files.push({
    path: 'tools/.gitkeep',
    content: '',
    type: 'unknown',
    lastModified: now,
  });

  // logs/ folder
  files.push({
    path: 'logs/.gitkeep',
    content: '',
    type: 'unknown',
    lastModified: now,
  });

  // Skill files for each skill
  for (const skill of story.skills || []) {
    const slug = generateSlug(skill.name);
    const skillDir = `skills/${slug}`;

    // SKILL.md - Skill documentation and usage (required per Agent Skills spec)
    files.push({
      path: `${skillDir}/SKILL.md`,
      content: generateSkillMd(skill),
      type: 'skill',
      lastModified: now,
    });

    // config.yaml - Skill-specific settings (our extension)
    files.push({
      path: `${skillDir}/config.yaml`,
      content: generateSkillConfig(skill),
      type: 'skill-config',
      lastModified: now,
    });

    // scripts/ folder - executable code (Agent Skills spec)
    const scripts = skill.portability?.scripts || [];
    if (scripts.length) {
      for (const script of scripts) {
        files.push({
          path: `${skillDir}/scripts/${script.filename}`,
          content: script.content || '',
          type: 'script',
          lastModified: now,
        });
      }
    } else {
      files.push({
        path: `${skillDir}/scripts/.gitkeep`,
        content: '',
        type: 'unknown',
        lastModified: now,
      });
    }

    // references/ folder - additional documentation (Agent Skills spec)
    const references = skill.portability?.references || [];
    if (references.length) {
      for (const ref of references) {
        files.push({
          path: `${skillDir}/references/${ref.filename}`,
          content: ref.content || '',
          type: 'reference',
          lastModified: now,
        });
      }
    } else {
      files.push({
        path: `${skillDir}/references/.gitkeep`,
        content: '',
        type: 'unknown',
        lastModified: now,
      });
    }

    // assets/ folder - static resources (Agent Skills spec)
    const assets = skill.portability?.assets || [];
    if (assets.length) {
      for (const asset of assets) {
        files.push({
          path: `${skillDir}/assets/${asset.filename}`,
          content: asset.content || '',
          type: 'asset',
          lastModified: now,
        });
      }
    } else {
      files.push({
        path: `${skillDir}/assets/.gitkeep`,
        content: '',
        type: 'unknown',
        lastModified: now,
      });
    }
  }

  // MCP config if any skills have tools
  const allTools = (story.skills || []).flatMap(s => s.tools || []);
  if (allTools.length > 0) {
    files.push({
      path: 'tools/mcp-servers.json',
      content: generateMcpConfig(allTools),
      type: 'mcp-config',
      lastModified: now,
    });
  }

  return files;
}

export function storyToFileSystem(story: AgentStory): AgentFileSystem {
  return {
    id: story.id,
    name: story.name,
    files: storyToFiles(story),
    metadata: {
      version: story.version,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      createdBy: story.createdBy,
    },
  };
}

// ============================================================================
// Files → Story (Deserialization)
// ============================================================================

export function filesToStory(
  fileSystem: AgentFileSystem
): AgentStory {
  // Look for agent.md (new format) or AGENTS.md (legacy format)
  const agentFile = fileSystem.files.find(f => f.path === 'agent.md')
    || fileSystem.files.find(f => f.path === 'AGENTS.md');
  const skillFiles = fileSystem.files.filter(f => f.type === 'skill');

  const agent = agentFile ? parseAgentMd(agentFile.content) : {};
  const skills = skillFiles.map(f => parseSkillMd(f.content, f.path));

  return {
    id: fileSystem.id,
    version: fileSystem.metadata.version,
    createdAt: fileSystem.metadata.createdAt,
    updatedAt: fileSystem.metadata.updatedAt,
    createdBy: fileSystem.metadata.createdBy,
    name: agent.name || fileSystem.name || 'Untitled Agent',
    ...agent,
    skills,
  };
}

// ============================================================================
// agent.md Generation
// ============================================================================

export function generateAgentMd(story: AgentStory): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${story.name || 'Untitled Agent'}`);
  lines.push('');

  // Purpose
  if (story.purpose) {
    lines.push('## Purpose');
    lines.push(story.purpose);
    lines.push('');
  }

  // Autonomy
  if (story.autonomyLevel) {
    lines.push('## Autonomy');
    lines.push(formatAutonomy(story.autonomyLevel));
    lines.push('');
  }

  // Role
  if (story.role) {
    lines.push('## Role');
    lines.push(story.role);
    lines.push('');
  }

  // Guardrails
  if (story.guardrails?.length) {
    lines.push('## Guardrails');
    for (const g of story.guardrails) {
      lines.push(`- **${g.name}**: ${g.constraint}`);
    }
    lines.push('');
  }

  // Human Interaction
  if (story.humanInteraction) {
    lines.push('## Human Interaction');
    if (story.humanInteraction.mode) {
      lines.push(`- Mode: ${story.humanInteraction.mode}`);
    }
    if (story.humanInteraction.escalation) {
      lines.push(`- Escalation: ${story.humanInteraction.escalation.channel || 'default'}`);
    }
    lines.push('');
  }

  // Collaboration
  if (story.collaboration) {
    lines.push('## Collaboration');
    if (story.collaboration.role) {
      lines.push(`- Role: ${story.collaboration.role}`);
    }
    if (story.collaboration.reportsTo) {
      lines.push(`- Reports to: ${story.collaboration.reportsTo}`);
    }
    if (story.collaboration.peers?.length) {
      lines.push(`- Peers: ${story.collaboration.peers.map(p => p.agent).join(', ')}`);
    }
    lines.push('');
  }

  // Memory
  if (story.memory) {
    lines.push('## Memory');
    if (story.memory.persistent?.length) {
      for (const p of story.memory.persistent) {
        lines.push(`- ${p.name} (${p.type}): ${p.purpose}`);
      }
    }
    if (story.memory.learning?.length) {
      lines.push(`- Learning: ${story.memory.learning.map(l => l.type).join(', ')}`);
    }
    lines.push('');
  }

  // Tags
  if (story.tags?.length) {
    lines.push('## Tags');
    lines.push(story.tags.join(', '));
    lines.push('');
  }

  // Notes
  if (story.notes) {
    lines.push('## Notes');
    lines.push(story.notes);
    lines.push('');
  }

  return lines.join('\n');
}

function formatAutonomy(level: string): string {
  const descriptions: Record<string, string> = {
    full: 'Full - Complete decision authority with minimal oversight',
    supervised: 'Supervised - Operates independently, escalates edge cases',
    collaborative: 'Collaborative - Shared decision-making with humans',
    directed: 'Directed - Requires human approval for each action',
  };
  return descriptions[level] || level;
}

// ============================================================================
// config.yaml Generation (Agent-level)
// ============================================================================

export function generateAgentConfig(story: AgentStory): string {
  const lines: string[] = [];

  lines.push('# Agent Configuration');
  lines.push(`name: ${story.name || 'Untitled Agent'}`);
  lines.push(`identifier: ${story.identifier || generateSlug(story.name || 'untitled')}`);
  lines.push(`version: ${story.version || '1.0'}`);
  lines.push('');

  if (story.autonomyLevel) {
    lines.push(`autonomy_level: ${story.autonomyLevel}`);
  }

  if (story.humanInteraction?.mode) {
    lines.push('');
    lines.push('human_interaction:');
    lines.push(`  mode: ${story.humanInteraction.mode}`);
    if (story.humanInteraction.escalation) {
      lines.push('  escalation:');
      if (story.humanInteraction.escalation.conditions) {
        lines.push(`    conditions: "${story.humanInteraction.escalation.conditions}"`);
      }
      if (story.humanInteraction.escalation.channel) {
        lines.push(`    channel: ${story.humanInteraction.escalation.channel}`);
      }
    }
  }

  if (story.collaboration) {
    lines.push('');
    lines.push('collaboration:');
    if (story.collaboration.role) {
      lines.push(`  role: ${story.collaboration.role}`);
    }
    if (story.collaboration.reportsTo) {
      lines.push(`  reports_to: ${story.collaboration.reportsTo}`);
    }
  }

  if (story.memory) {
    lines.push('');
    lines.push('memory:');
    if (story.memory.working?.length) {
      lines.push('  working:');
      for (const item of story.memory.working) {
        lines.push(`    - "${item}"`);
      }
    }
    if (story.memory.persistent?.length) {
      lines.push('  persistent:');
      for (const p of story.memory.persistent) {
        lines.push(`    - name: ${p.name}`);
        lines.push(`      type: ${p.type}`);
        lines.push(`      purpose: "${p.purpose}"`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// agent.md Parsing
// ============================================================================

export function parseAgentMd(content: string): Partial<AgentStory> {
  const result: Partial<AgentStory> = {};

  // Parse title (H1)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    result.name = titleMatch[1].trim();
  }

  // Parse sections
  const sections = parseSections(content);

  if (sections.purpose) {
    result.purpose = sections.purpose.trim();
  }

  if (sections.autonomy) {
    result.autonomyLevel = parseAutonomyLevel(sections.autonomy);
  }

  if (sections.role) {
    result.role = sections.role.trim();
  }

  if (sections.guardrails) {
    result.guardrails = parseGuardrails(sections.guardrails);
  }

  if (sections.tags) {
    result.tags = sections.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (sections.notes) {
    result.notes = sections.notes.trim();
  }

  return result;
}

function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionRegex = /^##\s+(.+)$/gm;
  let match;
  let lastSection: { name: string; start: number } | null = null;

  while ((match = sectionRegex.exec(content)) !== null) {
    if (lastSection) {
      sections[lastSection.name.toLowerCase()] = content.slice(
        lastSection.start + match[0].length,
        match.index
      ).trim();
    }
    lastSection = {
      name: match[1],
      start: match.index,
    };
  }

  if (lastSection) {
    sections[lastSection.name.toLowerCase()] = content.slice(
      lastSection.start + lastSection.name.length + 3
    ).trim();
  }

  return sections;
}

function parseAutonomyLevel(text: string): AgentStory['autonomyLevel'] {
  const lower = text.toLowerCase();
  if (lower.includes('full')) return 'full';
  if (lower.includes('supervised')) return 'supervised';
  if (lower.includes('collaborative')) return 'collaborative';
  if (lower.includes('directed')) return 'directed';
  return 'supervised';
}

function parseGuardrails(text: string): AgentStory['guardrails'] {
  const lines = text.split('\n').filter(l => l.trim().startsWith('-'));
  return lines.map((line, i) => {
    const content = line.replace(/^-\s*/, '').trim();
    const boldMatch = content.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
    if (boldMatch) {
      return {
        name: boldMatch[1],
        constraint: boldMatch[2],
        enforcement: 'hard' as const,
      };
    }
    return {
      name: `Guardrail ${i + 1}`,
      constraint: content,
      enforcement: 'hard' as const,
    };
  });
}

// ============================================================================
// SKILL.md Generation
// ============================================================================

export function generateSkillMd(skill: Skill): string {
  const lines: string[] = [];

  // YAML frontmatter
  lines.push('---');
  lines.push(`name: ${generateSlug(skill.name)}`);
  lines.push(`description: ${skill.description || 'No description'}`);
  if (skill.domain) {
    lines.push(`domain: ${skill.domain}`);
  }
  if (skill.acquired) {
    lines.push(`acquired: ${skill.acquired}`);
  }
  lines.push('---');
  lines.push('');

  // Title
  lines.push(`# ${skill.name}`);
  lines.push('');

  // Triggers
  if (skill.triggers?.length) {
    lines.push('## Triggers');
    for (const trigger of skill.triggers) {
      lines.push(`- **${trigger.type}**: ${trigger.description}`);
      if (trigger.conditions?.length) {
        lines.push(`  - Conditions: ${trigger.conditions.join(', ')}`);
      }
    }
    lines.push('');
  }

  // Behavior
  if (skill.behavior) {
    lines.push('## Behavior');
    lines.push(`**Model**: ${skill.behavior.model}`);
    lines.push('');

    if (skill.behavior.model === 'sequential' && skill.behavior.steps) {
      lines.push('### Steps');
      skill.behavior.steps.forEach((step, i) => {
        lines.push(`${i + 1}. ${step}`);
      });
      lines.push('');
    }
  }

  // Tools
  if (skill.tools?.length) {
    lines.push('## Tools');
    for (const tool of skill.tools) {
      lines.push(`- **${tool.name}**: ${tool.purpose} [${tool.permissions.join(', ')}]`);
    }
    lines.push('');
  }

  // Acceptance
  if (skill.acceptance?.successConditions?.length) {
    lines.push('## Success Criteria');
    for (const condition of skill.acceptance.successConditions) {
      lines.push(`- ${condition}`);
    }
    lines.push('');
  }

  // Guardrails
  if (skill.guardrails?.length) {
    lines.push('## Guardrails');
    for (const g of skill.guardrails) {
      lines.push(`- **${g.name}**: ${g.constraint}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// SKILL.md Parsing
// ============================================================================

export function parseSkillMd(content: string, path: string): Skill {
  // Parse frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  let frontmatter: Record<string, string> = {};
  let body = content;

  if (frontmatterMatch) {
    // Simple YAML parsing for frontmatter
    const yamlLines = frontmatterMatch[1].split('\n');
    for (const line of yamlLines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        frontmatter[key] = value;
      }
    }
    body = frontmatterMatch[2];
  }

  // Parse title from body
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const name = titleMatch?.[1] || frontmatter.name || path.split('/').slice(-2, -1)[0] || 'Untitled Skill';

  // Parse sections
  const sections = parseSections(body);

  // Build skill
  const skill: Skill = {
    id: crypto.randomUUID(),
    name,
    description: frontmatter.description || sections.description || '',
    domain: frontmatter.domain || 'General',
    acquired: (frontmatter.acquired as Skill['acquired']) || 'built_in',
    triggers: parseSkillTriggers(sections.triggers),
    acceptance: {
      successConditions: parseSuccessConditions(sections['success criteria']),
    },
  };

  // Parse behavior
  if (sections.behavior) {
    skill.behavior = parseSkillBehavior(sections.behavior);
  }

  // Parse tools
  if (sections.tools) {
    skill.tools = parseSkillTools(sections.tools);
  }

  // Parse guardrails
  if (sections.guardrails) {
    skill.guardrails = parseSkillGuardrails(sections.guardrails);
  }

  return skill;
}

function parseSkillTriggers(text?: string): Skill['triggers'] {
  if (!text) {
    return [{ type: 'manual', description: 'Manually triggered' }];
  }

  const lines = text.split('\n').filter(l => l.trim().startsWith('-'));
  return lines.map(line => {
    const content = line.replace(/^-\s*/, '').trim();
    const typeMatch = content.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
    if (typeMatch) {
      return {
        type: typeMatch[1].toLowerCase() as Skill['triggers'][0]['type'],
        description: typeMatch[2],
      };
    }
    return {
      type: 'manual' as const,
      description: content,
    };
  });
}

function parseSuccessConditions(text?: string): string[] {
  if (!text) return ['Task completed successfully'];

  const lines = text.split('\n').filter(l => l.trim().startsWith('-'));
  return lines.map(l => l.replace(/^-\s*/, '').trim());
}

function parseSkillBehavior(text: string): Skill['behavior'] {
  const modelMatch = text.match(/\*\*Model\*\*:\s*(\w+)/i);
  const model = modelMatch?.[1]?.toLowerCase() || 'sequential';

  if (model === 'sequential') {
    const stepsMatch = text.match(/###\s*Steps\n([\s\S]*?)(?=\n##|$)/);
    if (stepsMatch) {
      const steps = stepsMatch[1]
        .split('\n')
        .filter(l => /^\d+\./.test(l.trim()))
        .map(l => l.replace(/^\d+\.\s*/, '').trim());
      return { model: 'sequential', steps };
    }
  }

  return { model: 'sequential', steps: ['Execute task'] };
}

function parseSkillTools(text: string): Skill['tools'] {
  const lines = text.split('\n').filter(l => l.trim().startsWith('-'));
  return lines.map(line => {
    const content = line.replace(/^-\s*/, '').trim();
    const match = content.match(/^\*\*(.+?)\*\*:\s*(.+?)(?:\s*\[(.+?)\])?$/);
    if (match) {
      const permissions = match[3]?.split(',').map(p => p.trim() as 'read' | 'write' | 'execute') || ['execute'];
      return {
        name: match[1],
        purpose: match[2],
        permissions,
        required: true,
      };
    }
    return {
      name: content,
      purpose: 'Tool',
      permissions: ['execute' as const],
      required: true,
    };
  });
}

function parseSkillGuardrails(text: string): Skill['guardrails'] {
  const lines = text.split('\n').filter(l => l.trim().startsWith('-'));
  return lines.map((line, i) => {
    const content = line.replace(/^-\s*/, '').trim();
    const match = content.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
    if (match) {
      return {
        name: match[1],
        constraint: match[2],
        enforcement: 'hard' as const,
      };
    }
    return {
      name: `Constraint ${i + 1}`,
      constraint: content,
      enforcement: 'hard' as const,
    };
  });
}

// ============================================================================
// MCP Config Generation
// ============================================================================

interface Tool {
  name: string;
  purpose: string;
  permissions: string[];
}

function generateMcpConfig(tools: Tool[]): string {
  const config = {
    mcpServers: tools.reduce((acc, tool) => {
      acc[generateSlug(tool.name)] = {
        purpose: tool.purpose,
        permissions: tool.permissions,
      };
      return acc;
    }, {} as Record<string, { purpose: string; permissions: string[] }>),
  };
  return JSON.stringify(config, null, 2);
}

// ============================================================================
// Skill Config Generation
// ============================================================================

export function generateSkillConfig(skill: Skill): string {
  const lines: string[] = [];

  lines.push('# Skill Configuration');
  lines.push(`name: ${generateSlug(skill.name)}`);
  lines.push(`domain: ${skill.domain || 'General'}`);
  lines.push(`acquired: ${skill.acquired || 'built_in'}`);
  lines.push('');

  // Triggers
  if (skill.triggers?.length) {
    lines.push('triggers:');
    for (const trigger of skill.triggers) {
      lines.push(`  - type: ${trigger.type}`);
      lines.push(`    description: "${trigger.description || ''}"`);
      if (trigger.conditions?.length) {
        lines.push('    conditions:');
        for (const c of trigger.conditions) {
          lines.push(`      - "${c}"`);
        }
      }
    }
    lines.push('');
  }

  // Behavior
  if (skill.behavior) {
    lines.push('behavior:');
    lines.push(`  model: ${skill.behavior.model}`);
    if (skill.behavior.model === 'sequential' && skill.behavior.steps?.length) {
      lines.push('  steps:');
      for (const step of skill.behavior.steps) {
        lines.push(`    - "${step}"`);
      }
    }
    lines.push('');
  }

  // Tools
  if (skill.tools?.length) {
    lines.push('tools:');
    for (const tool of skill.tools) {
      lines.push(`  - name: ${tool.name}`);
      lines.push(`    purpose: "${tool.purpose}"`);
      lines.push(`    required: ${tool.required}`);
      lines.push(`    permissions: [${tool.permissions.join(', ')}]`);
    }
    lines.push('');
  }

  // Acceptance
  if (skill.acceptance?.successConditions?.length) {
    lines.push('acceptance:');
    lines.push('  success_conditions:');
    for (const c of skill.acceptance.successConditions) {
      lines.push(`    - "${c}"`);
    }
    if (skill.acceptance.qualityMetrics?.length) {
      lines.push('  quality_metrics:');
      for (const m of skill.acceptance.qualityMetrics) {
        lines.push(`    - name: ${m.name}`);
        lines.push(`      target: "${m.target}"`);
      }
    }
    lines.push('');
  }

  // Guardrails
  if (skill.guardrails?.length) {
    lines.push('guardrails:');
    for (const g of skill.guardrails) {
      lines.push(`  - name: ${g.name}`);
      lines.push(`    constraint: "${g.constraint}"`);
      lines.push(`    enforcement: ${g.enforcement}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Prompt File Generation
// ============================================================================

function generatePromptFile(prompt: NonNullable<Skill['prompts']>[0]): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`name: ${prompt.name}`);
  if (prompt.inputs?.length) {
    lines.push('inputs:');
    for (const input of prompt.inputs) {
      lines.push(`  - name: ${input.name}`);
      lines.push(`    type: ${input.type}`);
      lines.push(`    required: ${input.required ?? true}`);
      if (input.description) {
        lines.push(`    description: "${input.description}"`);
      }
    }
  }
  if (prompt.outputs?.length) {
    lines.push('outputs:');
    for (const output of prompt.outputs) {
      lines.push(`  - name: ${output.name}`);
      lines.push(`    type: ${output.type}`);
      if (output.description) {
        lines.push(`    description: "${output.description}"`);
      }
    }
  }
  lines.push('---');
  lines.push('');

  // Title
  const title = prompt.name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  lines.push(`# ${title}`);
  lines.push('');

  // Description
  lines.push(prompt.description);
  lines.push('');

  // Content
  lines.push(prompt.content);

  return lines.join('\n');
}
