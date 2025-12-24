/**
 * Letta Adapter
 *
 * Generates agent.json compatible with Letta's agent definition format.
 * Includes memory blocks, core procedures, and tool definitions.
 *
 * See: https://docs.letta.com/
 */

import type { AgentStory } from '@/lib/schemas/story';
import type { Skill } from '@/lib/schemas/skill';
import { generateSlug } from '@/lib/schemas/skill';
import type {
  HarnessAdapter,
  HarnessCompatibility,
  HarnessOutput,
  HarnessFile,
  TryItConfig,
} from '../types';
import { registerAdapter } from '../registry';

// ============================================================================
// Letta Types
// ============================================================================

interface LettaMemoryBlock {
  label: string;
  value: string;
  limit?: number;
}

interface LettaTool {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

interface LettaAgent {
  name: string;
  description: string;
  system: string;
  memory: {
    human: string;
    persona: string;
    blocks?: LettaMemoryBlock[];
  };
  tools: LettaTool[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Letta Adapter Implementation
// ============================================================================

export const lettaAdapter: HarnessAdapter = {
  id: 'letta',
  name: 'Letta',
  description: 'Generate agent.json for Letta agent framework',
  icon: 'Brain',
  url: 'https://letta.com',

  canExport(story: AgentStory): HarnessCompatibility {
    const warnings: string[] = [];
    const missingFeatures: string[] = [];
    const unsupportedFeatures: string[] = [];

    // Basic validation
    if (!story.name) {
      missingFeatures.push('agent name');
    }

    // Check for workflow behaviors (Letta handles these differently)
    const hasWorkflows = story.skills?.some(
      (skill) => skill.behavior?.model === 'workflow'
    );
    if (hasWorkflows) {
      warnings.push('Complex workflows may need manual adjustment in Letta');
    }

    // Check for schedule triggers
    const hasScheduleTriggers = story.skills?.some((skill) =>
      skill.triggers?.some((t) => t.type === 'schedule')
    );
    if (hasScheduleTriggers) {
      warnings.push('Schedule triggers require Letta cron job configuration');
      unsupportedFeatures.push('scheduled triggers');
    }

    // Letta has its own memory system
    if (story.memory?.persistent?.length) {
      warnings.push('Persistent stores will be mapped to Letta memory blocks');
    }

    const compatible = missingFeatures.length === 0;

    return {
      compatible,
      warnings,
      missingFeatures,
      unsupportedFeatures,
    };
  },

  generate(story: AgentStory): HarnessOutput {
    const files: HarnessFile[] = [];
    const warnings: string[] = [];

    // Generate main agent.json
    const agent = generateLettaAgent(story);
    files.push({
      path: 'letta/agent.json',
      content: JSON.stringify(agent, null, 2),
    });

    // Generate tool definitions file if tools exist
    const tools = extractTools(story);
    if (tools.length > 0) {
      files.push({
        path: 'letta/tools.py',
        content: generateToolsPython(tools, story),
      });
    }

    const instructions = `
## Using with Letta

1. Install Letta: \`pip install letta\`
2. Create agent from config:
   \`\`\`python
   import json
   from letta import create_client

   client = create_client()

   with open('agent.json') as f:
       config = json.load(f)

   agent = client.create_agent(
       name=config['name'],
       system=config['system'],
       memory=config['memory'],
       tools=config['tools']
   )
   \`\`\`
3. If using custom tools, register them from \`tools.py\` first.
`.trim();

    return { files, warnings, instructions };
  },

  getTryItConfig(story: AgentStory): TryItConfig | null {
    return {
      type: 'cli',
      command: `letta run --agent-config letta/agent.json`,
      setupInstructions: `
1. Install Letta CLI: pip install letta
2. Start Letta server: letta server
3. Run the command to create and interact with your agent
      `.trim(),
      description: 'Launch a Letta agent with this configuration',
    };
  },
};

// ============================================================================
// Agent Generation
// ============================================================================

function generateLettaAgent(story: AgentStory): LettaAgent {
  // Build system prompt from agent identity
  const systemParts: string[] = [];

  if (story.role) {
    systemParts.push(story.role);
  }

  if (story.purpose) {
    systemParts.push(`\nYour purpose: ${story.purpose}`);
  }

  // Add capabilities summary
  if (story.skills?.length) {
    systemParts.push('\n\nYou have the following capabilities:');
    for (const skill of story.skills) {
      systemParts.push(`- ${skill.name}: ${skill.description}`);
    }
  }

  // Add guardrails
  if (story.guardrails?.length) {
    systemParts.push('\n\nConstraints:');
    for (const g of story.guardrails) {
      systemParts.push(`- ${g.name}: ${g.constraint}`);
    }
  }

  // Build persona (agent's self-description)
  const personaParts: string[] = [`I am ${story.name}.`];
  if (story.role) {
    personaParts.push(story.role);
  }
  if (story.autonomyLevel) {
    const autonomyDescriptions: Record<string, string> = {
      full: 'I operate autonomously and make decisions independently.',
      supervised: 'I handle routine tasks independently but escalate edge cases.',
      collaborative: 'I work collaboratively, proposing actions and seeking feedback.',
      directed: 'I follow explicit direction and request approval for actions.',
    };
    personaParts.push(autonomyDescriptions[story.autonomyLevel] || '');
  }

  // Build memory blocks from persistent stores
  const blocks: LettaMemoryBlock[] = [];
  if (story.memory?.persistent) {
    for (const store of story.memory.persistent) {
      blocks.push({
        label: store.name,
        value: store.purpose,
        limit: 2000,
      });
    }
  }

  // Add working memory as a block
  if (story.memory?.working?.length) {
    blocks.push({
      label: 'context',
      value: story.memory.working.join('\n'),
      limit: 5000,
    });
  }

  // Extract tools from skills
  const tools = extractTools(story);

  return {
    name: generateSlug(story.name),
    description: story.purpose || `${story.name} agent`,
    system: systemParts.join('\n'),
    memory: {
      human: 'The user interacting with this agent.',
      persona: personaParts.join(' '),
      blocks: blocks.length > 0 ? blocks : undefined,
    },
    tools,
    metadata: {
      source: 'agentstories',
      version: story.version,
      autonomyLevel: story.autonomyLevel,
    },
  };
}

// ============================================================================
// Tool Extraction
// ============================================================================

function extractTools(story: AgentStory): LettaTool[] {
  const tools: LettaTool[] = [];
  const seenTools = new Set<string>();

  // Convert each skill into a callable tool
  if (story.skills) {
    for (const skill of story.skills) {
      const toolName = generateSlug(skill.name);
      if (seenTools.has(toolName)) continue;
      seenTools.add(toolName);

      const tool: LettaTool = {
        name: toolName,
        description: skill.description,
      };

      // Add parameters from skill inputs
      if (skill.inputs?.length) {
        const properties: Record<string, { type: string; description: string }> = {};
        const required: string[] = [];

        for (const input of skill.inputs) {
          properties[input.name] = {
            type: mapTypeToJson(input.type),
            description: input.description,
          };
          if (input.required !== false) {
            required.push(input.name);
          }
        }

        tool.parameters = {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
        };
      }

      tools.push(tool);
    }
  }

  // Also add explicit tools from skills
  if (story.skills) {
    for (const skill of story.skills) {
      if (!skill.tools) continue;

      for (const t of skill.tools) {
        const toolName = generateSlug(t.name);
        if (seenTools.has(toolName)) continue;
        seenTools.add(toolName);

        tools.push({
          name: toolName,
          description: t.purpose,
        });
      }
    }
  }

  return tools;
}

function mapTypeToJson(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('string') || lowerType.includes('text')) return 'string';
  if (lowerType.includes('number') || lowerType.includes('int') || lowerType.includes('float')) return 'number';
  if (lowerType.includes('bool')) return 'boolean';
  if (lowerType.includes('array') || lowerType.includes('list')) return 'array';
  if (lowerType.includes('object') || lowerType.includes('dict')) return 'object';
  return 'string';
}

// ============================================================================
// Python Tools Generation
// ============================================================================

function generateToolsPython(tools: LettaTool[], story: AgentStory): string {
  const lines: string[] = [
    '"""',
    `Auto-generated tool definitions for ${story.name}`,
    '',
    'Register these tools with your Letta client before creating the agent.',
    '"""',
    '',
    'from letta import tool',
    '',
  ];

  for (const t of tools) {
    lines.push('@tool');

    // Build function signature
    const params = t.parameters?.properties
      ? Object.entries(t.parameters.properties)
          .map(([name, prop]) => `${name}: ${pythonType(prop.type)}`)
          .join(', ')
      : '';

    lines.push(`def ${t.name}(${params}) -> str:`);
    lines.push(`    """${t.description}"""`);
    lines.push(`    # TODO: Implement ${t.name}`);
    lines.push(`    pass`);
    lines.push('');
  }

  return lines.join('\n');
}

function pythonType(jsonType: string): string {
  switch (jsonType) {
    case 'string': return 'str';
    case 'number': return 'float';
    case 'boolean': return 'bool';
    case 'array': return 'list';
    case 'object': return 'dict';
    default: return 'str';
  }
}

// ============================================================================
// Register Adapter
// ============================================================================

registerAdapter(lettaAdapter);
