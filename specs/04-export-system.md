# Export System Specification

## Overview

The export system generates shareable artifacts from Agent Stories in multiple formats. Phase 1 supports Markdown and JSON exports; PDF export is planned for Phase 2.

---

## Export Formats

| Format | Use Case | Audience |
|--------|----------|----------|
| Markdown | Documentation, wikis, repos | All stakeholders |
| JSON | Machine consumption, integrations | Developers, systems |
| PDF | Formal documents, presentations | Business stakeholders |

---

## Markdown Export

### Template Structure

```markdown
# {story.name}

> **Identifier:** `{story.identifier}`
> **Format:** {story.format}
> **Autonomy Level:** {autonomyLevelLabel}
> **Last Updated:** {story.updatedAt}

## Agent Story

**As a** {story.role}

**triggered by** {triggerDescription}

**I** {story.action}

**so that** {story.outcome}

---

## Autonomy Level: {autonomyLevelLabel}

{autonomyLevelDescription}

- **Human Involvement:** {autonomyMeta.humanInvolvement}
- **Agent Authority:** {autonomyMeta.agentAuthority}

{#if format === 'full'}

---

## Behavior Model

{#if behaviorConfig}
**Type:** {behaviorConfig.type}

{#if behaviorConfig.type === 'workflow'}
### Workflow Stages

| Stage | Description |
|-------|-------------|
{#each stages}
| {stage.name} | {stage.description} |
{/each}

**Initial Stage:** {initialStageId}
**Terminal Stages:** {terminalStageIds.join(', ')}
{/if}
{/if}

---

## Skills & Reasoning

{#if skillsInventory}
### Primary Skills

{#each primarySkills}
- **{skill.name}** ({skill.proficiencyLevel})
  - Acquisition: {skill.acquisitionType}
  {#if skill.qualityThreshold}
  - Quality Bar: {skill.qualityThreshold.metric} ≥ {skill.qualityThreshold.minimumValue}
  {/if}
{/each}
{/if}

---

## Human Collaboration

{#if humanCollaboration}
**Pattern:** {humanCollaboration.pattern}

{#if escalationTriggers.length}
### Escalation Triggers

| Trigger | Condition | Priority |
|---------|-----------|----------|
{#each escalationTriggers}
| {trigger.name} | `{trigger.condition}` | {trigger.priority} |
{/each}
{/if}

{#if approvalWorkflows.length}
### Approval Workflows

{#each approvalWorkflows}
- **{workflow.name}**: Requires {workflow.requiredApprovers} approver(s) from {workflow.approverRoles.join(', ')}
{/each}
{/if}
{/if}

---

## Agent Collaboration

{#if agentCollaboration}
**Role:** {agentCollaboration.role}

{#if role === 'supervisor'}
**Managed Agents:** {managedAgentIds.join(', ')}
{/if}

{#if communicationPatterns.length}
### Communication Patterns

| Target Agent | Message Types | Protocol |
|--------------|---------------|----------|
{#each communicationPatterns}
| {pattern.targetAgentId} | {pattern.messageTypes.join(', ')} | {pattern.protocol} |
{/each}
{/if}
{/if}

---

## Memory Architecture

{#if memoryArchitecture}
{#if workingMemory}
### Working Memory
- **Type:** {workingMemory.memoryType}
- **Storage:** {workingMemory.storageType}
- **Sensitivity:** {workingMemory.dataSensitivity}
{/if}

{#if persistentStores.length}
### Persistent Stores

| Store | Type | Storage | Retention |
|-------|------|---------|-----------|
{#each persistentStores}
| {store.name} | {store.memoryType} | {store.storageType} | {store.retentionPolicy?.maxAgeDays || 'Indefinite'} days |
{/each}
{/if}
{/if}

---

## Quality & Constraints

{#if qualityRequirements}
### Quality Requirements

| Metric | Target |
|--------|--------|
{#if qualityRequirements.responseTimeMs}
| Response Time | ≤ {qualityRequirements.responseTimeMs}ms |
{/if}
{#if qualityRequirements.accuracyThreshold}
| Accuracy | ≥ {(qualityRequirements.accuracyThreshold * 100).toFixed(1)}% |
{/if}
{#if qualityRequirements.availabilityTarget}
| Availability | ≥ {(qualityRequirements.availabilityTarget * 100).toFixed(2)}% |
{/if}
{/if}

{#if constraints}
### Constraints

{#if constraints.maxConcurrentTasks}
- **Max Concurrent Tasks:** {constraints.maxConcurrentTasks}
{/if}
{#if constraints.complianceFrameworks?.length}
- **Compliance:** {constraints.complianceFrameworks.join(', ')}
{/if}
{/if}

{/if}

---

## Metadata

- **Created:** {story.createdAt}
- **Created By:** {story.createdBy}
- **Tags:** {story.tags?.join(', ') || 'None'}

{#if notes}
### Notes

{story.notes}
{/if}
```

### Markdown Export Options

```typescript
interface MarkdownExportOptions {
  // Include extended sections (Full format only)
  includeBehavior?: boolean;      // default: true
  includeSkills?: boolean;        // default: true
  includeHumanCollab?: boolean;   // default: true
  includeAgentCollab?: boolean;   // default: true
  includeMemory?: boolean;        // default: true
  includeQuality?: boolean;       // default: true

  // Formatting
  includeTableOfContents?: boolean; // default: false
  includeMetadata?: boolean;        // default: true

  // Header customization
  headerLevel?: 1 | 2 | 3;          // default: 1
  frontmatter?: boolean;            // default: false (YAML frontmatter)
}
```

---

## JSON Export

### Schema

The JSON export produces a clean, machine-readable representation of the story.

```typescript
interface JsonExportOutput {
  $schema: string;  // JSON Schema URL for validation
  version: string;  // Export format version
  exportedAt: string;
  story: AgentStory;
}
```

### Example Output (Light Format)

```json
{
  "$schema": "https://agentstorybuilder.com/schemas/story-export-v1.json",
  "version": "1.0",
  "exportedAt": "2025-12-19T10:30:00Z",
  "story": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "format": "light",
    "version": "1.0",
    "createdAt": "2025-12-15T09:00:00Z",
    "updatedAt": "2025-12-19T10:00:00Z",
    "createdBy": "user-123",
    "identifier": "support-triage",
    "name": "Support Triage Agent",
    "role": "Support Triage Agent",
    "trigger": {
      "type": "message",
      "sourceAgents": ["support-gateway"],
      "protocol": "a2a"
    },
    "action": "classify the incoming support request by topic and urgency, then route to the appropriate specialized support queue",
    "outcome": "customers receive faster responses by being connected to the right team immediately",
    "autonomyLevel": "supervised",
    "tags": ["support", "triage", "routing"]
  }
}
```

### JSON Export Options

```typescript
interface JsonExportOptions {
  // Include schema reference
  includeSchema?: boolean;        // default: true

  // Formatting
  pretty?: boolean;               // default: true
  indent?: number;                // default: 2

  // Field selection
  excludeFields?: string[];       // Dot-notation paths to exclude
  includeMetadata?: boolean;      // default: true (id, createdAt, etc.)
}
```

---

## PDF Export (Phase 2)

### Design Goals

- Professional, presentation-ready documents
- Branded header/footer options
- Table of contents for long stories
- Syntax highlighting for code/expressions
- Page break control

### PDF Export Options

```typescript
interface PdfExportOptions {
  // Branding
  logo?: string;                  // URL or base64
  companyName?: string;
  headerText?: string;
  footerText?: string;

  // Layout
  pageSize?: 'letter' | 'a4';     // default: 'letter'
  orientation?: 'portrait' | 'landscape'; // default: 'portrait'
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Content
  includeTableOfContents?: boolean; // default: true for Full format
  includePageNumbers?: boolean;     // default: true

  // Styling
  theme?: 'light' | 'dark';         // default: 'light'
  accentColor?: string;             // hex color
}
```

---

## Export API

### Single Story Export

```
POST /api/stories/:id/export
Content-Type: application/json

Body: {
  format: 'markdown' | 'json' | 'pdf';
  options?: ExportOptions;
}

Response:
  - markdown: Content-Type: text/markdown
  - json: Content-Type: application/json
  - pdf: Content-Type: application/pdf

All responses include:
  Content-Disposition: attachment; filename="{identifier}.{ext}"
```

### Bulk Export

```
POST /api/stories/export
Content-Type: application/json

Body: {
  storyIds: string[];
  format: 'markdown' | 'json';
  options?: ExportOptions;
  archive?: boolean;  // default: true, creates ZIP for multiple stories
}

Response:
  - Single story: Direct file download
  - Multiple stories: application/zip
```

---

## Export Implementation

### Markdown Generator

```typescript
// /lib/export/markdown.ts

import { AgentStory, isFullFormat } from '@/lib/schemas';
import { AUTONOMY_LEVEL_METADATA } from '@/lib/schemas/story';

interface MarkdownExportOptions {
  includeBehavior?: boolean;
  includeSkills?: boolean;
  includeHumanCollab?: boolean;
  includeAgentCollab?: boolean;
  includeMemory?: boolean;
  includeQuality?: boolean;
  includeTableOfContents?: boolean;
  includeMetadata?: boolean;
  headerLevel?: 1 | 2 | 3;
  frontmatter?: boolean;
}

const defaultOptions: MarkdownExportOptions = {
  includeBehavior: true,
  includeSkills: true,
  includeHumanCollab: true,
  includeAgentCollab: true,
  includeMemory: true,
  includeQuality: true,
  includeTableOfContents: false,
  includeMetadata: true,
  headerLevel: 1,
  frontmatter: false,
};

export function exportToMarkdown(
  story: AgentStory,
  options: MarkdownExportOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  const h = (level: number) => '#'.repeat(opts.headerLevel! + level - 1);
  const lines: string[] = [];

  // Frontmatter (optional)
  if (opts.frontmatter) {
    lines.push('---');
    lines.push(`identifier: ${story.identifier}`);
    lines.push(`name: ${story.name}`);
    lines.push(`format: ${story.format}`);
    lines.push(`autonomyLevel: ${story.autonomyLevel}`);
    lines.push('---');
    lines.push('');
  }

  // Title and metadata block
  lines.push(`${h(1)} ${story.name}`);
  lines.push('');
  lines.push(`> **Identifier:** \`${story.identifier}\``);
  lines.push(`> **Format:** ${story.format}`);
  lines.push(`> **Autonomy Level:** ${AUTONOMY_LEVEL_METADATA[story.autonomyLevel].label}`);
  lines.push(`> **Last Updated:** ${formatDate(story.updatedAt)}`);
  lines.push('');

  // Core story
  lines.push(`${h(2)} Agent Story`);
  lines.push('');
  lines.push(`**As a** ${story.role}`);
  lines.push('');
  lines.push(`**triggered by** ${formatTrigger(story.trigger)}`);
  lines.push('');
  lines.push(`**I** ${story.action}`);
  lines.push('');
  lines.push(`**so that** ${story.outcome}`);
  lines.push('');

  // Autonomy section
  lines.push('---');
  lines.push('');
  lines.push(`${h(2)} Autonomy Level: ${AUTONOMY_LEVEL_METADATA[story.autonomyLevel].label}`);
  lines.push('');
  lines.push(AUTONOMY_LEVEL_METADATA[story.autonomyLevel].description);
  lines.push('');

  // Extended sections for Full format
  if (isFullFormat(story)) {
    if (opts.includeBehavior && story.behaviorConfig) {
      lines.push(...renderBehaviorSection(story.behaviorConfig, h));
    }
    if (opts.includeSkills && story.skillsInventory) {
      lines.push(...renderSkillsSection(story.skillsInventory, h));
    }
    if (opts.includeHumanCollab && story.humanCollaboration) {
      lines.push(...renderHumanCollabSection(story.humanCollaboration, h));
    }
    if (opts.includeAgentCollab && story.agentCollaboration) {
      lines.push(...renderAgentCollabSection(story.agentCollaboration, h));
    }
    if (opts.includeMemory && story.memoryArchitecture) {
      lines.push(...renderMemorySection(story.memoryArchitecture, h));
    }
    if (opts.includeQuality && (story.qualityRequirements || story.constraints)) {
      lines.push(...renderQualitySection(story.qualityRequirements, story.constraints, h));
    }
  }

  // Metadata footer
  if (opts.includeMetadata) {
    lines.push('---');
    lines.push('');
    lines.push(`${h(2)} Metadata`);
    lines.push('');
    lines.push(`- **Created:** ${formatDate(story.createdAt)}`);
    lines.push(`- **Created By:** ${story.createdBy}`);
    lines.push(`- **Tags:** ${story.tags?.join(', ') || 'None'}`);

    if (story.notes) {
      lines.push('');
      lines.push(`${h(3)} Notes`);
      lines.push('');
      lines.push(story.notes);
    }
  }

  return lines.join('\n');
}

function formatTrigger(trigger: Trigger): string {
  switch (trigger.type) {
    case 'message':
      return `message from [${trigger.sourceAgents.join(', ')}]`;
    case 'schedule':
      return `schedule (${trigger.cronExpression})`;
    case 'resource_change':
      return `${trigger.changeTypes.join('/')} on ${trigger.resourceType}`;
    case 'cascade':
      return `cascade from ${trigger.upstreamAgentId}`;
    case 'manual':
      return 'manual activation';
    default:
      return trigger.type;
  }
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Additional render functions for each section...
```

### JSON Generator

```typescript
// /lib/export/json.ts

import { AgentStory } from '@/lib/schemas';

interface JsonExportOptions {
  includeSchema?: boolean;
  pretty?: boolean;
  indent?: number;
  excludeFields?: string[];
  includeMetadata?: boolean;
}

const defaultOptions: JsonExportOptions = {
  includeSchema: true,
  pretty: true,
  indent: 2,
  includeMetadata: true,
};

export function exportToJson(
  story: AgentStory,
  options: JsonExportOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };

  let storyData = { ...story };

  // Remove excluded fields
  if (opts.excludeFields?.length) {
    storyData = removeFields(storyData, opts.excludeFields);
  }

  // Remove metadata if requested
  if (!opts.includeMetadata) {
    const { id, createdAt, updatedAt, createdBy, ...rest } = storyData;
    storyData = rest as AgentStory;
  }

  const output: JsonExportOutput = {
    ...(opts.includeSchema && {
      $schema: 'https://agentstorybuilder.com/schemas/story-export-v1.json',
    }),
    version: '1.0',
    exportedAt: new Date().toISOString(),
    story: storyData,
  };

  return opts.pretty
    ? JSON.stringify(output, null, opts.indent)
    : JSON.stringify(output);
}

function removeFields(obj: any, paths: string[]): any {
  const result = { ...obj };
  for (const path of paths) {
    const parts = path.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) break;
      current = current[parts[i]];
    }
    delete current[parts[parts.length - 1]];
  }
  return result;
}
```

---

## Export UI

### Export Button Menu

```
┌────────────────────┐
│ Export ▼           │
├────────────────────┤
│ 📄 Markdown        │
│ 📋 JSON            │
│ 📑 PDF (Pro)       │  ← Disabled/upgrade prompt in Phase 1
├────────────────────┤
│ ⚙️ Export Options   │
└────────────────────┘
```

### Export Options Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│ Export Options                                           [× Close]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ FORMAT                                                              │
│ ○ Markdown (.md)                                                    │
│ ● JSON (.json)                                                      │
│ ○ PDF (.pdf) [Coming Soon]                                          │
│                                                                     │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                     │
│ MARKDOWN OPTIONS (shown when Markdown selected)                     │
│ ☑ Include Table of Contents                                         │
│ ☑ Include Metadata                                                  │
│ ☐ Add YAML Frontmatter                                              │
│                                                                     │
│ SECTIONS TO INCLUDE                                                 │
│ ☑ Behavior Model                                                    │
│ ☑ Skills & Reasoning                                                │
│ ☑ Human Collaboration                                               │
│ ☑ Agent Collaboration                                               │
│ ☑ Memory Architecture                                               │
│ ☑ Quality & Constraints                                             │
│                                                                     │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                     │
│ JSON OPTIONS (shown when JSON selected)                             │
│ ☑ Include Schema Reference                                          │
│ ☑ Pretty Print                                                      │
│ ☑ Include Metadata (id, timestamps)                                 │
│                                                                     │
│                                         [Cancel] [Export]           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Bulk Export Flow

### UF-E001: Export Multiple Stories

**Flow:**
1. User selects multiple stories in Library (checkboxes)
2. User clicks "Export Selected" from bulk actions
3. System shows export format selection
4. User selects format and options
5. System generates exports for each story
6. System creates ZIP archive with:
   - Individual files named `{identifier}.{ext}`
   - `manifest.json` with export metadata
7. Browser downloads ZIP file

### Manifest Format

```json
{
  "exportedAt": "2025-12-19T10:30:00Z",
  "format": "markdown",
  "storyCount": 5,
  "stories": [
    {
      "identifier": "support-triage",
      "name": "Support Triage Agent",
      "filename": "support-triage.md"
    },
    {
      "identifier": "order-processor",
      "name": "Order Processing Agent",
      "filename": "order-processor.md"
    }
  ]
}
```

---

## Performance Requirements

| Operation | Target |
|-----------|--------|
| Single story export (MD/JSON) | < 100ms |
| Single story export (PDF) | < 2s |
| Bulk export (10 stories, MD) | < 500ms |
| Bulk export (50 stories, ZIP) | < 5s |

---

## Error Handling

### Export Failures

- Show toast with error message
- Offer retry option
- Log error for debugging

### Partial Bulk Export Failures

- Complete successful exports
- Include `errors.json` in ZIP with failed story IDs and reasons
- Show summary: "Exported 8 of 10 stories. 2 failed."
