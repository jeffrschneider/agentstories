# AgentSkills.io Compatibility Specification

## Overview

This specification defines how agentstories integrates with the [AgentSkills.io](https://agentskills.io) open standard. We adopt a **superset approach**: our skill schema includes all agentskills.io required fields while retaining our richer modeling capabilities.

### Goals

1. **Import**: Load agentskills.io SKILL.md files into agentstories
2. **Export**: Generate valid agentskills.io skill directories from our skills
3. **Round-trip**: Import → edit → export without data loss for agentskills.io fields

### Non-Goals

- Replacing our rich skill modeling with agentskills.io's minimal schema
- Auto-syncing with external skill repositories (future consideration)

---

## AgentSkills.io Format Summary

### Directory Structure

```
skill-name/
├── SKILL.md          # Required - YAML frontmatter + markdown instructions
├── scripts/          # Optional - executable code
├── references/       # Optional - additional documentation
└── assets/           # Optional - supporting files
```

### SKILL.md Frontmatter Schema

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-64 chars; lowercase alphanumeric + hyphens; no leading/trailing/consecutive hyphens |
| `description` | string | Yes | 1-1024 chars |
| `license` | string | No | License name or bundled file reference |
| `compatibility` | string | No | 1-500 chars; environment requirements |
| `metadata` | object | No | String key-value pairs for custom properties |
| `allowed-tools` | string | No | Space-delimited pre-approved tool list (experimental) |

### Body Content

Freeform markdown following frontmatter. Recommended sections include procedures, input/output examples, and edge case handling.

---

## Schema Changes

### New Fields on Skill

Add the following fields to `SkillSchema` in `/lib/schemas/skill.ts`:

```typescript
// AgentSkills.io compatibility fields
export const AgentSkillsPortabilitySchema = z.object({
  // Required by agentskills.io
  slug: z.string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, {
      message: 'Must be lowercase alphanumeric with single hyphens, no leading/trailing hyphens'
    })
    .describe('AgentSkills.io compatible name (kebab-case)'),

  // Optional agentskills.io fields
  license: z.string()
    .max(100)
    .optional()
    .describe('SPDX license identifier or custom license name'),

  compatibility: z.string()
    .max(500)
    .optional()
    .describe('Environment requirements (e.g., "Python 3.10+, Node 18+")'),

  // References to additional files
  scripts: z.array(z.object({
    filename: z.string().min(1),
    language: z.enum(['python', 'bash', 'javascript', 'typescript']),
    purpose: z.string().min(1),
    content: z.string().optional().describe('Inline script content, if not external file')
  })).optional(),

  references: z.array(z.object({
    filename: z.string().min(1),
    title: z.string().min(1),
    content: z.string().optional().describe('Inline reference content, if not external file')
  })).optional()
});

export type AgentSkillsPortability = z.infer<typeof AgentSkillsPortabilitySchema>;
```

### Updated Skill Schema

```typescript
export const SkillSchema = z.object({
  // Existing identity fields
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1).max(1024), // Updated: max 1024 for agentskills.io
  domain: z.string().min(1),
  acquired: SkillAcquisitionEnum,

  // NEW: AgentSkills.io portability
  portability: AgentSkillsPortabilitySchema.optional(),

  // Existing interface fields
  triggers: z.array(SkillTriggerSchema).min(1),
  inputs: z.array(SkillInputSchema).optional(),
  outputs: z.array(SkillOutputSchema).optional(),

  // Existing resources
  tools: z.array(SkillToolSchema).optional(),

  // Existing execution
  behavior: SkillBehaviorSchema.optional(),
  reasoning: SkillReasoningSchema.optional(),

  // Existing success & failure
  acceptance: SkillAcceptanceCriteriaSchema,
  failureHandling: SkillFailureHandlingSchema.optional(),

  // Existing constraints
  guardrails: z.array(SkillGuardrailSchema).optional()
});
```

### Helper Functions

```typescript
/**
 * Generate a valid agentskills.io slug from a skill name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .replace(/-{2,}/g, '-')        // Collapse consecutive hyphens
    .slice(0, 64);                 // Truncate to max length
}

/**
 * Validate a slug against agentskills.io requirements
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug) && slug.length <= 64;
}

/**
 * Check if a skill has complete agentskills.io portability data
 */
export function hasPortabilityData(skill: Skill): boolean {
  return !!(skill.portability?.slug);
}

/**
 * Get portability completeness for UI indicator
 */
export function getPortabilityCompleteness(skill: Skill): {
  ready: boolean;
  missing: string[];
  optional: string[];
} {
  const missing: string[] = [];
  const optional: string[] = [];

  if (!skill.portability?.slug) {
    missing.push('slug');
  }

  if (!skill.portability?.license) {
    optional.push('license');
  }

  if (!skill.portability?.compatibility) {
    optional.push('compatibility');
  }

  return {
    ready: missing.length === 0,
    missing,
    optional
  };
}
```

---

## UI Changes

### Skill Editor: Portability Section

Add a new collapsible section to the skill editor, after the existing sections:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ▼ AgentSkills.io Portability                              [Auto-fill]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Slug *                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ticket-triage                                                       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ℹ️ Lowercase letters, numbers, and hyphens only (e.g., "data-analysis") │
│                                                                         │
│ License                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ MIT                                                          ▼      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ Common: MIT, Apache-2.0, BSD-3-Clause, proprietary                      │
│                                                                         │
│ Compatibility                                                           │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Requires access to Helpdesk API and Sentiment Analysis service      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ℹ️ Environment requirements, dependencies, or prerequisites             │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────── │
│                                                                         │
│ Scripts (0)                                                    [+ Add]  │
│ No scripts defined                                                      │
│                                                                         │
│ References (0)                                                 [+ Add]  │
│ No references defined                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Auto-fill Behavior

The `[Auto-fill]` button:
1. Generates `slug` from `skill.name` using `generateSlug()`
2. Derives `compatibility` from `skill.tools` (list tool names as requirements)
3. Does NOT auto-fill `license` (user must explicitly choose)

### Portability Indicator

Show a badge on skill cards in the skills list:

```
┌────────────────────────────────────────┐
│ Ticket Triage                          │
│ Customer Service • built_in            │
│                                        │
│ [AgentSkills Ready ✓]  or  [Not Portable] │
└────────────────────────────────────────┘
```

- **Green "AgentSkills Ready ✓"**: `portability.slug` is set and valid
- **Gray "Not Portable"**: Missing required portability data

---

## Export: AgentSkills.io Format

### Export Function

```typescript
// /lib/export/agentskills.ts

import { Skill } from '@/lib/schemas';
import { generateSlug, isValidSlug } from '@/lib/schemas/skill';

interface AgentSkillsExportOptions {
  includeScripts?: boolean;      // default: true
  includeReferences?: boolean;   // default: true
  generateMissingSlug?: boolean; // default: true
}

interface AgentSkillsExportResult {
  skillMd: string;               // SKILL.md content
  scripts: Array<{ filename: string; content: string }>;
  references: Array<{ filename: string; content: string }>;
  warnings: string[];
}

export function exportToAgentSkills(
  skill: Skill,
  options: AgentSkillsExportOptions = {}
): AgentSkillsExportResult {
  const opts = {
    includeScripts: true,
    includeReferences: true,
    generateMissingSlug: true,
    ...options
  };

  const warnings: string[] = [];

  // Determine slug
  let slug = skill.portability?.slug;
  if (!slug && opts.generateMissingSlug) {
    slug = generateSlug(skill.name);
    warnings.push(`Generated slug "${slug}" from skill name`);
  }
  if (!slug || !isValidSlug(slug)) {
    throw new Error(`Invalid or missing slug for skill "${skill.name}"`);
  }

  // Build frontmatter
  const frontmatter = buildFrontmatter(skill, slug);

  // Build body
  const body = buildMarkdownBody(skill);

  // Combine
  const skillMd = `---\n${frontmatter}---\n\n${body}`;

  // Collect scripts
  const scripts = opts.includeScripts && skill.portability?.scripts
    ? skill.portability.scripts
        .filter(s => s.content)
        .map(s => ({ filename: s.filename, content: s.content! }))
    : [];

  // Collect references
  const references = opts.includeReferences && skill.portability?.references
    ? skill.portability.references
        .filter(r => r.content)
        .map(r => ({ filename: r.filename, content: r.content! }))
    : [];

  return { skillMd, scripts, references, warnings };
}

function buildFrontmatter(skill: Skill, slug: string): string {
  const lines: string[] = [];

  lines.push(`name: ${slug}`);
  lines.push(`description: ${escapeYaml(skill.description.slice(0, 1024))}`);

  if (skill.portability?.license) {
    lines.push(`license: ${skill.portability.license}`);
  }

  if (skill.portability?.compatibility) {
    lines.push(`compatibility: ${escapeYaml(skill.portability.compatibility)}`);
  }

  // Build allowed-tools from our tools array
  if (skill.tools?.length) {
    const toolSlugs = skill.tools
      .map(t => generateSlug(t.name))
      .join(' ');
    lines.push(`allowed-tools: ${toolSlugs}`);
  }

  // Add our extended fields as metadata
  const metadata: Record<string, string> = {
    domain: skill.domain,
    acquired: skill.acquired
  };
  lines.push('metadata:');
  for (const [key, value] of Object.entries(metadata)) {
    lines.push(`  ${key}: ${value}`);
  }

  return lines.join('\n') + '\n';
}

function buildMarkdownBody(skill: Skill): string {
  const sections: string[] = [];

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
        sections.push(`| ${input.name} | ${input.type} | ${input.required !== false ? 'Yes' : 'No'} | ${input.description} |`);
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
        break;

      case 'workflow':
        sections.push('### Stages\n');
        for (const stage of skill.behavior.stages) {
          sections.push(`#### ${stage.name}\n`);
          sections.push(`${stage.purpose}\n`);
          if (stage.actions?.length) {
            sections.push('Actions:');
            stage.actions.forEach(a => sections.push(`- ${a}`));
          }
          if (stage.transitions?.length) {
            sections.push('\nTransitions:');
            stage.transitions.forEach(t => sections.push(`- → ${t.to} when ${t.when}`));
          }
          sections.push('');
        }
        break;

      case 'adaptive':
        sections.push('### Capabilities\n');
        skill.behavior.capabilities.forEach(c => sections.push(`- ${c}`));
        if (skill.behavior.selectionStrategy) {
          sections.push(`\n**Selection Strategy**: ${skill.behavior.selectionStrategy}`);
        }
        break;

      case 'iterative':
        sections.push('### Iteration\n');
        sections.push('**Body**:');
        skill.behavior.body.forEach(b => sections.push(`- ${b}`));
        sections.push(`\n**Terminates when**: ${skill.behavior.terminationCondition}`);
        if (skill.behavior.maxIterations) {
          sections.push(`**Max iterations**: ${skill.behavior.maxIterations}`);
        }
        break;
    }
    sections.push('');
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
    skill.acceptance.successConditions.forEach(c => sections.push(`- ${c}`));
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
        sections.push(`- **${mode.condition}**: ${mode.recovery}${mode.escalate ? ' (escalate)' : ''}`);
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
      sections.push(`**Constraint**: ${g.constraint}\n`);
      sections.push(`**Enforcement**: ${g.enforcement}\n`);
      if (g.onViolation) {
        sections.push(`**On violation**: ${g.onViolation}\n`);
      }
    }
  }

  return sections.join('\n');
}

function escapeYaml(str: string): string {
  if (/[:\n"']/.test(str)) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}
```

### Export UI Integration

Add "AgentSkills" as a format option in the skill export UI:

```typescript
type SkillExportFormat = 'json' | 'yaml' | 'agentskills';
```

For AgentSkills export:
- **Single file download**: Downloads SKILL.md directly
- **With scripts/references**: Downloads ZIP containing full directory structure

---

## Import: AgentSkills.io Format

### Import Function

```typescript
// /lib/import/agentskills.ts

import { Skill, SkillTrigger } from '@/lib/schemas';
import { parse as parseYaml } from 'yaml';

interface AgentSkillsImportResult {
  skill: Partial<Skill>;
  warnings: string[];
  scripts: Array<{ filename: string; content: string }>;
  references: Array<{ filename: string; content: string }>;
}

export function importFromAgentSkills(
  skillMd: string,
  scripts?: Array<{ filename: string; content: string }>,
  references?: Array<{ filename: string; content: string }>
): AgentSkillsImportResult {
  const warnings: string[] = [];

  // Parse frontmatter
  const frontmatterMatch = skillMd.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error('Invalid SKILL.md: missing YAML frontmatter');
  }

  const [, frontmatterStr, body] = frontmatterMatch;
  const frontmatter = parseYaml(frontmatterStr);

  // Build skill from frontmatter
  const skill: Partial<Skill> = {
    name: formatSlugAsName(frontmatter.name),
    description: frontmatter.description,
    domain: frontmatter.metadata?.domain || 'General',
    acquired: parseAcquired(frontmatter.metadata?.acquired),

    portability: {
      slug: frontmatter.name,
      license: frontmatter.license,
      compatibility: frontmatter.compatibility,
      scripts: scripts?.map(s => ({
        filename: s.filename,
        language: inferLanguage(s.filename),
        purpose: `Imported from ${s.filename}`,
        content: s.content
      })),
      references: references?.map(r => ({
        filename: r.filename,
        title: r.filename.replace(/\.[^.]+$/, ''),
        content: r.content
      }))
    },

    // Parse tools from allowed-tools
    tools: frontmatter['allowed-tools']
      ? frontmatter['allowed-tools'].split(' ').map((name: string) => ({
          name: formatSlugAsName(name),
          purpose: 'Imported from agentskills.io',
          permissions: ['execute' as const],
          required: true
        }))
      : undefined,

    // Default trigger (can be refined from body parsing)
    triggers: [{
      type: 'manual' as const,
      description: 'Imported skill - trigger not specified'
    }],

    // Default acceptance (can be refined from body parsing)
    acceptance: {
      successConditions: ['Skill execution completed']
    }
  };

  // Parse body sections to enrich skill data
  const parsedBody = parseMarkdownBody(body);

  if (parsedBody.triggers) {
    skill.triggers = parsedBody.triggers;
  }
  if (parsedBody.inputs) {
    skill.inputs = parsedBody.inputs;
  }
  if (parsedBody.outputs) {
    skill.outputs = parsedBody.outputs;
  }
  if (parsedBody.behavior) {
    skill.behavior = parsedBody.behavior;
  }
  if (parsedBody.acceptance) {
    skill.acceptance = parsedBody.acceptance;
  }
  if (parsedBody.guardrails) {
    skill.guardrails = parsedBody.guardrails;
  }

  // Add warning if we couldn't parse much from body
  if (!parsedBody.hasSections) {
    warnings.push('Could not parse structured sections from skill body - manual review recommended');
  }

  return { skill, warnings, scripts: scripts || [], references: references || [] };
}

function formatSlugAsName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseAcquired(value?: string): 'built_in' | 'learned' | 'delegated' {
  if (value === 'learned' || value === 'delegated') {
    return value;
  }
  return 'built_in';
}

function inferLanguage(filename: string): 'python' | 'bash' | 'javascript' | 'typescript' {
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.sh') || filename.endsWith('.bash')) return 'bash';
  if (filename.endsWith('.ts')) return 'typescript';
  return 'javascript';
}

function parseMarkdownBody(body: string): {
  hasSections: boolean;
  triggers?: SkillTrigger[];
  inputs?: Skill['inputs'];
  outputs?: Skill['outputs'];
  behavior?: Skill['behavior'];
  acceptance?: Skill['acceptance'];
  guardrails?: Skill['guardrails'];
} {
  // Implementation would parse markdown sections
  // This is a simplified version - full implementation would use a markdown parser
  const hasSections = body.includes('## ');

  return { hasSections };
}
```

### Import UI

Add import capability to the skills section:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Import Skill                                                    [Close] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ○ JSON / YAML (agentstories format)                                     │
│ ● AgentSkills.io (SKILL.md)                                             │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ │                     Drop SKILL.md here                              │ │
│ │                     or click to browse                              │ │
│ │                                                                     │ │
│ │              (Also accepts ZIP with scripts/references)             │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                                               [Cancel]  [Import]        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Mapping

### Export: agentstories → agentskills.io

| agentstories Field | agentskills.io Field | Transformation |
|--------------------|---------------------|----------------|
| `skill.name` | (body) | Human-readable, used in headings |
| `skill.description` | `description` | Truncate to 1024 chars |
| `skill.portability.slug` | `name` | Must be valid kebab-case |
| `skill.portability.license` | `license` | Direct copy |
| `skill.portability.compatibility` | `compatibility` | Direct copy |
| `skill.domain` | `metadata.domain` | As custom metadata |
| `skill.acquired` | `metadata.acquired` | As custom metadata |
| `skill.tools[].name` | `allowed-tools` | Join with spaces, kebab-case |
| `skill.triggers` | Body: "## Triggers" | Markdown section |
| `skill.inputs` | Body: "## Interface" | Markdown table |
| `skill.outputs` | Body: "## Interface" | Markdown table |
| `skill.behavior` | Body: "## Behavior" | Markdown section |
| `skill.reasoning` | Body: "## Reasoning" | Markdown section |
| `skill.acceptance` | Body: "## Success Criteria" | Markdown section |
| `skill.failureHandling` | Body: "## Error Handling" | Markdown section |
| `skill.guardrails` | Body: "## Guardrails" | Markdown section |
| `skill.portability.scripts` | `scripts/` directory | File per script |
| `skill.portability.references` | `references/` directory | File per reference |

### Import: agentskills.io → agentstories

| agentskills.io Field | agentstories Field | Transformation |
|---------------------|-------------------|----------------|
| `name` | `skill.portability.slug` | Direct copy |
| `name` | `skill.name` | Title case conversion |
| `description` | `skill.description` | Direct copy |
| `license` | `skill.portability.license` | Direct copy |
| `compatibility` | `skill.portability.compatibility` | Direct copy |
| `allowed-tools` | `skill.tools` | Parse, create tool stubs |
| `metadata.domain` | `skill.domain` | Direct copy |
| `metadata.acquired` | `skill.acquired` | Parse enum |
| Body sections | Various fields | Best-effort parsing |

---

## Validation

### Export Validation

Before export, validate:
1. `portability.slug` is set and valid (or auto-generate)
2. `description` is ≤ 1024 characters
3. All referenced scripts/references have content

### Import Validation

After import, validate:
1. Required fields present: `name`, `description`
2. `name` matches slug format
3. Warn if body couldn't be parsed into structured fields

---

## Migration

### Existing Skills

Existing skills without `portability` data remain valid. The field is optional.

### Auto-population Option

Add a migration utility:

```typescript
export function populatePortabilityDefaults(skill: Skill): Skill {
  if (!skill.portability) {
    return {
      ...skill,
      portability: {
        slug: generateSlug(skill.name),
        compatibility: skill.tools?.length
          ? `Requires: ${skill.tools.map(t => t.name).join(', ')}`
          : undefined
      }
    };
  }
  return skill;
}
```

---

## Future Considerations

1. **Skill Registry Integration**: Connect to public skill repositories
2. **Version Synchronization**: Track upstream changes to imported skills
3. **Dependency Resolution**: Handle skills that reference other skills
4. **MCP Server Generation**: Generate MCP server stubs from skill definitions

---

## Implementation Order

1. **Schema updates** (`/lib/schemas/skill.ts`)
   - Add `AgentSkillsPortabilitySchema`
   - Add `portability` field to `SkillSchema`
   - Add helper functions

2. **Export functionality** (`/lib/export/agentskills.ts`)
   - Implement `exportToAgentSkills()`
   - Add to export panel UI

3. **UI updates** (`/components/story-editor/sections/skill-editors/`)
   - Add Portability section to skill editor
   - Add portability indicator to skill cards
   - Add AgentSkills format to export options

4. **Import functionality** (`/lib/import/agentskills.ts`)
   - Implement `importFromAgentSkills()`
   - Add import UI for SKILL.md files
