import { describe, it, expect } from 'vitest';
import {
  generateAgentMd,
  generateSkillMd,
  generateAgentConfig,
  generateSkillConfig,
  parseAgentMd,
  parseSkillMd,
  storyToFiles,
} from './transforms';
import { generateSlug, inferFileType } from './types';
import type { AgentStory } from '@/lib/schemas/story';
import type { Skill } from '@/lib/schemas/skill';

describe('generateSlug', () => {
  it('converts name to kebab-case', () => {
    expect(generateSlug('Joke Agent')).toBe('joke-agent');
    expect(generateSlug('Tell Jokes')).toBe('tell-jokes');
    expect(generateSlug('PDF Processing')).toBe('pdf-processing');
  });

  it('handles special characters', () => {
    expect(generateSlug('My Agent!')).toBe('my-agent');
    expect(generateSlug('Agent & Skills')).toBe('agent-skills');
    expect(generateSlug("User's Helper")).toBe('user-s-helper');
  });

  it('removes consecutive hyphens', () => {
    expect(generateSlug('My -- Agent')).toBe('my-agent');
    expect(generateSlug('Agent   Name')).toBe('agent-name');
  });

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug('-Agent-')).toBe('agent');
    expect(generateSlug('  Agent  ')).toBe('agent');
  });

  it('truncates to 64 characters', () => {
    const longName = 'A'.repeat(100);
    expect(generateSlug(longName).length).toBeLessThanOrEqual(64);
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles numbers', () => {
    expect(generateSlug('Agent 2.0')).toBe('agent-2-0');
    expect(generateSlug('123 Agent')).toBe('123-agent');
  });
});

describe('inferFileType', () => {
  it('identifies agent.md', () => {
    expect(inferFileType('agent.md')).toBe('agents');
    expect(inferFileType('AGENTS.md')).toBe('agents');
  });

  it('identifies skill files', () => {
    expect(inferFileType('skills/joke-telling/SKILL.md')).toBe('skill');
    expect(inferFileType('skills/my-skill/config.yaml')).toBe('skill-config');
  });

  it('identifies Agent Skills spec directories', () => {
    expect(inferFileType('skills/my-skill/scripts/run.py')).toBe('script');
    expect(inferFileType('skills/my-skill/references/guide.md')).toBe('reference');
    expect(inferFileType('skills/my-skill/assets/schema.json')).toBe('asset');
  });

  it('identifies config files', () => {
    expect(inferFileType('config.yaml')).toBe('config');
    expect(inferFileType('tools/mcp-servers.json')).toBe('mcp-config');
  });
});

describe('generateAgentMd', () => {
  it('generates basic agent markdown', () => {
    const story: AgentStory = {
      id: 'test-id',
      name: 'Joke Agent',
      version: '1.0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      purpose: 'Entertain users with jokes',
      skills: [],
    };

    const md = generateAgentMd(story);

    expect(md).toContain('# Joke Agent');
    expect(md).toContain('## Purpose');
    expect(md).toContain('Entertain users with jokes');
  });

  it('includes autonomy level', () => {
    const story: AgentStory = {
      id: 'test-id',
      name: 'Test Agent',
      version: '1.0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      autonomyLevel: 'supervised',
      skills: [],
    };

    const md = generateAgentMd(story);

    expect(md).toContain('## Autonomy');
    expect(md).toContain('Supervised');
  });

  it('includes guardrails', () => {
    const story: AgentStory = {
      id: 'test-id',
      name: 'Test Agent',
      version: '1.0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      guardrails: [
        { name: 'Safe Content', constraint: 'No harmful content', enforcement: 'hard' },
      ],
      skills: [],
    };

    const md = generateAgentMd(story);

    expect(md).toContain('## Guardrails');
    expect(md).toContain('**Safe Content**');
    expect(md).toContain('No harmful content');
  });

  it('includes tags', () => {
    const story: AgentStory = {
      id: 'test-id',
      name: 'Test Agent',
      version: '1.0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      tags: ['entertainment', 'humor'],
      skills: [],
    };

    const md = generateAgentMd(story);

    expect(md).toContain('## Tags');
    expect(md).toContain('entertainment, humor');
  });
});

describe('generateSkillMd', () => {
  it('generates YAML frontmatter per Agent Skills spec', () => {
    const skill: Skill = {
      id: 'test-id',
      name: 'Joke Telling',
      description: 'Tell jokes to users',
      domain: 'Entertainment',
      acquired: 'built_in',
      triggers: [{ type: 'manual', description: 'Manually triggered' }],
      acceptance: { successConditions: ['User laughs'] },
    };

    const md = generateSkillMd(skill);

    // Check frontmatter format
    expect(md).toMatch(/^---\nname: joke-telling\n/);
    expect(md).toContain('description: Tell jokes to users');
    expect(md).toContain('domain: Entertainment');
    expect(md).toContain('---\n\n# Joke Telling');
  });

  it('includes triggers section', () => {
    const skill: Skill = {
      id: 'test-id',
      name: 'Test Skill',
      description: 'Test',
      triggers: [
        { type: 'message', description: 'User asks for help' },
        { type: 'schedule', description: 'Every hour' },
      ],
      acceptance: { successConditions: ['Done'] },
    };

    const md = generateSkillMd(skill);

    expect(md).toContain('## Triggers');
    expect(md).toContain('**message**: User asks for help');
    expect(md).toContain('**schedule**: Every hour');
  });

  it('includes behavior with steps', () => {
    const skill: Skill = {
      id: 'test-id',
      name: 'Test Skill',
      description: 'Test',
      triggers: [{ type: 'manual', description: 'Manual' }],
      behavior: {
        model: 'sequential',
        steps: ['Step 1', 'Step 2', 'Step 3'],
      },
      acceptance: { successConditions: ['Done'] },
    };

    const md = generateSkillMd(skill);

    expect(md).toContain('## Behavior');
    expect(md).toContain('**Model**: sequential');
    expect(md).toContain('### Steps');
    expect(md).toContain('1. Step 1');
    expect(md).toContain('2. Step 2');
    expect(md).toContain('3. Step 3');
  });

  it('includes tools section', () => {
    const skill: Skill = {
      id: 'test-id',
      name: 'Test Skill',
      description: 'Test',
      triggers: [{ type: 'manual', description: 'Manual' }],
      tools: [
        { name: 'API', purpose: 'Fetch data', permissions: ['read'], required: true },
      ],
      acceptance: { successConditions: ['Done'] },
    };

    const md = generateSkillMd(skill);

    expect(md).toContain('## Tools');
    expect(md).toContain('**API**: Fetch data [read]');
  });

  it('includes success criteria', () => {
    const skill: Skill = {
      id: 'test-id',
      name: 'Test Skill',
      description: 'Test',
      triggers: [{ type: 'manual', description: 'Manual' }],
      acceptance: {
        successConditions: ['Task complete', 'User satisfied'],
      },
    };

    const md = generateSkillMd(skill);

    expect(md).toContain('## Success Criteria');
    expect(md).toContain('- Task complete');
    expect(md).toContain('- User satisfied');
  });
});

describe('parseAgentMd', () => {
  it('parses agent name from title', () => {
    const md = '# My Agent\n\n## Purpose\nDo things';
    const result = parseAgentMd(md);

    expect(result.name).toBe('My Agent');
  });

  it('parses purpose section', () => {
    const md = '# Agent\n\n## Purpose\nHelp users with tasks';
    const result = parseAgentMd(md);

    expect(result.purpose).toBe('Help users with tasks');
  });

  it('parses autonomy level', () => {
    const md = '# Agent\n\n## Autonomy\nSupervised - Operates independently';
    const result = parseAgentMd(md);

    expect(result.autonomyLevel).toBe('supervised');
  });

  it('parses guardrails', () => {
    const md = `# Agent

## Guardrails
- **Safe**: No harm
- **Polite**: Be nice`;

    const result = parseAgentMd(md);

    expect(result.guardrails).toHaveLength(2);
    expect(result.guardrails?.[0].name).toBe('Safe');
    expect(result.guardrails?.[0].constraint).toBe('No harm');
  });
});

describe('parseSkillMd', () => {
  it('parses frontmatter', () => {
    const md = `---
name: joke-telling
description: Tell jokes to users
domain: Entertainment
---

# Joke Telling

## Triggers
- **manual**: Manually triggered`;

    const result = parseSkillMd(md, 'skills/joke-telling/SKILL.md');

    expect(result.name).toBe('Joke Telling');
    expect(result.description).toBe('Tell jokes to users');
    expect(result.domain).toBe('Entertainment');
  });

  it('parses triggers', () => {
    const md = `---
name: test
description: Test
---

# Test

## Triggers
- **message**: User sends message
- **schedule**: Every hour`;

    const result = parseSkillMd(md, 'skills/test/SKILL.md');

    expect(result.triggers).toHaveLength(2);
    expect(result.triggers?.[0].type).toBe('message');
    expect(result.triggers?.[1].type).toBe('schedule');
  });

  it('parses behavior with steps', () => {
    const md = `---
name: test
description: Test
---

# Test

## Behavior
**Model**: sequential

### Steps
1. First step
2. Second step`;

    const result = parseSkillMd(md, 'skills/test/SKILL.md');

    expect(result.behavior?.model).toBe('sequential');
    expect(result.behavior?.steps).toHaveLength(2);
    expect(result.behavior?.steps?.[0]).toBe('First step');
  });
});

describe('storyToFiles', () => {
  it('creates correct file structure for agent', () => {
    const story: AgentStory = {
      id: 'test-id',
      name: 'Test Agent',
      version: '1.0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      purpose: 'Test',
      skills: [],
    };

    const files = storyToFiles(story);

    // Check required files exist
    const paths = files.map(f => f.path);
    expect(paths).toContain('agent.md');
    expect(paths).toContain('config.yaml');
    expect(paths).toContain('skills/.gitkeep');
    expect(paths).toContain('memory/short_term/.gitkeep');
    expect(paths).toContain('memory/long_term/.gitkeep');
    expect(paths).toContain('tools/.gitkeep');
    expect(paths).toContain('logs/.gitkeep');
  });

  it('creates skill files per Agent Skills spec', () => {
    const story: AgentStory = {
      id: 'test-id',
      name: 'Test Agent',
      version: '1.0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      skills: [
        {
          id: 'skill-1',
          name: 'Joke Telling',
          description: 'Tell jokes',
          triggers: [{ type: 'manual', description: 'Manual' }],
          acceptance: { successConditions: ['Done'] },
        },
      ],
    };

    const files = storyToFiles(story);
    const paths = files.map(f => f.path);

    // Check skill directory structure
    expect(paths).toContain('skills/joke-telling/SKILL.md');
    expect(paths).toContain('skills/joke-telling/config.yaml');
    expect(paths).toContain('skills/joke-telling/scripts/.gitkeep');
    expect(paths).toContain('skills/joke-telling/references/.gitkeep');
    expect(paths).toContain('skills/joke-telling/assets/.gitkeep');
  });

  it('includes script files from skill portability', () => {
    const story: AgentStory = {
      id: 'test-id',
      name: 'Test Agent',
      version: '1.0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      skills: [
        {
          id: 'skill-1',
          name: 'Data Processing',
          description: 'Process data',
          triggers: [{ type: 'manual', description: 'Manual' }],
          acceptance: { successConditions: ['Done'] },
          portability: {
            slug: 'data-processing',
            scripts: [
              { filename: 'process.py', language: 'python', purpose: 'Process files', content: 'print("hello")' },
            ],
          },
        },
      ],
    };

    const files = storyToFiles(story);
    const scriptFile = files.find(f => f.path === 'skills/data-processing/scripts/process.py');

    expect(scriptFile).toBeDefined();
    expect(scriptFile?.content).toBe('print("hello")');
    expect(scriptFile?.type).toBe('script');
  });
});

describe('generateAgentConfig', () => {
  it('generates valid YAML config', () => {
    const story: AgentStory = {
      id: 'test-id',
      name: 'Test Agent',
      version: '1.0',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      autonomyLevel: 'supervised',
      skills: [],
    };

    const config = generateAgentConfig(story);

    expect(config).toContain('name: Test Agent');
    expect(config).toContain('identifier: test-agent');
    expect(config).toContain('version: 1.0');
    expect(config).toContain('autonomy_level: supervised');
  });
});

describe('generateSkillConfig', () => {
  it('generates valid YAML config', () => {
    const skill: Skill = {
      id: 'test-id',
      name: 'Joke Telling',
      description: 'Tell jokes',
      domain: 'Entertainment',
      acquired: 'built_in',
      triggers: [{ type: 'message', description: 'User asks' }],
      behavior: { model: 'sequential', steps: ['Step 1'] },
      acceptance: { successConditions: ['User laughs'] },
    };

    const config = generateSkillConfig(skill);

    expect(config).toContain('name: joke-telling');
    expect(config).toContain('domain: Entertainment');
    expect(config).toContain('triggers:');
    expect(config).toContain('type: message');
    expect(config).toContain('behavior:');
    expect(config).toContain('model: sequential');
    expect(config).toContain('acceptance:');
    expect(config).toContain('success_conditions:');
  });
});
