/**
 * Agent Filesystem Export Module
 *
 * Exports complete Agent Stories as portable filesystem structures
 * including agent.md, config.yaml, skills with prompts/tools/examples,
 * and memory configuration.
 */

import { AgentStory } from '@/lib/schemas/story';
import { Skill, generateSlug, isValidSlug } from '@/lib/schemas/skill';
import { exportToAgentSkills } from './agentskills';

// ============================================================================
// Types
// ============================================================================

export interface AgentExportOptions {
  /** Include skill directories (default: true) */
  includeSkills?: boolean;
  /** Include memory directory structure (default: true) */
  includeMemoryStructure?: boolean;
  /** Include shared tools directory (default: false) */
  includeSharedTools?: boolean;
  /** Include logs directory (default: false) */
  includeLogs?: boolean;
  /** Include skill examples (default: true) */
  includeExamples?: boolean;
  /** Include skill prompts (default: true) */
  includePrompts?: boolean;
  /** Include tool implementations (default: true) */
  includeToolImplementations?: boolean;
  /** Generate README.md (default: true) */
  generateReadme?: boolean;
  /** Include .gitkeep files (default: true) */
  includeGitkeep?: boolean;
  /** Validate AgentSkills.io compatibility (default: true) */
  validateAgentSkillsCompat?: boolean;
}

export interface ExportedFile {
  /** Relative path from agent root */
  path: string;
  /** File content */
  content: string;
  /** Is this binary content (base64)? */
  binary?: boolean;
}

export interface AgentExportResult {
  /** All exported files */
  files: ExportedFile[];
  /** Root directory name (agent identifier) */
  rootDir: string;
  /** Warnings during export */
  warnings: string[];
  /** Number of skills exported */
  skillCount: number;
  /** Total files exported */
  totalFiles: number;
  /** Estimated size in bytes */
  estimatedSize: number;
}

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<AgentExportOptions> = {
  includeSkills: true,
  includeMemoryStructure: true,
  includeSharedTools: false,
  includeLogs: false,
  includeExamples: true,
  includePrompts: true,
  includeToolImplementations: true,
  generateReadme: true,
  includeGitkeep: true,
  validateAgentSkillsCompat: true,
};

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export an Agent Story to a complete filesystem structure.
 */
export function exportAgentToFilesystem(
  story: AgentStory,
  options?: AgentExportOptions
): AgentExportResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const files: ExportedFile[] = [];
  const warnings: string[] = [];

  // Determine root directory name
  const rootDir = story.identifier || generateSlug(story.name) || 'agent';

  // Generate agent.md
  files.push({
    path: 'agent.md',
    content: generateAgentMd(story),
  });

  // Generate config.yaml
  files.push({
    path: 'config.yaml',
    content: generateAgentConfig(story),
  });

  // Generate README.md
  if (opts.generateReadme) {
    files.push({
      path: 'README.md',
      content: generateReadme(story),
    });
  }

  // Export skills
  let skillCount = 0;
  if (opts.includeSkills && story.skills?.length) {
    for (const skill of story.skills) {
      const skillFiles = exportSkillToFilesystem(skill, opts, warnings);
      files.push(...skillFiles);
      skillCount++;
    }
  }

  // Create memory structure
  if (opts.includeMemoryStructure) {
    // Memory config
    if (story.memory) {
      files.push({
        path: 'memory/config.yaml',
        content: generateMemoryConfig(story.memory),
      });
    }

    // Memory directories
    if (opts.includeGitkeep) {
      files.push({ path: 'memory/short_term/.gitkeep', content: '' });
      files.push({ path: 'memory/long_term/.gitkeep', content: '' });
    }
  }

  // Create shared tools structure
  if (opts.includeSharedTools) {
    files.push({
      path: 'shared/tools/__init__.py',
      content: '"""Shared tools module."""\n',
    });
    files.push({
      path: 'shared/tools/base_tool.py',
      content: generateBaseToolPy(),
    });
    if (story.purpose) {
      files.push({
        path: 'shared/prompts/system_prompt.md',
        content: generateSystemPrompt(story),
      });
    }
  }

  // Create logs directory
  if (opts.includeLogs && opts.includeGitkeep) {
    files.push({ path: 'logs/.gitkeep', content: '' });
  }

  // Calculate estimated size
  const estimatedSize = files.reduce((sum, f) => sum + f.content.length, 0);

  return {
    files,
    rootDir,
    warnings,
    skillCount,
    totalFiles: files.length,
    estimatedSize,
  };
}

// ============================================================================
// Agent File Generators
// ============================================================================

/**
 * Generate agent.md content
 */
function generateAgentMd(story: AgentStory): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`name: ${story.identifier || generateSlug(story.name)}`);
  lines.push(`version: "${story.version || '1.0'}"`);
  lines.push(`description: ${escapeYaml(story.purpose || story.name)}`);
  if (story.autonomyLevel) {
    lines.push(`autonomy: ${story.autonomyLevel}`);
  }
  lines.push(`created: ${story.createdAt}`);
  if (story.updatedAt !== story.createdAt) {
    lines.push(`updated: ${story.updatedAt}`);
  }
  lines.push('---');
  lines.push('');

  // Title
  lines.push(`# ${story.name}`);
  lines.push('');

  // Purpose section
  if (story.purpose) {
    lines.push('## Purpose');
    lines.push('');
    lines.push(story.purpose);
    lines.push('');
  }

  // Role section
  if (story.role) {
    lines.push('## Role');
    lines.push('');
    lines.push(story.role);
    lines.push('');
  }

  // Capabilities section
  if (story.skills?.length) {
    lines.push('## Capabilities');
    lines.push('');
    lines.push('This agent has the following skills:');
    for (const skill of story.skills) {
      const slug = skill.portability?.slug || generateSlug(skill.name);
      lines.push(`- [${skill.name}](skills/${slug}/SKILL.md) - ${skill.description.slice(0, 100)}`);
    }
    lines.push('');
  }

  // Human Interaction section
  if (story.humanInteraction) {
    lines.push('## Human Interaction');
    lines.push('');
    lines.push(`**Mode**: ${formatHumanInteractionMode(story.humanInteraction.mode)}`);
    if (story.humanInteraction.escalation) {
      lines.push(`- Escalation: ${story.humanInteraction.escalation.conditions}`);
      lines.push(`- Channel: ${story.humanInteraction.escalation.channel}`);
    }
    if (story.humanInteraction.checkpoints?.length) {
      lines.push('');
      lines.push('**Checkpoints**:');
      for (const cp of story.humanInteraction.checkpoints) {
        lines.push(`- ${cp.name}: ${cp.trigger} (${cp.type})`);
      }
    }
    lines.push('');
  }

  // Guardrails section
  if (story.guardrails?.length) {
    lines.push('## Guardrails');
    lines.push('');
    for (const g of story.guardrails) {
      lines.push(`- **${g.name}**: ${g.constraint}`);
    }
    lines.push('');
  }

  // Notes
  if (story.notes) {
    lines.push('## Notes');
    lines.push('');
    lines.push(story.notes);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate agent config.yaml
 */
function generateAgentConfig(story: AgentStory): string {
  const lines: string[] = [];

  lines.push('# Agent Configuration');
  lines.push(`version: "${story.version || '1.0'}"`);
  lines.push('');

  // Runtime (placeholder)
  lines.push('runtime:');
  lines.push('  framework: claude-agent-sdk');
  lines.push('  model: claude-sonnet-4-20250514');
  lines.push('  max_tokens: 4096');
  lines.push('');

  // Autonomy
  if (story.autonomyLevel) {
    lines.push('autonomy:');
    lines.push(`  level: ${story.autonomyLevel}`);
    lines.push('  escalation_threshold: 0.8');
    lines.push('');
  }

  // Human interaction
  if (story.humanInteraction) {
    lines.push('human_interaction:');
    lines.push(`  mode: ${story.humanInteraction.mode}`);
    if (story.humanInteraction.escalation) {
      lines.push('  escalation:');
      lines.push(`    conditions: ${escapeYaml(story.humanInteraction.escalation.conditions)}`);
      lines.push(`    channel: ${story.humanInteraction.escalation.channel}`);
    }
    if (story.humanInteraction.checkpoints?.length) {
      lines.push('  checkpoints:');
      for (const cp of story.humanInteraction.checkpoints) {
        lines.push(`    - name: ${cp.name}`);
        lines.push(`      trigger: ${escapeYaml(cp.trigger)}`);
        lines.push(`      type: ${cp.type}`);
        if (cp.timeout) {
          lines.push(`      timeout: ${cp.timeout}`);
        }
      }
    }
    lines.push('');
  }

  // Collaboration
  if (story.collaboration) {
    lines.push('collaboration:');
    lines.push(`  role: ${story.collaboration.role}`);
    if (story.collaboration.reportsTo) {
      lines.push(`  reports_to: ${story.collaboration.reportsTo}`);
    }
    if (story.collaboration.coordinates?.length) {
      lines.push('  coordinates:');
      for (const c of story.collaboration.coordinates) {
        lines.push(`    - agent: ${c.agent}`);
        lines.push(`      via: ${c.via}`);
        lines.push(`      for: ${escapeYaml(c.for)}`);
      }
    }
    if (story.collaboration.peers?.length) {
      lines.push('  peers:');
      for (const p of story.collaboration.peers) {
        lines.push(`    - agent: ${p.agent}`);
        lines.push(`      interaction: ${p.interaction}`);
      }
    }
    lines.push('');
  }

  // Memory
  if (story.memory) {
    lines.push('memory:');
    if (story.memory.working?.length) {
      lines.push('  working:');
      for (const w of story.memory.working) {
        lines.push(`    - ${escapeYaml(w)}`);
      }
    }
    if (story.memory.persistent?.length) {
      lines.push('  persistent:');
      for (const p of story.memory.persistent) {
        lines.push(`    - name: ${p.name}`);
        lines.push(`      type: ${p.type}`);
        lines.push(`      purpose: ${escapeYaml(p.purpose)}`);
        lines.push(`      updates: ${p.updates}`);
      }
    }
    if (story.memory.learning?.length) {
      lines.push('  learning:');
      for (const l of story.memory.learning) {
        lines.push(`    - type: ${l.type}`);
        lines.push(`      signal: ${escapeYaml(l.signal)}`);
      }
    }
    lines.push('');
  }

  // Guardrails
  if (story.guardrails?.length) {
    lines.push('guardrails:');
    for (const g of story.guardrails) {
      lines.push(`  - name: ${g.name}`);
      lines.push(`    constraint: ${escapeYaml(g.constraint)}`);
      lines.push(`    enforcement: ${g.enforcement || 'hard'}`);
    }
    lines.push('');
  }

  // Tags
  if (story.tags?.length) {
    lines.push('tags:');
    for (const tag of story.tags) {
      lines.push(`  - ${tag}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate memory config.yaml
 */
function generateMemoryConfig(memory: NonNullable<AgentStory['memory']>): string {
  const lines: string[] = [];

  lines.push('# Memory Configuration');
  lines.push('');

  lines.push('short_term:');
  lines.push('  type: session');
  lines.push('  max_items: 100');
  lines.push('  ttl: 1h');
  lines.push('');

  lines.push('long_term:');
  if (memory.persistent?.length) {
    lines.push('  stores:');
    for (const store of memory.persistent) {
      lines.push(`    - name: ${store.name}`);
      lines.push(`      type: ${store.type}`);
      lines.push(`      purpose: ${escapeYaml(store.purpose)}`);
      lines.push(`      update_mode: ${store.updates}`);
    }
  } else {
    lines.push('  stores: []');
  }
  lines.push('');

  if (memory.learning?.length) {
    lines.push('learning:');
    for (const learn of memory.learning) {
      lines.push(`  - type: ${learn.type}`);
      lines.push(`    signal: ${escapeYaml(learn.signal)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate README.md
 */
function generateReadme(story: AgentStory): string {
  const lines: string[] = [];

  lines.push(`# ${story.name}`);
  lines.push('');

  if (story.purpose) {
    lines.push(story.purpose);
    lines.push('');
  }

  lines.push('## Quick Start');
  lines.push('');
  lines.push('```bash');
  lines.push('# Install dependencies');
  lines.push('pip install -r requirements.txt  # or npm install');
  lines.push('');
  lines.push('# Run the agent');
  lines.push('python -m agent.main  # or npm start');
  lines.push('```');
  lines.push('');

  lines.push('## Structure');
  lines.push('');
  lines.push('```');
  lines.push(`${story.identifier || generateSlug(story.name)}/`);
  lines.push('├── agent.md          # Agent definition');
  lines.push('├── config.yaml       # Configuration');
  if (story.skills?.length) {
    lines.push('├── skills/           # Agent capabilities');
    for (const skill of story.skills.slice(0, 3)) {
      const slug = skill.portability?.slug || generateSlug(skill.name);
      lines.push(`│   └── ${slug}/`);
    }
    if (story.skills.length > 3) {
      lines.push(`│   └── ... (${story.skills.length - 3} more)`);
    }
  }
  lines.push('├── memory/           # Memory configuration');
  lines.push('└── README.md         # This file');
  lines.push('```');
  lines.push('');

  if (story.skills?.length) {
    lines.push('## Skills');
    lines.push('');
    lines.push('| Skill | Description |');
    lines.push('|-------|-------------|');
    for (const skill of story.skills) {
      const slug = skill.portability?.slug || generateSlug(skill.name);
      lines.push(`| [${skill.name}](skills/${slug}/SKILL.md) | ${skill.description.slice(0, 60)}... |`);
    }
    lines.push('');
  }

  lines.push('## Configuration');
  lines.push('');
  lines.push('See `config.yaml` for runtime settings including:');
  lines.push('- Model selection');
  lines.push('- Autonomy level');
  lines.push('- Human interaction mode');
  lines.push('- Memory configuration');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push(`*Generated by Agent Stories on ${new Date().toISOString().split('T')[0]}*`);

  return lines.join('\n');
}

// ============================================================================
// Skill Export
// ============================================================================

/**
 * Export a single skill to filesystem files
 */
function exportSkillToFilesystem(
  skill: Skill,
  opts: Required<AgentExportOptions>,
  warnings: string[]
): ExportedFile[] {
  const files: ExportedFile[] = [];
  const slug = skill.portability?.slug || generateSlug(skill.name);
  const skillDir = `skills/${slug}`;

  // Validate slug
  if (opts.validateAgentSkillsCompat && !isValidSlug(slug)) {
    warnings.push(`Skill "${skill.name}" has invalid slug "${slug}"`);
  }

  // Generate SKILL.md using existing agentskills export
  try {
    const agentSkillsResult = exportToAgentSkills(skill, { generateMissingSlug: true });
    files.push({
      path: `${skillDir}/SKILL.md`,
      content: agentSkillsResult.skillMd,
    });
    warnings.push(...agentSkillsResult.warnings.map(w => `[${skill.name}] ${w}`));
  } catch (error) {
    warnings.push(`Failed to export SKILL.md for "${skill.name}": ${error}`);
    // Fallback to basic SKILL.md
    files.push({
      path: `${skillDir}/SKILL.md`,
      content: generateBasicSkillMd(skill),
    });
  }

  // Generate skill config.yaml
  files.push({
    path: `${skillDir}/config.yaml`,
    content: generateSkillConfig(skill),
  });

  // Export prompts
  if (opts.includePrompts && skill.prompts?.length) {
    for (const prompt of skill.prompts) {
      files.push({
        path: `${skillDir}/prompts/${prompt.name}.md`,
        content: generatePromptFile(prompt),
      });
    }
  } else if (opts.includePrompts && opts.includeGitkeep) {
    files.push({ path: `${skillDir}/prompts/.gitkeep`, content: '' });
  }

  // Export tool implementations
  if (opts.includeToolImplementations && skill.toolImplementations?.length) {
    for (const impl of skill.toolImplementations) {
      files.push({
        path: `${skillDir}/tools/${impl.filename}`,
        content: impl.content,
      });
    }
  } else if (opts.includeToolImplementations && opts.includeGitkeep) {
    files.push({ path: `${skillDir}/tools/.gitkeep`, content: '' });
  }

  // Export examples
  if (opts.includeExamples && skill.examples?.length) {
    for (const example of skill.examples) {
      files.push({
        path: `${skillDir}/examples/${example.name}.md`,
        content: example.content,
      });
    }
  } else if (opts.includeExamples && opts.includeGitkeep) {
    files.push({ path: `${skillDir}/examples/.gitkeep`, content: '' });
  }

  // Export templates
  if (skill.templates?.length) {
    for (const template of skill.templates) {
      files.push({
        path: `${skillDir}/templates/${template.filename}`,
        content: template.content,
      });
    }
  }

  return files;
}

/**
 * Generate skill config.yaml
 */
function generateSkillConfig(skill: Skill): string {
  const lines: string[] = [];

  lines.push('# Skill Configuration');
  lines.push('version: "1.0"');
  lines.push('');

  // Triggers
  if (skill.triggers?.length) {
    lines.push('triggers:');
    for (const trigger of skill.triggers) {
      lines.push(`  - type: ${trigger.type}`);
      lines.push(`    description: ${escapeYaml(trigger.description)}`);
      if (trigger.conditions?.length) {
        lines.push('    conditions:');
        for (const c of trigger.conditions) {
          lines.push(`      - ${escapeYaml(c)}`);
        }
      }
    }
    lines.push('');
  }

  // Behavior
  if (skill.behavior) {
    lines.push('behavior:');
    lines.push(`  model: ${skill.behavior.model}`);
    if (skill.behavior.model === 'sequential' && skill.behavior.steps) {
      lines.push('  steps:');
      for (const step of skill.behavior.steps) {
        lines.push(`    - ${escapeYaml(step)}`);
      }
    }
    lines.push('');
  }

  // Reasoning
  if (skill.reasoning) {
    lines.push('reasoning:');
    lines.push(`  strategy: ${skill.reasoning.strategy}`);
    if (skill.reasoning.confidence) {
      lines.push(`  confidence_threshold: ${skill.reasoning.confidence.threshold}`);
      lines.push(`  fallback: ${skill.reasoning.confidence.fallbackAction}`);
    }
    lines.push('');
  }

  // Tools
  if (skill.tools?.length) {
    lines.push('tools:');
    for (const tool of skill.tools) {
      lines.push(`  - name: ${tool.name}`);
      lines.push(`    required: ${tool.required}`);
      lines.push(`    permissions: [${tool.permissions.join(', ')}]`);
    }
    lines.push('');
  }

  // Acceptance
  if (skill.acceptance) {
    lines.push('acceptance:');
    lines.push('  success_conditions:');
    for (const c of skill.acceptance.successConditions) {
      lines.push(`    - ${escapeYaml(c)}`);
    }
    if (skill.acceptance.qualityMetrics?.length) {
      lines.push('  quality_metrics:');
      for (const m of skill.acceptance.qualityMetrics) {
        lines.push(`    ${m.name}: ${escapeYaml(m.target)}`);
      }
    }
    lines.push('');
  }

  // Guardrails
  if (skill.guardrails?.length) {
    lines.push('guardrails:');
    for (const g of skill.guardrails) {
      lines.push(`  - name: ${g.name}`);
      lines.push(`    constraint: ${escapeYaml(g.constraint)}`);
      lines.push(`    enforcement: ${g.enforcement}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate a basic SKILL.md without the full agentskills export
 */
function generateBasicSkillMd(skill: Skill): string {
  const slug = skill.portability?.slug || generateSlug(skill.name);
  const lines: string[] = [];

  lines.push('---');
  lines.push(`name: ${slug}`);
  lines.push(`description: ${escapeYaml(skill.description)}`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${skill.name}`);
  lines.push('');
  lines.push(skill.description);

  return lines.join('\n');
}

/**
 * Generate a prompt file
 */
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
      lines.push(`    required: ${input.required}`);
      if (input.description) {
        lines.push(`    description: ${escapeYaml(input.description)}`);
      }
    }
  }
  if (prompt.outputs?.length) {
    lines.push('outputs:');
    for (const output of prompt.outputs) {
      lines.push(`  - name: ${output.name}`);
      lines.push(`    type: ${output.type}`);
      if (output.description) {
        lines.push(`    description: ${escapeYaml(output.description)}`);
      }
    }
  }
  lines.push('---');
  lines.push('');

  // Title and description
  lines.push(`# ${prompt.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`);
  lines.push('');
  lines.push(prompt.description);
  lines.push('');

  // Content
  lines.push(prompt.content);

  return lines.join('\n');
}

// ============================================================================
// Helper Generators
// ============================================================================

/**
 * Generate base_tool.py template
 */
function generateBaseToolPy(): string {
  return `"""Base class for agent tools."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class ToolResult:
    """Result from a tool execution."""
    success: bool
    data: Any
    error: Optional[str] = None


class BaseTool(ABC):
    """Abstract base class for all tools."""

    name: str
    description: str

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """Execute the tool with given arguments."""
        pass

    def validate_inputs(self, **kwargs) -> Optional[str]:
        """Validate inputs before execution. Return error message if invalid."""
        return None
`;
}

/**
 * Generate system prompt from story
 */
function generateSystemPrompt(story: AgentStory): string {
  const lines: string[] = [];

  lines.push(`# ${story.name} System Prompt`);
  lines.push('');
  lines.push('You are an AI agent with the following characteristics:');
  lines.push('');

  if (story.purpose) {
    lines.push('## Purpose');
    lines.push(story.purpose);
    lines.push('');
  }

  if (story.role) {
    lines.push('## Role');
    lines.push(story.role);
    lines.push('');
  }

  if (story.guardrails?.length) {
    lines.push('## Constraints');
    for (const g of story.guardrails) {
      lines.push(`- ${g.name}: ${g.constraint}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Download Functions
// ============================================================================

/**
 * Download agent as ZIP file
 */
export async function downloadAgentZip(
  story: AgentStory,
  options?: AgentExportOptions
): Promise<void> {
  const result = exportAgentToFilesystem(story, options);

  // Dynamic import JSZip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Create root folder
  const rootFolder = zip.folder(result.rootDir);
  if (!rootFolder) {
    throw new Error('Failed to create root folder in ZIP');
  }

  // Add all files
  for (const file of result.files) {
    if (file.binary) {
      rootFolder.file(file.path, file.content, { base64: true });
    } else {
      rootFolder.file(file.path, file.content);
    }
  }

  // Generate and download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.rootDir}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get filesystem tree preview
 */
export function getFilesystemPreview(result: AgentExportResult): string {
  const lines: string[] = [`${result.rootDir}/`];

  // Group files by directory
  const dirs = new Map<string, string[]>();
  for (const file of result.files) {
    const parts = file.path.split('/');
    const filename = parts.pop()!;
    const dir = parts.join('/') || '.';

    if (!dirs.has(dir)) {
      dirs.set(dir, []);
    }
    dirs.get(dir)!.push(filename);
  }

  // Build tree
  const sortedDirs = [...dirs.keys()].sort();
  for (const dir of sortedDirs) {
    const files = dirs.get(dir)!.sort();
    const prefix = dir === '.' ? '├── ' : `│   └── ${dir}/\n│       ├── `;

    if (dir === '.') {
      for (let i = 0; i < files.length; i++) {
        const isLast = i === files.length - 1;
        lines.push(`${isLast ? '└── ' : '├── '}${files[i]}`);
      }
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Escape string for YAML
 */
function escapeYaml(str: string): string {
  if (/[:\n"'#\[\]{}|>&*!?]/.test(str) || str.includes('\n')) {
    return `"${str.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  return str;
}

/**
 * Format human interaction mode for display
 */
function formatHumanInteractionMode(mode: string): string {
  const modes: Record<string, string> = {
    in_the_loop: 'In the loop (human approval for every decision)',
    on_the_loop: 'On the loop (human monitors, intervenes on exceptions)',
    out_of_loop: 'Out of loop (fully autonomous within boundaries)',
  };
  return modes[mode] || mode;
}
