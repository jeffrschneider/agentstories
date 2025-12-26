# Agent Skills Interview Questions

This specification defines the structured questions used to gather requirements for agents and their skills through conversational interaction.

## Design Principles

1. **Progressive Disclosure**: Start with essential questions, reveal complexity as needed
2. **Compound Questions**: Group related fields into natural conversational questions
3. **Context-Aware**: Skip questions that aren't relevant based on previous answers
4. **Examples-Driven**: Provide concrete examples to guide responses

---

## Level 1: Agent Identity

### Core Identity (Required)
```
Q1.1: What is your agent's name and primary purpose?
      - Name: What should we call this agent?
      - Purpose: In one sentence, what does this agent do?

Q1.2: What role does this agent play, and how autonomous should it be?
      - Role: (e.g., "Customer Support Specialist", "Data Analyst", "Code Reviewer")
      - Autonomy:
        * Full: Operates independently with complete decision authority
        * Supervised: Handles routine tasks, escalates edge cases
        * Collaborative: Works together with humans on decisions
        * Directed: Requires approval for each action
```

### Tags & Categorization
```
Q1.3: What categories or tags describe this agent?
      Examples: "customer-facing", "internal", "data-processing", "creative"
```

---

## Level 2: Human Interaction Model

### Interaction Mode
```
Q2.1: How should humans be involved in this agent's work?
      - In the Loop: Human approves every decision before action
      - On the Loop: Human monitors and intervenes on exceptions only
      - Out of Loop: Fully autonomous within defined boundaries
```

### Checkpoints
```
Q2.2: Are there specific points where human involvement is required?
      For each checkpoint:
      - What triggers the need for human involvement?
      - What type of involvement? (Approval / Input / Review / Escalation)
      - What happens if the human doesn't respond in time?

      Examples:
      - "Before sending any external communication" → Approval
      - "When confidence score is below 80%" → Escalation
      - "After completing a batch of 100 items" → Review
```

### Escalation Policy
```
Q2.3: When should this agent escalate to a human, and how?
      - Conditions: What situations require human intervention?
        Examples: "Error rate exceeds 5%", "Customer requests human", "Uncertain response"
      - Channel: How should escalation happen?
        Examples: "Slack #escalations", "Email to on-call", "Create Jira ticket"
```

---

## Level 3: Agent Collaboration

### Role in Multi-Agent Systems
```
Q3.1: Does this agent work with other agents? What's its role?
      - Supervisor: Orchestrates and delegates to other agents
      - Worker: Executes tasks as directed by a supervisor
      - Peer: Collaborates as equals with other agents
      - Solo: Works independently, no agent-to-agent interaction
```

### Supervisor Relationships (if Supervisor)
```
Q3.2: What agents does this supervisor coordinate?
      For each worker agent:
      - Which agent? (name or type)
      - How do they communicate? (A2A protocol, API, queue)
      - What tasks are delegated?

      Example: "Coordinates 'research-agent' via A2A for data gathering tasks"
```

### Worker Relationships (if Worker)
```
Q3.3: Who supervises this agent?
      - Which agent or system assigns tasks?
      - How are instructions received?
```

### Peer Relationships
```
Q3.4: What peer agents does this agent collaborate with?
      For each peer:
      - Which agent?
      - Interaction pattern:
        * Request/Response: Synchronous calls
        * Pub/Sub: Event-based messaging
        * Shared State: Coordinated access to shared data
```

---

## Level 4: Memory & Learning

### Working Memory
```
Q4.1: What context should this agent maintain during a session?
      Examples:
      - "Current conversation history"
      - "User preferences discovered in this session"
      - "Running totals and calculations"
      - "Files currently being processed"
```

### Persistent Memory
```
Q4.2: What information should this agent remember across sessions?
      For each memory store:
      - Name: What is this memory called?
      - Type: Knowledge Base / Vector DB / Relational DB / Key-Value Store
      - Purpose: What is stored and why?
      - Access: Read-only / Append-only / Full CRUD

      Examples:
      - "Customer interaction history" → Vector DB, append-only
      - "Product catalog" → Knowledge Base, read-only
      - "User preferences" → Key-Value, full CRUD
```

### Learning Configuration
```
Q4.3: Should this agent learn and improve over time? How?
      - Feedback Loop: Iterative improvement from user feedback
      - Reinforcement: Reward-based optimization
      - Fine-tuning: Periodic model updates

      What signals trigger learning?
      Examples: "Thumbs up/down on responses", "Task completion rate", "Error corrections"
```

---

## Level 5: Agent-Level Guardrails

```
Q5.1: What must this agent NEVER do? (Identity-level constraints)
      For each guardrail:
      - Name: Short identifier
      - Constraint: What is prohibited
      - Rationale: Why this guardrail exists
      - Enforcement: Hard (never violate) / Soft (prefer but can override)

      Examples:
      - "No PII Storage" → "Never store personal information locally" → Hard
      - "Professional Tone" → "Maintain formal language" → Soft
      - "No Financial Advice" → "Never provide specific investment recommendations" → Hard
```

---

## Level 6: Skills (Capabilities)

### Skill Identity
```
Q6.1: What is this skill's name and what does it do?
      - Name: (kebab-case, e.g., "process-refund", "generate-report")
      - Description: What it does AND when to use it (max 1024 chars)
      - Domain: Category (e.g., "Customer Service", "Data Processing")

Q6.2: How was this skill acquired?
      - Built-in: Core competency the agent was designed with
      - Learned: Acquired through training or experience
      - Delegated: Performed by calling another agent or service
```

### Skill Triggers
```
Q6.3: What triggers this skill to activate?
      For each trigger:
      - Type: Message / Schedule / Resource Change / Cascade / Manual / Condition
      - Description: Human-readable explanation
      - Conditions: Guard conditions that must be true
      - Examples: Concrete trigger examples

      Type-specific details:
      - Message: What sources? What patterns? What protocol (A2A, webhook, API)?
      - Schedule: What cron expression? What timezone?
      - Resource Change: What resource? What change types (create/update/delete)?
      - Cascade: Which skill or agent triggers this? What event?
      - Condition: What expression? How often to check?
      - Manual: Who can trigger it? Confirmation required?
```

### Skill Behavior
```
Q6.4: How does this skill execute its task?
      - Sequential: Step-by-step execution
        → What are the steps in order?
      - Workflow: DAG-based with parallel paths
        → What are the stages and dependencies?
      - Adaptive: Flexible based on context
        → What capabilities can it dynamically use?
```

### Skill Tools
```
Q6.5: What tools or resources does this skill need?
      For each tool:
      - Name: Tool identifier
      - Purpose: What it's used for
      - Permissions: Read / Write / Execute
      - Required: Is this tool mandatory?

      Examples:
      - "database_query" → "Fetch customer records" → Read → Required
      - "email_sender" → "Send notifications" → Execute → Optional
      - "file_system" → "Store generated reports" → Write → Required
```

### Skill Acceptance Criteria
```
Q6.6: How do we know this skill succeeded?
      - Success Conditions: What must be true for success?
        Examples: "Customer issue resolved", "Report generated", "All validations pass"
      - Quality Metrics: What measurements indicate quality?
        Examples: "Response time < 2s", "Accuracy > 95%", "Customer satisfaction > 4/5"
```

### Skill Failure Handling
```
Q6.7: What could go wrong, and how should failures be handled?
      For each failure mode:
      - Condition: What does this failure look like?
      - Recovery: How should it be handled?
      - Escalate: Should this trigger human intervention?

      Examples:
      - "API timeout" → "Retry 3 times with exponential backoff" → No
      - "Invalid input format" → "Request clarification from user" → No
      - "Repeated failures" → "Log and notify on-call" → Yes

      Default fallback if no specific handler matches?
      Notify on any failure?
```

### Skill Guardrails
```
Q6.8: What constraints apply specifically to this skill?
      For each guardrail:
      - Name: Short identifier
      - Constraint: What the skill must not do
      - Enforcement: Hard / Soft
      - On Violation: What action to take if violated

      Examples:
      - "Rate Limit" → "Max 100 API calls per minute" → Hard → "Queue excess requests"
      - "Data Scope" → "Only access data from current user's organization" → Hard → "Abort with error"
```

---

## Level 7: Skill Resources

### Scripts
```
Q7.1: Does this skill need executable scripts?
      For each script:
      - Filename: (e.g., "extract.py", "validate.sh")
      - Language: Python / Bash / JavaScript / TypeScript
      - Purpose: What does this script do?
      - Content: (inline or file reference)
```

### Reference Documents
```
Q7.2: What additional documentation does this skill need?
      For each reference:
      - Filename: (e.g., "REFERENCE.md", "api-guide.md")
      - Title: Human-readable title
      - Content: (inline or file reference)

      Examples:
      - "API documentation for external service"
      - "Business rules and edge cases"
      - "Examples and sample outputs"
```

### Assets
```
Q7.3: What static resources does this skill use?
      For each asset:
      - Filename: (e.g., "template.json", "schema.yaml", "lookup.csv")
      - Type: JSON / YAML / CSV / TXT / PNG / SVG / Other
      - Description: What is this asset for?
      - Content: (inline or file reference)
```

---

## Level 8: Tool Integrations (MCP)

```
Q8.1: What external tools should this agent connect to via MCP?
      For each MCP server:
      - Name: Server identifier
      - Purpose: What capabilities does it provide?
      - Configuration: Connection details

      Examples:
      - "filesystem" → "Read and write local files"
      - "github" → "Access repositories and create PRs"
      - "slack" → "Send messages and read channels"
      - "database" → "Query and update PostgreSQL"
```

---

## Question Flow Recommendations

### Initial Agent Creation
1. Start with Q1.1 (name, purpose) - Required
2. Follow with Q1.2 (role, autonomy) - Required
3. Ask Q6.1-Q6.4 for first skill - Recommended
4. Offer to add more skills or dive deeper

### Progressive Depth
```
Depth 0 (Minimal): Q1.1, Q1.2
Depth 1 (Basic):   + Q2.1, Q5.1, Q6.1-Q6.3
Depth 2 (Full):    + Q2.2-Q2.3, Q3.1-Q3.4, Q4.1-Q4.3, Q6.4-Q6.8
Depth 3 (Expert):  + Q7.1-Q7.3, Q8.1
```

### Context-Aware Skipping
- Skip Q3.2-Q3.4 if Q3.1 = "Solo"
- Skip Q4.3 if agent is "Directed" autonomy
- Skip Q6.7 for simple skills with no external dependencies
- Skip Q7.* for skills that are purely conversational

### Skill Suggestions Integration
After Q1.1-Q1.2, offer skill suggestions based on:
- Agent name keywords
- Role description
- Purpose statement
- Domain tags

---

## Example Conversation Flow

```
Assistant: Let's create your agent! What's its name and primary purpose?

User: I want a customer support agent that handles refund requests.