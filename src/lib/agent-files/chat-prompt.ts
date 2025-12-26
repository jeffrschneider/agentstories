/**
 * System prompt for agent chat that returns structured JSON
 *
 * Instead of returning markdown blobs that need parsing,
 * the LLM returns structured JSON that maps directly to our file structure.
 */

export const AGENT_FILE_STRUCTURE = `
agent/
├── agent.md                    # Core agent definition (name, purpose, role, autonomy, guardrails)
├── config.yaml                 # Agent configuration settings
├── skills/
│   └── {skill-slug}/
│       ├── SKILL.md            # Skill definition (triggers, behavior, success criteria)
│       ├── config.yaml         # Skill settings
│       ├── prompts/            # Prompt templates for this skill
│       ├── tools/              # Tool implementations
│       └── examples/           # Usage examples
├── memory/
│   ├── short_term/             # Session-based memory
│   └── long_term/              # Persistent memory store
├── tools/                      # Agent-level tools
└── logs/
`;

export const JSON_OUTPUT_SCHEMA = `{
  "action": "create_agent" | "update_agent" | "add_skill" | "update_skill",
  "message": "Human-readable explanation of what was created/changed",
  "agent": {
    "name": "string (required)",
    "identifier": "string (kebab-case)",
    "purpose": "string",
    "role": "string",
    "autonomyLevel": "full" | "supervised" | "collaborative" | "directed",
    "guardrails": [
      { "name": "string", "constraint": "string" }
    ],
    "tags": ["string"]
  },
  "skills": [
    {
      "name": "string (required)",
      "description": "string",
      "domain": "string",
      "triggers": [
        { "type": "message" | "schedule" | "manual" | "condition", "description": "string" }
      ],
      "behavior": {
        "model": "sequential" | "workflow" | "adaptive",
        "steps": ["string array for sequential"]
      },
      "tools": [
        { "name": "string", "purpose": "string", "permissions": ["read", "write", "execute"] }
      ],
      "acceptance": {
        "successConditions": ["string"]
      },
      "guardrails": [
        { "name": "string", "constraint": "string" }
      ]
    }
  ]
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

## File Structure
${AGENT_FILE_STRUCTURE}

## Current Files
${fileList}
${currentAgentInfo}

## Your Task
Help the user create or modify their agent. Return your response as JSON that matches this schema:

${JSON_OUTPUT_SCHEMA}

## Rules

1. **For new agents**: Include full agent object with at least name and purpose
2. **For new skills**: Include the skill in the skills array with required fields (name, triggers, behavior)
3. **For updates**: Only include fields that are being changed
4. **Always include**: A human-readable "message" explaining what you created/changed

## Examples

### Creating a new agent with a skill:
\`\`\`json
{
  "action": "create_agent",
  "message": "Created a Joke Telling Agent with a joke-telling skill that responds to user requests.",
  "agent": {
    "name": "Joke Telling Agent",
    "identifier": "joke-telling-agent",
    "purpose": "Entertain users by telling jokes on demand",
    "role": "Entertainment assistant that delivers jokes based on user preferences",
    "autonomyLevel": "supervised",
    "guardrails": [
      { "name": "Appropriate Content", "constraint": "Only tell family-friendly jokes" }
    ]
  },
  "skills": [
    {
      "name": "Joke Telling",
      "description": "Tell jokes to users based on their preferences",
      "domain": "Entertainment",
      "triggers": [
        { "type": "message", "description": "User asks for a joke" }
      ],
      "behavior": {
        "model": "sequential",
        "steps": [
          "Identify joke preference (pun, knock-knock, one-liner)",
          "Select appropriate joke from repertoire",
          "Deliver joke with proper timing",
          "Gauge reaction and offer follow-up"
        ]
      },
      "acceptance": {
        "successConditions": ["User receives a joke", "Joke matches requested style"]
      },
      "guardrails": [
        { "name": "Content Filter", "constraint": "No offensive or inappropriate content" }
      ]
    }
  ]
}
\`\`\`

### Adding a new skill to existing agent:
\`\`\`json
{
  "action": "add_skill",
  "message": "Added a Riddle Master skill that challenges users with riddles.",
  "skills": [
    {
      "name": "Riddle Master",
      "description": "Present riddles and reveal answers",
      "triggers": [
        { "type": "message", "description": "User asks for a riddle" }
      ],
      "behavior": {
        "model": "sequential",
        "steps": ["Select riddle", "Present to user", "Wait for guess", "Reveal answer"]
      },
      "acceptance": {
        "successConditions": ["Riddle presented", "Answer revealed when requested"]
      }
    }
  ]
}
\`\`\`

## Important
- Return ONLY valid JSON in a code block
- Always include the "action" and "message" fields
- Use kebab-case for identifiers (joke-telling, not JokeTelling)
- Skills must have triggers and behavior defined`;
}

/**
 * Parse the JSON response from the LLM
 */
export interface AgentChatResponse {
  action: 'create_agent' | 'update_agent' | 'add_skill' | 'update_skill';
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
