# Agent Harness Adapters & GitHub Integration

## Overview

This specification defines how Agent Stories can export agent definitions to various runtime harnesses (Claude, Letta, OpenAI Assistants, LangGraph, CrewAI) and publish them to GitHub repositories. The goal is to make Agent Stories a **design-time tool** that produces **runtime-ready artifacts** for multiple agent frameworks.

### Goals

1. **GitHub Publishing**: Push agent.md + skills to a GitHub repository
2. **Harness Adapters**: Generate framework-specific configurations from Agent Stories
3. **Try It**: Allow users to test their agents in supported harnesses directly from the UI

### Non-Goals

- Hosting agent runtimes (we generate configs, not run agents)
- Real-time synchronization with harnesses
- Supporting every possible agent framework (start with high-value targets)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AGENT STORIES                                     │
│                          (Design-Time Tool)                                  │
│                                                                              │
│  ┌──────────────────┐    ┌───────────────┐    ┌─────────────────────────┐   │
│  │ Agent Story +    │ →  │ Validation &  │ →  │ Normalized Agent Model  │   │
│  │ Skills (Zod)     │    │ Completeness  │    │ (Ready for export)      │   │
│  └──────────────────┘    └───────────────┘    └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   GitHub    │ │  Harness    │ │  "Try It"   │
            │  Publisher  │ │  Adapters   │ │   Launcher  │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │  Git Repo   │ │  Downloads  │ │  External   │
            │  Push       │ │  (ZIP/Files)│ │  Harness UI │
            └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Part 1: GitHub Publishing

### 1.1 Repository Structure

When publishing to GitHub, generate the following structure:

```
agent-name/
├── README.md              # Auto-generated agent overview
├── agent.md               # Agent definition (AgentSkills.io compatible)
├── skills/
│   ├── skill-one/
│   │   ├── SKILL.md
│   │   ├── scripts/       # If skill has scripts
│   │   └── references/    # If skill has references
│   ├── skill-two/
│   │   └── SKILL.md
│   └── ...
├── harnesses/             # Generated harness configs
│   ├── claude/
│   │   └── CLAUDE.md
│   ├── openai/
│   │   └── assistant.json
│   ├── letta/
│   │   └── agent.json
│   └── ...
└── .agentstories/
    └── source.json        # Original Agent Stories data (for round-trip)
```

### 1.2 GitHub Integration

#### Authentication

```typescript
interface GitHubAuth {
  type: 'oauth' | 'pat';
  token: string;
  scope: string[];  // Required: repo, workflow (optional)
}
```

Support both:
- **OAuth App flow**: User clicks "Connect GitHub", authorizes, we store token
- **Personal Access Token**: User pastes PAT for simpler setup

#### Repository Selection

```typescript
interface GitHubPublishOptions {
  // Target repository
  owner: string;           // GitHub username or org
  repo: string;            // Repository name
  branch?: string;         // Default: 'main'
  path?: string;           // Subdirectory path (default: root)

  // Commit options
  commitMessage?: string;  // Default: "Update agent: {agent.name}"
  createPr?: boolean;      // Create PR instead of direct push
  prTitle?: string;
  prBody?: string;

  // Content options
  includeHarnesses?: string[];  // Which harness configs to include
  includeSource?: boolean;      // Include .agentstories/source.json
}
```

#### Publish Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Publish to GitHub                                                    [Close] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔗 Connected as: @jeffrschneider                        [Disconnect]     │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ REPOSITORY                                                                   │
│ ┌────────────────────────────┐ / ┌────────────────────────────────────────┐ │
│ │ jeffrschneider         ▼   │   │ my-agent-library                   ▼   │ │
│ └────────────────────────────┘   └────────────────────────────────────────┘ │
│                                  [+ Create new repository]                   │
│                                                                              │
│ PATH (optional)                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ agents/support-triage                                                    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ℹ️ Leave empty to publish to repository root                                 │
│                                                                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ HARNESS CONFIGS TO INCLUDE                                                   │
│ ☑ Claude (CLAUDE.md)                                                         │
│ ☑ OpenAI Assistants (assistant.json)                                         │
│ ☐ Letta (agent.json)                                                         │
│ ☐ LangGraph (agent.py)                                                       │
│ ☐ CrewAI (agents.yaml)                                                       │
│                                                                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ ○ Push directly to main                                                      │
│ ● Create Pull Request                                                        │
│                                                                              │
│ PR Title                                                                     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Add Support Triage Agent                                                 │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                                              [Cancel]  [Publish to GitHub]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Generated README.md

Auto-generate a README for the agent:

```markdown
# {Agent Name}

> {Agent Story: As a... triggered by... I... so that...}

## Overview

- **Autonomy Level**: {level}
- **Skills**: {count}
- **Domain**: {primary domain}

## Skills

| Skill | Domain | Description |
|-------|--------|-------------|
| {name} | {domain} | {description} |
| ... | ... | ... |

## Quick Start

### Claude Code

Copy `harnesses/claude/CLAUDE.md` to your project root.

### OpenAI Assistants

Import `harnesses/openai/assistant.json` via the OpenAI API.

### Letta

```bash
letta agent import harnesses/letta/agent.json
```

## Source

This agent was designed in [Agent Stories](https://agentstories.io).
The original source is available in `.agentstories/source.json`.
```

---

## Part 2: Harness Adapters

### 2.1 Adapter Interface

All harness adapters implement a common interface:

```typescript
// /lib/harnesses/types.ts

import { AgentStory, Skill } from '@/lib/schemas';

interface HarnessAdapter {
  /** Unique identifier for this harness */
  id: string;

  /** Display name */
  name: string;

  /** Description for UI */
  description: string;

  /** Icon identifier (lucide icon name) */
  icon: string;

  /** Website URL */
  url: string;

  /** Check if an agent/skill can be exported to this harness */
  canExport(story: AgentStory): HarnessCompatibility;

  /** Generate harness-specific configuration */
  generate(story: AgentStory): HarnessOutput;

  /** Get "Try It" launch configuration (if supported) */
  getTryItConfig?(story: AgentStory): TryItConfig | null;
}

interface HarnessCompatibility {
  compatible: boolean;
  warnings: string[];
  missingFeatures: string[];  // Features we have that harness can't support
  unsupportedFeatures: string[];  // Features harness needs that we don't have
}

interface HarnessOutput {
  files: Array<{
    path: string;      // Relative path within harness directory
    content: string;   // File content
    encoding?: 'utf-8' | 'base64';
  }>;
  instructions?: string;  // Setup instructions for user
  warnings: string[];
}

interface TryItConfig {
  type: 'url' | 'cli' | 'api';

  // For type: 'url'
  launchUrl?: string;

  // For type: 'cli'
  command?: string;

  // For type: 'api'
  endpoint?: string;
  payload?: Record<string, unknown>;
}
```

### 2.2 Claude Adapter

Generates `CLAUDE.md` and MCP tool definitions.

```typescript
// /lib/harnesses/claude.ts

import { HarnessAdapter, HarnessOutput } from './types';
import { AgentStory, Skill } from '@/lib/schemas';

export const claudeAdapter: HarnessAdapter = {
  id: 'claude',
  name: 'Claude Code',
  description: 'Generate CLAUDE.md for Claude Code CLI',
  icon: 'Terminal',
  url: 'https://docs.anthropic.com/claude-code',

  canExport(story) {
    const warnings: string[] = [];
    const missingFeatures: string[] = [];

    // Claude doesn't have built-in memory/state management
    if (story.format === 'full' && story.memoryArchitecture) {
      missingFeatures.push('Persistent memory (use external store)');
    }

    // Claude doesn't have native scheduling
    const hasScheduleTriggers = story.skills?.some(s =>
      s.triggers.some(t => t.type === 'schedule')
    );
    if (hasScheduleTriggers) {
      warnings.push('Schedule triggers require external orchestration');
    }

    return {
      compatible: true,
      warnings,
      missingFeatures,
      unsupportedFeatures: []
    };
  },

  generate(story) {
    const files: HarnessOutput['files'] = [];
    const warnings: string[] = [];

    // Generate CLAUDE.md
    const claudeMd = generateClaudeMd(story);
    files.push({
      path: 'CLAUDE.md',
      content: claudeMd
    });

    // Generate MCP tool definitions if we have tools
    const allTools = story.skills?.flatMap(s => s.tools || []) || [];
    if (allTools.length > 0) {
      const mcpConfig = generateMcpConfig(allTools);
      files.push({
        path: 'mcp-tools.json',
        content: JSON.stringify(mcpConfig, null, 2)
      });
    }

    // Generate slash commands from skills
    if (story.skills?.length) {
      for (const skill of story.skills) {
        const command = generateSlashCommand(skill);
        files.push({
          path: `.claude/commands/${skill.portability?.slug || generateSlug(skill.name)}.md`,
          content: command
        });
      }
    }

    return { files, warnings };
  },

  getTryItConfig(story) {
    // Claude Code is a CLI tool - provide instructions
    return {
      type: 'cli',
      command: `claude --project . "Act as: ${story.name}"`
    };
  }
};

function generateClaudeMd(story: AgentStory): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${story.name}\n`);

  // Identity/Persona
  sections.push('## Identity\n');
  sections.push(`You are a ${story.role}.\n`);
  sections.push(`Your purpose: ${story.outcome}\n`);

  // Autonomy guidance
  sections.push('## Autonomy Level\n');
  sections.push(getAutonomyGuidance(story.autonomyLevel));
  sections.push('');

  // Skills as capabilities
  if (story.skills?.length) {
    sections.push('## Capabilities\n');
    for (const skill of story.skills) {
      sections.push(`### ${skill.name}\n`);
      sections.push(`${skill.description}\n`);

      // Triggers become "when to use"
      if (skill.triggers?.length) {
        sections.push('**When to use:**');
        for (const trigger of skill.triggers) {
          sections.push(`- ${trigger.description}`);
        }
        sections.push('');
      }

      // Behavior becomes instructions
      if (skill.behavior) {
        sections.push('**How to execute:**');
        switch (skill.behavior.model) {
          case 'sequential':
            skill.behavior.steps.forEach((step, i) => {
              sections.push(`${i + 1}. ${step}`);
            });
            break;
          case 'workflow':
            for (const stage of skill.behavior.stages) {
              sections.push(`- **${stage.name}**: ${stage.purpose}`);
            }
            break;
          case 'adaptive':
            sections.push('Choose from these approaches based on context:');
            skill.behavior.capabilities.forEach(c => sections.push(`- ${c}`));
            break;
        }
        sections.push('');
      }

      // Acceptance criteria become success conditions
      if (skill.acceptance?.successConditions?.length) {
        sections.push('**Success criteria:**');
        skill.acceptance.successConditions.forEach(c => sections.push(`- ${c}`));
        sections.push('');
      }
    }
  }

  // Guardrails
  const allGuardrails = story.skills?.flatMap(s => s.guardrails || []) || [];
  if (allGuardrails.length > 0) {
    sections.push('## Guardrails\n');
    sections.push('You MUST follow these constraints:\n');
    for (const g of allGuardrails) {
      sections.push(`- **${g.name}**: ${g.constraint}`);
    }
    sections.push('');
  }

  // Tools
  const allTools = story.skills?.flatMap(s => s.tools || []) || [];
  if (allTools.length > 0) {
    sections.push('## Available Tools\n');
    for (const tool of allTools) {
      sections.push(`- **${tool.name}**: ${tool.purpose}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

function getAutonomyGuidance(level: string): string {
  switch (level) {
    case 'autonomous':
      return 'You operate independently. Make decisions and take actions without asking for confirmation unless the situation involves significant risk or ambiguity.';
    case 'supervised':
      return 'You can take routine actions independently, but must check in with the user for significant decisions or when unsure.';
    case 'assistive':
      return 'You provide recommendations and drafts, but wait for user approval before taking actions.';
    case 'passive':
      return 'You only respond when directly asked. Provide information but do not take actions.';
    default:
      return 'Follow user instructions and ask for clarification when needed.';
  }
}

function generateMcpConfig(tools: Skill['tools']): object {
  // Generate MCP server configuration stub
  return {
    mcpServers: {
      'agent-tools': {
        command: 'npx',
        args: ['-y', '@agentstories/mcp-tools'],
        tools: tools?.map(t => ({
          name: t.name,
          description: t.purpose,
          inputSchema: {
            type: 'object',
            properties: {},
            // Would need to derive from skill inputs
          }
        }))
      }
    }
  };
}

function generateSlashCommand(skill: Skill): string {
  const lines: string[] = [];

  lines.push(`# ${skill.name}`);
  lines.push('');
  lines.push(skill.description);
  lines.push('');

  if (skill.behavior?.model === 'sequential') {
    lines.push('## Steps');
    skill.behavior.steps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
  }

  if (skill.inputs?.length) {
    lines.push('');
    lines.push('## Inputs');
    for (const input of skill.inputs) {
      lines.push(`- **${input.name}** (${input.type}): ${input.description}`);
    }
  }

  return lines.join('\n');
}
```

### 2.3 OpenAI Assistants Adapter

Generates `assistant.json` for OpenAI Assistants API.

```typescript
// /lib/harnesses/openai.ts

import { HarnessAdapter } from './types';
import { AgentStory, Skill } from '@/lib/schemas';

export const openaiAdapter: HarnessAdapter = {
  id: 'openai',
  name: 'OpenAI Assistants',
  description: 'Generate configuration for OpenAI Assistants API',
  icon: 'Bot',
  url: 'https://platform.openai.com/docs/assistants',

  canExport(story) {
    const warnings: string[] = [];
    const missingFeatures: string[] = [];

    // OpenAI has limited tool types
    const allTools = story.skills?.flatMap(s => s.tools || []) || [];
    const unsupportedTools = allTools.filter(t =>
      !['code_interpreter', 'retrieval', 'function'].includes(t.type || 'function')
    );
    if (unsupportedTools.length > 0) {
      warnings.push(`Some tools will be converted to functions: ${unsupportedTools.map(t => t.name).join(', ')}`);
    }

    return {
      compatible: true,
      warnings,
      missingFeatures,
      unsupportedFeatures: []
    };
  },

  generate(story) {
    const systemPrompt = buildSystemPrompt(story);
    const tools = buildTools(story);

    const assistant = {
      name: story.name,
      description: story.action,
      model: 'gpt-4-turbo-preview',
      instructions: systemPrompt,
      tools,
      metadata: {
        source: 'agentstories',
        identifier: story.identifier,
        autonomyLevel: story.autonomyLevel
      }
    };

    return {
      files: [{
        path: 'assistant.json',
        content: JSON.stringify(assistant, null, 2)
      }],
      instructions: `
## Setup Instructions

1. Create the assistant via API:
   \`\`\`bash
   curl https://api.openai.com/v1/assistants \\
     -H "Authorization: Bearer $OPENAI_API_KEY" \\
     -H "Content-Type: application/json" \\
     -H "OpenAI-Beta: assistants=v2" \\
     -d @assistant.json
   \`\`\`

2. Or import via the OpenAI Playground UI.
      `,
      warnings: []
    };
  },

  getTryItConfig(story) {
    return {
      type: 'url',
      launchUrl: 'https://platform.openai.com/playground?mode=assistant'
    };
  }
};

function buildSystemPrompt(story: AgentStory): string {
  const sections: string[] = [];

  sections.push(`You are ${story.role}.`);
  sections.push('');
  sections.push(`Your goal: ${story.outcome}`);
  sections.push('');

  // Add skill instructions
  if (story.skills?.length) {
    sections.push('## Your Capabilities\n');
    for (const skill of story.skills) {
      sections.push(`### ${skill.name}`);
      sections.push(skill.description);

      if (skill.behavior?.model === 'sequential') {
        sections.push('\nSteps:');
        skill.behavior.steps.forEach((step, i) => {
          sections.push(`${i + 1}. ${step}`);
        });
      }
      sections.push('');
    }
  }

  // Add guardrails
  const guardrails = story.skills?.flatMap(s => s.guardrails || []) || [];
  if (guardrails.length > 0) {
    sections.push('## Constraints\n');
    for (const g of guardrails) {
      sections.push(`- ${g.constraint}`);
    }
  }

  return sections.join('\n');
}

function buildTools(story: AgentStory): object[] {
  const tools: object[] = [];

  // Add code interpreter if any skill uses it
  const usesCodeInterpreter = story.skills?.some(s =>
    s.tools?.some(t => t.name.toLowerCase().includes('code') || t.name.toLowerCase().includes('python'))
  );
  if (usesCodeInterpreter) {
    tools.push({ type: 'code_interpreter' });
  }

  // Add retrieval if any skill needs document access
  const usesRetrieval = story.skills?.some(s =>
    s.tools?.some(t => t.name.toLowerCase().includes('search') || t.name.toLowerCase().includes('document'))
  );
  if (usesRetrieval) {
    tools.push({ type: 'retrieval' });
  }

  // Convert skill inputs to function tools
  for (const skill of story.skills || []) {
    if (skill.inputs?.length) {
      tools.push({
        type: 'function',
        function: {
          name: skill.portability?.slug || generateSlug(skill.name),
          description: skill.description,
          parameters: {
            type: 'object',
            properties: Object.fromEntries(
              skill.inputs.map(input => [
                input.name,
                {
                  type: mapTypeToJsonSchema(input.type),
                  description: input.description
                }
              ])
            ),
            required: skill.inputs
              .filter(i => i.required !== false)
              .map(i => i.name)
          }
        }
      });
    }
  }

  return tools;
}

function mapTypeToJsonSchema(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'integer': 'integer',
    'boolean': 'boolean',
    'array': 'array',
    'object': 'object'
  };
  return typeMap[type.toLowerCase()] || 'string';
}
```

### 2.4 Letta Adapter

Generates configuration for Letta (formerly MemGPT).

```typescript
// /lib/harnesses/letta.ts

import { HarnessAdapter } from './types';
import { AgentStory } from '@/lib/schemas';

export const lettaAdapter: HarnessAdapter = {
  id: 'letta',
  name: 'Letta',
  description: 'Generate configuration for Letta (MemGPT) agents',
  icon: 'Brain',
  url: 'https://docs.letta.com',

  canExport(story) {
    return {
      compatible: true,
      warnings: [],
      missingFeatures: [],
      unsupportedFeatures: []
    };
  },

  generate(story) {
    const persona = buildPersona(story);
    const human = buildHumanDescription();
    const tools = buildLettaTools(story);

    const agentConfig = {
      name: story.identifier,
      persona,
      human,
      tools,
      system: buildSystemMessage(story),
      preset: 'memgpt_chat',
      metadata: {
        source: 'agentstories',
        autonomyLevel: story.autonomyLevel
      }
    };

    return {
      files: [{
        path: 'agent.json',
        content: JSON.stringify(agentConfig, null, 2)
      }],
      instructions: `
## Setup Instructions

1. Install Letta CLI:
   \`\`\`bash
   pip install letta
   \`\`\`

2. Import the agent:
   \`\`\`bash
   letta agent create --config agent.json
   \`\`\`

3. Start chatting:
   \`\`\`bash
   letta chat --agent ${story.identifier}
   \`\`\`
      `,
      warnings: []
    };
  },

  getTryItConfig(story) {
    return {
      type: 'cli',
      command: `letta chat --agent ${story.identifier}`
    };
  }
};

function buildPersona(story: AgentStory): string {
  const lines: string[] = [];

  lines.push(`I am ${story.role}.`);
  lines.push('');
  lines.push(`My purpose is to ${story.action} so that ${story.outcome}.`);
  lines.push('');

  if (story.skills?.length) {
    lines.push('My skills include:');
    for (const skill of story.skills) {
      lines.push(`- ${skill.name}: ${skill.description}`);
    }
  }

  return lines.join('\n');
}

function buildHumanDescription(): string {
  return 'The user is someone who needs assistance with tasks within my capabilities.';
}

function buildSystemMessage(story: AgentStory): string {
  const guardrails = story.skills?.flatMap(s => s.guardrails || []) || [];

  if (guardrails.length === 0) {
    return '';
  }

  const lines = ['You must follow these rules:'];
  for (const g of guardrails) {
    lines.push(`- ${g.constraint}`);
  }
  return lines.join('\n');
}

function buildLettaTools(story: AgentStory): object[] {
  const tools: object[] = [];

  for (const skill of story.skills || []) {
    if (skill.inputs?.length) {
      tools.push({
        name: skill.portability?.slug || generateSlug(skill.name),
        description: skill.description,
        parameters: skill.inputs.map(input => ({
          name: input.name,
          type: input.type,
          required: input.required !== false,
          description: input.description
        })),
        returns: skill.outputs?.map(output => ({
          name: output.name,
          type: output.type,
          description: output.description
        })) || []
      });
    }
  }

  return tools;
}
```

### 2.5 LangGraph Adapter

Generates Python code for LangGraph.

```typescript
// /lib/harnesses/langgraph.ts

import { HarnessAdapter } from './types';
import { AgentStory, Skill } from '@/lib/schemas';

export const langgraphAdapter: HarnessAdapter = {
  id: 'langgraph',
  name: 'LangGraph',
  description: 'Generate Python code for LangGraph agents',
  icon: 'GitBranch',
  url: 'https://langchain-ai.github.io/langgraph/',

  canExport(story) {
    return {
      compatible: true,
      warnings: ['Generated code is a starting template - implement tool functions'],
      missingFeatures: [],
      unsupportedFeatures: []
    };
  },

  generate(story) {
    const agentPy = generateAgentPython(story);
    const toolsPy = generateToolsPython(story);
    const requirementsTxt = generateRequirements();

    return {
      files: [
        { path: 'agent.py', content: agentPy },
        { path: 'tools.py', content: toolsPy },
        { path: 'requirements.txt', content: requirementsTxt }
      ],
      instructions: `
## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. Set your API key:
   \`\`\`bash
   export OPENAI_API_KEY=your-key
   # or
   export ANTHROPIC_API_KEY=your-key
   \`\`\`

3. Run the agent:
   \`\`\`bash
   python agent.py
   \`\`\`
      `,
      warnings: []
    };
  }
};

function generateAgentPython(story: AgentStory): string {
  const skillNodes = story.skills?.map(skill => {
    const funcName = toSnakeCase(skill.name);
    return `
def ${funcName}_node(state: AgentState) -> AgentState:
    """${skill.description}"""
    # TODO: Implement ${skill.name} logic
    messages = state["messages"]

    # Add your skill implementation here
    response = model.invoke(messages)

    return {"messages": [response]}
`;
  }).join('\n') || '';

  const nodeRegistrations = story.skills?.map(skill => {
    const funcName = toSnakeCase(skill.name);
    return `graph.add_node("${funcName}", ${funcName}_node)`;
  }).join('\n    ') || '';

  return `"""
${story.name}

${story.action} so that ${story.outcome}

Generated by Agent Stories
"""

from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
import operator

from tools import get_tools


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]


# Initialize model
model = ChatOpenAI(model="gpt-4-turbo-preview")

# System prompt
SYSTEM_PROMPT = """${buildSystemPrompt(story)}"""

${skillNodes}

def should_continue(state: AgentState) -> str:
    """Determine next step based on last message."""
    messages = state["messages"]
    last_message = messages[-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


def create_agent():
    """Create and compile the agent graph."""
    graph = StateGraph(AgentState)

    # Add nodes
    ${nodeRegistrations}
    graph.add_node("tools", ToolNode(get_tools()))

    # Add edges
    graph.set_entry_point("${story.skills?.[0] ? toSnakeCase(story.skills[0].name) : 'tools'}")
    graph.add_conditional_edges(
        "${story.skills?.[0] ? toSnakeCase(story.skills[0].name) : 'tools'}",
        should_continue,
        {
            "tools": "tools",
            END: END
        }
    )
    graph.add_edge("tools", END)

    return graph.compile()


if __name__ == "__main__":
    agent = create_agent()

    # Example invocation
    result = agent.invoke({
        "messages": [HumanMessage(content="Hello, I need help.")]
    })

    print(result["messages"][-1].content)
`;
}

function generateToolsPython(story: AgentStory): string {
  const tools = story.skills?.flatMap(s => s.tools || []) || [];

  const toolDefs = tools.map(tool => {
    const funcName = toSnakeCase(tool.name);
    return `
@tool
def ${funcName}() -> str:
    """${tool.purpose}"""
    # TODO: Implement ${tool.name}
    pass
`;
  }).join('\n');

  const toolList = tools.map(t => toSnakeCase(t.name)).join(', ');

  return `"""
Tools for ${story.name}

Generated by Agent Stories
"""

from langchain_core.tools import tool


${toolDefs}

def get_tools():
    """Return list of available tools."""
    return [${toolList}]
`;
}

function generateRequirements(): string {
  return `langchain>=0.1.0
langchain-openai>=0.0.5
langgraph>=0.0.20
`;
}

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
```

### 2.6 CrewAI Adapter

Generates YAML configuration for CrewAI.

```typescript
// /lib/harnesses/crewai.ts

import { HarnessAdapter } from './types';
import { AgentStory } from '@/lib/schemas';
import { stringify as yamlStringify } from 'yaml';

export const crewaiAdapter: HarnessAdapter = {
  id: 'crewai',
  name: 'CrewAI',
  description: 'Generate YAML configuration for CrewAI',
  icon: 'Users',
  url: 'https://docs.crewai.com',

  canExport(story) {
    return {
      compatible: true,
      warnings: [],
      missingFeatures: [],
      unsupportedFeatures: []
    };
  },

  generate(story) {
    const agentsYaml = generateAgentsYaml(story);
    const tasksYaml = generateTasksYaml(story);

    return {
      files: [
        { path: 'agents.yaml', content: yamlStringify(agentsYaml) },
        { path: 'tasks.yaml', content: yamlStringify(tasksYaml) }
      ],
      instructions: `
## Setup Instructions

1. Install CrewAI:
   \`\`\`bash
   pip install crewai
   \`\`\`

2. Create your crew:
   \`\`\`python
   from crewai import Crew, Agent, Task
   import yaml

   with open('agents.yaml') as f:
       agents_config = yaml.safe_load(f)

   with open('tasks.yaml') as f:
       tasks_config = yaml.safe_load(f)

   # Create agents and tasks from config
   # ...
   \`\`\`
      `,
      warnings: []
    };
  }
};

function generateAgentsYaml(story: AgentStory): object {
  const agents: Record<string, object> = {};

  // Main agent
  agents[story.identifier] = {
    role: story.role,
    goal: story.outcome,
    backstory: story.action,
    verbose: true,
    allow_delegation: story.autonomyLevel === 'autonomous',
    tools: story.skills?.flatMap(s =>
      s.tools?.map(t => t.name) || []
    ) || []
  };

  return agents;
}

function generateTasksYaml(story: AgentStory): object {
  const tasks: Record<string, object> = {};

  for (const skill of story.skills || []) {
    const taskId = skill.portability?.slug || generateSlug(skill.name);

    tasks[taskId] = {
      description: skill.description,
      expected_output: skill.acceptance?.successConditions?.join('; ') || 'Task completed successfully',
      agent: story.identifier
    };
  }

  return tasks;
}
```

### 2.7 Adapter Registry

```typescript
// /lib/harnesses/index.ts

import { HarnessAdapter } from './types';
import { claudeAdapter } from './claude';
import { openaiAdapter } from './openai';
import { lettaAdapter } from './letta';
import { langgraphAdapter } from './langgraph';
import { crewaiAdapter } from './crewai';

export const harnessAdapters: Record<string, HarnessAdapter> = {
  claude: claudeAdapter,
  openai: openaiAdapter,
  letta: lettaAdapter,
  langgraph: langgraphAdapter,
  crewai: crewaiAdapter
};

export function getAdapter(id: string): HarnessAdapter | undefined {
  return harnessAdapters[id];
}

export function getAllAdapters(): HarnessAdapter[] {
  return Object.values(harnessAdapters);
}

export * from './types';
```

---

## Part 3: "Try It" Launcher

### 3.1 Try It UI

Add a "Try It" button that launches the agent in a supported harness:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Try Agent                                                           [Close] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Launch your agent in one of these harnesses:                                 │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🖥️  Claude Code                                              [Launch]   │ │
│ │ Run in your terminal with Claude CLI                                    │ │
│ │                                                                         │ │
│ │ Command:                                                                │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ claude --project . "Act as: Support Triage Agent"              [📋] │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🤖 OpenAI Playground                                         [Launch]   │ │
│ │ Test in OpenAI's web interface                                          │ │
│ │                                                                         │ │
│ │ Opens: platform.openai.com/playground                                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🧠 Letta                                                     [Launch]   │ │
│ │ Run with persistent memory                                              │ │
│ │                                                                         │ │
│ │ Command:                                                                │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ letta chat --agent support-triage                              [📋] │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ 💡 Tip: Download harness configs first for full functionality.              │
│                                                    [Download All Configs]    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Try It Implementation

```typescript
// /components/story-editor/try-it-dialog.tsx

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Copy, ExternalLink, Terminal, Download } from 'lucide-react';
import { AgentStory } from '@/lib/schemas';
import { getAllAdapters, HarnessAdapter, TryItConfig } from '@/lib/harnesses';

interface TryItDialogProps {
  story: AgentStory;
}

export function TryItDialog({ story }: TryItDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const adapters = getAllAdapters();

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLaunch = (adapter: HarnessAdapter) => {
    const config = adapter.getTryItConfig?.(story);
    if (!config) return;

    switch (config.type) {
      case 'url':
        window.open(config.launchUrl, '_blank');
        break;
      case 'cli':
        handleCopy(config.command!, adapter.id);
        break;
      case 'api':
        // Could open a modal with API details
        break;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Play className="h-4 w-4" />
          Try It
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Try Agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Launch your agent in one of these harnesses:
          </p>

          {adapters.map(adapter => {
            const config = adapter.getTryItConfig?.(story);
            if (!config) return null;

            return (
              <div
                key={adapter.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getIcon(adapter.icon)}</span>
                    <div>
                      <h4 className="font-medium">{adapter.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {adapter.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleLaunch(adapter)}
                  >
                    {config.type === 'url' ? (
                      <>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Launch
                      </>
                    ) : (
                      <>
                        <Terminal className="h-4 w-4 mr-1" />
                        Copy Command
                      </>
                    )}
                  </Button>
                </div>

                {config.type === 'cli' && config.command && (
                  <div className="flex items-center gap-2 bg-muted rounded p-2">
                    <code className="text-sm flex-1 font-mono">
                      {config.command}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(config.command!, adapter.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copied === adapter.id && (
                      <span className="text-xs text-green-600">Copied!</span>
                    )}
                  </div>
                )}

                {config.type === 'url' && (
                  <p className="text-xs text-muted-foreground">
                    Opens: {new URL(config.launchUrl!).hostname}
                  </p>
                )}
              </div>
            );
          })}

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>💡</span>
              Download harness configs first for full functionality.
            </p>
            <Button variant="outline" className="mt-2 gap-2">
              <Download className="h-4 w-4" />
              Download All Configs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Part 4: UI Integration

### 4.1 Story Editor Header

Add harness export and GitHub publish buttons to the story editor:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Support Triage Agent                                                         │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ [Import/Export ▼]  [Harnesses ▼]  [Publish to GitHub]  [Try It ▶]          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Harnesses Dropdown

```
┌────────────────────────────┐
│ Download Harness Configs   │
├────────────────────────────┤
│ ☑ Claude (CLAUDE.md)       │
│ ☑ OpenAI (assistant.json)  │
│ ☐ Letta (agent.json)       │
│ ☐ LangGraph (agent.py)     │
│ ☐ CrewAI (agents.yaml)     │
├────────────────────────────┤
│ [Download Selected]        │
│ [Download All as ZIP]      │
└────────────────────────────┘
```

---

## Part 5: Data Flow

### 5.1 Export Flow

```
User clicks "Publish to GitHub"
         │
         ▼
┌─────────────────────────────┐
│ Validate agent completeness │
│ - Has at least 1 skill     │
│ - All required fields set   │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Generate artifacts          │
│ - README.md                 │
│ - agent.md                  │
│ - skills/*.md               │
│ - harnesses/*               │
│ - .agentstories/source.json │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ GitHub API                  │
│ - Check repo access         │
│ - Create/update files       │
│ - Create PR if selected     │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Show success                │
│ - Link to repo/PR           │
│ - "Try It" prompt           │
└─────────────────────────────┘
```

### 5.2 Import Flow (Future)

```
User provides GitHub repo URL
         │
         ▼
┌─────────────────────────────┐
│ Fetch repository            │
│ - Check for agent.md        │
│ - Check for skills/         │
│ - Check for .agentstories/  │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Parse and import            │
│ - Use source.json if exists │
│ - Fall back to parsing MD   │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Create/update AgentStory    │
│ - Preserve source link      │
└─────────────────────────────┘
```

---

## Implementation Order

### Phase 1: Core Harness Adapters
1. Define `HarnessAdapter` interface and types
2. Implement Claude adapter (highest value for Claude Code users)
3. Implement OpenAI adapter
4. Add harness download UI

### Phase 2: Additional Adapters
5. Implement Letta adapter
6. Implement LangGraph adapter
7. Implement CrewAI adapter

### Phase 3: GitHub Integration
8. Add GitHub OAuth flow
9. Implement repository publishing
10. Add PR creation option

### Phase 4: Try It Experience
11. Build Try It dialog
12. Integrate with harness adapters
13. Add "Download All Configs" functionality

### Phase 5: Polish
14. Add compatibility checking UI
15. Improve error handling
16. Add progress indicators for GitHub operations

---

## API Endpoints

### Harness Generation

```
POST /api/stories/:id/harness
Content-Type: application/json

Body: {
  harness: 'claude' | 'openai' | 'letta' | 'langgraph' | 'crewai';
}

Response: {
  files: Array<{ path: string; content: string }>;
  instructions: string;
  warnings: string[];
}
```

### GitHub Publishing

```
POST /api/stories/:id/publish
Content-Type: application/json

Body: {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  harnesses?: string[];
  createPr?: boolean;
  prTitle?: string;
}

Response: {
  success: boolean;
  url: string;  // repo or PR URL
  filesCreated: string[];
}
```

---

## Security Considerations

1. **GitHub Tokens**: Store OAuth tokens securely, encrypt at rest
2. **Scope Minimization**: Request only `repo` scope, not `admin`
3. **Rate Limiting**: Respect GitHub API limits
4. **Validation**: Sanitize all generated content to prevent injection

---

## Future Considerations

1. **Bidirectional Sync**: Pull changes from GitHub back into Agent Stories
2. **Harness Marketplace**: Discover and import agents from public repos
3. **Custom Harness Templates**: Allow users to define their own harness formats
4. **Version Control**: Track changes to published agents over time
5. **Collaborative Editing**: Multiple users editing the same agent
