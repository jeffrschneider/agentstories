/**
 * Convert an AgentStory to a system prompt for the Claude Agent SDK.
 *
 * This generates a comprehensive system prompt that embodies the agent's
 * identity, capabilities, constraints, and behavioral guidance.
 */

import type { AgentStory } from '@/lib/schemas/story';
import type { Skill } from '@/lib/schemas/skill';

// ============================================================================
// Autonomy Level Guidance
// ============================================================================

const AUTONOMY_GUIDANCE: Record<string, string> = {
  full: `You operate with full autonomy. Make decisions independently and execute actions without requiring approval. Use your judgment to complete tasks efficiently.`,
  supervised: `You operate under supervision. Handle routine tasks independently but escalate edge cases, unusual situations, or high-risk decisions to a human for review. When uncertain, ask for guidance.`,
  collaborative: `You work collaboratively with humans. Propose actions and wait for feedback before proceeding on significant decisions. Maintain an ongoing dialogue about approach and progress.`,
  directed: `You follow explicit direction. Wait for specific instructions before taking action. Request approval for each significant step in a process. Explain your reasoning before acting.`,
};

// ============================================================================
// Main Conversion Function
// ============================================================================

/**
 * Convert an AgentStory to a system prompt string.
 */
export function storyToSystemPrompt(story: AgentStory): string {
  const sections: string[] = [];

  // Identity section
  sections.push(buildIdentitySection(story));

  // Operating mode / autonomy
  if (story.autonomyLevel) {
    sections.push(buildAutonomySection(story.autonomyLevel));
  }

  // Human interaction guidance
  if (story.humanInteraction) {
    sections.push(buildHumanInteractionSection(story));
  }

  // Capabilities (skills)
  if (story.skills?.length) {
    sections.push(buildCapabilitiesSection(story.skills));
  }

  // Guardrails and constraints
  if (story.guardrails?.length) {
    sections.push(buildGuardrailsSection(story));
  }

  // Memory / context guidance
  if (story.memory?.working?.length) {
    sections.push(buildMemorySection(story));
  }

  return sections.join('\n\n');
}

// ============================================================================
// Section Builders
// ============================================================================

function buildIdentitySection(story: AgentStory): string {
  const lines: string[] = [];

  lines.push(`# Identity`);
  lines.push('');
  lines.push(`You are **${story.name}**.`);

  if (story.role) {
    lines.push('');
    lines.push(story.role);
  }

  if (story.purpose) {
    lines.push('');
    lines.push(`**Purpose**: ${story.purpose}`);
  }

  return lines.join('\n');
}

function buildAutonomySection(autonomyLevel: string): string {
  const lines: string[] = [];

  lines.push(`# Operating Mode`);
  lines.push('');
  lines.push(AUTONOMY_GUIDANCE[autonomyLevel] || AUTONOMY_GUIDANCE.collaborative);

  return lines.join('\n');
}

function buildHumanInteractionSection(story: AgentStory): string {
  const lines: string[] = [];
  const hi = story.humanInteraction!;

  lines.push(`# Human Interaction`);
  lines.push('');

  // Mode description
  const modeDescriptions: Record<string, string> = {
    in_the_loop: 'Humans are in the loop - you must get approval before taking significant actions.',
    on_the_loop: 'Humans are on the loop - they monitor your work and can intervene when needed.',
    out_of_loop: 'Humans are out of the loop - you operate autonomously within defined boundaries.',
  };
  lines.push(modeDescriptions[hi.mode] || '');

  // Checkpoints
  if (hi.checkpoints?.length) {
    lines.push('');
    lines.push('## Checkpoints');
    lines.push('');
    for (const cp of hi.checkpoints) {
      lines.push(`- **${cp.name}** (${cp.type}): ${cp.trigger}`);
    }
  }

  // Escalation
  if (hi.escalation) {
    lines.push('');
    lines.push('## Escalation');
    lines.push('');
    lines.push(`When: ${hi.escalation.conditions}`);
    lines.push(`How: ${hi.escalation.channel}`);
  }

  return lines.join('\n');
}

function buildCapabilitiesSection(skills: Skill[]): string {
  const lines: string[] = [];

  lines.push(`# Capabilities`);
  lines.push('');
  lines.push('You have the following skills and capabilities:');
  lines.push('');

  for (const skill of skills) {
    lines.push(`## ${skill.name}`);
    lines.push('');
    lines.push(skill.description);
    lines.push('');

    // When to use this skill
    if (skill.triggers?.length) {
      lines.push('**When to use this skill:**');
      for (const trigger of skill.triggers) {
        lines.push(`- ${trigger.description}`);
        if (trigger.examples?.length) {
          lines.push(`  - Examples: ${trigger.examples.join(', ')}`);
        }
      }
      lines.push('');
    }

    // How to execute
    if (skill.behavior) {
      lines.push('**How to execute:**');
      switch (skill.behavior.model) {
        case 'sequential':
          skill.behavior.steps.forEach((step, i) => {
            lines.push(`${i + 1}. ${step}`);
          });
          break;
        case 'workflow':
          lines.push('Follow this workflow:');
          for (const stage of skill.behavior.stages) {
            lines.push(`- **${stage.name}**: ${stage.purpose}`);
            if (stage.actions?.length) {
              for (const action of stage.actions) {
                lines.push(`  - ${action}`);
              }
            }
          }
          break;
        case 'adaptive':
          lines.push(`Select from these approaches based on context: ${skill.behavior.capabilities.join(', ')}`);
          if (skill.behavior.selectionStrategy) {
            lines.push(`Selection strategy: ${skill.behavior.selectionStrategy}`);
          }
          break;
        case 'iterative':
          lines.push('Iterate:');
          for (const b of skill.behavior.body) {
            lines.push(`- ${b}`);
          }
          lines.push(`Until: ${skill.behavior.terminationCondition}`);
          if (skill.behavior.maxIterations) {
            lines.push(`Maximum iterations: ${skill.behavior.maxIterations}`);
          }
          break;
      }
      lines.push('');
    }

    // Success criteria
    if (skill.acceptance?.successConditions?.length) {
      lines.push('**Success criteria:**');
      for (const condition of skill.acceptance.successConditions) {
        lines.push(`- ${condition}`);
      }
      lines.push('');
    }

    // Skill-specific guardrails
    if (skill.guardrails?.length) {
      lines.push('**Constraints for this skill:**');
      for (const g of skill.guardrails) {
        lines.push(`- ${g.name}: ${g.constraint}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function buildGuardrailsSection(story: AgentStory): string {
  const lines: string[] = [];

  lines.push(`# Constraints`);
  lines.push('');
  lines.push('You must always adhere to these constraints:');
  lines.push('');

  for (const guardrail of story.guardrails!) {
    const enforcement = guardrail.enforcement === 'hard' ? '(HARD CONSTRAINT)' : '(soft constraint)';
    lines.push(`- **${guardrail.name}** ${enforcement}: ${guardrail.constraint}`);
    if (guardrail.rationale) {
      lines.push(`  - Rationale: ${guardrail.rationale}`);
    }
  }

  return lines.join('\n');
}

function buildMemorySection(story: AgentStory): string {
  const lines: string[] = [];

  lines.push(`# Context Awareness`);
  lines.push('');
  lines.push('Maintain awareness of the following throughout the conversation:');
  lines.push('');

  for (const item of story.memory!.working!) {
    lines.push(`- ${item}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Tool Extraction
// ============================================================================

/**
 * Extract tool names from an AgentStory for SDK configuration.
 * Returns the tools the agent should have access to.
 */
export function extractToolsFromStory(story: AgentStory): string[] {
  const tools = new Set<string>();

  // Default tools for general agents
  tools.add('Read');
  tools.add('Glob');
  tools.add('Grep');

  // Add tools from skills
  if (story.skills) {
    for (const skill of story.skills) {
      if (skill.tools) {
        for (const tool of skill.tools) {
          // Map tool names to SDK tool names
          const sdkTool = mapToolName(tool.name);
          if (sdkTool) {
            tools.add(sdkTool);
          }
        }
      }
    }
  }

  return Array.from(tools);
}

/**
 * Map agent story tool names to SDK tool names.
 */
function mapToolName(name: string): string | null {
  const lower = name.toLowerCase();

  // Direct mappings to SDK tools
  const mappings: Record<string, string> = {
    'bash': 'Bash',
    'shell': 'Bash',
    'terminal': 'Bash',
    'read': 'Read',
    'file': 'Read',
    'write': 'Write',
    'edit': 'Edit',
    'glob': 'Glob',
    'grep': 'Grep',
    'search': 'Grep',
    'web': 'WebFetch',
    'fetch': 'WebFetch',
    'browser': 'WebFetch',
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  return null;
}
