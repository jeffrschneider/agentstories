/**
 * Process structured JSON response from LLM into file actions
 *
 * This module converts the LLM's JSON response into a list of file
 * actions (create, update, delete) that map to the Agent Skills
 * file structure.
 */

import type { AgentFile } from './types';
import { generateSlug } from './types';
import { generateAgentMd, generateSkillMd, generateAgentConfig, generateSkillConfig } from './transforms';
import type { AgentChatResponse } from './chat-prompt';
import type { AgentStory } from '@/lib/schemas/story';

export interface ChatAction {
  type: 'create_file' | 'update_file' | 'delete_file' | 'update_name';
  path: string;
  content?: string;
  name?: string;
}

/**
 * Convert a JSON response to file actions
 */
export function processStructuredResponse(
  response: AgentChatResponse,
  files: AgentFile[],
  agentName: string
): ChatAction[] {
  const actions: ChatAction[] = [];

  // Handle question action - no file changes, just display the message
  if (response.action === 'question') {
    return actions; // Empty - the message is already shown in the chat
  }

  // Process agent identity
  if (response.agent) {
    // Build skill links for agent.md
    const skillLinks = response.skills?.map(s => {
      const slug = generateSlug(s.name);
      return `- [${s.name}](skills/${slug}/SKILL.md) - ${s.description || 'No description'}`;
    }) || [];

    // Also include existing skills that aren't being updated
    const existingSkillFiles = files.filter(f => f.path.endsWith('SKILL.md'));
    for (const skillFile of existingSkillFiles) {
      const pathMatch = skillFile.path.match(/skills\/([^/]+)\/SKILL\.md/);
      if (pathMatch) {
        const slug = pathMatch[1];
        // Don't duplicate if this skill is being updated
        const isBeingUpdated = response.skills?.some(s => generateSlug(s.name) === slug);
        if (!isBeingUpdated) {
          // Extract name from file content (look for # Title)
          const titleMatch = skillFile.content.match(/^#\s+(.+)$/m);
          const name = titleMatch?.[1] || slug;
          const descMatch = skillFile.content.match(/description:\s*(.+)/);
          const desc = descMatch?.[1] || 'No description';
          skillLinks.push(`- [${name}](skills/${slug}/SKILL.md) - ${desc}`);
        }
      }
    }

    const skillsSection = skillLinks.length > 0
      ? `\n## Skills\n${skillLinks.join('\n')}\n`
      : '';

    const agentStory = {
      name: response.agent.name || agentName,
      purpose: response.agent.purpose,
      role: response.agent.role,
      autonomyLevel: response.agent.autonomyLevel,
      guardrails: response.agent.guardrails?.map(g => ({
        ...g,
        enforcement: 'hard' as const,
      })),
      tags: response.agent.tags,
    } as AgentStory;

    // Generate agent.md with skills section appended
    const agentContent = generateAgentMd(agentStory) + skillsSection;

    actions.push({
      type: files.some(f => f.path === 'agent.md') ? 'update_file' : 'create_file',
      path: 'agent.md',
      content: agentContent,
    });

    // Generate config.yaml for the agent
    const isNewAgent = !files.some(f => f.path === 'config.yaml');
    actions.push({
      type: isNewAgent ? 'create_file' : 'update_file',
      path: 'config.yaml',
      content: generateAgentConfig(agentStory),
    });

    // Create directory structure for new agents
    if (isNewAgent) {
      // Create memory directories
      actions.push({
        type: 'create_file',
        path: 'memory/short_term/.gitkeep',
        content: '',
      });
      actions.push({
        type: 'create_file',
        path: 'memory/long_term/.gitkeep',
        content: '',
      });
      // Create tools directory
      actions.push({
        type: 'create_file',
        path: 'tools/.gitkeep',
        content: '',
      });
      // Create logs directory
      actions.push({
        type: 'create_file',
        path: 'logs/.gitkeep',
        content: '',
      });
    }

    // Update the agent name in the UI header
    if (response.agent.name) {
      actions.push({
        type: 'update_name',
        path: '',
        name: response.agent.name,
      });
    }
  }

  // Process skills
  if (response.skills?.length) {
    // If we have skills but no agent property, we need to update agent.md with new skill links
    if (!response.agent) {
      const existingAgentFile = files.find(f => f.path === 'agent.md');
      if (existingAgentFile) {
        // Build new skill links
        const newSkillLinks = response.skills.map(s => {
          const slug = generateSlug(s.name);
          return `- [${s.name}](skills/${slug}/SKILL.md) - ${s.description || 'No description'}`;
        });

        // Also preserve existing skills not being updated
        const existingSkillFiles = files.filter(f => f.path.endsWith('SKILL.md'));
        for (const skillFile of existingSkillFiles) {
          const pathMatch = skillFile.path.match(/skills\/([^/]+)\/SKILL\.md/);
          if (pathMatch) {
            const slug = pathMatch[1];
            // Don't duplicate if this skill is being updated
            const isBeingUpdated = response.skills.some(s => generateSlug(s.name) === slug);
            if (!isBeingUpdated) {
              const titleMatch = skillFile.content.match(/^#\s+(.+)$/m);
              const name = titleMatch?.[1] || slug;
              const descMatch = skillFile.content.match(/description:\s*(.+)/);
              const desc = descMatch?.[1] || 'No description';
              newSkillLinks.push(`- [${name}](skills/${slug}/SKILL.md) - ${desc}`);
            }
          }
        }

        // Update agent.md with new skills section
        let updatedContent = existingAgentFile.content;
        const skillsSectionRegex = /## Skills\n([\s\S]*?)(?=\n## |\n*$)/;
        const newSkillsSection = `## Skills\n${newSkillLinks.join('\n')}\n`;

        if (skillsSectionRegex.test(updatedContent)) {
          // Replace existing Skills section
          updatedContent = updatedContent.replace(skillsSectionRegex, newSkillsSection);
        } else {
          // Add Skills section at the end
          updatedContent = updatedContent.trimEnd() + '\n\n' + newSkillsSection;
        }

        actions.push({
          type: 'update_file',
          path: 'agent.md',
          content: updatedContent,
        });
      }
    }

    for (const skill of response.skills) {
      const slug = generateSlug(skill.name);
      const skillPath = `skills/${slug}/SKILL.md`;

      const skillContent = generateSkillMd({
        id: crypto.randomUUID(),
        name: skill.name,
        description: skill.description || '',
        domain: skill.domain || 'General',
        acquired: 'built_in',
        portability: {
          slug,
          license: skill.license,
          compatibility: skill.compatibility,
          scripts: skill.scripts?.map(s => ({
            filename: s.filename,
            language: s.language as 'python' | 'bash' | 'javascript' | 'typescript',
            purpose: s.purpose,
            content: s.content,
          })),
          references: skill.references?.map(r => ({
            filename: r.filename,
            title: r.title,
            content: r.content,
          })),
          assets: skill.assets?.map(a => ({
            filename: a.filename,
            type: (a.type || 'other') as 'json' | 'yaml' | 'csv' | 'txt' | 'png' | 'svg' | 'other',
            description: a.description,
            content: a.content,
          })),
        },
        triggers: skill.triggers?.map(t => ({
          type: t.type as 'message' | 'schedule' | 'manual' | 'condition',
          description: t.description,
        })) || [{ type: 'manual' as const, description: 'Manually triggered' }],
        behavior: skill.behavior?.model === 'sequential' && skill.behavior.steps ? {
          model: 'sequential' as const,
          steps: skill.behavior.steps,
        } : skill.behavior?.model === 'workflow' ? {
          model: 'workflow' as const,
          stages: [],
        } : skill.behavior?.model === 'adaptive' ? {
          model: 'adaptive' as const,
          capabilities: [],
        } : undefined,
        tools: skill.tools?.map(t => ({
          name: t.name,
          purpose: t.purpose,
          permissions: t.permissions as ('read' | 'write' | 'execute')[],
          required: true,
        })),
        acceptance: skill.acceptance ? {
          successConditions: skill.acceptance.successConditions,
        } : { successConditions: ['Task completed successfully'] },
        guardrails: skill.guardrails?.map(g => ({
          ...g,
          enforcement: 'hard' as const,
        })),
      });

      actions.push({
        type: files.some(f => f.path === skillPath) ? 'update_file' : 'create_file',
        path: skillPath,
        content: skillContent,
      });

      // Create skill config.yaml
      const skillConfigPath = `skills/${slug}/config.yaml`;
      const skillObj = {
        id: crypto.randomUUID(),
        name: skill.name,
        description: skill.description || '',
        domain: skill.domain || 'General',
        acquired: 'built_in' as const,
        triggers: skill.triggers?.map(t => ({
          type: t.type as 'message' | 'schedule' | 'manual' | 'condition',
          description: t.description,
        })) || [{ type: 'manual' as const, description: 'Manually triggered' }],
        behavior: skill.behavior?.model === 'sequential' && skill.behavior.steps ? {
          model: 'sequential' as const,
          steps: skill.behavior.steps,
        } : { model: 'sequential' as const, steps: ['Execute task'] },
        tools: skill.tools?.map(t => ({
          name: t.name,
          purpose: t.purpose,
          permissions: t.permissions as ('read' | 'write' | 'execute')[],
          required: true,
        })),
        acceptance: skill.acceptance ? {
          successConditions: skill.acceptance.successConditions,
        } : { successConditions: ['Task completed successfully'] },
        guardrails: skill.guardrails?.map(g => ({
          ...g,
          enforcement: 'hard' as const,
        })),
      };
      actions.push({
        type: files.some(f => f.path === skillConfigPath) ? 'update_file' : 'create_file',
        path: skillConfigPath,
        content: generateSkillConfig(skillObj),
      });

      // Create skill subdirectories if they don't exist
      const isNewSkill = !files.some(f => f.path === skillPath);
      if (isNewSkill) {
        // scripts/ directory
        if (!skill.scripts?.length) {
          actions.push({
            type: 'create_file',
            path: `skills/${slug}/scripts/.gitkeep`,
            content: '',
          });
        }
        // references/ directory
        if (!skill.references?.length) {
          actions.push({
            type: 'create_file',
            path: `skills/${slug}/references/.gitkeep`,
            content: '',
          });
        }
        // assets/ directory
        if (!skill.assets?.length) {
          actions.push({
            type: 'create_file',
            path: `skills/${slug}/assets/.gitkeep`,
            content: '',
          });
        }
      }

      // Create script files
      if (skill.scripts?.length) {
        for (const script of skill.scripts) {
          const scriptPath = `skills/${slug}/scripts/${script.filename}`;
          actions.push({
            type: files.some(f => f.path === scriptPath) ? 'update_file' : 'create_file',
            path: scriptPath,
            content: script.content || '',
          });
        }
      }

      // Create reference files
      if (skill.references?.length) {
        for (const ref of skill.references) {
          const refPath = `skills/${slug}/references/${ref.filename}`;
          actions.push({
            type: files.some(f => f.path === refPath) ? 'update_file' : 'create_file',
            path: refPath,
            content: ref.content || '',
          });
        }
      }

      // Create asset files
      if (skill.assets?.length) {
        for (const asset of skill.assets) {
          const assetPath = `skills/${slug}/assets/${asset.filename}`;
          actions.push({
            type: files.some(f => f.path === assetPath) ? 'update_file' : 'create_file',
            path: assetPath,
            content: asset.content || '',
          });
        }
      }
    }
  }

  // Process arbitrary file actions
  if (response.files?.length) {
    for (const file of response.files) {
      if (file.action === 'delete') {
        actions.push({
          type: 'delete_file',
          path: file.path,
        });
      } else {
        actions.push({
          type: files.some(f => f.path === file.path) ? 'update_file' : 'create_file',
          path: file.path,
          content: file.content,
        });
      }
    }
  }

  return actions;
}
