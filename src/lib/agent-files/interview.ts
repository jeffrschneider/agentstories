/**
 * Interview Questions Framework
 *
 * Modular question sets for guided agent and skill creation.
 * Designed to be reusable - skill questions work for both
 * agent-attached skills and standalone skills.
 */

// ============================================================================
// Types
// ============================================================================

export type InterviewContext = 'agent' | 'skill' | 'skill-standalone';

export interface InterviewState {
  context: InterviewContext;
  depth: 'quick' | 'standard' | 'thorough';
  phase: 'identity' | 'behavior' | 'integration' | 'refinement';
  gathered: Record<string, unknown>;
}

// ============================================================================
// Agent Interview Questions
// ============================================================================

export const AGENT_INTERVIEW = `
## Guided Agent Creation

When a user wants to create or significantly modify an agent, gather requirements conversationally.

### Phase 1: Identity (Always ask)

**Opening Question:**
"Let's create your agent! What should we call it, and what's its main purpose?"

After they respond, confirm:
"Got it - [Name] that [purpose]. What role does it play (e.g., 'Customer Support Specialist', 'Data Analyst')?"

**Autonomy Question:**
"How autonomous should [Name] be?
• **Full** - operates independently with complete authority
• **Supervised** - handles routine tasks, escalates edge cases
• **Collaborative** - works together with humans on decisions
• **Directed** - requires approval for each action"

### Phase 2: Human Interaction (Ask for supervised/collaborative)

"How should humans be involved?
• **In the loop** - approves every decision
• **On the loop** - monitors, intervenes on exceptions
• **Out of loop** - fully autonomous within boundaries"

If not "out of loop":
"When should this agent escalate to a human? (e.g., 'when confidence is low', 'customer requests human', 'error rate exceeds threshold')"

### Phase 3: Capabilities (Always offer)

"Based on [purpose], here are some skills I'd suggest:
• [skill-1] - [brief description]
• [skill-2] - [brief description]
• [skill-3] - [brief description]

Would you like me to add any of these, or describe different capabilities you need?"

### Phase 4: Guardrails (Ask for autonomous agents)

"What should [Name] never do? These are identity-level constraints.
Examples: 'Never store personal data locally', 'Always maintain professional tone', 'Never provide financial advice'"
`;

// ============================================================================
// Skill Interview Questions (Reusable for standalone skills)
// ============================================================================

export const SKILL_INTERVIEW = `
## Guided Skill Creation

Use these questions whether creating a skill for an agent or a standalone skill.

### Phase 1: Identity (Always ask)

**Opening:**
"What should this skill be called, and what does it do?"

Format: name should be kebab-case (e.g., "process-refund", "generate-report")
Description: explain WHAT it does AND WHEN to use it (max 1024 chars)

**Domain:**
"What category does this fall into? (e.g., 'Customer Service', 'Data Processing', 'Content Generation')"

### Phase 2: Triggers (Always ask)

"What triggers this skill to activate?
• **Message** - incoming request (from user, API, another agent)
• **Schedule** - time-based (cron expression)
• **Manual** - human explicitly triggers it
• **Condition** - when a state condition becomes true
• **Cascade** - triggered by another skill completing"

For each trigger, ask: "Can you give an example of when this would fire?"

### Phase 3: Behavior (Ask for complex skills)

"How does this skill execute?
• **Sequential** - step-by-step in order
• **Workflow** - parallel paths with dependencies
• **Adaptive** - flexible based on context"

If sequential: "Walk me through the steps in order."

### Phase 4: Tools (Ask when relevant)

"Does this skill need any external tools or resources?
Examples: database access, file system, email sending, API calls"

For each tool: "What permissions does it need? (read, write, execute)"

### Phase 5: Success Criteria (Recommended)

"How do we know this skill succeeded? What must be true?"
Examples: "Customer issue resolved", "Report generated and saved", "All validations pass"

### Phase 6: Guardrails (Ask for sensitive operations)

"Are there constraints specific to this skill?
Examples: 'Max 100 API calls per minute', 'Only access current user's data', 'Never modify production data'"
`;

// ============================================================================
// Conversation Guidelines
// ============================================================================

export const CONVERSATION_GUIDELINES = `
## Conversation Style

1. **One topic at a time** - Don't overwhelm with multiple questions
2. **Confirm understanding** - "So you want X that does Y, right?"
3. **Offer suggestions** - "Based on [context], you might want..."
4. **Allow shortcuts** - If user says "just make it" or "skip that", use reasonable defaults
5. **Show progress** - "Great, we've covered identity. Now let's talk about what triggers it."

## When to Ask vs. Assume

**Always ask about:**
- Name and purpose (can't assume these)
- Autonomy level for agents (critical for behavior)
- At least one trigger for skills

**Can assume with confirmation:**
- Role (infer from purpose, confirm)
- Domain (infer from name/description)
- Basic guardrails (suggest based on domain)

**Skip unless user engages:**
- Detailed failure handling
- Learning configuration
- Agent collaboration
- Scripts/references/assets

## Handling User Shortcuts

If user says:
- "just create it" → Generate with sensible defaults, explain what you chose
- "skip this" → Move to next phase, note what was skipped
- "I don't know" → Suggest options or use a safe default
- "add everything" → Create comprehensive configuration
`;

// ============================================================================
// Build Interview-Enabled Prompt
// ============================================================================

export function buildInterviewPrompt(
  context: InterviewContext,
  state?: Partial<InterviewState>
): string {
  const isSkillOnly = context === 'skill-standalone';

  let prompt = '';

  if (!isSkillOnly) {
    prompt += AGENT_INTERVIEW + '\n\n';
  }

  prompt += SKILL_INTERVIEW + '\n\n';
  prompt += CONVERSATION_GUIDELINES;

  // Add context-specific guidance
  if (isSkillOnly) {
    prompt += `
## Standalone Skill Context

You are helping create a skill that will be added to a skill library, not attached to a specific agent.
- Focus on making the skill portable and reusable
- Include license and compatibility information
- Ensure the skill is well-documented for others to use
`;
  }

  return prompt;
}

// ============================================================================
// State Tracking Helpers
// ============================================================================

export function getNextQuestion(
  context: InterviewContext,
  gathered: Record<string, unknown>
): string | null {
  // Agent context
  if (context === 'agent') {
    if (!gathered.name || !gathered.purpose) {
      return "What should we call this agent, and what's its main purpose?";
    }
    if (!gathered.role) {
      return `What role does ${gathered.name} play?`;
    }
    if (!gathered.autonomyLevel) {
      return `How autonomous should ${gathered.name} be? (full/supervised/collaborative/directed)`;
    }
    if (!gathered.skills || (Array.isArray(gathered.skills) && gathered.skills.length === 0)) {
      return `What capabilities should ${gathered.name} have? I can suggest some based on its purpose.`;
    }
  }

  // Skill context (works for both attached and standalone)
  if (context === 'skill' || context === 'skill-standalone') {
    if (!gathered.skillName || !gathered.skillDescription) {
      return "What should this skill be called, and what does it do?";
    }
    if (!gathered.triggers || (Array.isArray(gathered.triggers) && gathered.triggers.length === 0)) {
      return "What triggers this skill to activate?";
    }
    if (!gathered.behavior) {
      return "How does this skill execute its task? (sequential steps, workflow, or adaptive)";
    }
  }

  // All required questions answered
  return null;
}

export function hasMinimumRequirements(
  context: InterviewContext,
  gathered: Record<string, unknown>
): boolean {
  if (context === 'agent') {
    return !!(gathered.name && gathered.purpose);
  }
  if (context === 'skill' || context === 'skill-standalone') {
    return !!(gathered.skillName && gathered.skillDescription);
  }
  return false;
}
