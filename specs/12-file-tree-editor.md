# File-Tree Based Agent Editor

## Overview

Replace the current form-heavy, nested-tab approach with a file-tree based editor that mirrors how agents are actually deployed. This follows the [AGENTS.md](https://agents.md/) standard and provides a familiar IDE-like experience.

### Goals

1. **File-first mental model**: Users edit files, not forms
2. **Match deployment reality**: The file tree IS what gets pushed to GitHub
3. **Context-aware chat**: Chat knows which file you're editing
4. **Minimal friction**: Start with 1-2 files, grow as needed
5. **AGENTS.md compatible**: Follow the emerging ecosystem standard

### Non-Goals

- Full IDE functionality (syntax highlighting, git integration)
- Real-time collaboration
- File system access (we're simulating a file system in the UI)

---

## Directory Structure

### Standard Agent Layout

```
my-agent/
├── AGENTS.md           # Agent identity, purpose, guardrails
├── skills/
│   ├── skill-name/
│   │   ├── SKILL.md    # Skill definition (YAML frontmatter + markdown)
│   │   ├── scripts/    # Optional executable code
│   │   └── references/ # Optional supporting docs
│   └── another-skill/
│       └── SKILL.md
├── tools/
│   └── mcp-servers.json  # MCP server configurations
└── .agentstories/
    └── config.json       # AgentStories metadata (internal)
```

### File Purposes

| File | Content Type | Purpose |
|------|-------------|---------|
| `AGENTS.md` | Markdown | Agent identity, purpose, autonomy, high-level guardrails |
| `skills/*/SKILL.md` | YAML + Markdown | Individual skill definitions |
| `tools/mcp-servers.json` | JSON | MCP server tool configurations |
| `.agentstories/config.json` | JSON | Internal metadata (id, version, timestamps) |

---

## AGENTS.md Format

Based on the AGENTS.md standard, adapted for our use:

```markdown
# Customer Support Agent

## Purpose
Handle customer inquiries, process refunds, and escalate complex issues.

## Autonomy
Supervised - operates independently but escalates edge cases.

## Guardrails
- Never share customer PII externally
- Always verify identity before account changes
- Escalate after 2 failed resolution attempts

## Human Interaction
- Mode: on-the-loop
- Escalation: Slack #support-escalations

## Collaboration
- Reports to: support-supervisor
- Peers: billing-agent, shipping-agent

## Memory
- Persistent: customer-history (vector store)
- Learning: feedback-loop from resolution ratings

## Tags
customer-service, tier-1, refunds
```

### AGENTS.md Sections (all optional except name)

| Section | Maps to Schema | Notes |
|---------|---------------|-------|
| `# {Name}` | `name` | H1 heading is the agent name |
| `## Purpose` | `purpose` | Why this agent exists |
| `## Autonomy` | `autonomyLevel` | full/supervised/collaborative/directed |
| `## Role` | `role` | What role the agent fulfills |
| `## Guardrails` | `guardrails[]` | Bullet list of constraints |
| `## Human Interaction` | `humanInteraction` | Mode, escalation config |
| `## Collaboration` | `collaboration` | Multi-agent setup |
| `## Memory` | `memory` | Working/persistent/learning config |
| `## Tags` | `tags` | Comma-separated list |
| `## Notes` | `notes` | Freeform notes |

---

## UI Layout

### Three-Panel Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Agent: Customer Support Bot                           [Test] [Generate] [⋮] │
├──────────────┬──────────────────────────────────┬───────────────────────────┤
│ FILES        │ AGENTS.md                    [×] │ CHAT                      │
│              │                                  │                           │
│ ▼ my-agent/  │ # Customer Support Agent         │ What would you like to    │
│   AGENTS.md ◀│                                  │ change?                   │
│   ▶ skills/  │ ## Purpose                       │                           │
│   ▶ tools/   │ Handle customer inquiries...     │ ─────────────────────────│
│              │                                  │                           │
│ ─────────────│ ## Autonomy                      │ [Context: AGENTS.md]      │
│ [+ New File] │ Supervised                       │                           │
│              │                                  │ ┌─────────────────────┐   │
│              │ ## Guardrails                    │ │ Add a guardrail for │   │
│              │ - Never share PII                │ │ rate limiting...    │   │
│              │ - Verify identity first          │ └─────────────────────┘   │
│              │                                  │ [Send]                    │
├──────────────┴──────────────────────────────────┴───────────────────────────┤
│ Auto-saved • Last change: 2 minutes ago                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Panel Behavior

#### File Tree (Left Panel)
- Collapsible folders
- Click file to open in editor
- Right-click for context menu (rename, delete, duplicate)
- [+ New File] button creates file with template
- Drag-and-drop to reorganize

#### Editor (Center Panel)
- Markdown editor for .md files
- JSON editor for .json files
- Tab bar for multiple open files
- Auto-save on blur/delay

#### Chat (Right Panel)
- Always visible (resizable)
- Shows current context: which file is active
- Chat is scoped to the active file
- Can toggle between file-scoped and agent-scoped chat

### Chat Context Rules

| Active File | Chat Scope | Behavior |
|-------------|-----------|----------|
| `AGENTS.md` | Agent-level | Can create/modify skills, update identity |
| `skills/*/SKILL.md` | Skill-level | Modifies that specific skill |
| `tools/*.json` | Tools | Updates tool configurations |
| None/root | Agent-level | Orchestrates all files |

### Context Indicator

```
┌─────────────────────────────────────┐
│ 💬 Editing: skills/refunds/SKILL.md │
│ [Switch to Agent scope ↗]           │
└─────────────────────────────────────┘
```

---

## File Operations

### Creating Files

**New Skill:**
1. User clicks [+ New File] or types in chat "add a skill for X"
2. Creates `skills/{slug}/SKILL.md` with template
3. Opens file in editor

**Skill Template:**
```markdown
---
name: new-skill
description: Describe what this skill does
---

# New Skill

## Triggers
- Type: manual
- Description: When to invoke this skill

## Behavior
1. First step
2. Second step

## Success Criteria
- Skill completed successfully
```

### Deleting Files

- Right-click → Delete
- Confirmation dialog
- Chat: "delete the refunds skill" → confirms before deleting

### Renaming/Moving

- Right-click → Rename
- Updates all internal references
- Chat: "rename ticket-triage to issue-classifier"

---

## Data Model Changes

### AgentStory → AgentFiles

Transform the current `AgentStory` schema into a virtual file system:

```typescript
interface AgentFileSystem {
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

interface AgentFile {
  path: string;           // e.g., "AGENTS.md", "skills/refunds/SKILL.md"
  content: string;        // File content (markdown, JSON)
  type: 'agents' | 'skill' | 'mcp-config' | 'config';
  lastModified: string;
}
```

### Serialization

**AgentStory → AgentFiles:**
```typescript
function storyToFiles(story: AgentStory): AgentFile[] {
  const files: AgentFile[] = [];

  // AGENTS.md from agent identity
  files.push({
    path: 'AGENTS.md',
    content: generateAgentsMd(story),
    type: 'agents',
    lastModified: story.updatedAt
  });

  // SKILL.md for each skill
  for (const skill of story.skills || []) {
    const slug = generateSlug(skill.name);
    files.push({
      path: `skills/${slug}/SKILL.md`,
      content: generateSkillMd(skill),
      type: 'skill',
      lastModified: story.updatedAt
    });
  }

  // MCP config if tools exist
  if (story.skills?.some(s => s.tools?.length)) {
    files.push({
      path: 'tools/mcp-servers.json',
      content: generateMcpConfig(story),
      type: 'mcp-config',
      lastModified: story.updatedAt
    });
  }

  return files;
}
```

**AgentFiles → AgentStory:**
```typescript
function filesToStory(files: AgentFile[], metadata: AgentFileSystem['metadata']): AgentStory {
  const agentFile = files.find(f => f.path === 'AGENTS.md');
  const skillFiles = files.filter(f => f.type === 'skill');

  const agent = parseAgentsMd(agentFile?.content || '');
  const skills = skillFiles.map(f => parseSkillMd(f.content));

  return {
    id: metadata.id,
    version: metadata.version,
    ...agent,
    skills,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
}
```

---

## Chat Integration

### IMPORTANT: Always Use Structured JSON Prompts

The chat system MUST always use the structured JSON system prompt, regardless of which file is selected. This ensures:

1. **Skills are always created properly** - If user asks "add a skill" while editing a file, the skill still gets created
2. **Consistent LLM responses** - The LLM always returns JSON that can be parsed into file actions
3. **No scope confusion** - User doesn't need to know about file vs agent scope

**Never use a simple markdown prompt** that tells the LLM to return markdown. This breaks skill/file creation because:
- The LLM returns markdown instead of JSON
- JSON parsing fails
- Skills never get created
- Files don't appear in the tree

When a file is selected, append a note to the structured prompt indicating which file is active, so the LLM can include it in the `files` array if the user wants to edit it.

```typescript
// CORRECT: Always use structured JSON prompt
function buildSystemPrompt() {
  let prompt = buildStructuredSystemPrompt(agentName, fileList, currentAgent, fileContents);

  if (contextFile) {
    prompt += `\n\nNOTE: User has "${contextFile.path}" selected. Include in "files" array if they want to edit it.`;
  }

  return prompt;
}

// WRONG: Don't use simple markdown prompts - breaks skill creation!
// if (contextFile) {
//   return `You are editing ${contextFile.path}. Return markdown.`;  // DON'T DO THIS
// }
```

### Context-Aware Prompts

```typescript
function buildChatContext(activeFile: AgentFile | null, allFiles: AgentFile[]): string {
  if (!activeFile) {
    // Agent-level context
    return `You are editing an agent. Files:
${allFiles.map(f => `- ${f.path}`).join('\n')}

Help the user create, modify, or delete files.`;
  }

  if (activeFile.type === 'skill') {
    return `You are editing the skill at ${activeFile.path}.

Current content:
${activeFile.content}

Help the user modify this skill. For changes outside this skill, suggest switching context.`;
  }

  return `You are editing ${activeFile.path}.

Current content:
${activeFile.content}`;
}
```

### Chat Actions

Chat can trigger file operations:

```typescript
interface ChatAction {
  type: 'create_file' | 'update_file' | 'delete_file' | 'rename_file';
  path: string;
  content?: string;
  newPath?: string;  // for rename
}
```

The extraction API returns both a response AND optional actions:

```typescript
interface ChatResponse {
  message: string;
  actions?: ChatAction[];
}
```

---

## Implementation Components

### FileTree Component

```typescript
interface FileTreeProps {
  files: AgentFile[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
}
```

### FileEditor Component

```typescript
interface FileEditorProps {
  file: AgentFile;
  onChange: (content: string) => void;
  onClose: () => void;
}
```

### AgentChat Component

```typescript
interface AgentChatProps {
  files: AgentFile[];
  activeFile: AgentFile | null;
  onAction: (action: ChatAction) => void;
}
```

### AgentWorkspace Component (Container)

```typescript
interface AgentWorkspaceProps {
  agentId: string;
}

function AgentWorkspace({ agentId }: AgentWorkspaceProps) {
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>('AGENTS.md');
  const [openFiles, setOpenFiles] = useState<string[]>(['AGENTS.md']);

  // ... file operations, chat integration, auto-save
}
```

---

## Migration

### Existing Stories

When opening an existing `AgentStory`:
1. Convert to `AgentFileSystem` using `storyToFiles()`
2. Display in new file-tree UI
3. On save, convert back using `filesToStory()`

### Backward Compatibility

- The underlying data model (`AgentStory`) remains unchanged
- File representation is a view layer transformation
- Export/import still works with existing formats

---

## New Agent Flow

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ New Agent                                                                    │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ FILES        │                                                              │
│              │     Start by describing your agent                           │
│ (empty)      │                                                              │
│              │     ┌────────────────────────────────────────────────────┐   │
│              │     │ I need an agent that handles customer support      │   │
│              │     │ tickets, classifies them, and routes to the right │   │
│              │     │ team...                                            │   │
│              │     └────────────────────────────────────────────────────┘   │
│              │     [Create Agent]                                           │
│              │                                                              │
│              │     Or start from a template:                                │
│              │     • Customer Service Agent                                 │
│              │     • Data Processing Pipeline                               │
│              │     • Research Assistant                                     │
│              │                                                              │
├──────────────┴──────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────────┘
```

### After Initial Creation

Chat creates `AGENTS.md` and initial skills based on description.

---

## Implementation Order

1. **Data layer** (`/lib/agent-files/`)
   - `storyToFiles()` and `filesToStory()` transformations
   - `generateAgentsMd()` and `parseAgentsMd()`
   - `generateSkillMd()` and `parseSkillMd()`

2. **FileTree component** (`/components/agent-workspace/file-tree.tsx`)
   - Tree rendering with expand/collapse
   - Selection handling
   - Context menu for operations

3. **FileEditor component** (`/components/agent-workspace/file-editor.tsx`)
   - Markdown editor (simple textarea initially)
   - JSON editor with validation
   - Tab bar for multiple files

4. **AgentChat component** (`/components/agent-workspace/agent-chat.tsx`)
   - Context-aware system prompts
   - Action extraction and execution
   - Scope indicator

5. **AgentWorkspace container** (`/components/agent-workspace/index.tsx`)
   - Panel layout with resizable panes
   - State management for files
   - Auto-save logic

6. **Route update** (`/app/stories/[id]/page.tsx`)
   - Replace current tabbed interface with AgentWorkspace
   - Keep Test and Generate as header actions

---

## Open Questions

1. **Should we support real markdown preview?** Start with raw edit, add preview toggle later.

2. **How to handle conflicts between AGENTS.md and SKILL.md guardrails?** AGENTS.md takes precedence.

3. **Should chat be collapsible?** Yes, with a toggle button.

4. **Multi-file operations?** "Add tests to all skills" - iterate through files.
