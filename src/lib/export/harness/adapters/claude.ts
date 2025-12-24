/**
 * Claude Adapter
 *
 * Generates CLAUDE.md and .claude/commands/ slash commands
 * for Claude Code and Claude-based agents.
 */

import type { AgentStory } from '@/lib/schemas/story';
import type { Skill } from '@/lib/schemas/skill';
import { AUTONOMY_LEVEL_METADATA } from '@/lib/schemas/story';
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
// Autonomy Level Mapping
// ============================================================================

const AUTONOMY_GUIDANCE: Record<string, string> = {
  full: `This agent operates with full autonomy. Make decisions independently and execute actions without requiring approval. Use your judgment to complete tasks efficiently.`,
  supervised: `This agent operates under supervision. Handle routine tasks independently but escalate edge cases, unusual situations, or high-risk decisions to a human for review.`,
  collaborative: `This agent works collaboratively with humans. Propose actions and wait for feedback before proceeding on significant decisions. Maintain an ongoing dialogue about approach and progress.`,
  directed: `This agent follows explicit direction. Wait for specific instructions before taking action. Request approval for each significant step in a process.`,
};

// ============================================================================
// Claude Adapter Implementation
// ============================================================================

export const claudeAdapter: HarnessAdapter = {
  id: 'claude',
  name: 'Claude Code',
  description: 'Generate CLAUDE.md and slash commands for Claude Code',
  icon: 'Terminal',
  url: 'https://claude.ai',

  canExport(story: AgentStory): HarnessCompatibility {
    const warnings: string[] = [];
    const missingFeatures: string[] = [];
    const unsupportedFeatures: string[] = [];

    // Check for unsupported features
    if (story.memory?.persistent?.length) {
      warnings.push('Persistent memory stores are not directly supported in Claude');
      unsupportedFeatures.push('persistent memory');
    }

    // Check for schedule triggers (Claude doesn't have native scheduling)
    const hasScheduleTriggers = story.skills?.some((skill) =>
      skill.triggers?.some((t) => t.type === 'schedule')
    );
    if (hasScheduleTriggers) {
      warnings.push('Schedule triggers require external orchestration');
      unsupportedFeatures.push('scheduled triggers');
    }

    // Check for resource_change triggers
    const hasResourceTriggers = story.skills?.some((skill) =>
      skill.triggers?.some((t) => t.type === 'resource_change')
    );
    if (hasResourceTriggers) {
      warnings.push('Resource change triggers require external file watching');
      unsupportedFeatures.push('resource change triggers');
    }

    // Check for learning memory (Claude doesn't persist learning)
    if (story.memory?.learning?.length) {
      warnings.push('Learning/feedback loops are not persisted between sessions');
      unsupportedFeatures.push('persistent learning');
    }

    // Basic validation
    if (!story.name) {
      missingFeatures.push('agent name');
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

    // Generate main CLAUDE.md
    const claudeMd = generateClaudeMd(story);
    files.push({
      path: 'claude/CLAUDE.md',
      content: claudeMd,
    });

    // Generate slash commands for each skill
    if (story.skills?.length) {
      for (const skill of story.skills) {
        const command = generateSlashCommand(skill);
        if (command) {
          const slug = skill.portability?.slug || generateSlug(skill.name);
          files.push({
            path: `claude/.claude/commands/${slug}.md`,
            content: command,
          });
        }
      }
    }

    // Generate MCP configuration if tools are defined
    const mcpConfig = generateMcpConfig(story);
    if (mcpConfig) {
      files.push({
        path: 'claude/mcp.json',
        content: mcpConfig,
      });
      warnings.push('MCP configuration generated - review server URLs before use');
    }

    const instructions = `
## Using with Claude Code

1. Copy the contents of \`CLAUDE.md\` to your project root as \`CLAUDE.md\`
2. Copy the \`.claude/commands/\` directory to your project
3. If using MCP tools, configure \`mcp.json\` with your actual server URLs

The slash commands can be invoked in Claude Code using \`/${story.name ? generateSlug(story.name) : 'skill'}-<skill-name>\`.
`.trim();

    return { files, warnings, instructions };
  },

  getTryItConfig(story: AgentStory): TryItConfig | null {
    return {
      type: 'cli',
      command: `claude --project . --resume`,
      setupInstructions: `
1. Ensure Claude Code CLI is installed
2. Copy generated files to your project
3. Run the command to start a Claude Code session with your agent configuration
      `.trim(),
      description: 'Launch Claude Code with this agent configuration',
    };
  },
};

// ============================================================================
// CLAUDE.md Generation
// ============================================================================

function generateClaudeMd(story: AgentStory): string {
  const sections: string[] = [];

  // Persona section
  sections.push('## Persona\n');
  sections.push(`You are **${story.name}**.`);

  if (story.role) {
    sections.push(`\n${story.role}`);
  }

  if (story.purpose) {
    sections.push(`\n**Purpose**: ${story.purpose}`);
  }

  sections.push('');

  // Autonomy guidance
  if (story.autonomyLevel) {
    sections.push('## Operating Mode\n');
    sections.push(AUTONOMY_GUIDANCE[story.autonomyLevel] || AUTONOMY_GUIDANCE.collaborative);
    sections.push('');
  }

  // Human interaction guidance
  if (story.humanInteraction) {
    sections.push('## Human Interaction\n');
    sections.push(`**Mode**: ${formatHumanInteractionMode(story.humanInteraction.mode)}\n`);

    if (story.humanInteraction.checkpoints?.length) {
      sections.push('### Checkpoints\n');
      for (const cp of story.humanInteraction.checkpoints) {
        sections.push(`- **${cp.type}** "${cp.name}": ${cp.trigger}`);
        if (cp.timeout) {
          sections.push(`  - Timeout: ${cp.timeout}`);
        }
      }
      sections.push('');
    }

    if (story.humanInteraction.escalation) {
      sections.push('### Escalation\n');
      sections.push(`- **When**: ${story.humanInteraction.escalation.conditions}`);
      sections.push(`- **How**: ${story.humanInteraction.escalation.channel}`);
      sections.push('');
    }
  }

  // Capabilities section (from skills)
  if (story.skills?.length) {
    sections.push('## Capabilities\n');

    for (const skill of story.skills) {
      sections.push(`### ${skill.name}\n`);
      sections.push(skill.description);
      sections.push('');

      // Triggers
      if (skill.triggers?.length) {
        sections.push('**When to activate**:');
        for (const trigger of skill.triggers) {
          sections.push(`- ${trigger.description}`);
          if (trigger.examples?.length) {
            sections.push(`  - Examples: ${trigger.examples.join(', ')}`);
          }
        }
        sections.push('');
      }

      // Behavior steps
      if (skill.behavior) {
        sections.push('**Execution**:');
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
            sections.push(`Choose from: ${skill.behavior.capabilities.join(', ')}`);
            break;
          case 'iterative':
            sections.push(`Repeat: ${skill.behavior.body.join(', ')}`);
            sections.push(`Until: ${skill.behavior.terminationCondition}`);
            break;
        }
        sections.push('');
      }

      // Success conditions
      if (skill.acceptance?.successConditions?.length) {
        sections.push('**Success criteria**:');
        for (const condition of skill.acceptance.successConditions) {
          sections.push(`- ${condition}`);
        }
        sections.push('');
      }
    }
  }

  // Tools section
  const allTools = story.skills?.flatMap((s) => s.tools || []) || [];
  if (allTools.length) {
    sections.push('## Tools\n');
    sections.push('The following tools are available:\n');

    const uniqueTools = new Map<string, typeof allTools[0]>();
    for (const tool of allTools) {
      if (!uniqueTools.has(tool.name)) {
        uniqueTools.set(tool.name, tool);
      }
    }

    for (const tool of uniqueTools.values()) {
      sections.push(`- **${tool.name}**: ${tool.purpose}`);
      if (tool.conditions) {
        sections.push(`  - Use when: ${tool.conditions}`);
      }
    }
    sections.push('');
  }

  // Guardrails section
  if (story.guardrails?.length) {
    sections.push('## Constraints\n');

    for (const guardrail of story.guardrails) {
      const enforcement = guardrail.enforcement === 'hard' ? '⚠️' : '';
      sections.push(`- ${enforcement}**${guardrail.name}**: ${guardrail.constraint}`);
      if (guardrail.rationale) {
        sections.push(`  - Rationale: ${guardrail.rationale}`);
      }
    }
    sections.push('');
  }

  // Memory guidance (what to remember in-session)
  if (story.memory?.working?.length) {
    sections.push('## Context Management\n');
    sections.push('Maintain awareness of:');
    for (const item of story.memory.working) {
      sections.push(`- ${item}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

// ============================================================================
// Slash Command Generation
// ============================================================================

function generateSlashCommand(skill: Skill): string | null {
  if (!skill.name) return null;

  const sections: string[] = [];

  // Command description
  sections.push(skill.description);
  sections.push('');

  // Inputs as prompt template
  if (skill.inputs?.length) {
    sections.push('## Inputs\n');
    for (const input of skill.inputs) {
      const required = input.required !== false ? '(required)' : '(optional)';
      sections.push(`- **${input.name}** ${required}: ${input.description}`);
    }
    sections.push('');
  }

  // Execution steps
  if (skill.behavior) {
    sections.push('## Steps\n');
    switch (skill.behavior.model) {
      case 'sequential':
        skill.behavior.steps.forEach((step, i) => {
          sections.push(`${i + 1}. ${step}`);
        });
        break;
      case 'workflow':
        for (const stage of skill.behavior.stages) {
          sections.push(`### ${stage.name}\n`);
          sections.push(stage.purpose);
          if (stage.actions?.length) {
            stage.actions.forEach((a) => sections.push(`- ${a}`));
          }
          sections.push('');
        }
        break;
      case 'adaptive':
        sections.push('Select and execute based on context:\n');
        skill.behavior.capabilities.forEach((c) => sections.push(`- ${c}`));
        break;
      case 'iterative':
        sections.push('Repeat the following until done:\n');
        skill.behavior.body.forEach((b) => sections.push(`- ${b}`));
        sections.push(`\nStop when: ${skill.behavior.terminationCondition}`);
        break;
    }
    sections.push('');
  }

  // Success criteria
  if (skill.acceptance?.successConditions?.length) {
    sections.push('## Success Criteria\n');
    for (const condition of skill.acceptance.successConditions) {
      sections.push(`- [ ] ${condition}`);
    }
    sections.push('');
  }

  // Guardrails
  if (skill.guardrails?.length) {
    sections.push('## Constraints\n');
    for (const g of skill.guardrails) {
      sections.push(`- **${g.name}**: ${g.constraint}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

// ============================================================================
// MCP Configuration Generation
// ============================================================================

function generateMcpConfig(story: AgentStory): string | null {
  const allTools = story.skills?.flatMap((s) => s.tools || []) || [];
  if (!allTools.length) return null;

  // Group tools as potential MCP servers
  const servers: Record<string, { command: string; description: string }> = {};

  for (const tool of allTools) {
    const slug = generateSlug(tool.name);
    if (!servers[slug]) {
      servers[slug] = {
        command: `npx @${slug}/mcp-server`,
        description: tool.purpose,
      };
    }
  }

  const config = {
    mcpServers: Object.fromEntries(
      Object.entries(servers).map(([name, info]) => [
        name,
        {
          command: info.command,
          args: [],
        },
      ])
    ),
  };

  return JSON.stringify(config, null, 2);
}

// ============================================================================
// Helpers
// ============================================================================

function formatHumanInteractionMode(mode: string): string {
  switch (mode) {
    case 'in_the_loop':
      return 'Human-in-the-loop (approval required for actions)';
    case 'on_the_loop':
      return 'Human-on-the-loop (oversight with ability to intervene)';
    case 'out_of_loop':
      return 'Human-out-of-loop (autonomous operation)';
    default:
      return mode;
  }
}

// ============================================================================
// Register Adapter
// ============================================================================

registerAdapter(claudeAdapter);
