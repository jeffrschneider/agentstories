# Agent Filesystem Export Specification

## Overview

This specification defines the complete directory structure for exporting an Agent Story as a portable, executable agent filesystem. This goes beyond single-skill export to provide a full agent package including configuration, skills, prompts, tools, memory structure, and examples.

## Design Goals

1. **Portable**: Agents can be moved between systems and repositories
2. **Self-Contained**: All necessary files are included
3. **Executable**: Structure supports direct execution by agent runtimes
4. **Compatible**: Individual skills remain AgentSkills.io compatible
5. **Progressive**: Supports both minimal and full-featured exports

---

## Directory Structure

### Full Agent Export

```
{agent-identifier}/
├── agent.md                          # Core agent definition
├── config.yaml                       # Agent configuration
├── README.md                         # Auto-generated documentation
│
├── skills/
│   └── {skill-slug}/
│       ├── SKILL.md                  # AgentSkills.io compatible
│       ├── config.yaml               # Skill-specific settings
│       ├── prompts/
│       │   └── {prompt-name}.md      # Prompt templates
│       ├── tools/
│       │   └── {tool-name}.{ext}     # Tool implementations
│       ├── templates/
│       │   └── {template-name}.{ext} # Output templates
│       └── examples/
│           └── {example-name}.md     # Usage examples
│
├── memory/
│   ├── config.yaml                   # Memory configuration
│   ├── short_term/                   # Session-based memory
│   │   └── .gitkeep
│   └── long_term/                    # Persistent memory
│       └── .gitkeep
│
├── shared/
│   ├── tools/                        # Agent-level shared tools
│   │   ├── __init__.py
│   │   └── base_tool.py
│   └── prompts/                      # Agent-level shared prompts
│       └── system_prompt.md
│
└── logs/
    └── .gitkeep
```

### Minimal Export (Skills Only)

```
{agent-identifier}/
├── agent.md
├── config.yaml
└── skills/
    └── {skill-slug}/
        └── SKILL.md
```

---

## File Specifications

### agent.md

The core agent definition file, human-readable markdown with YAML frontmatter.

```yaml
---
name: support-request-router
version: "1.0"
description: Routes customer support requests to appropriate teams
autonomy: supervised
created: 2024-01-15T10:30:00Z
---

# Support Request Router

## Purpose

Ensure support requests reach the right team quickly with full context.

## Role

Customer Support Triage Agent responsible for classifying and routing
incoming support requests based on content, urgency, and customer tier.

## Capabilities

This agent has the following skills:
- [Ticket Triage](skills/ticket-triage/SKILL.md) - Classify incoming requests
- [Queue Routing](skills/queue-routing/SKILL.md) - Route to appropriate queues

## Human Interaction

**Mode**: On the loop
- Agent operates independently for routine requests
- Escalates edge cases and low-confidence classifications
- Weekly review of routing decisions

## Guardrails

- Never auto-close tickets without customer confirmation
- Always maintain audit trail for compliance
- Respect customer tier SLAs
```

### config.yaml (Agent Level)

```yaml
# Agent Configuration
version: "1.0"
runtime:
  framework: claude-agent-sdk  # or langchain, crewai, etc.
  model: claude-sonnet-4-20250514
  max_tokens: 4096

autonomy:
  level: supervised
  escalation_threshold: 0.8

human_interaction:
  mode: on_the_loop
  default_channel: slack
  escalation_policy:
    critical:
      response_time: 5m
      channel: pagerduty
    high:
      response_time: 1h
      channel: slack
    normal:
      response_time: 4h
      channel: email

collaboration:
  role: worker
  reports_to: support-orchestrator
  peers:
    - agent: knowledge-base-agent
      interaction: request_response

memory:
  short_term:
    type: session
    max_items: 100
  long_term:
    stores:
      - name: routing_history
        type: relational
        purpose: Track routing patterns
        update_mode: append

guardrails:
  - name: no_auto_close
    constraint: Never close tickets without customer confirmation
    enforcement: hard
  - name: audit_trail
    constraint: All routing decisions must be logged
    enforcement: hard

tags:
  - customer-support
  - triage
  - routing
```

### Skill config.yaml

```yaml
# Skill Configuration
version: "1.0"

triggers:
  - type: message
    source: support-gateway
    conditions:
      - ticket_unassigned
      - no_priority_set

behavior:
  model: sequential
  timeout: 30s
  retry:
    max_attempts: 2
    backoff: exponential

reasoning:
  strategy: hybrid
  confidence_threshold: 0.8
  fallback: escalate_to_human

tools:
  - name: ticket-system-api
    required: true
    permissions: [read, write]
  - name: classification-model
    required: true
    permissions: [execute]

acceptance:
  success_conditions:
    - category_assigned
    - priority_set
    - confidence_recorded
  quality_metrics:
    accuracy: ">= 95%"
    latency: "< 5s"

guardrails:
  - name: no_pii_logging
    constraint: Never log raw message content
    enforcement: hard
```

### Prompt Files

Prompt files are markdown with optional YAML frontmatter for metadata.

```markdown
---
name: classify_request
version: "1.0"
inputs:
  - name: request_text
    type: string
    required: true
  - name: customer_context
    type: object
    required: false
outputs:
  - name: category
    type: string
  - name: confidence
    type: number
---

# Classify Support Request

You are analyzing a customer support request to determine its category and urgency.

## Input

**Request Text:**
{{request_text}}

{{#if customer_context}}
**Customer Context:**
- Tier: {{customer_context.tier}}
- Previous Issues: {{customer_context.issue_count}}
{{/if}}

## Instructions

1. Read the request carefully
2. Identify the primary issue category
3. Assess urgency based on keywords and tone
4. Consider customer tier for priority adjustment

## Categories

- billing: Payment, invoices, refunds
- technical: Product issues, bugs, errors
- account: Login, access, permissions
- general: Questions, feedback, other

## Output Format

Return JSON:
```json
{
  "category": "<category>",
  "urgency": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "reasoning": "<brief explanation>"
}
```
```

### Tool Implementation Files

Tool implementations follow a standard interface pattern.

**Python Example (tools/search.py):**
```python
"""Search tool for web queries."""

from typing import Any
from .base_tool import BaseTool, ToolResult


class SearchTool(BaseTool):
    """Execute web searches and return results."""

    name = "search"
    description = "Search the web for information"

    async def execute(self, query: str, max_results: int = 10) -> ToolResult:
        """
        Execute a web search.

        Args:
            query: The search query
            max_results: Maximum number of results to return

        Returns:
            ToolResult with search results
        """
        # Implementation here
        pass
```

### Example Files

Example files show skill usage in practice.

```markdown
---
name: basic_triage
description: Basic ticket triage example
---

# Basic Ticket Triage Example

## Scenario

A customer submits a ticket about a billing discrepancy.

## Input

```json
{
  "request_text": "I was charged twice for my subscription last month. Please help!",
  "customer_context": {
    "tier": "premium",
    "issue_count": 2
  }
}
```

## Expected Output

```json
{
  "category": "billing",
  "urgency": "high",
  "confidence": 0.95,
  "reasoning": "Clear billing issue, duplicate charge mentioned, premium customer"
}
```

## Notes

- Premium customers automatically get elevated urgency
- Billing issues with clear financial impact are prioritized
```

---

## Schema Updates

### Extended Skill Schema

```typescript
// Additions to /lib/schemas/skill.ts

// Prompt template for skill
export const SkillPromptSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/),
  description: z.string().min(1),
  inputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(true),
    description: z.string().optional()
  })).optional(),
  outputs: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional()
  })).optional(),
  content: z.string().min(1).describe('Prompt template content with {{variables}}')
});

export type SkillPrompt = z.infer<typeof SkillPromptSchema>;

// Tool implementation
export const ToolImplementationSchema = z.object({
  toolName: z.string().min(1).describe('References tools[].name'),
  language: z.enum(['python', 'typescript', 'javascript', 'bash']),
  filename: z.string().min(1),
  content: z.string().min(1).describe('Implementation source code'),
  dependencies: z.array(z.string()).optional()
});

export type ToolImplementation = z.infer<typeof ToolImplementationSchema>;

// Usage example
export const SkillExampleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_-]*$/),
  description: z.string().min(1),
  input: z.record(z.unknown()).optional(),
  expectedOutput: z.record(z.unknown()).optional(),
  content: z.string().min(1).describe('Full example markdown content')
});

export type SkillExample = z.infer<typeof SkillExampleSchema>;

// Output template
export const OutputTemplateSchema = z.object({
  name: z.string().min(1),
  format: z.enum(['markdown', 'json', 'yaml', 'html', 'text', 'docx', 'pdf']),
  filename: z.string().min(1),
  content: z.string().min(1)
});

export type OutputTemplate = z.infer<typeof OutputTemplateSchema>;

// Extended skill with filesystem content
export const ExtendedSkillSchema = SkillSchema.extend({
  // Prompt templates
  prompts: z.array(SkillPromptSchema).optional(),

  // Tool implementations
  toolImplementations: z.array(ToolImplementationSchema).optional(),

  // Usage examples
  examples: z.array(SkillExampleSchema).optional(),

  // Output templates
  templates: z.array(OutputTemplateSchema).optional()
});

export type ExtendedSkill = z.infer<typeof ExtendedSkillSchema>;
```

---

## Export Functions

### Main Export Interface

```typescript
// /lib/export/agent-filesystem.ts

export interface AgentExportOptions {
  // What to include
  includeSkills?: boolean;           // default: true
  includeMemoryStructure?: boolean;  // default: true
  includeSharedTools?: boolean;      // default: true
  includeLogs?: boolean;             // default: false
  includeExamples?: boolean;         // default: true

  // Format options
  generateReadme?: boolean;          // default: true
  includeGitkeep?: boolean;          // default: true

  // Validation
  validateAgentSkillsCompat?: boolean; // default: true
}

export interface ExportedFile {
  path: string;      // Relative path from agent root
  content: string;   // File content
  binary?: boolean;  // Is this binary content (base64)?
}

export interface AgentExportResult {
  files: ExportedFile[];
  rootDir: string;              // Agent identifier (root directory name)
  warnings: string[];
  skillCount: number;
  totalFiles: number;
  estimatedSize: number;        // Bytes
}

export function exportAgentToFilesystem(
  story: AgentStory,
  options?: AgentExportOptions
): AgentExportResult;

export async function downloadAgentZip(
  story: AgentStory,
  options?: AgentExportOptions
): Promise<void>;
```

### File Generators

```typescript
// Generate agent.md from story
function generateAgentMd(story: AgentStory): string;

// Generate agent config.yaml
function generateAgentConfig(story: AgentStory): string;

// Generate skill config.yaml
function generateSkillConfig(skill: Skill): string;

// Generate memory config.yaml
function generateMemoryConfig(memory: AgentMemory): string;

// Generate README.md
function generateReadme(story: AgentStory): string;

// Generate prompt file
function generatePromptFile(prompt: SkillPrompt): string;

// Generate tool implementation file
function generateToolFile(impl: ToolImplementation): string;

// Generate example file
function generateExampleFile(example: SkillExample): string;
```

---

## Directory Mapping

### Agent Story → Filesystem

| Agent Story Field | Filesystem Location |
|-------------------|---------------------|
| `story.name` | `agent.md` frontmatter `name` |
| `story.identifier` | Root directory name |
| `story.role` | `agent.md` Role section |
| `story.purpose` | `agent.md` Purpose section |
| `story.autonomyLevel` | `config.yaml` `autonomy.level` |
| `story.humanInteraction` | `config.yaml` `human_interaction` |
| `story.collaboration` | `config.yaml` `collaboration` |
| `story.memory` | `config.yaml` `memory` + `memory/` structure |
| `story.guardrails` | `config.yaml` `guardrails` + `agent.md` section |
| `story.skills[]` | `skills/{slug}/` directories |

### Skill → Filesystem

| Skill Field | Filesystem Location |
|-------------|---------------------|
| `skill.name` | `SKILL.md` frontmatter + title |
| `skill.description` | `SKILL.md` frontmatter + body |
| `skill.portability.slug` | Directory name |
| `skill.triggers` | `config.yaml` `triggers` + `SKILL.md` section |
| `skill.tools` | `config.yaml` `tools` |
| `skill.toolImplementations` | `tools/` directory |
| `skill.behavior` | `config.yaml` `behavior` |
| `skill.reasoning` | `config.yaml` `reasoning` |
| `skill.acceptance` | `config.yaml` `acceptance` |
| `skill.guardrails` | `config.yaml` `guardrails` |
| `skill.prompts` | `prompts/` directory |
| `skill.examples` | `examples/` directory |
| `skill.templates` | `templates/` directory |

---

## Import Support

### Import Function

```typescript
// /lib/import/agent-filesystem.ts

export interface AgentImportResult {
  story: AgentStory;
  warnings: string[];
  skippedFiles: string[];
}

export async function importAgentFromFilesystem(
  files: File[] | FileSystemDirectoryHandle
): Promise<AgentImportResult>;

export async function importAgentFromZip(
  zipFile: File
): Promise<AgentImportResult>;
```

### Parsing Logic

1. Find `agent.md` to identify root
2. Parse `config.yaml` for agent settings
3. Scan `skills/` for subdirectories
4. For each skill:
   - Parse `SKILL.md` (AgentSkills.io format)
   - Parse `config.yaml` for skill settings
   - Collect `prompts/*.md`
   - Collect `tools/*.*`
   - Collect `examples/*.md`
   - Collect `templates/*.*`
5. Parse `memory/config.yaml` if present
6. Merge into AgentStory object

---

## Validation

### Export Validation

Before export, validate:
1. Agent has valid identifier (can be directory name)
2. All skills have valid slugs
3. No duplicate skill slugs
4. Tool implementations reference valid tools
5. Prompt variables match documented inputs

### AgentSkills.io Compatibility Check

Each skill's `SKILL.md` should:
1. Have valid frontmatter (name, description)
2. Name matches directory name
3. Description under 1024 chars
4. Body under 500 lines (warning)

---

## UI Integration

### Export Dialog

Add to the story editor:
- "Export Agent" button in toolbar
- Dialog with export options:
  - Format: ZIP download
  - Include: Skills, Memory, Tools, Examples
  - Compatibility checks

### Preview Panel

Show filesystem tree preview before export:
```
support-request-router/
├── agent.md
├── config.yaml
├── README.md
└── skills/
    ├── ticket-triage/
    │   ├── SKILL.md
    │   ├── config.yaml
    │   └── prompts/
    │       └── classify_request.md
    └── queue-routing/
        ├── SKILL.md
        └── config.yaml
```

---

## Implementation Order

1. **Schema updates** (`/lib/schemas/skill.ts`)
   - Add `SkillPromptSchema`
   - Add `ToolImplementationSchema`
   - Add `SkillExampleSchema`
   - Add `OutputTemplateSchema`
   - Create `ExtendedSkillSchema`

2. **Export module** (`/lib/export/agent-filesystem.ts`)
   - Implement file generators
   - Implement `exportAgentToFilesystem()`
   - Implement `downloadAgentZip()`

3. **UI components**
   - Create `AgentExportDialog` component
   - Add filesystem preview
   - Integrate into story editor toolbar

4. **Import module** (`/lib/import/agent-filesystem.ts`)
   - Implement directory parser
   - Implement ZIP import
   - Add import UI

5. **Skill editor updates**
   - Add Prompts editor tab
   - Add Tool Implementations section
   - Add Examples section
