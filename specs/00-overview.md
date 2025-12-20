# Agent Story Builder - Technical Specifications

## Overview

This directory contains the technical specifications for Agent Story Builder, a web-based platform for capturing comprehensive requirements for AI agents using the Agent Stories framework.

## Core Architecture: Agent vs Skill Separation

The data model follows a **skill-based architecture** with a clear separation:

### Agent = WHO (The Container)
The agent is an identity container that provides context across all its capabilities:

| Element | Purpose |
|---------|---------|
| **Core Identity** | Role, purpose, autonomy level |
| **Human Interaction** | Overall mode, escalation policy |
| **Agent Collaboration** | Supervisor/worker/peer relationships |
| **Memory** | What persists across skills and sessions |
| **High-Level Guardrails** | Identity constraints that apply to all skills |

### Skill = WHAT + HOW (Units of Capability)
Skills are self-contained capability bundles that define what an agent can do:

| Element | Purpose |
|---------|---------|
| **Triggers** | When this skill activates |
| **Inputs/Outputs** | Skill interface contract |
| **Tools** | Resources this skill uses |
| **Behavior** | How execution flows (stages, steps) |
| **Reasoning** | Decision strategy, retry logic |
| **Acceptance Criteria** | What "done" looks like |
| **Failure Handling** | Error recovery, fallbacks |
| **Guardrails** | Skill-specific constraints |

This separation means:
- **Skills are complete capability units** - they own everything needed to execute
- **Agents are identity containers** - they define WHO, not WHAT
- **Memory is shared** - skills read/write agent memory, don't own separate stores
- **Guardrails are layered** - agent-level applies to all, skill-level adds specifics

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide
- **Server State**: @tanstack/react-query
- **Local State**: Valtio
- **Validation**: Zod
- **Database**: PostgreSQL (structured data) + Document store (story content)
- **Auth**: NextAuth.js with SSO support

## Specification Index

| Spec | Description |
|------|-------------|
| [01-data-models](./01-data-models.md) | Core data models and Zod schemas (skill-based architecture) |
| [02-story-management](./02-story-management.md) | Story creation, editing, and validation |
| [03-template-system](./03-template-system.md) | Template library and management |
| [04-export-system](./04-export-system.md) | Export to Markdown, JSON, PDF |
| [05-collaboration](./05-collaboration.md) | Real-time editing, comments, sharing |
| [06-api-specification](./06-api-specification.md) | REST API endpoints |
| [07-ui-components](./07-ui-components.md) | Component architecture and specs |
| [08-ui-innovation](./08-ui-innovation.md) | Grouped navigation and progressive disclosure |

## Architecture Principles

### Progressive Disclosure
The UI reveals complexity progressively. Core story elements are always visible; extended specifications appear as collapsible panels that users expand as needed.

### Format Duality
The system supports two formats:
- **Agent Story Light**: Simple agents, early-stage design, quick stakeholder communication
- **Agent Story Full**: Complex agents with detailed skills and specifications

### Skill-First Design
When upgrading from Light to Full format, the simple trigger/action/outcome statement becomes a single skill. Users can then add more skills to expand the agent's capabilities.

### Validation-First
All data flows through Zod schemas for runtime validation. Invalid states are caught at the boundary.

## Directory Structure

```
/app
  /api                    # API routes
    /stories              # Story CRUD operations
    /templates            # Template operations
    /skills               # Skill template operations
    /export               # Export endpoints
    /auth                 # Authentication
  /(dashboard)            # Dashboard routes
    /stories              # Story management pages
    /templates            # Template browser
    /settings             # User/org settings
/components
  /story                  # Story-related components
  /skill                  # Skill editing components
  /template               # Template components
  /collaboration          # Collaboration components
  /ui                     # shadcn/ui components
/lib
  /schemas                # Zod schemas
    /agent.ts             # Agent-level schemas
    /skill.ts             # Skill-level schemas
    /trigger.ts           # Trigger schemas
    /behavior.ts          # Behavior schemas
    /reasoning.ts         # Reasoning schemas
    /tools.ts             # Tool schemas
    /guardrails.ts        # Guardrail schemas
    /collaboration.ts     # Collaboration schemas
    /memory.ts            # Memory schemas
    /story.ts             # Complete story schemas
    /template.ts          # Template schemas
  /utils                  # Utility functions
  /hooks                  # Custom React hooks
/stores
  /story-editor           # Story editor state
  /skill-editor           # Skill editor state
  /ui                     # UI state (modals, panels)
```

## Core Concepts Reference

### Skill Trigger Types
| Type | Description |
|------|-------------|
| `message` | Incoming message or request |
| `resource_change` | State change in monitored resources |
| `schedule` | Time-based activation |
| `cascade` | Triggered by another skill or agent |
| `manual` | Human-initiated activation |
| `condition` | State condition becomes true |

### Skill Behavior Models
| Model | Description |
|-------|-------------|
| `sequential` | Linear step-by-step execution |
| `workflow` | Multi-stage with conditional transitions |
| `adaptive` | Dynamic based on context |
| `iterative` | Loop until termination condition met |

### Reasoning Strategies
| Strategy | Description |
|----------|-------------|
| `rule_based` | Deterministic rules and logic |
| `llm_guided` | LLM-driven decision making |
| `hybrid` | Combination of rules and LLM |

### Autonomy Levels
| Level | Human Involvement | Agent Authority |
|-------|-------------------|-----------------|
| `full` | Minimal oversight | Complete decision authority |
| `supervised` | Exception-based review | Operates independently, escalates edge cases |
| `collaborative` | Active partnership | Shared decision-making |
| `directed` | Step-by-step approval | Executes specific instructions |

### Human Interaction Modes
| Mode | Description |
|------|-------------|
| `in_the_loop` | Human approval for every decision |
| `on_the_loop` | Human monitors, intervenes on exceptions |
| `out_of_loop` | Fully autonomous within boundaries |

### Agent Collaboration Roles
| Role | Description |
|------|-------------|
| `supervisor` | Coordinates and orchestrates other agents |
| `worker` | Executes specific tasks as directed |
| `peer` | Collaborates as equals with defined patterns |

### Memory Store Types
| Type | Description |
|------|-------------|
| `kb` | Knowledge base for structured information |
| `vector` | Vector database for embeddings and semantic search |
| `relational` | Relational database for structured queries |
| `kv` | Key-value store for fast lookups |
| `graph` | Graph database for relationship queries |

### Tool Permissions
| Permission | Description |
|------------|-------------|
| `read` | Read-only access |
| `write` | Can create and update data |
| `execute` | Can execute actions |
| `admin` | Full administrative access |

### Skill Acquisition Types
| Type | Description |
|------|-------------|
| `built_in` | Core competency the agent is designed with |
| `learned` | Acquired through training, feedback, or experience |
| `delegated` | Performed by calling another agent or service |

## Key Design Decisions

### Why Skills Own Tools
Each skill declares the tools it needs rather than referencing agent-level tools because:
1. Skills are complete capability units - they should be self-describing
2. Clearer dependencies - reading a skill shows all its requirements
3. Better portability - skills can be reused across agents without fixing references

### Why Triggers Are Skill-Level
Different skills activate under different conditions. A "Classification" skill activates on new messages, while a "Routing" skill activates on classification completion. The agent's activation surface is the union of its skills' triggers.

### Why Memory Is Agent-Level
Memory stays at agent level because:
1. Skills often need to share context
2. Persistent state shouldn't be fragmented
3. Learning signals come from cross-skill patterns

Skills read from and write to agent memory but don't own separate stores.

### Why Guardrails Exist at Both Levels
- **Agent guardrails**: Identity constraints that apply to all skills (e.g., "never expose PII")
- **Skill guardrails**: Capability-specific constraints (e.g., "only assign known categories")

Agent guardrails are inherited by all skills. Skill guardrails add additional constraints.

## Phase 1 Scope (MVP)

Phase 1 focuses on individual practitioners with core functionality:

- [x] Story Canvas (Light + Full formats)
- [x] Skill Editor (for Full format)
- [x] Template Browser (starter templates + skill templates)
- [x] Markdown and JSON export
- [x] Individual user authentication
- [ ] No real-time collaboration (Phase 2)
- [ ] No organization accounts (Phase 2)
- [ ] No PDF export (Phase 2)
