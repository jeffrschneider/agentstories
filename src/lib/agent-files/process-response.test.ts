import { describe, it, expect } from 'vitest';
import { processStructuredResponse, type ChatAction } from './process-response';
import type { AgentFile } from './types';
import type { AgentChatResponse } from './chat-prompt';

describe('processStructuredResponse', () => {
  describe('question action', () => {
    it('returns empty actions for question', () => {
      const response: AgentChatResponse = {
        action: 'question',
        message: 'What should the agent do?',
      };

      const actions = processStructuredResponse(response, [], 'New Agent');

      expect(actions).toHaveLength(0);
    });
  });

  describe('create_agent action', () => {
    it('creates agent.md with proper content', () => {
      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Created agent',
        agent: {
          name: 'Joke Agent',
          purpose: 'Tell jokes',
          autonomyLevel: 'supervised',
        },
        skills: [],
      };

      const actions = processStructuredResponse(response, [], 'New Agent');

      const agentMdAction = actions.find(a => a.path === 'agent.md');
      expect(agentMdAction).toBeDefined();
      expect(agentMdAction?.type).toBe('create_file');
      expect(agentMdAction?.content).toContain('# Joke Agent');
      expect(agentMdAction?.content).toContain('Tell jokes');
    });

    it('creates config.yaml', () => {
      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Created agent',
        agent: {
          name: 'Test Agent',
          purpose: 'Test',
        },
        skills: [],
      };

      const actions = processStructuredResponse(response, [], 'New Agent');

      const configAction = actions.find(a => a.path === 'config.yaml');
      expect(configAction).toBeDefined();
      expect(configAction?.type).toBe('create_file');
      expect(configAction?.content).toContain('name: Test Agent');
    });

    it('creates directory structure for new agents', () => {
      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Created agent',
        agent: { name: 'Test' },
        skills: [],
      };

      const actions = processStructuredResponse(response, [], 'New Agent');
      const paths = actions.map(a => a.path);

      expect(paths).toContain('memory/short_term/.gitkeep');
      expect(paths).toContain('memory/long_term/.gitkeep');
      expect(paths).toContain('tools/.gitkeep');
      expect(paths).toContain('logs/.gitkeep');
    });

    it('includes update_name action', () => {
      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Created agent',
        agent: { name: 'My Agent' },
        skills: [],
      };

      const actions = processStructuredResponse(response, [], 'New Agent');

      const nameAction = actions.find(a => a.type === 'update_name');
      expect(nameAction).toBeDefined();
      expect(nameAction?.name).toBe('My Agent');
    });

    it('creates skill files per Agent Skills spec', () => {
      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Created agent',
        agent: { name: 'Joke Agent' },
        skills: [
          {
            name: 'joke-telling',
            description: 'Tell jokes to users',
            domain: 'Entertainment',
            triggers: [{ type: 'message', description: 'User asks' }],
            behavior: { model: 'sequential', steps: ['Get joke', 'Tell joke'] },
            acceptance: { successConditions: ['User laughs'] },
          },
        ],
      };

      const actions = processStructuredResponse(response, [], 'New Agent');
      const paths = actions.map(a => a.path);

      // Check skill files
      expect(paths).toContain('skills/joke-telling/SKILL.md');
      expect(paths).toContain('skills/joke-telling/config.yaml');
      expect(paths).toContain('skills/joke-telling/scripts/.gitkeep');
      expect(paths).toContain('skills/joke-telling/references/.gitkeep');
      expect(paths).toContain('skills/joke-telling/assets/.gitkeep');
    });

    it('adds skill links to agent.md', () => {
      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Created agent',
        agent: { name: 'Joke Agent' },
        skills: [
          { name: 'joke-telling', description: 'Tell jokes' },
          { name: 'riddle-telling', description: 'Tell riddles' },
        ],
      };

      const actions = processStructuredResponse(response, [], 'New Agent');

      const agentMdAction = actions.find(a => a.path === 'agent.md');
      expect(agentMdAction?.content).toContain('## Skills');
      expect(agentMdAction?.content).toContain('[joke-telling](skills/joke-telling/SKILL.md)');
      expect(agentMdAction?.content).toContain('[riddle-telling](skills/riddle-telling/SKILL.md)');
    });

    it('generates SKILL.md with YAML frontmatter', () => {
      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Created agent',
        agent: { name: 'Test' },
        skills: [
          {
            name: 'data-processing',
            description: 'Process data files efficiently',
            domain: 'Data',
          },
        ],
      };

      const actions = processStructuredResponse(response, [], 'New Agent');

      const skillMd = actions.find(a => a.path === 'skills/data-processing/SKILL.md');
      expect(skillMd?.content).toMatch(/^---\nname: data-processing\n/);
      expect(skillMd?.content).toContain('description: Process data files efficiently');
      expect(skillMd?.content).toContain('domain: Data');
    });
  });

  describe('add_skill action', () => {
    it('updates agent.md with new skill links', () => {
      const existingFiles: AgentFile[] = [
        {
          path: 'agent.md',
          content: '# Joke Agent\n\n## Purpose\nTell jokes',
          type: 'agents',
          lastModified: '2024-01-01',
        },
      ];

      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added riddle skill',
        skills: [
          { name: 'riddle-telling', description: 'Tell riddles' },
        ],
      };

      const actions = processStructuredResponse(response, existingFiles, 'Joke Agent');

      const agentMdAction = actions.find(a => a.path === 'agent.md');
      expect(agentMdAction).toBeDefined();
      expect(agentMdAction?.type).toBe('update_file');
      expect(agentMdAction?.content).toContain('## Skills');
      expect(agentMdAction?.content).toContain('[riddle-telling](skills/riddle-telling/SKILL.md)');
    });

    it('preserves existing skills when adding new ones', () => {
      const existingFiles: AgentFile[] = [
        {
          path: 'agent.md',
          content: '# Joke Agent\n\n## Skills\n- [joke-telling](skills/joke-telling/SKILL.md) - Tell jokes',
          type: 'agents',
          lastModified: '2024-01-01',
        },
        {
          path: 'skills/joke-telling/SKILL.md',
          content: '---\nname: joke-telling\ndescription: Tell jokes\n---\n\n# Joke Telling',
          type: 'skill',
          lastModified: '2024-01-01',
        },
      ];

      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added riddle skill',
        skills: [
          { name: 'riddle-telling', description: 'Tell riddles' },
        ],
      };

      const actions = processStructuredResponse(response, existingFiles, 'Joke Agent');

      const agentMdAction = actions.find(a => a.path === 'agent.md');
      // Should have both skills
      expect(agentMdAction?.content).toContain('riddle-telling');
      expect(agentMdAction?.content).toContain('Joke Telling');
    });

    it('creates skill directory structure', () => {
      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added skill',
        skills: [
          { name: 'new-skill', description: 'A new skill' },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');
      const paths = actions.map(a => a.path);

      expect(paths).toContain('skills/new-skill/SKILL.md');
      expect(paths).toContain('skills/new-skill/config.yaml');
      expect(paths).toContain('skills/new-skill/scripts/.gitkeep');
      expect(paths).toContain('skills/new-skill/references/.gitkeep');
      expect(paths).toContain('skills/new-skill/assets/.gitkeep');
    });
  });

  describe('skill with scripts, references, assets', () => {
    it('creates script files', () => {
      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added skill with scripts',
        skills: [
          {
            name: 'data-processor',
            description: 'Process data',
            scripts: [
              { filename: 'process.py', language: 'python', purpose: 'Process', content: 'print("hello")' },
            ],
          },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');

      const scriptAction = actions.find(a => a.path === 'skills/data-processor/scripts/process.py');
      expect(scriptAction).toBeDefined();
      expect(scriptAction?.type).toBe('create_file');
      expect(scriptAction?.content).toBe('print("hello")');
    });

    it('creates reference files', () => {
      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added skill',
        skills: [
          {
            name: 'api-caller',
            description: 'Call APIs',
            references: [
              { filename: 'api-guide.md', title: 'API Guide', content: '# API Guide' },
            ],
          },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');

      const refAction = actions.find(a => a.path === 'skills/api-caller/references/api-guide.md');
      expect(refAction).toBeDefined();
      expect(refAction?.content).toBe('# API Guide');
    });

    it('creates asset files', () => {
      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added skill',
        skills: [
          {
            name: 'validator',
            description: 'Validate data',
            assets: [
              { filename: 'schema.json', type: 'json', description: 'Schema', content: '{}' },
            ],
          },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');

      const assetAction = actions.find(a => a.path === 'skills/validator/assets/schema.json');
      expect(assetAction).toBeDefined();
      expect(assetAction?.content).toBe('{}');
    });

    it('skips gitkeep when actual files are provided', () => {
      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added skill',
        skills: [
          {
            name: 'test-skill',
            description: 'Test',
            scripts: [{ filename: 'run.py', language: 'python', purpose: 'Run', content: '' }],
          },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');
      const paths = actions.map(a => a.path);

      // Should have the script but not the scripts/.gitkeep
      expect(paths).toContain('skills/test-skill/scripts/run.py');
      expect(paths).not.toContain('skills/test-skill/scripts/.gitkeep');
      // But should have other gitkeeps
      expect(paths).toContain('skills/test-skill/references/.gitkeep');
      expect(paths).toContain('skills/test-skill/assets/.gitkeep');
    });
  });

  describe('add_file action', () => {
    it('creates arbitrary files', () => {
      const response: AgentChatResponse = {
        action: 'add_file',
        message: 'Added config',
        files: [
          { path: 'custom/config.json', content: '{"key": "value"}', action: 'create' },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');

      const fileAction = actions.find(a => a.path === 'custom/config.json');
      expect(fileAction).toBeDefined();
      expect(fileAction?.type).toBe('create_file');
      expect(fileAction?.content).toBe('{"key": "value"}');
    });

    it('deletes files', () => {
      const existingFiles: AgentFile[] = [
        { path: 'old-file.txt', content: 'old', type: 'unknown', lastModified: '2024-01-01' },
      ];

      const response: AgentChatResponse = {
        action: 'add_file',
        message: 'Deleted file',
        files: [
          { path: 'old-file.txt', content: '', action: 'delete' },
        ],
      };

      const actions = processStructuredResponse(response, existingFiles, 'Agent');

      const deleteAction = actions.find(a => a.path === 'old-file.txt');
      expect(deleteAction?.type).toBe('delete_file');
    });

    it('updates existing files', () => {
      const existingFiles: AgentFile[] = [
        { path: 'config.json', content: '{}', type: 'unknown', lastModified: '2024-01-01' },
      ];

      const response: AgentChatResponse = {
        action: 'add_file',
        message: 'Updated config',
        files: [
          { path: 'config.json', content: '{"updated": true}', action: 'update' },
        ],
      };

      const actions = processStructuredResponse(response, existingFiles, 'Agent');

      const updateAction = actions.find(a => a.path === 'config.json');
      expect(updateAction?.type).toBe('update_file');
      expect(updateAction?.content).toBe('{"updated": true}');
    });
  });

  describe('update_agent action', () => {
    it('updates agent.md for existing agent', () => {
      const existingFiles: AgentFile[] = [
        { path: 'agent.md', content: '# Old Agent', type: 'agents', lastModified: '2024-01-01' },
        { path: 'config.yaml', content: 'name: Old Agent', type: 'config', lastModified: '2024-01-01' },
      ];

      const response: AgentChatResponse = {
        action: 'update_agent',
        message: 'Updated agent',
        agent: {
          name: 'New Agent Name',
          purpose: 'New purpose',
        },
      };

      const actions = processStructuredResponse(response, existingFiles, 'Old Agent');

      const agentMdAction = actions.find(a => a.path === 'agent.md');
      expect(agentMdAction?.type).toBe('update_file');
      expect(agentMdAction?.content).toContain('# New Agent Name');
      expect(agentMdAction?.content).toContain('New purpose');
    });
  });

  describe('slug generation', () => {
    it('converts skill names to kebab-case slugs', () => {
      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added skill',
        skills: [
          { name: 'Tell Funny Jokes', description: 'Tell jokes' },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');
      const paths = actions.map(a => a.path);

      expect(paths).toContain('skills/tell-funny-jokes/SKILL.md');
    });

    it('handles special characters in skill names', () => {
      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added skill',
        skills: [
          { name: 'User\'s Helper!', description: 'Help users' },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');
      const paths = actions.map(a => a.path);

      expect(paths.some(p => p.includes('skills/user-s-helper/'))).toBe(true);
    });
  });

  describe('action type separation (create vs update)', () => {
    it('returns create_file for new files and update_file for existing files', () => {
      const existingFiles: AgentFile[] = [
        { path: 'agent.md', content: '# Existing Agent', type: 'agents', lastModified: '2024-01-01' },
        { path: 'config.yaml', content: 'name: Existing Agent', type: 'config', lastModified: '2024-01-01' },
      ];

      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Updated agent with new skill',
        agent: { name: 'Updated Agent', purpose: 'Test' },
        skills: [
          { name: 'new-skill', description: 'A new skill' },
        ],
      };

      const actions = processStructuredResponse(response, existingFiles, 'Existing Agent');

      // Existing files should be update_file
      const agentMdAction = actions.find(a => a.path === 'agent.md');
      expect(agentMdAction?.type).toBe('update_file');

      const configAction = actions.find(a => a.path === 'config.yaml');
      expect(configAction?.type).toBe('update_file');

      // New skill files should be create_file
      const skillMdAction = actions.find(a => a.path === 'skills/new-skill/SKILL.md');
      expect(skillMdAction?.type).toBe('create_file');

      const skillConfigAction = actions.find(a => a.path === 'skills/new-skill/config.yaml');
      expect(skillConfigAction?.type).toBe('create_file');
    });

    it('correctly identifies create vs update when adding skill to existing agent', () => {
      const existingFiles: AgentFile[] = [
        { path: 'agent.md', content: '# Agent\n\n## Purpose\nDo things', type: 'agents', lastModified: '2024-01-01' },
        { path: 'skills/existing-skill/SKILL.md', content: '---\nname: existing-skill\n---', type: 'skill', lastModified: '2024-01-01' },
      ];

      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added new skill',
        skills: [
          { name: 'brand-new-skill', description: 'Totally new' },
        ],
      };

      const actions = processStructuredResponse(response, existingFiles, 'Agent');

      // agent.md should be update_file (adding skill link)
      const agentMdAction = actions.find(a => a.path === 'agent.md');
      expect(agentMdAction?.type).toBe('update_file');

      // New skill should be create_file
      const newSkillAction = actions.find(a => a.path === 'skills/brand-new-skill/SKILL.md');
      expect(newSkillAction?.type).toBe('create_file');

      // New skill directories should be create_file
      const scriptsAction = actions.find(a => a.path === 'skills/brand-new-skill/scripts/.gitkeep');
      expect(scriptsAction?.type).toBe('create_file');
    });

    it('mixes create and update for multiple file changes', () => {
      const existingFiles: AgentFile[] = [
        { path: 'agent.md', content: '# Agent', type: 'agents', lastModified: '2024-01-01' },
        { path: 'config.yaml', content: 'name: Agent', type: 'config', lastModified: '2024-01-01' },
        { path: 'existing-file.json', content: '{}', type: 'unknown', lastModified: '2024-01-01' },
      ];

      const response: AgentChatResponse = {
        action: 'add_file',
        message: 'Mixed file operations',
        files: [
          { path: 'existing-file.json', content: '{"updated": true}', action: 'update' },
          { path: 'new-file.json', content: '{"new": true}', action: 'create' },
        ],
      };

      const actions = processStructuredResponse(response, existingFiles, 'Agent');

      const updateAction = actions.find(a => a.path === 'existing-file.json');
      expect(updateAction?.type).toBe('update_file');

      const createAction = actions.find(a => a.path === 'new-file.json');
      expect(createAction?.type).toBe('create_file');
    });

    it('all skill subdirectories are create_file for new skills', () => {
      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Added skill',
        skills: [
          { name: 'complete-skill', description: 'Has all directories' },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');

      // Filter to only create_file actions for this skill
      const createActions = actions.filter(
        a => a.type === 'create_file' && a.path.startsWith('skills/complete-skill/')
      );

      // Should have SKILL.md, config.yaml, and 3 .gitkeep files
      expect(createActions.length).toBeGreaterThanOrEqual(5);

      const paths = createActions.map(a => a.path);
      expect(paths).toContain('skills/complete-skill/SKILL.md');
      expect(paths).toContain('skills/complete-skill/config.yaml');
      expect(paths).toContain('skills/complete-skill/scripts/.gitkeep');
      expect(paths).toContain('skills/complete-skill/references/.gitkeep');
      expect(paths).toContain('skills/complete-skill/assets/.gitkeep');
    });
  });

  describe('skill directory structure always created', () => {
    it('creates scripts/, references/, and assets/ directories for every new skill', () => {
      const response: AgentChatResponse = {
        action: 'create_agent',
        message: 'Created agent with multiple skills',
        agent: { name: 'Multi-Skill Agent' },
        skills: [
          { name: 'skill-one', description: 'First skill' },
          { name: 'skill-two', description: 'Second skill' },
          { name: 'skill-three', description: 'Third skill' },
        ],
      };

      const actions = processStructuredResponse(response, [], 'Agent');
      const paths = actions.map(a => a.path);

      // Each skill should have all three directories
      for (const skillName of ['skill-one', 'skill-two', 'skill-three']) {
        expect(paths).toContain(`skills/${skillName}/SKILL.md`);
        expect(paths).toContain(`skills/${skillName}/config.yaml`);
        expect(paths).toContain(`skills/${skillName}/scripts/.gitkeep`);
        expect(paths).toContain(`skills/${skillName}/references/.gitkeep`);
        expect(paths).toContain(`skills/${skillName}/assets/.gitkeep`);
      }
    });

    it('does not create duplicate directories for existing skills', () => {
      const existingFiles: AgentFile[] = [
        { path: 'skills/existing-skill/SKILL.md', content: '---\nname: existing-skill\n---', type: 'skill', lastModified: '2024-01-01' },
        { path: 'skills/existing-skill/scripts/.gitkeep', content: '', type: 'unknown', lastModified: '2024-01-01' },
      ];

      const response: AgentChatResponse = {
        action: 'add_skill',
        message: 'Updating existing skill',
        skills: [
          { name: 'existing-skill', description: 'Updated description' },
        ],
      };

      const actions = processStructuredResponse(response, existingFiles, 'Agent');

      // Should update the existing SKILL.md, not create new directories
      const skillMdAction = actions.find(a => a.path === 'skills/existing-skill/SKILL.md');
      expect(skillMdAction?.type).toBe('update_file');

      // Should NOT have gitkeep actions since skill already exists
      const gitkeepActions = actions.filter(
        a => a.path.includes('existing-skill') && a.path.endsWith('.gitkeep')
      );
      expect(gitkeepActions.length).toBe(0);
    });
  });
});
