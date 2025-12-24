/**
 * AgentSkills.io Export Module
 *
 * Converts agentstories Skill objects into AgentSkills.io compatible format.
 * See: https://agentskills.io/specification
 */

import {
  Skill,
  generateSlug,
  isValidSlug,
} from '@/lib/schemas/skill';

// ============================================================================
// Types
// ============================================================================

export interface AgentSkillsExportOptions {
  /** Include scripts in export (default: true) */
  includeScripts?: boolean;
  /** Include references in export (default: true) */
  includeReferences?: boolean;
  /** Auto-generate slug if missing (default: true) */
  generateMissingSlug?: boolean;
}

export interface ExportedFile {
  filename: string;
  content: string;
}

export interface AgentSkillsExportResult {
  /** The SKILL.md content */
  skillMd: string;
  /** Scripts to be placed in scripts/ directory */
  scripts: ExportedFile[];
  /** References to be placed in references/ directory */
  references: ExportedFile[];
  /** Warnings generated during export */
  warnings: string[];
  /** The determined slug for directory naming */
  slug: string;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export a skill to AgentSkills.io format.
 *
 * @param skill - The skill to export
 * @param options - Export options
 * @returns The exported SKILL.md content, scripts, references, and warnings
 * @throws Error if the skill cannot be exported (invalid or missing slug)
 */
export function exportToAgentSkills(
  skill: Skill,
  options: AgentSkillsExportOptions = {}
): AgentSkillsExportResult {
  const opts: Required<AgentSkillsExportOptions> = {
    includeScripts: true,
    includeReferences: true,
    generateMissingSlug: true,
    ...options,
  };

  const warnings: string[] = [];

  // Determine slug
  let slug = skill.portability?.slug;
  if (!slug && opts.generateMissingSlug) {
    slug = generateSlug(skill.name);
    warnings.push(`Generated slug "${slug}" from skill name`);
  }
  if (!slug) {
    throw new Error(`Missing slug for skill "${skill.name}". Configure portability settings or enable generateMissingSlug.`);
  }
  if (!isValidSlug(slug)) {
    throw new Error(`Invalid slug "${slug}" for skill "${skill.name}". Must be lowercase alphanumeric with hyphens.`);
  }

  // Build frontmatter
  const frontmatter = buildFrontmatter(skill, slug);

  // Build body
  const body = buildMarkdownBody(skill);

  // Combine into SKILL.md
  const skillMd = `---\n${frontmatter}---\n\n${body}`;

  // Collect scripts
  const scripts: ExportedFile[] = [];
  if (opts.includeScripts && skill.portability?.scripts) {
    for (const script of skill.portability.scripts) {
      if (script.content) {
        scripts.push({
          filename: script.filename,
          content: script.content,
        });
      }
    }
  }

  // Collect references
  const references: ExportedFile[] = [];
  if (opts.includeReferences && skill.portability?.references) {
    for (const ref of skill.portability.references) {
      if (ref.content) {
        references.push({
          filename: ref.filename,
          content: ref.content,
        });
      }
    }
  }

  return { skillMd, scripts, references, warnings, slug };
}

// ============================================================================
// Frontmatter Builder
// ============================================================================

function buildFrontmatter(skill: Skill, slug: string): string {
  const lines: string[] = [];

  // Required fields
  lines.push(`name: ${slug}`);
  lines.push(`description: ${escapeYaml(skill.description.slice(0, 1024))}`);

  // Optional portability fields
  if (skill.portability?.license) {
    lines.push(`license: ${skill.portability.license}`);
  }

  if (skill.portability?.compatibility) {
    lines.push(`compatibility: ${escapeYaml(skill.portability.compatibility)}`);
  }

  // Build allowed-tools from our tools array
  if (skill.tools?.length) {
    const toolSlugs = skill.tools
      .map((t) => generateSlug(t.name))
      .join(' ');
    lines.push(`allowed-tools: ${toolSlugs}`);
  }

  // Add our extended fields as metadata
  lines.push('metadata:');
  lines.push(`  domain: ${skill.domain}`);
  lines.push(`  acquired: ${skill.acquired}`);
  if (skill.id) {
    lines.push(`  source-id: ${skill.id}`);
  }

  return lines.join('\n') + '\n';
}

// ============================================================================
// Markdown Body Builder
// ============================================================================

function buildMarkdownBody(skill: Skill): string {
  const sections: string[] = [];

  // Title (human-readable name)
  sections.push(`# ${skill.name}\n`);
  sections.push(`${skill.description}\n`);

  // Triggers section
  if (skill.triggers?.length) {
    sections.push('## Triggers\n');
    for (const trigger of skill.triggers) {
      sections.push(`- **${trigger.type}**: ${trigger.description}`);
      if (trigger.conditions?.length) {
        sections.push(`  - Conditions: ${trigger.conditions.join(', ')}`);
      }
      if (trigger.examples?.length) {
        sections.push(`  - Examples: ${trigger.examples.join(', ')}`);
      }
    }
    sections.push('');
  }

  // Inputs/Outputs section
  if (skill.inputs?.length || skill.outputs?.length) {
    sections.push('## Interface\n');

    if (skill.inputs?.length) {
      sections.push('### Inputs\n');
      sections.push('| Name | Type | Required | Description |');
      sections.push('|------|------|----------|-------------|');
      for (const input of skill.inputs) {
        const required = input.required !== false ? 'Yes' : 'No';
        sections.push(`| ${input.name} | ${input.type} | ${required} | ${input.description} |`);
      }
      sections.push('');
    }

    if (skill.outputs?.length) {
      sections.push('### Outputs\n');
      sections.push('| Name | Type | Description |');
      sections.push('|------|------|-------------|');
      for (const output of skill.outputs) {
        sections.push(`| ${output.name} | ${output.type} | ${output.description} |`);
      }
      sections.push('');
    }
  }

  // Behavior section
  if (skill.behavior) {
    sections.push('## Behavior\n');
    sections.push(`**Model**: ${skill.behavior.model}\n`);

    switch (skill.behavior.model) {
      case 'sequential':
        sections.push('### Steps\n');
        skill.behavior.steps.forEach((step, i) => {
          sections.push(`${i + 1}. ${step}`);
        });
        sections.push('');
        break;

      case 'workflow':
        sections.push('### Stages\n');
        for (const stage of skill.behavior.stages) {
          sections.push(`#### ${stage.name}\n`);
          sections.push(`${stage.purpose}\n`);
          if (stage.actions?.length) {
            sections.push('Actions:');
            stage.actions.forEach((a) => sections.push(`- ${a}`));
          }
          if (stage.transitions?.length) {
            sections.push('\nTransitions:');
            stage.transitions.forEach((t) => sections.push(`- → ${t.to} when ${t.when}`));
          }
          sections.push('');
        }
        break;

      case 'adaptive':
        sections.push('### Capabilities\n');
        skill.behavior.capabilities.forEach((c) => sections.push(`- ${c}`));
        if (skill.behavior.selectionStrategy) {
          sections.push(`\n**Selection Strategy**: ${skill.behavior.selectionStrategy}`);
        }
        sections.push('');
        break;

      case 'iterative':
        sections.push('### Iteration\n');
        sections.push('**Body**:');
        skill.behavior.body.forEach((b) => sections.push(`- ${b}`));
        sections.push(`\n**Terminates when**: ${skill.behavior.terminationCondition}`);
        if (skill.behavior.maxIterations) {
          sections.push(`**Max iterations**: ${skill.behavior.maxIterations}`);
        }
        sections.push('');
        break;
    }
  }

  // Tools section
  if (skill.tools?.length) {
    sections.push('## Tools\n');
    sections.push('| Tool | Purpose | Permissions |');
    sections.push('|------|---------|-------------|');
    for (const tool of skill.tools) {
      sections.push(`| ${tool.name} | ${tool.purpose} | ${tool.permissions.join(', ')} |`);
    }
    sections.push('');
  }

  // Reasoning section
  if (skill.reasoning) {
    sections.push('## Reasoning\n');
    sections.push(`**Strategy**: ${skill.reasoning.strategy}\n`);

    if (skill.reasoning.decisionPoints?.length) {
      sections.push('### Decision Points\n');
      for (const dp of skill.reasoning.decisionPoints) {
        sections.push(`#### ${dp.name}\n`);
        sections.push(`- **Inputs**: ${dp.inputs.join(', ')}`);
        sections.push(`- **Approach**: ${dp.approach}`);
        if (dp.outcomes?.length) {
          sections.push(`- **Outcomes**: ${dp.outcomes.join(', ')}`);
        }
        sections.push('');
      }
    }

    if (skill.reasoning.retry) {
      sections.push('### Retry Configuration\n');
      sections.push(`- Max attempts: ${skill.reasoning.retry.maxAttempts}`);
      sections.push(`- Backoff: ${skill.reasoning.retry.backoffStrategy}`);
      if (skill.reasoning.retry.retryOn?.length) {
        sections.push(`- Retry on: ${skill.reasoning.retry.retryOn.join(', ')}`);
      }
      sections.push('');
    }
  }

  // Acceptance criteria section
  if (skill.acceptance) {
    sections.push('## Success Criteria\n');

    sections.push('### Conditions\n');
    skill.acceptance.successConditions.forEach((c) => sections.push(`- ${c}`));
    sections.push('');

    if (skill.acceptance.qualityMetrics?.length) {
      sections.push('### Quality Metrics\n');
      sections.push('| Metric | Target |');
      sections.push('|--------|--------|');
      for (const m of skill.acceptance.qualityMetrics) {
        sections.push(`| ${m.name} | ${m.target} |`);
      }
      sections.push('');
    }

    if (skill.acceptance.timeout) {
      sections.push(`**Timeout**: ${skill.acceptance.timeout}\n`);
    }
  }

  // Failure handling section
  if (skill.failureHandling) {
    sections.push('## Error Handling\n');

    if (skill.failureHandling.modes?.length) {
      sections.push('### Failure Modes\n');
      for (const mode of skill.failureHandling.modes) {
        const escalateNote = mode.escalate ? ' *(escalate)*' : '';
        sections.push(`- **${mode.condition}**: ${mode.recovery}${escalateNote}`);
      }
      sections.push('');
    }

    if (skill.failureHandling.defaultFallback) {
      sections.push(`**Default fallback**: ${skill.failureHandling.defaultFallback}\n`);
    }
  }

  // Guardrails section
  if (skill.guardrails?.length) {
    sections.push('## Guardrails\n');
    for (const g of skill.guardrails) {
      sections.push(`### ${g.name}\n`);
      sections.push(`- **Constraint**: ${g.constraint}`);
      sections.push(`- **Enforcement**: ${g.enforcement}`);
      if (g.onViolation) {
        sections.push(`- **On violation**: ${g.onViolation}`);
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Escape a string for YAML frontmatter.
 * Wraps in quotes if it contains special characters.
 */
function escapeYaml(str: string): string {
  // If string contains YAML special chars, wrap in quotes
  if (/[:\n"'#\[\]{}|>&*!?]/.test(str) || str.includes('\n')) {
    // Use double quotes and escape internal quotes
    return `"${str.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  return str;
}

/**
 * Generate a downloadable SKILL.md file.
 */
export function downloadSkillMd(skill: Skill, options?: AgentSkillsExportOptions): void {
  const result = exportToAgentSkills(skill, options);

  const blob = new Blob([result.skillMd], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SKILL.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a ZIP file containing the full skill directory structure.
 * Requires JSZip library.
 */
export async function downloadSkillZip(
  skill: Skill,
  options?: AgentSkillsExportOptions
): Promise<void> {
  const result = exportToAgentSkills(skill, options);

  // Dynamic import JSZip to avoid bundling if not needed
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Create skill directory
  const skillDir = zip.folder(result.slug);
  if (!skillDir) {
    throw new Error('Failed to create skill directory in ZIP');
  }

  // Add SKILL.md
  skillDir.file('SKILL.md', result.skillMd);

  // Add scripts
  if (result.scripts.length > 0) {
    const scriptsDir = skillDir.folder('scripts');
    if (scriptsDir) {
      for (const script of result.scripts) {
        scriptsDir.file(script.filename, script.content);
      }
    }
  }

  // Add references
  if (result.references.length > 0) {
    const refsDir = skillDir.folder('references');
    if (refsDir) {
      for (const ref of result.references) {
        refsDir.file(ref.filename, ref.content);
      }
    }
  }

  // Generate and download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.slug}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
