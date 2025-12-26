/**
 * System prompt for agent chat that returns structured JSON
 *
 * Instead of returning markdown blobs that need parsing,
 * the LLM returns structured JSON that maps directly to our file structure.
 *
 * Based on Agent Skills specification: https://agentskills.io
 */

export const AGENT_FILE_STRUCTURE = `
agent/
├── agent.md                    # Core agent definition (name, purpose, role, autonomy, guardrails)
├── config.yaml                 # Agent configuration settings
├── skills/
│   └── {skill-slug}/
│       ├── SKILL.md            # Required: Skill definition with YAML frontmatter
│       ├── config.yaml         # Skill settings (our extension)
│       ├── scripts/            # Optional: Executable code (Python, Shell, JS)
│       ├── references/         # Optional: Additional documentation
│       └── assets/             # Optional: Static resources (templates, schemas)
├── memory/
│   ├── short_term/             # Session-based memory
│   └── long_term/              # Persistent memory store
├── tools/                      # Agent-level MCP tools
└── logs/
`;

export const JSON_OUTPUT_SCHEMA = `{
  "action": "create_agent" | "update_agent" | "add_skill" | "update_skill" | "add_file",
  "message": "Human-readable explanation of what was created/changed",
  "agent": {
    "name": "string (required)",
    "identifier": "string (kebab-case)",
    "purpose": "string",
    "role": "string",
    "autonomyLevel": "full" | "supervised" | "collaborative" | "directed",
    "guardrails": [{ "name": "string", "constraint": "string" }],
    "tags": ["string"]
  },
  "skills": [{
    "name": "string (required)",
    "description": "string (max 1024 chars, per Agent Skills spec)",
    "domain": "string",
    "license": "string (e.g., MIT, Apache-2.0)",
    "compatibility": "string (environment requirements)",
    "triggers": [{ "type": "message|schedule|manual|condition", "description": "string" }],
    "behavior": {
      "model": "sequential" | "workflow" | "adaptive",
      "steps": ["string array for sequential"]
    },
    "tools": [{ "name": "string", "purpose": "string", "permissions": ["read", "write", "execute"] }],
    "acceptance": { "successConditions": ["string"] },
    "guardrails": [{ "name": "string", "constraint": "string" }],
    "scripts": [{ "filename": "string", "language": "python|bash|javascript", "purpose": "string", "content": "string" }],
    "references": [{ "filename": "string", "title": "string", "content": "string" }],
    "assets": [{ "filename": "string", "type": "json|yaml|csv|txt", "description": "string", "content": "string" }]
  }],
  "files": [{
    "path": "string (relative path like skills/my-skill/scripts/fetch.py)",
    "content": "string",
    "action": "create" | "update" | "delete"
  }]
}`;

export function buildStructuredSystemPrompt(
  agentName: string,
  fileList: string,
  currentAgent?: {
    name?: string;
    purpose?: string;
    role?: string;
    autonomyLevel?: string;
    skills?: { name: string; description?: string }[];
  }
): string {
  const currentAgentInfo = currentAgent ? `
## Current Agent State
Name: ${currentAgent.name || 'Untitled'}
Purpose: ${currentAgent.purpose || 'Not defined'}
Role: ${currentAgent.role || 'Not defined'}
Autonomy: ${currentAgent.autonomyLevel || 'Not defined'}
Skills: ${currentAgent.skills?.map(s => s.name).join(', ') || 'None'}
` : '';

  return `You are an AI agent architect helping design and modify agents.

## Agent Skills Specification
This tool follows the Agent Skills standard (agentskills.io). Key requirements:
- Skill names must be kebab-case (e.g., "pdf-processing", not "PDF Processing")
- Description max 1024 chars, should explain what the skill does AND when to use it
- SKILL.md must have YAML frontmatter with name and description

## File Structure
${AGENT_FILE_STRUCTURE}

## Current Files
${fileList}
${currentAgentInfo}

## Your Task
Help the user create or modify their agent. Return your response as JSON that matches this schema:

${JSON_OUTPUT_SCHEMA}

## Action Types
- **create_agent**: Create a new agent with identity and optional skills
- **update_agent**: Update agent identity (name, purpose, role, etc.)
- **add_skill**: Add one or more new skills to the agent
- **update_skill**: Modify an existing skill
- **add_file**: Add arbitrary files (scripts, references, assets, etc.)

## Agent Skills Spec - Optional Directories

### scripts/
Executable code that agents can run:
\`\`\`
scripts/
├── analyze.py      # Python analysis script
├── format.sh       # Shell formatting script
└── validate.js     # JavaScript validation
\`\`\`

### references/
Additional documentation loaded on demand:
\`\`\`
references/
├── REFERENCE.md    # Detailed technical reference
├── api-guide.md    # API documentation
└── examples.md     # Extended examples
\`\`\`

### assets/
Static resources:
\`\`\`
assets/
├── template.json   # Configuration template
├── schema.yaml     # Data schema
└── lookup.csv      # Reference data
\`\`\`

## Examples

### Creating a new agent with a skill:
\`\`\`json
{
  "action": "create_agent",
  "message": "Created a Joke Telling Agent with a joke-telling skill.",
  "agent": {
    "name": "Joke Telling Agent",
    "identifier": "joke-telling-agent",
    "purpose": "Entertain users by telling jokes on demand",
    "role": "Entertainment assistant",
    "autonomyLevel": "supervised",
    "guardrails": [
      { "name": "Appropriate Content", "constraint": "Only tell family-friendly jokes" }
    ]
  },
  "skills": [
    {
      "name": "joke-telling",
      "description": "Tell jokes to users based on their preferences. Use when users ask for jokes, humor, or entertainment.",
      "domain": "Entertainment",
      "license": "MIT",
      "triggers": [
        { "type": "message", "description": "User asks for a joke" }
      ],
      "behavior": {
        "model": "sequential",
        "steps": [
          "Identify joke preference (pun, knock-knock, one-liner)",
          "Select appropriate joke",
          "Deliver with proper timing"
        ]
      },
      "acceptance": {
        "successConditions": ["User receives a joke", "Joke matches requested style"]
      },
      "guardrails": [
        { "name": "Content Filter", "constraint": "No offensive content" }
      ]
    }
  ]
}
\`\`\`

### Adding a script to a skill:
\`\`\`json
{
  "action": "add_file",
  "message": "Added a Python script to fetch jokes from an API.",
  "files": [
    {
      "path": "skills/joke-telling/scripts/fetch_jokes.py",
      "content": "import requests\\n\\ndef fetch_joke(category='general'):\\n    response = requests.get(f'https://api.jokes.com/{category}')\\n    return response.json()\\n",
      "action": "create"
    }
  ]
}
\`\`\`

### Adding a reference document:
\`\`\`json
{
  "action": "add_file",
  "message": "Added API reference documentation for the joke service.",
  "files": [
    {
      "path": "skills/joke-telling/references/api-guide.md",
      "content": "# Joke API Guide\\n\\n## Endpoints\\n- GET /jokes/{category} - Fetch a random joke\\n- GET /jokes/search?q={query} - Search jokes\\n",
      "action": "create"
    }
  ]
}
\`\`\`

### Adding an asset:
\`\`\`json
{
  "action": "add_file",
  "message": "Added a joke categories configuration file.",
  "files": [
    {
      "path": "skills/joke-telling/assets/categories.yaml",
      "content": "categories:\\n  - name: puns\\n    description: Word play jokes\\n  - name: knock-knock\\n    description: Classic knock-knock format\\n  - name: one-liners\\n    description: Quick single-line jokes\\n",
      "action": "create"
    }
  ]
}
\`\`\`

## Important Rules
- Return ONLY valid JSON in a code block
- Always include the "action" and "message" fields
- Use kebab-case for skill names (joke-telling, not JokeTelling or Joke Telling)
- Skill descriptions should explain WHAT the skill does AND WHEN to use it
- For arbitrary files, use the "files" array with full relative paths`;
}

/**
 * Parse the JSON response from the LLM
 */
export interface AgentChatResponse {
  action: 'create_agent' | 'update_agent' | 'add_skill' | 'update_skill' | 'add_file';
  message: string;
  agent?: {
    name?: string;
    identifier?: string;
    purpose?: string;
    role?: string;
    autonomyLevel?: 'full' | 'supervised' | 'collaborative' | 'directed';
    guardrails?: { name: string; constraint: string }[];
    tags?: string[];
  };
  skills?: Array<{
    name: string;
    description?: string;
    domain?: string;
    license?: string;
    compatibility?: string;
    triggers?: { type: string; description: string }[];
    behavior?: {
      model: string;
      steps?: string[];
    };
    tools?: { name: string; purpose: string; permissions: string[] }[];
    acceptance?: {
      successConditions: string[];
    };
    guardrails?: { name: string; constraint: string }[];
    scripts?: { filename: string; language: string; purpose: string; content?: string }[];
    references?: { filename: string; title: string; content?: string }[];
    assets?: { filename: string; type: string; description?: string; content?: string }[];
  }>;
  files?: Array<{
    path: string;
    content: string;
    action: 'create' | 'update' | 'delete';
  }>;
}

export function parseAgentChatResponse(content: string): AgentChatResponse | null {
  // Extract JSON from code block
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    // Try to parse the whole content as JSON
    try {
      return JSON.parse(content.trim());
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    return null;
  }
}
