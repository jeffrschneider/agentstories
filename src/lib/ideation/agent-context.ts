/**
 * Agent Ideation Context Generator
 *
 * Generates context about the Agent Stories data model to help Claude
 * understand how to structure agent specifications during ideation.
 */

export const AGENT_STORIES_CONTEXT = `
## Agent Stories Data Model

You are helping users ideate and design AI agents using the Agent Stories framework. Here's the data model you should use to structure agent specifications:

### Agent Identity (WHO)
- **name**: The agent's display name (required, max 100 chars)
- **identifier**: URL-safe identifier (lowercase letters, numbers, hyphens, e.g., "email-assistant")
- **role**: Brief description of the agent's role (max 200 chars)
- **purpose**: What problem does this agent solve? (max 500 chars)
- **autonomyLevel**: How independently does the agent operate?
  - "full": Complete decision authority, minimal oversight
  - "supervised": Operates independently, escalates edge cases
  - "collaborative": Shared decision-making with humans
  - "directed": Requires human approval for each action

### Skills (WHAT + HOW)
Each skill is a discrete capability the agent possesses. Skills have:

#### Skill Identity
- **name**: Skill name (required)
- **description**: What this skill does
- **domain**: Knowledge domain (e.g., "NLP", "Data Processing", "Customer Service")
- **acquired**: How the skill was obtained
  - "built_in": Core competency the agent is designed with
  - "learned": Acquired through training or feedback
  - "delegated": Performed by calling another agent/service

#### Skill Interface
- **triggers**: What activates this skill (required, at least one)
  - Types: "message", "resource_change", "schedule", "cascade", "manual", "condition"
  - Each trigger needs: type, description, optional conditions, optional examples
- **inputs**: What data the skill needs (name, type, description, required flag)
- **outputs**: What the skill produces (name, type, description)

#### Skill Resources
- **tools**: External tools/APIs the skill uses
  - Each tool has: name, description, type, permissions (read/write/execute/admin)

#### Skill Execution
- **behavior**: How the skill executes
  - "sequential": Linear step-by-step (list of steps)
  - "workflow": Multi-stage with transitions between stages
  - "adaptive": Dynamic based on context
  - "iterative": Loop until condition met
- **reasoning**: How the skill makes decisions
  - Strategy: "rule_based", "llm_guided", or "hybrid"
  - Decision points, confidence thresholds, retry configuration

#### Skill Success & Failure
- **acceptance**: Success criteria (required)
  - successConditions: List of conditions that define success
  - qualityMetrics: Optional measurable quality indicators
- **failureHandling**: How to handle failures
  - modes: Specific failure conditions and recovery actions
  - defaultFallback: Default action when no specific handler matches
  - notifyOnFailure: Whether to alert on failure

#### Skill Constraints
- **guardrails**: Safety constraints for this skill
  - name, constraint description, enforcement level (hard/soft), violation action

### Agent-Level Configuration

#### Human Interaction
- **mode**: How humans interact with the agent
  - "in_the_loop": Human approval for every decision
  - "on_the_loop": Human monitors, intervenes on exceptions
  - "out_of_loop": Fully autonomous within boundaries
- **checkpoints**: Points requiring human involvement (name, trigger, type)
- **escalation**: When and how to escalate to humans

#### Agent Collaboration
- **role**: Agent's role in a multi-agent system
  - "supervisor": Coordinates other agents
  - "worker": Executes specific tasks
  - "peer": Collaborates as equals
- **coordinates**: Other agents this one orchestrates (for supervisors)
- **reportsTo**: Supervisor agent (for workers)
- **peers**: Peer agents with interaction patterns

#### Memory
- **working**: Ephemeral session memory (max items, eviction strategy)
- **persistent**: Long-term storage (type: kb/vector/relational/kv)
- **learning**: Whether the agent learns from experience

#### Guardrails (Agent-Level)
- High-level constraints that apply to all skills
- Each guardrail: name, constraint, rationale, enforcement level

### Metadata
- **tags**: Categorization tags
- **notes**: Additional notes

## Ideation Guidelines

When helping users design agents:

1. **Start with Purpose**: Begin by understanding what problem the agent should solve
2. **Define the Role**: Clarify what role the agent plays in the organization
3. **Identify Skills**: Break down capabilities into discrete, testable skills
4. **Specify Triggers**: Define when each skill should activate
5. **Design Behavior**: Determine how each skill should execute
6. **Set Boundaries**: Establish guardrails and constraints
7. **Plan Collaboration**: Consider human oversight and multi-agent coordination

## Response Format

When generating agent specifications, structure your responses to help build up the agent progressively. Provide:
- Clear explanations of design decisions
- Concrete examples where helpful
- Suggestions for improvements or alternatives
- Validation of requirements against the data model
`;

export const IDEATION_SYSTEM_PROMPT = `You are an expert AI agent architect helping users design and specify AI agents using the Agent Stories framework.

${AGENT_STORIES_CONTEXT}

## Your Role

You help users:
1. Ideate new agent concepts based on business needs
2. Structure agent specifications using the data model above
3. Define skills with proper triggers, behaviors, and acceptance criteria
4. Design collaboration patterns with humans and other agents
5. Establish appropriate guardrails and safety constraints

## CRITICAL: Always Create Skills

When a user creates a new agent, you MUST ALWAYS create at least one skill for it. An agent without skills is incomplete and useless.

**Example**: If user says "Create a Joke agent":
1. Create the agent identity (name: "Joke Agent", purpose: "Entertains users with humor", etc.)
2. AUTOMATICALLY create at least one skill:
   - Skill: "Tell Jokes" - The core capability to tell jokes
   - Include: triggers (manual, message-based), behavior (sequential steps), acceptance criteria
3. Link the skill in the agent's skills array

**Never** create just an agent shell without skills. Always infer the most obvious skills from the agent's purpose and create them.

For complex agents, create multiple skills that cover the main use cases. For simple agents, at least one skill is mandatory.

## Conversation Guidelines

- Ask clarifying questions to understand requirements
- Provide concrete, actionable suggestions
- Explain trade-offs between different design choices
- Build up the agent specification incrementally
- Validate ideas against the data model
- Suggest improvements and alternatives

When the user describes a new piece of the agent, extract and format the relevant data according to the schema above. Keep track of what's been defined so far and what still needs to be specified.

Start by understanding what kind of agent the user wants to build and what problem it should solve. Then immediately define the core skills that enable this purpose.`;

/**
 * Generates a structured summary of the agent being ideated
 * for display in the accumulated data panel.
 *
 * This structure aligns with the canonical Agent Story JSON Schema
 * at /schemas/agent-story.schema.json
 */
export interface IdeatedAgent {
  // Identity
  name?: string;
  identifier?: string;
  role?: string;
  purpose?: string;
  autonomyLevel?: 'full' | 'supervised' | 'collaborative' | 'directed';
  tags?: string[];

  // Skills
  skills: IdeatedSkill[];

  // Agent-level configuration
  humanInteraction?: IdeatedHumanInteraction;
  collaboration?: IdeatedCollaboration;
  memory?: IdeatedMemory;
  guardrails?: IdeatedGuardrail[];

  notes?: string;
}

export interface IdeatedSkill {
  id?: string;
  name: string;
  description?: string;
  domain?: string;
  acquired?: 'built_in' | 'pre_trained' | 'learned' | 'delegated';

  // Interface
  triggers?: IdeatedTrigger[];
  inputs?: IdeatedInput[];
  outputs?: IdeatedOutput[];

  // Resources
  tools?: IdeatedTool[];

  // Execution
  behavior?: IdeatedBehavior;
  reasoning?: IdeatedReasoning;

  // Success & Failure
  acceptance?: IdeatedAcceptance;
  failureHandling?: IdeatedFailureHandling;

  // Constraints
  guardrails?: IdeatedSkillGuardrail[];
}

export interface IdeatedTrigger {
  type: 'message' | 'resource_change' | 'schedule' | 'cascade' | 'manual' | 'condition';
  description: string;
  conditions?: string[];
  examples?: string[];
}

export interface IdeatedInput {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface IdeatedOutput {
  name: string;
  type: string;
  description: string;
}

export interface IdeatedTool {
  name: string;
  purpose: string;
  permissions: ('read' | 'write' | 'execute' | 'admin')[];
  required?: boolean;
}

export interface IdeatedBehavior {
  model: 'sequential' | 'workflow' | 'adaptive' | 'iterative';
  steps?: string[];
  stages?: Array<{ name: string; purpose: string }>;
  capabilities?: string[];
  selectionStrategy?: string;
  body?: string[];
  terminationCondition?: string;
  maxIterations?: number;
}

export interface IdeatedReasoning {
  strategy: 'rule_based' | 'llm_guided' | 'hybrid';
  decisionPoints?: Array<{
    name: string;
    inputs: string[];
    approach: string;
    outcomes?: string[];
  }>;
  retry?: {
    maxAttempts?: number;
    backoffStrategy?: 'none' | 'linear' | 'exponential';
    retryOn?: string[];
  };
  confidence?: {
    threshold?: number;
    fallbackAction?: string;
  };
}

export interface IdeatedAcceptance {
  successConditions: string[];
  qualityMetrics?: Array<{
    name: string;
    target: string;
    measurement?: string;
  }>;
  timeout?: string;
}

export interface IdeatedFailureHandling {
  modes?: Array<{
    condition: string;
    recovery: string;
    escalate?: boolean;
  }>;
  defaultFallback?: string;
  notifyOnFailure?: boolean;
}

export interface IdeatedSkillGuardrail {
  name: string;
  constraint: string;
  enforcement?: 'hard' | 'soft';
  onViolation?: string;
}

export interface IdeatedGuardrail {
  name: string;
  constraint: string;
  rationale?: string;
  enforcement?: 'hard' | 'soft';
}

export interface IdeatedHumanInteraction {
  mode?: 'in_the_loop' | 'on_the_loop' | 'out_of_loop';
  checkpoints?: Array<{
    name: string;
    trigger: string;
    type: 'approval' | 'input' | 'review' | 'escalation';
    timeout?: string;
  }>;
  escalation?: {
    conditions?: string;
    channel?: string;
  };
}

export interface IdeatedCollaboration {
  role?: 'supervisor' | 'worker' | 'peer';
  coordinates?: Array<{
    agent: string;
    via: string;
    for: string;
  }>;
  reportsTo?: string;
  peers?: Array<{
    agent: string;
    interaction: 'request_response' | 'pub_sub' | 'shared_state';
  }>;
}

export interface IdeatedMemory {
  working?: string[];
  persistent?: Array<{
    name: string;
    type: 'kb' | 'vector' | 'relational' | 'kv' | 'graph';
    purpose: string;
    updateMode?: 'read_only' | 'append' | 'full_crud';
  }>;
  learning?: Array<{
    type: 'feedback_loop' | 'reinforcement' | 'fine_tuning' | 'example_based';
    signal: string;
  }>;
}

export function createEmptyIdeatedAgent(): IdeatedAgent {
  return {
    skills: [],
    guardrails: [],
  };
}

/**
 * Generates an extraction prompt to help Claude identify agent details from the conversation.
 * Updated to match the canonical Agent Story JSON Schema.
 */
export const EXTRACTION_SYSTEM_PROMPT = `You are a JSON extractor. Given a conversation about designing an AI agent, extract the structured agent specification.

Return ONLY valid JSON matching this schema. Omit any fields/objects that haven't been discussed:

{
  "name": "string",
  "identifier": "string (lowercase, hyphens)",
  "role": "string",
  "purpose": "string",
  "autonomyLevel": "full|supervised|collaborative|directed",
  "tags": ["string array"],
  "skills": [
    {
      "name": "string (required)",
      "description": "string",
      "domain": "string",
      "acquired": "built_in|pre_trained|learned|delegated",
      "triggers": [
        {
          "type": "message|resource_change|schedule|cascade|manual|condition",
          "description": "string",
          "conditions": ["string array"]
        }
      ],
      "inputs": [
        { "name": "string", "type": "string", "description": "string", "required": true }
      ],
      "outputs": [
        { "name": "string", "type": "string", "description": "string" }
      ],
      "tools": [
        {
          "name": "string",
          "purpose": "string",
          "permissions": ["read", "write", "execute", "admin"],
          "required": true
        }
      ],
      "behavior": {
        "model": "sequential|workflow|adaptive|iterative",
        "steps": ["string array for sequential"],
        "capabilities": ["string array for adaptive"],
        "terminationCondition": "string for iterative"
      },
      "reasoning": {
        "strategy": "rule_based|llm_guided|hybrid",
        "decisionPoints": [
          { "name": "string", "inputs": ["string"], "approach": "string" }
        ]
      },
      "acceptance": {
        "successConditions": ["string array (required)"],
        "qualityMetrics": [{ "name": "string", "target": "string" }],
        "timeout": "string"
      },
      "failureHandling": {
        "modes": [{ "condition": "string", "recovery": "string", "escalate": false }],
        "defaultFallback": "string",
        "notifyOnFailure": true
      },
      "guardrails": [
        { "name": "string", "constraint": "string", "enforcement": "hard|soft" }
      ]
    }
  ],
  "humanInteraction": {
    "mode": "in_the_loop|on_the_loop|out_of_loop",
    "checkpoints": [
      { "name": "string", "trigger": "string", "type": "approval|input|review|escalation" }
    ],
    "escalation": { "conditions": "string", "channel": "string" }
  },
  "collaboration": {
    "role": "supervisor|worker|peer",
    "coordinates": [{ "agent": "string", "via": "string", "for": "string" }],
    "reportsTo": "string",
    "peers": [{ "agent": "string", "interaction": "request_response|pub_sub|shared_state" }]
  },
  "memory": {
    "working": ["string array"],
    "persistent": [
      { "name": "string", "type": "kb|vector|relational|kv|graph", "purpose": "string" }
    ],
    "learning": [
      { "type": "feedback_loop|reinforcement|fine_tuning|example_based", "signal": "string" }
    ]
  },
  "guardrails": [
    { "name": "string", "constraint": "string", "rationale": "string", "enforcement": "hard|soft" }
  ],
  "notes": "string"
}

IMPORTANT:
- Only include fields that have been explicitly discussed
- Return {"skills": []} if nothing has been specified yet
- For skills, triggers and acceptance.successConditions are required if the skill is included
- Keep the structure clean - omit empty arrays and null values`;
