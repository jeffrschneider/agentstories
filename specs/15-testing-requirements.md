# Testing Requirements Specification

> All features must have tests. Tests must pass before code is considered complete.

## Overview

This project uses **spec-driven development with mandatory testing**. Every implementation must:

1. Follow the relevant spec exactly
2. Have comprehensive test coverage
3. Pass all tests before merge

## Test Framework

- **Framework**: Vitest
- **DOM Testing**: @testing-library/react + jsdom
- **Assertions**: Vitest built-in + @testing-library/jest-dom

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

## Test File Conventions

| Pattern | Description |
|---------|-------------|
| `*.test.ts` | Unit tests for modules |
| `*.test.tsx` | Component tests |
| `*.spec.ts` | Integration/spec tests |

Tests live alongside the code they test:
```
src/lib/agent-files/
├── transforms.ts
├── transforms.test.ts      # Tests for transforms
├── chat-prompt.ts
├── chat-prompt.test.ts     # Tests for chat-prompt
├── process-response.ts
└── process-response.test.ts # Tests for process-response
```

## Test Categories

### 1. Unit Tests (Required)

Test individual functions in isolation:

```typescript
describe('generateSlug', () => {
  it('converts name to kebab-case', () => {
    expect(generateSlug('Joke Agent')).toBe('joke-agent');
  });

  it('handles special characters', () => {
    expect(generateSlug('Agent & Skills')).toBe('agent-skills');
  });
});
```

### 2. Integration Tests (Required for features)

Test how modules work together:

```typescript
describe('processStructuredResponse', () => {
  it('creates complete file structure for new agent', () => {
    const response = { action: 'create_agent', agent: {...}, skills: [...] };
    const actions = processStructuredResponse(response, [], 'New Agent');

    expect(actions).toContainEqual(expect.objectContaining({ path: 'agent.md' }));
    expect(actions).toContainEqual(expect.objectContaining({ path: 'skills/joke-telling/SKILL.md' }));
  });
});
```

### 3. Component Tests (For UI components)

Test React components with Testing Library:

```typescript
describe('AgentChat', () => {
  it('renders chat interface', () => {
    render(<AgentChat {...props} />);
    expect(screen.getByPlaceholderText('Describe changes...')).toBeInTheDocument();
  });
});
```

## Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Core library (`/lib`) | 80% |
| API routes (`/api`) | 70% |
| Components | 60% |
| Overall | 70% |

## Development Workflow

### Step 1: Read the Spec
Before implementing, read the relevant spec in `/specs/`.

### Step 2: Write Tests First (TDD encouraged)
Write tests that verify the spec requirements:

```typescript
// From spec: "Skills must have YAML frontmatter with name and description"
it('generates SKILL.md with YAML frontmatter', () => {
  const skill = { name: 'joke-telling', description: 'Tell jokes' };
  const md = generateSkillMd(skill);

  expect(md).toMatch(/^---\nname: joke-telling\n/);
  expect(md).toContain('description: Tell jokes');
});
```

### Step 3: Implement
Write code to make tests pass.

### Step 4: Run Tests
```bash
npm run test:run
```

### Step 5: Fix Failures
If tests fail:
1. Read the error message
2. Debug the implementation
3. Fix the issue
4. Re-run tests
5. Repeat until all pass

### Step 6: Commit
Only commit when all tests pass:
```bash
# Verify tests pass
npm run test:run && git add -A && git commit -m "feat: implement feature"
```

## CI/CD Integration

Tests run automatically on:
- Every push to feature branches
- Every pull request

PRs cannot merge if tests fail.

## Key Test Files

| File | Tests |
|------|-------|
| `chat-prompt.test.ts` | JSON parsing, system prompt building |
| `transforms.test.ts` | File generation (agent.md, SKILL.md), parsing |
| `process-response.test.ts` | LLM response → file actions mapping |

## Agent Skills Spec Compliance

Tests verify compliance with the Agent Skills specification:

```typescript
// Skill name must be kebab-case, max 64 chars
it('generates valid skill slugs', () => {
  expect(generateSlug('PDF Processing')).toBe('pdf-processing');
  expect(generateSlug('A'.repeat(100)).length).toBeLessThanOrEqual(64);
});

// SKILL.md must have YAML frontmatter
it('generates SKILL.md with required frontmatter', () => {
  const md = generateSkillMd(skill);
  expect(md).toMatch(/^---\nname: /);
  expect(md).toContain('description:');
});

// Directory structure per Agent Skills spec
it('creates skill directory structure', () => {
  const actions = processStructuredResponse(response, [], 'Agent');
  const paths = actions.map(a => a.path);

  expect(paths).toContain('skills/my-skill/SKILL.md');
  expect(paths).toContain('skills/my-skill/scripts/.gitkeep');
  expect(paths).toContain('skills/my-skill/references/.gitkeep');
  expect(paths).toContain('skills/my-skill/assets/.gitkeep');
});
```

## Debugging Test Failures

### 1. Read the failure message
```
FAIL  src/lib/agent-files/transforms.test.ts
  ✕ generates SKILL.md with YAML frontmatter (5ms)
    Expected: /^---\nname: joke-telling\n/
    Received: "# Joke Telling\n\n..."
```

### 2. Check the implementation
The implementation isn't generating YAML frontmatter.

### 3. Fix and re-run
```bash
npm run test:run -- --filter="generates SKILL.md"
```

### 4. Run all tests before committing
```bash
npm run test:run
```

## Mocking

### Mock external services
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  fetchAgent: vi.fn().mockResolvedValue({ name: 'Test Agent' }),
}));
```

### Mock crypto.randomUUID
Already configured in `src/test/setup.ts`:
```typescript
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
});
```

## Adding New Tests

When adding a new feature:

1. Create test file alongside the implementation
2. Cover happy path + edge cases + error cases
3. Run tests to verify they fail (TDD)
4. Implement the feature
5. Run tests to verify they pass
6. Check coverage: `npm run test:coverage`

## Test Maintenance

- Update tests when specs change
- Delete tests for removed features
- Keep tests focused and fast
- Avoid testing implementation details
