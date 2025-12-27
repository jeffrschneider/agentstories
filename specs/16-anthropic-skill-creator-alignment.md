# Anthropic Skill-Creator Alignment Specification

> Aligning Agent Stories skill creation with the official Anthropic skill-creator patterns from [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/skill-creator).

## Overview

This spec defines changes needed to align Agent Stories' skill creation system with Anthropic's official guidance. The goal is to produce skills that follow the "concise is key" philosophy while maintaining our structured approach where it adds value.

---

## Gap Analysis Summary

| Area | Anthropic Approach | Current Agent Stories | Priority |
|------|-------------------|----------------------|----------|
| SKILL.md body | Free-form procedural instructions | Generated structured sections | **High** |
| Frontmatter | Minimal (name, description, license) | Extended (7+ fields) | Medium |
| Validation scripts | `quick_validate.py` with strict rules | Zod schema (different rules) | **High** |
| Init scaffolding | `init_skill.py` with TODO guidance | Interview-based, no TODOs | Medium |
| Packaging | `.skill` ZIP with pre-validation | `downloadSkillZip()` (no validation) | Medium |
| Reference docs | `workflows.md`, `output-patterns.md` | Not present | **High** |
| Token budgets | Explicit (<5k words, <500 lines) | Not enforced | Medium |
| Examples-first | Step 1: Gather concrete examples | Not emphasized | Low |

---

## Implementation Plan

### Phase 1: Reference Documentation (High Priority)

Add Anthropic's reference patterns to the skill-creator skill itself.

#### 1.1 Create `workflows.md` reference

**Location:** When creating skills, include as `references/workflows.md`

**Content:**
```markdown
# Workflow Patterns

## Sequential Workflows

For complex tasks, break into distinct phases:

1. Analyze the input (run analyze.py)
2. Process the data (run process.py)
3. Validate results (run validate.py)
4. Generate output (run output.py)

## Conditional Workflows

For branching tasks, guide through decision points:

1. Determine the task type:
   **Creating new?** → Follow "Creation workflow"
   **Editing existing?** → Follow "Editing workflow"

2. Creation workflow: [steps]
3. Editing workflow: [steps]
```

#### 1.2 Create `output-patterns.md` reference

**Location:** When creating skills, include as `references/output-patterns.md`

**Content:**
```markdown
# Output Patterns

## Template Pattern

Provide structure for consistent output:

**Strict (for APIs/data):**
ALWAYS use this exact structure...

**Flexible (for analysis):**
Sensible default, adapt as needed...

## Examples Pattern

Show input/output pairs:

**Example 1:**
Input: [user request]
Output: [expected result]

Examples help Claude understand style better than descriptions alone.
```

---

### Phase 2: SKILL.md Generation Overhaul (High Priority)

#### 2.1 Simplify frontmatter output

**Current output:**
```yaml
name: ticket-triage
description: Classify and prioritize...
license: MIT
compatibility: Requires Helpdesk API...
allowed-tools: api-call helpdesk-system
metadata:
  domain: Customer Service
  acquired: built_in
  source-id: abc123
```

**Target output:**
```yaml
name: ticket-triage
description: Classify and prioritize incoming support tickets. Use when new tickets arrive or when ticket backlog needs processing.
license: MIT
```

**Changes to `src/lib/export/agentskills.ts`:**

```typescript
function buildFrontmatter(skill: Skill, slug: string): string {
  const lines: string[] = [];

  // Required fields only
  lines.push(`name: ${slug}`);

  // Description must include WHAT + WHEN (Anthropic requirement)
  const description = ensureWhenClause(skill.description, skill.triggers);
  lines.push(`description: ${escapeYaml(description.slice(0, 1024))}`);

  // Optional: license only if specified
  if (skill.portability?.license) {
    lines.push(`license: ${skill.portability.license}`);
  }

  // Remove: compatibility, allowed-tools, metadata section
  // These add noise without value for AI execution

  return lines.join('\n') + '\n';
}

function ensureWhenClause(description: string, triggers?: SkillTrigger[]): string {
  // If description already contains "when" or "use when", return as-is
  if (/\bwhen\b/i.test(description) || /\buse for\b/i.test(description)) {
    return description;
  }

  // Otherwise, append trigger context
  if (triggers?.length) {
    const triggerDesc = triggers
      .map(t => t.description)
      .filter(Boolean)
      .join(', ');
    if (triggerDesc) {
      return `${description} Use when ${triggerDesc.toLowerCase()}.`;
    }
  }

  return description;
}
```

#### 2.2 Rewrite body generation to be instruction-focused

**Current approach:** Generates formal specification sections (Interface, Behavior, Tools tables, etc.)

**Target approach:** Generate procedural instructions Claude can follow

**New `buildMarkdownBody` function:**

```typescript
function buildMarkdownBody(skill: Skill): string {
  const sections: string[] = [];

  // Title
  sections.push(`# ${skill.name}\n`);

  // Brief overview (not full description - that's in frontmatter)
  if (skill.behavior?.model) {
    sections.push(`This skill uses a ${skill.behavior.model} approach.\n`);
  }

  // Workflow/Process section (prioritize this - it's what Claude needs)
  sections.push(buildWorkflowSection(skill));

  // Tools section (only if tools exist, keep brief)
  if (skill.tools?.length) {
    sections.push(buildToolsSection(skill));
  }

  // Success criteria as checklist (actionable, not formal)
  sections.push(buildSuccessChecklist(skill));

  // Constraints (guardrails as "do not" list)
  if (skill.guardrails?.length) {
    sections.push(buildConstraintsSection(skill));
  }

  // References to bundled resources
  sections.push(buildResourcesSection(skill));

  return sections.filter(Boolean).join('\n');
}

function buildWorkflowSection(skill: Skill): string {
  const lines: string[] = ['## Process\n'];

  if (skill.behavior?.model === 'sequential' && skill.behavior.steps) {
    skill.behavior.steps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
  } else if (skill.behavior?.model === 'workflow' && skill.behavior.stages) {
    // Convert stages to decision tree format
    lines.push('Determine the task type:\n');
    skill.behavior.stages.forEach(stage => {
      lines.push(`**${stage.name}?** → ${stage.purpose}`);
      if (stage.actions?.length) {
        stage.actions.forEach(a => lines.push(`  - ${a}`));
      }
    });
  } else if (skill.triggers?.length) {
    // Fallback: derive process from triggers
    lines.push('When activated:\n');
    skill.triggers.forEach(t => {
      lines.push(`- On ${t.type}: ${t.description}`);
    });
  }

  lines.push('');
  return lines.join('\n');
}

function buildSuccessChecklist(skill: Skill): string {
  if (!skill.acceptance?.successConditions?.length) return '';

  const lines: string[] = ['## Success Checklist\n'];
  lines.push('Verify before completing:\n');
  skill.acceptance.successConditions.forEach(c => {
    lines.push(`- [ ] ${c}`);
  });
  lines.push('');
  return lines.join('\n');
}

function buildConstraintsSection(skill: Skill): string {
  if (!skill.guardrails?.length) return '';

  const lines: string[] = ['## Constraints\n'];
  lines.push('Do NOT:\n');
  skill.guardrails.forEach(g => {
    lines.push(`- ${g.constraint}`);
  });
  lines.push('');
  return lines.join('\n');
}

function buildResourcesSection(skill: Skill): string {
  const hasScripts = skill.portability?.scripts?.length;
  const hasRefs = skill.portability?.references?.length;

  if (!hasScripts && !hasRefs) return '';

  const lines: string[] = ['## Resources\n'];

  if (hasScripts) {
    lines.push('### Scripts');
    skill.portability!.scripts!.forEach(s => {
      lines.push(`- \`scripts/${s.filename}\` - ${s.purpose}`);
    });
    lines.push('');
  }

  if (hasRefs) {
    lines.push('### References');
    skill.portability!.references!.forEach(r => {
      lines.push(`- [${r.title}](references/${r.filename})`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
```

---

### Phase 3: Validation Script (High Priority)

#### 3.1 Add Anthropic-compatible validation

**New file:** `src/lib/validation/skill-validator.ts`

```typescript
export interface SkillValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const ALLOWED_FRONTMATTER_KEYS = new Set([
  'name',
  'description',
  'license',
  'allowed-tools',
  'metadata'
]);

export function validateSkillForExport(skill: Skill): SkillValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  const slug = skill.portability?.slug || generateSlug(skill.name);
  if (!slug) {
    errors.push('Missing skill name');
  } else {
    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push(`Name '${slug}' must be hyphen-case (lowercase, digits, hyphens only)`);
    }
    if (slug.startsWith('-') || slug.endsWith('-') || slug.includes('--')) {
      errors.push(`Name '${slug}' cannot start/end with hyphen or have consecutive hyphens`);
    }
    if (slug.length > 64) {
      errors.push(`Name is too long (${slug.length} chars). Maximum is 64.`);
    }
  }

  // Description validation
  if (!skill.description) {
    errors.push('Missing description');
  } else {
    if (skill.description.length > 1024) {
      errors.push(`Description too long (${skill.description.length} chars). Maximum is 1024.`);
    }
    if (/<|>/.test(skill.description)) {
      errors.push('Description cannot contain angle brackets (< or >)');
    }
    // Warn if missing "when" clause
    if (!/\bwhen\b/i.test(skill.description) && !/\buse for\b/i.test(skill.description)) {
      warnings.push('Description should explain WHEN to use this skill (e.g., "Use when...")');
    }
  }

  // Token budget warnings
  const estimatedTokens = estimateSkillTokens(skill);
  if (estimatedTokens > 5000) {
    warnings.push(`Skill may exceed 5k token budget (~${estimatedTokens} estimated). Consider moving content to references/.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function estimateSkillTokens(skill: Skill): number {
  // Rough estimate: 1 token ≈ 4 characters
  const content = JSON.stringify(skill);
  return Math.ceil(content.length / 4);
}
```

#### 3.2 Integrate validation into export

**Update `exportToAgentSkills`:**

```typescript
export function exportToAgentSkills(
  skill: Skill,
  options: AgentSkillsExportOptions = {}
): AgentSkillsExportResult {
  // Run validation first
  const validation = validateSkillForExport(skill);

  if (!validation.valid && !options.skipValidation) {
    throw new Error(`Skill validation failed:\n${validation.errors.join('\n')}`);
  }

  const warnings = [...validation.warnings];

  // ... rest of export logic
}
```

---

### Phase 4: Init Script & Scaffolding (Medium Priority)

#### 4.1 Add skill initialization with TODOs

**New file:** `src/lib/skill-init/templates.ts`

```typescript
export const SKILL_MD_TEMPLATE = `---
name: {slug}
description: [TODO: Explain what this skill does AND when to use it. Include specific scenarios, file types, or tasks that trigger it.]
---

# {title}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## Process

[TODO: Choose a structure that fits:

**Sequential** (for step-by-step procedures):
1. First step
2. Second step
3. Third step

**Conditional** (for branching decisions):
1. Determine task type:
   **Creating new?** → Follow Creation workflow
   **Editing existing?** → Follow Editing workflow

Delete this guidance when done.]

## Success Checklist

- [ ] [TODO: What must be true when done?]
- [ ] [TODO: Quality check]

## Resources

- See [workflows.md](references/workflows.md) for workflow patterns
- See [output-patterns.md](references/output-patterns.md) for output formatting
`;

export const EXAMPLE_SCRIPT_TEMPLATE = `#!/usr/bin/env python3
"""
Example script for {slug}

Replace with actual implementation or delete if not needed.
"""

def main():
    print("Example script for {slug}")
    # TODO: Add actual logic

if __name__ == "__main__":
    main()
`;
```

#### 4.2 Add init function

```typescript
export function initSkill(name: string, basePath: string): SkillInitResult {
  const slug = generateSlug(name);
  const title = slugToTitle(name);
  const skillDir = path.join(basePath, 'skills', slug);

  // Create directory structure
  const dirs = [
    skillDir,
    path.join(skillDir, 'scripts'),
    path.join(skillDir, 'references'),
    path.join(skillDir, 'assets')
  ];

  const files = [
    {
      path: path.join(skillDir, 'SKILL.md'),
      content: SKILL_MD_TEMPLATE.replace(/{slug}/g, slug).replace(/{title}/g, title)
    },
    {
      path: path.join(skillDir, 'scripts', 'example.py'),
      content: EXAMPLE_SCRIPT_TEMPLATE.replace(/{slug}/g, slug)
    },
    {
      path: path.join(skillDir, 'references', 'workflows.md'),
      content: WORKFLOWS_REFERENCE
    },
    {
      path: path.join(skillDir, 'references', 'output-patterns.md'),
      content: OUTPUT_PATTERNS_REFERENCE
    }
  ];

  return { dirs, files, slug };
}
```

---

### Phase 5: Packaging Enhancement (Medium Priority)

#### 5.1 Add `.skill` file generation with validation

```typescript
export async function packageSkill(
  skill: Skill,
  options?: PackageOptions
): Promise<PackageResult> {
  // Step 1: Validate
  const validation = validateSkillForExport(skill);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  // Step 2: Export to AgentSkills format
  const exported = exportToAgentSkills(skill);

  // Step 3: Create .skill ZIP
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const skillDir = zip.folder(exported.slug);

  skillDir.file('SKILL.md', exported.skillMd);

  // Add scripts, references, assets...

  // Step 4: Generate blob
  const content = await zip.generateAsync({ type: 'blob' });

  return {
    success: true,
    filename: `${exported.slug}.skill`,
    blob: content,
    warnings: validation.warnings
  };
}
```

---

### Phase 6: Interview Flow Updates (Low Priority)

#### 6.1 Add "examples first" step

Update `SKILL_INTERVIEW` in `interview.ts`:

```typescript
export const SKILL_INTERVIEW = `
## Guided Skill Creation

### Phase 0: Examples (NEW - Ask first)

**Opening:**
"Before we define this skill, can you give me 1-2 concrete examples of how it would be used?
For example: 'User uploads a PDF and asks to extract tables' or 'User says: summarize this document'"

This helps us understand the actual usage patterns before defining structure.

### Phase 1: Identity (Always ask)
...
`;
```

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/export/agentskills.ts` | Modify | Simplify frontmatter, rewrite body generation |
| `src/lib/validation/skill-validator.ts` | Create | Anthropic-compatible validation |
| `src/lib/skill-init/templates.ts` | Create | Skill scaffolding templates |
| `src/lib/skill-init/index.ts` | Create | Init function |
| `src/lib/agent-files/interview.ts` | Modify | Add "examples first" phase |
| `specs/16-anthropic-skill-creator-alignment.md` | Create | This spec |

---

## Success Criteria

1. Generated SKILL.md files pass Anthropic's `quick_validate.py`
2. Frontmatter contains only: name, description, license (optional)
3. Body is procedural instructions, not formal specifications
4. Validation warns about missing "when" clause in descriptions
5. Token budget warnings appear for skills >5k tokens
6. Skills include `references/workflows.md` and `references/output-patterns.md`

---

## References

- [Anthropic skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator)
- [AgentSkills.io](https://agentskills.io)
- [Spec 13: AgentSkills Standard](./13-agentskills-standard.md)
- [Spec 11: AgentSkills Compatibility](./11-agentskills-compatibility.md)
