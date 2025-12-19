# Agent Story Builder - Technical Specifications

## Overview

This directory contains the technical specifications for Agent Story Builder, a web-based platform for capturing comprehensive requirements for AI agents using the Agent Stories framework.

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
| [01-data-models](./01-data-models.md) | Core data models and Zod schemas |
| [02-story-management](./02-story-management.md) | Story creation, editing, and validation |
| [03-template-system](./03-template-system.md) | Template library and management |
| [04-export-system](./04-export-system.md) | Export to Markdown, JSON, PDF |
| [05-collaboration](./05-collaboration.md) | Real-time editing, comments, sharing |
| [06-api-specification](./06-api-specification.md) | REST API endpoints |
| [07-ui-components](./07-ui-components.md) | Component architecture and specs |

## Architecture Principles

### Progressive Disclosure
The UI reveals complexity progressively. Core story elements are always visible; extended specifications appear as collapsible panels that users expand as needed.

### Format Duality
The system supports two formats:
- **Agent Story Light**: Simple agents, early-stage design, quick stakeholder communication
- **Agent Story Full**: Complex agents with detailed engineering specifications

### Validation-First
All data flows through Zod schemas for runtime validation. Invalid states are caught at the boundary.

## Directory Structure

```
/app
  /api                    # API routes
    /stories              # Story CRUD operations
    /templates            # Template operations
    /export               # Export endpoints
    /auth                 # Authentication
  /(dashboard)            # Dashboard routes
    /stories              # Story management pages
    /templates            # Template browser
    /settings             # User/org settings
/components
  /story                  # Story-related components
  /template               # Template components
  /collaboration          # Collaboration components
  /ui                     # shadcn/ui components
/lib
  /schemas                # Zod schemas
  /utils                  # Utility functions
  /hooks                  # Custom React hooks
/stores
  /story-editor           # Story editor state
  /ui                     # UI state (modals, panels)
```

## Core Concepts Reference

### Trigger Types
| Type | Description |
|------|-------------|
| `message` | A2A communication from other agents |
| `resource_change` | State change in monitored resources |
| `schedule` | Cron-based time triggers |
| `cascade` | Events from upstream agents |
| `manual` | Human-initiated activation |

### Behavior Models
| Model | Description |
|-------|-------------|
| `workflow` | Predictable stage-based execution |
| `adaptive` | Runtime decisions based on context |
| `hybrid` | Structured workflows with adaptive decision points |

### Planning Strategies
| Strategy | Description |
|----------|-------------|
| `none` | No planning - direct execution |
| `local` | Agent plans its own work |
| `delegated` | Planning delegated to another agent |
| `emergent` | Planning emerges from agent collaboration |

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

## Phase 1 Scope (MVP)

Phase 1 focuses on individual practitioners with core functionality:

- [x] Story Canvas (Light + Full formats)
- [x] Template Browser (starter templates)
- [x] Markdown and JSON export
- [x] Individual user authentication
- [ ] No real-time collaboration (Phase 2)
- [ ] No organization accounts (Phase 2)
- [ ] No PDF export (Phase 2)
