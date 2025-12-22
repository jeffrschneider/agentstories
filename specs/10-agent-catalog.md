# Agent Catalog Specification

## Overview

The Agent Catalog provides a central registry of all agents in the organization, tracking them through their lifecycle from initial planning through operational deployment and eventual sunset. The primary focus is on agents in the "Planned" lifecycle stage where requirements and agent stories are being gathered.

## Key Concepts

### Agent vs Agent Story

- **Agent**: An operational entity in the catalog with lifecycle state, links to external systems, and organizational metadata
- **Agent Story**: The detailed specification of what an agent does (skills, triggers, behaviors) - linked to an agent

Agents are the "what exists" view while Agent Stories are the "how it works" view.

### Agent Lifecycle States

| State | Description | Primary Focus |
|-------|-------------|---------------|
| `planned` | Slot reserved for a future agent; requirements/stories being gathered | **This is our main focus** - capturing capabilities and agent stories |
| `development` | Agent is being developed or tested | Links to development/testing systems |
| `operational` | Agent is or can be active and running | Links to monitoring/tracing systems |
| `sunset` | Agent is deprecated or decommissioned | Historical reference |

### External System Links

The Agent Catalog is NOT the system of record for development, operations, or monitoring. Instead, it links to other systems:

| Link Type | Description | Example Systems |
|-----------|-------------|-----------------|
| `tracing` | Agent execution tracing and observability | Datadog, Jaeger, OpenTelemetry |
| `reputation` | Agent quality and trust metrics | Custom reputation systems |
| `repository` | Source code repository | GitHub, GitLab |
| `monitoring` | Runtime monitoring dashboards | Grafana, Prometheus |
| `documentation` | External documentation | Confluence, Notion |
| `ticketing` | Issue tracking | Jira, Linear |

## Data Model

### Agent Schema

```typescript
const AgentLifecycleEnum = z.enum(['planned', 'development', 'operational', 'sunset']);

const ExternalLinkSchema = z.object({
  type: z.enum(['tracing', 'reputation', 'repository', 'monitoring', 'documentation', 'ticketing', 'other']),
  label: z.string(),
  url: z.string().url(),
});

const AgentSchema = z.object({
  // Identity
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  identifier: z.string().max(50).regex(/^[a-z][a-z0-9-]*$/).optional(),

  // Lifecycle
  lifecycleState: AgentLifecycleEnum,
  lifecycleNotes: z.string().optional(),

  // Relationships
  agentStoryId: z.string().uuid().optional(), // Link to detailed agent story
  departmentId: z.string().uuid().optional(), // Organizational context

  // Capabilities (high-level summary for planned agents)
  plannedCapabilities: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    priority: z.enum(['must-have', 'should-have', 'nice-to-have']).optional(),
  })).optional(),

  // External Links
  externalLinks: z.array(ExternalLinkSchema).optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().optional(),
});
```

## UI Components

### Agent Catalog Page (`/agents`)

**Layout:**
- Header with title, description, and "New Agent" button
- Filter card with search, lifecycle filter, and department filter
- Tab navigation for lifecycle views (All, Planned, Development, Operational, Sunset)
- Grid of agent cards (focus on Planned by default)

**Filter Options:**
- Search by name/description
- Lifecycle state filter
- Department filter (optional)
- Tags filter

### Agent Card

Displays:
- Agent name and identifier
- Lifecycle state badge (color-coded)
- Description (truncated)
- Planned capabilities count (for planned agents)
- External links icons
- Tags
- Last updated date
- Link to Agent Story if exists

**Lifecycle Badge Colors:**
| State | Color |
|-------|-------|
| `planned` | Blue (primary focus) |
| `development` | Yellow/Amber |
| `operational` | Green |
| `sunset` | Gray |

### Agent Detail Page (`/agents/[id]`)

**For Planned Agents (primary focus):**
- Agent identity section
- Planned capabilities list with priorities
- Link to create/view Agent Story
- Notes section for requirements gathering
- Timeline of changes

**For Other States:**
- Same identity section
- External links prominent
- Link to Agent Story (detailed specs)
- Lifecycle transition history

## Navigation

Add "Agent Catalog" to the main navigation after "Organization":
- Icon: `Bot` from Lucide
- Path: `/agents`
- Position: After "Organization", before "HAPs"

## User Flows

### 1. Planning a New Agent

1. User clicks "New Agent" from catalog
2. Enters basic info (name, description)
3. Lifecycle defaults to "Planned"
4. User adds planned capabilities (what the agent should do)
5. Optionally creates Agent Story for detailed specs
6. Agent appears in catalog under "Planned" tab

### 2. Tracking Agent Development

1. User views planned agent
2. Changes lifecycle to "Development"
3. Adds repository link, ticketing link
4. Agent Story is refined during development
5. Agent moves to Development tab

### 3. Agent Goes Live

1. User views development agent
2. Changes lifecycle to "Operational"
3. Adds tracing, monitoring, reputation links
4. Agent appears in Operational tab

### 4. Retiring an Agent

1. User views operational agent
2. Changes lifecycle to "Sunset"
3. Adds notes about deprecation reason
4. Agent moves to Sunset tab (historical reference)

## Integration with Existing Features

### Agent Stories Integration

- Planned agents can link to Agent Stories for detailed specifications
- "Create Story" action available from agent detail page
- Stories page shows which agents use which stories

### HAPs Integration

- HAPs reference agents through their Agent Story
- Agent catalog provides the "what agents exist" view
- HAPs provide the "who works with this agent" view

### Organization Integration

- Agents can be associated with departments
- Department pages can show related agents
