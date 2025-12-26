# Agent Skills Standard Specification

> Official specification from [agentskills.io](https://agentskills.io) - the portable skill format for AI agents.

## Overview

Agent Skills is a standardized format for defining portable, reusable skills that can be shared across different AI agent implementations. This document captures the complete specification and provides guidance on how Agent Stories supports this standard.

---

## Directory Structure

A skill is a directory containing at minimum a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required - skill definition
├── scripts/          # Optional - executable code
│   ├── extract.py
│   └── process.sh
├── references/       # Optional - additional documentation
│   ├── REFERENCE.md
│   └── examples.md
└── assets/           # Optional - static resources
    ├── template.json
    └── schema.yaml
```

---

## SKILL.md Format

The `SKILL.md` file must contain YAML frontmatter followed by Markdown content.

### Required Frontmatter

```yaml
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

### Optional Frontmatter Fields

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
license: Apache-2.0
compatibility: Requires poppler-utils, Python 3.10+
allowed-tools: Bash(pdf:*) Read Write
metadata:
  author: example-org
  version: "1.0"
  domain: document-processing
---
```

### Field Specifications

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | Max 64 chars. Lowercase letters, numbers, hyphens only. No leading/trailing/consecutive hyphens. Must match directory name. |
| `description` | Yes | Max 1024 chars. Non-empty. Describes what the skill does and when to use it. |
| `license` | No | License name or reference to bundled license file. |
| `compatibility` | No | Max 500 chars. Environment requirements (products, packages, network access). |
| `metadata` | No | Arbitrary key-value mapping for additional metadata. |
| `allowed-tools` | No | Space-delimited list of pre-approved tools. (Experimental) |

### Name Field Rules

Valid:
- `pdf-processing`
- `data-analysis`
- `code-review`
- `a1b2c3`

Invalid:
- `PDF-Processing` (uppercase not allowed)
- `-pdf` (cannot start with hyphen)
- `pdf-` (cannot end with hyphen)
- `pdf--processing` (consecutive hyphens not allowed)

### Description Best Practices

**Good:**
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

**Poor:**
```yaml
description: Helps with PDFs.
```

The description should:
- Explain what the skill does
- Explain when to use it
- Include keywords that help agents identify relevant tasks

---

## Body Content

The Markdown body after frontmatter contains skill instructions. Write whatever helps agents perform the task effectively.

Recommended sections:
- Step-by-step instructions
- Examples of inputs and outputs
- Common edge cases
- Error handling guidance

### Example SKILL.md

```markdown
---
name: code-review
description: Reviews code changes for bugs, security issues, and style violations. Use when reviewing pull requests, commits, or code snippets.
license: MIT
metadata:
  author: acme-corp
  version: "2.0"
---

# Code Review Skill

Review code changes systematically, checking for common issues.

## Process

1. **Understand Context**: Read the full diff and any related files
2. **Check for Bugs**: Look for logic errors, null references, race conditions
3. **Security Review**: Identify injection vulnerabilities, auth issues, data exposure
4. **Style Check**: Verify naming conventions, formatting, documentation

## Output Format

Provide feedback in this structure:

### Critical Issues
- List blocking problems that must be fixed

### Suggestions
- List non-blocking improvements

### Positive Notes
- Highlight good patterns observed

## Common Patterns to Flag

- Hardcoded credentials or secrets
- Missing error handling
- Unbounded loops or recursion
- SQL/command injection vulnerabilities
- Missing input validation
```

---

## Optional Directories

### scripts/

Contains executable code that agents can run:

```
scripts/
├── analyze.py      # Python analysis script
├── format.sh       # Shell formatting script
└── validate.js     # JavaScript validation
```

Scripts should:
- Be self-contained or clearly document dependencies
- Include helpful error messages
- Handle edge cases gracefully

### references/

Additional documentation loaded on demand:

```
references/
├── REFERENCE.md    # Detailed technical reference
├── FORMS.md        # Form templates
├── api-guide.md    # API documentation
└── examples.md     # Extended examples
```

Keep files focused—agents load these on demand, so smaller files use less context.

### assets/

Static resources:

```
assets/
├── template.json   # Configuration template
├── schema.yaml     # Data schema
├── diagram.png     # Visual reference
└── lookup.csv      # Reference data
```

---

## Progressive Disclosure

Skills should be structured for efficient context usage:

| Level | Content | Token Budget |
|-------|---------|--------------|
| **Metadata** | `name` + `description` | ~100 tokens |
| **Instructions** | Full `SKILL.md` body | < 5000 tokens recommended |
| **Resources** | scripts/, references/, assets/ | Loaded on demand |

**Guidelines:**
- Keep `SKILL.md` under 500 lines
- Move detailed reference material to separate files
- Use file references for large examples

---

## File References

Reference other files using relative paths from skill root:

```markdown
See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
scripts/extract.py
```

Keep references one level deep. Avoid deeply nested reference chains.

---

## Validation

Use the official validation tool:

```bash
skills-ref validate ./my-skill
```

This checks:
- Valid YAML frontmatter
- Name conventions
- Required fields
- Directory structure

---

## Agent Stories ↔ Agent Skills Mapping

### Current Support

Agent Stories already includes portability fields in the Skill schema (`/lib/schemas/skill.ts`):

```typescript
export const AgentSkillsPortabilitySchema = z.object({
  slug: z.string()        // Maps to Agent Skills `name`
    .min(1).max(64)
    .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/),
  license: z.string().max(100).optional(),
  compatibility: z.string().max(500).optional(),
  scripts: z.array(SkillScriptSchema).optional(),
  references: z.array(SkillReferenceSchema).optional()
});
```

### Mapping Table

| Agent Skills Field | Agent Stories Field | Notes |
|--------------------|---------------------|-------|
| `name` | `portability.slug` | Auto-generated from skill name |
| `description` | `description` | Direct mapping (max 1024 chars) |
| `license` | `portability.license` | Optional |
| `compatibility` | `portability.compatibility` | Optional |
| `metadata.author` | `createdBy` (story level) | Could add to skill |
| `metadata.version` | `version` (story level) | Could add to skill |
| `allowed-tools` | `tools[].name` | Partial mapping |
| Body content | Generated from skill fields | Needs export generator |
| `scripts/` | `portability.scripts` | Supported |
| `references/` | `portability.references` | Supported |

---

## Gaps & Recommendations

See [11-agentskills-compatibility.md](./11-agentskills-compatibility.md) for detailed gap analysis and implementation recommendations.

### Priority Improvements

1. **Export Generator**: Generate complete `SKILL.md` from Agent Story skills
2. **Import Parser**: Parse existing Agent Skills into our skill format
3. **Validation Integration**: Add Agent Skills validation to our validation pipeline
4. **Directory Export**: Export skill as complete directory structure
5. **Skill-Level Versioning**: Add version field to individual skills

---

## References

- [Agent Skills Official Docs](https://agentskills.io)
- [Agent Skills GitHub](https://github.com/agentskills/agentskills)
- [skills-ref Validation Library](https://github.com/agentskills/agentskills/tree/main/skills-ref)
- [llms.txt Navigation](https://agentskills.io/llms.txt)
