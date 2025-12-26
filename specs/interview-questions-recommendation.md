# Recommendation: Using Interview Questions for Agent Creation

## Executive Summary

Use these interview questions as **guided conversation templates** that the LLM follows during agent creation and refinement. The questions drive a structured dialogue that progressively builds a complete agent specification.

---

## Recommended Architecture

### Option A: Question-Driven Chat Mode (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Creation Chat                       │
├─────────────────────────────────────────────────────────────┤
│  User: "Create a customer support agent"                    │
│                                                             │
│  Assistant: I'll help you create a customer support agent.  │
│  Let's start with the basics:                               │
│                                                             │
│  **Q1.1** What should we call this agent, and what's its    │
│  primary purpose?                                           │
│                                                             │
│  User: "Refund Handler - processes refund requests"         │
│                                                             │
│  Assistant: Great! "Refund Handler" with purpose            │
│  "Processes refund requests." ✓                             │
│                                                             │
│  **Q1.2** How autonomous should this agent be?              │
│  • Full - complete decision authority                       │
│  • Supervised - handles routine, escalates edge cases       │
│  • Collaborative - works with humans on decisions           │
│  • Directed - requires approval for each action             │
│                                                             │
│  [Continue with relevant questions...]                      │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
1. Embed the question flow in the system prompt
2. LLM tracks which questions have been answered
3. LLM asks next relevant question based on context
4. Answers populate the agent/skill schemas in real-time
5. Files update as conversation progresses

### Option B: Interview Wizard Mode

A separate "guided mode" that walks users through questions step-by-step:

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1 of 8: Agent Identity                      [Skip All]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  What is your agent's name?                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Refund Handler                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  What is its primary purpose?                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Processes customer refund requests efficiently       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Back] [Next: Role & Autonomy] │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
1. Multi-step form wizard component
2. Each step maps to a question level
3. Answers saved incrementally
4. Can skip to free-form chat at any point

### Option C: Hybrid Mode (Best of Both)

Start with quick questions, switch to free-form when user is ready:

```
┌─────────────────────────────────────────────────────────────┐
│  Quick Setup                            [Switch to Chat →]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name: [Refund Handler        ]                             │
│  Purpose: [Process refund requests             ]            │
│  Autonomy: [Supervised ▼]                                   │
│                                                             │
│  ──────────────────────────────────────────────────────────│
│  Based on this, I suggest these skills:                     │
│  ☑ process-refund    ☐ verify-eligibility   ☐ send-confirm│
│                                                             │
│  [Create Agent & Continue in Chat]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Recommendation

### Phase 1: Enhance Chat System Prompt

Update `chat-prompt.ts` to include the interview question framework:

```typescript
const INTERVIEW_CONTEXT = `
## Guided Agent Creation

When helping create or modify an agent, follow this question flow:

### For New Agents:
1. Ask Q1.1 (name, purpose) - extract and confirm
2. Ask Q1.2 (role, autonomy) - present options clearly
3. Suggest skills based on context
4. For each skill, ask Q6.1-Q6.3 (identity, triggers)
5. Offer to go deeper or add more skills

### For Modifications:
- Read current file content first
- Ask only about the specific change
- Preserve all existing data
- Confirm changes before applying

### Question Answering Style:
- Present multiple-choice when options are fixed
- Give examples for open-ended questions
- Confirm understanding before moving on
- Allow skipping ("let's skip this for now")
`;
```

### Phase 2: Add Depth Control

Allow users to set how detailed they want to go:

```typescript
type InterviewDepth = 'quick' | 'standard' | 'thorough' | 'expert';

const DEPTH_QUESTIONS = {
  quick: ['Q1.1', 'Q1.2'],  // Just name, purpose, autonomy
  standard: ['Q1.1', 'Q1.2', 'Q2.1', 'Q5.1', 'Q6.1-Q6.3'],  // + human mode, guardrails, skills
  thorough: ['Q1-Q6'],  // Full agent and skill coverage
  expert: ['Q1-Q8'],    // Everything including resources and MCP
};
```

### Phase 3: Question State Tracking

Track which questions have been answered:

```typescript
interface InterviewState {
  depth: InterviewDepth;
  answered: Set<string>;  // e.g., 'Q1.1', 'Q6.3'
  skipped: Set<string>;
  currentLevel: number;
  currentQuestion: string;
}
```

### Phase 4: Smart Question Selection

LLM decides next question based on:
- What's been answered
- User's depth preference
- Context from previous answers
- File content already exists

---

## Benefits

1. **Consistency**: Every agent gets the same thorough consideration
2. **Completeness**: No important fields forgotten
3. **Education**: Users learn what's possible
4. **Efficiency**: Skip irrelevant questions automatically
5. **Quality**: Better agents through guided process

---

## Example Enhanced System Prompt

```
You are an AI agent architect helping design agents through conversation.

## Interview Mode

You're conducting a structured interview to gather agent requirements.
Follow the question flow from the Interview Questions spec, but keep it
conversational and natural. Key behaviors:

1. **One topic at a time**: Don't overwhelm with multiple questions
2. **Confirm understanding**: "So you want X, is that right?"
3. **Offer suggestions**: "Based on your purpose, you might want..."
4. **Allow flexibility**: "We can come back to this later"
5. **Show progress**: "Great, we've covered identity. Next: how should humans be involved?"

## Current Interview State
- Answered: Q1.1 (name), Q1.2 (role)
- Next: Q2.1 (human interaction mode)
- Depth: standard

## Question Reference
[Include relevant questions for current depth]
```

---

## Next Steps

1. **Update chat-prompt.ts** with interview question framework
2. **Add depth selector** to chat UI ("Quick setup" / "Detailed" / "Expert")
3. **Track interview state** in the conversation
4. **Test with sample agents** to refine question flow
5. **Consider wizard mode** for users who prefer forms over chat
