import { describe, it, expect } from 'vitest';
import { parseAgentChatResponse, buildStructuredSystemPrompt } from './chat-prompt';

describe('parseAgentChatResponse', () => {
  describe('valid JSON responses', () => {
    it('parses JSON wrapped in code block', () => {
      const response = `\`\`\`json
{
  "action": "create_agent",
  "message": "Created Joke Agent",
  "agent": {
    "name": "Joke Agent",
    "purpose": "Tell jokes"
  },
  "skills": [
    {
      "name": "joke-telling",
      "description": "Tell jokes to users"
    }
  ]
}
\`\`\``;

      const result = parseAgentChatResponse(response);

      expect(result).not.toBeNull();
      expect(result?.action).toBe('create_agent');
      expect(result?.message).toBe('Created Joke Agent');
      expect(result?.agent?.name).toBe('Joke Agent');
      expect(result?.skills).toHaveLength(1);
      expect(result?.skills?.[0].name).toBe('joke-telling');
    });

    it('parses raw JSON without code block', () => {
      const response = `{
  "action": "question",
  "message": "What should I name this agent?"
}`;

      const result = parseAgentChatResponse(response);

      expect(result).not.toBeNull();
      expect(result?.action).toBe('question');
      expect(result?.message).toBe('What should I name this agent?');
    });

    it('parses JSON with json language tag', () => {
      const response = `Here's the agent:

\`\`\`json
{
  "action": "add_skill",
  "message": "Added riddle skill",
  "skills": [
    {
      "name": "riddle-telling",
      "description": "Tell riddles"
    }
  ]
}
\`\`\``;

      const result = parseAgentChatResponse(response);

      expect(result?.action).toBe('add_skill');
      expect(result?.skills?.[0].name).toBe('riddle-telling');
    });

    it('parses complete agent with all fields', () => {
      const response = `\`\`\`json
{
  "action": "create_agent",
  "message": "Created agent",
  "agent": {
    "name": "Customer Support Agent",
    "identifier": "customer-support-agent",
    "purpose": "Help customers with inquiries",
    "role": "Support specialist",
    "autonomyLevel": "supervised",
    "guardrails": [
      { "name": "Polite", "constraint": "Always be polite" }
    ],
    "tags": ["support", "customer-service"]
  },
  "skills": [
    {
      "name": "answer-questions",
      "description": "Answer customer questions",
      "domain": "Support",
      "license": "MIT",
      "triggers": [
        { "type": "message", "description": "Customer asks a question" }
      ],
      "behavior": {
        "model": "sequential",
        "steps": ["Understand question", "Find answer", "Respond"]
      },
      "acceptance": {
        "successConditions": ["Customer satisfied"]
      }
    }
  ]
}
\`\`\``;

      const result = parseAgentChatResponse(response);

      expect(result?.agent?.name).toBe('Customer Support Agent');
      expect(result?.agent?.autonomyLevel).toBe('supervised');
      expect(result?.agent?.guardrails).toHaveLength(1);
      expect(result?.skills?.[0].triggers).toHaveLength(1);
      expect(result?.skills?.[0].behavior?.model).toBe('sequential');
      expect(result?.skills?.[0].behavior?.steps).toHaveLength(3);
    });
  });

  describe('invalid responses', () => {
    it('returns null for plain markdown', () => {
      const response = `# Joke Agent

## Purpose
Tell jokes to users

## Skills
- Tell Jokes: Delivers humor`;

      const result = parseAgentChatResponse(response);
      expect(result).toBeNull();
    });

    it('returns null for malformed JSON', () => {
      const response = `\`\`\`json
{
  "action": "create_agent",
  "message": "incomplete
}
\`\`\``;

      const result = parseAgentChatResponse(response);
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = parseAgentChatResponse('');
      expect(result).toBeNull();
    });

    it('returns null for text without JSON', () => {
      const result = parseAgentChatResponse('Just some text about an agent');
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles code block without language tag', () => {
      const response = `\`\`\`
{
  "action": "question",
  "message": "What is the purpose?"
}
\`\`\``;

      const result = parseAgentChatResponse(response);
      expect(result?.action).toBe('question');
    });

    it('handles skills with scripts, references, and assets', () => {
      const response = `\`\`\`json
{
  "action": "add_skill",
  "message": "Added skill with resources",
  "skills": [
    {
      "name": "data-processing",
      "description": "Process data files",
      "scripts": [
        { "filename": "process.py", "language": "python", "purpose": "Process files", "content": "print('hello')" }
      ],
      "references": [
        { "filename": "api-guide.md", "title": "API Guide", "content": "# API Guide" }
      ],
      "assets": [
        { "filename": "schema.json", "type": "json", "description": "Data schema", "content": "{}" }
      ]
    }
  ]
}
\`\`\``;

      const result = parseAgentChatResponse(response);
      expect(result?.skills?.[0].scripts).toHaveLength(1);
      expect(result?.skills?.[0].references).toHaveLength(1);
      expect(result?.skills?.[0].assets).toHaveLength(1);
    });

    it('handles file actions', () => {
      const response = `\`\`\`json
{
  "action": "add_file",
  "message": "Added config file",
  "files": [
    { "path": "skills/my-skill/config.yaml", "content": "name: my-skill", "action": "create" }
  ]
}
\`\`\``;

      const result = parseAgentChatResponse(response);
      expect(result?.action).toBe('add_file');
      expect(result?.files).toHaveLength(1);
      expect(result?.files?.[0].path).toBe('skills/my-skill/config.yaml');
    });
  });
});

describe('buildStructuredSystemPrompt', () => {
  it('builds prompt for new agent', () => {
    const prompt = buildStructuredSystemPrompt(
      'New Agent',
      '- agent.md',
      undefined,
      []
    );

    expect(prompt).toContain('CRITICAL: ALWAYS RESPOND WITH JSON');
    expect(prompt).toContain('This is a NEW AGENT');
    expect(prompt).toContain('create_agent');
    expect(prompt).toContain('skills');
  });

  it('builds prompt for existing agent with skills', () => {
    const currentAgent = {
      name: 'Joke Agent',
      purpose: 'Tell jokes',
      skills: [{ name: 'joke-telling', description: 'Tell jokes' }],
    };

    const prompt = buildStructuredSystemPrompt(
      'Joke Agent',
      '- agent.md\n- skills/joke-telling/SKILL.md',
      currentAgent,
      [
        { path: 'agent.md', content: '# Joke Agent' },
        { path: 'skills/joke-telling/SKILL.md', content: '---\nname: joke-telling\n---' },
      ]
    );

    expect(prompt).toContain('This is an EXISTING AGENT');
    expect(prompt).toContain('Joke Agent');
    expect(prompt).toContain('joke-telling');
    expect(prompt).toContain('Preserving Existing Content');
  });

  it('includes JSON schema in prompt', () => {
    const prompt = buildStructuredSystemPrompt('Test', '', undefined, []);

    expect(prompt).toContain('"action"');
    expect(prompt).toContain('"agent"');
    expect(prompt).toContain('"skills"');
    expect(prompt).toContain('question');
    expect(prompt).toContain('create_agent');
    expect(prompt).toContain('add_skill');
  });

  it('includes Agent Skills spec requirements', () => {
    const prompt = buildStructuredSystemPrompt('Test', '', undefined, []);

    expect(prompt).toContain('kebab-case');
    expect(prompt).toContain('SKILL.md');
    expect(prompt).toContain('agentskills.io');
    expect(prompt).toContain('1024 chars');
  });
});
