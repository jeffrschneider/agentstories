# 09 - Human-Agent Pair (HAP) System

## Overview

The HAP system enables organizations to model and track the transformation of roles from human-only to human-agent collaboration. It provides visibility into AI adoption progress across the organization hierarchy.

## Core Concepts

### Business Domain
A high-level area of the business being transformed (e.g., "Customer Operations", "Finance & Accounting").

### Department
An organizational unit within a domain (e.g., "Customer Support", "Accounts Payable").

### Role
A job function with defined responsibilities. Responsibilities are flagged as `aiCandidate` if suitable for agent assistance.

### Person
An employee who holds one or more roles. Supports "wearing many hats" via role assignments with allocation percentages.

### Human-Agent Pair (HAP)
The core entity linking a Person, Role, and Agent Story. Tracks the transition of tasks from human to agent ownership.

## Data Models

### BusinessDomain Schema
```typescript
{
  id: string (uuid)
  name: string (1-100 chars)
  description?: string (max 500)
  createdAt: datetime
  updatedAt: datetime
}
```

### Department Schema
```typescript
{
  id: string (uuid)
  domainId: string (uuid)
  name: string (1-100 chars)
  description?: string (max 500)
  managerId?: string (uuid) // Person who manages
  createdAt: datetime
  updatedAt: datetime
}
```

### Role Schema
```typescript
{
  id: string (uuid)
  departmentId: string (uuid)
  name: string (1-100 chars)
  description?: string (max 500)
  level?: 'entry' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive'
  responsibilities: Responsibility[]
  requiredSkillDomains?: string[]
  createdAt: datetime
  updatedAt: datetime
}

Responsibility {
  id: string (uuid)
  name: string (1-200 chars)
  description?: string (max 500)
  aiCandidate: boolean // Can an agent help with this?
}
```

### Person Schema
```typescript
{
  id: string (uuid)
  name: string (1-100 chars)
  email: string (email format)
  title?: string (max 100)
  departmentId?: string (uuid)
  roleAssignments: RoleAssignment[]
  createdAt: datetime
  updatedAt: datetime
}

RoleAssignment {
  roleId: string (uuid)
  allocation: number (0-100) // Percentage of time
  isPrimary: boolean
}
```

### HumanAgentPair (HAP) Schema
```typescript
{
  id: string (uuid)
  personId: string (uuid)
  roleId: string (uuid)
  agentStoryId: string (uuid)
  asIs: HAPState           // Current state
  toBe: HAPState           // Target state
  transitionStatus: TransitionStatus
  topBlockers?: string[]
  targetCompletionDate?: datetime
  notes?: string (max 1000)
  createdAt: datetime
  updatedAt: datetime
}

HAPState {
  taskAssignments: TaskAssignment[]
  humanPercent: number (0-100)
  agentPercent: number (0-100)
  effectiveDate?: datetime
}

TaskAssignment {
  id: string (uuid)
  taskName: string (1-200 chars)
  description?: string (max 500)
  currentOwner: TaskOwner
  targetOwner: TaskOwner
  blockers?: string[]
  targetDate?: datetime
  notes?: string (max 500)
}

TaskOwner = 'human' | 'agent' | 'shared'

TransitionStatus = 'not_started' | 'planned' | 'in_progress' | 'blocked' | 'completed'
```

## State Management

### Valtio Store (`/stores/hap.ts`)
```typescript
{
  // Filters
  selectedDomainId: string | null
  selectedDepartmentId: string | null
  statusFilter: TransitionStatus | 'all'

  // Selection
  selectedHAPId: string | null

  // Draft editing
  draftHAP: Partial<HumanAgentPair> | null
  isDirty: boolean

  // Cache
  lastFetchedAt: Record<string, number>
}
```

### React Query Hooks (`/hooks/use-hap.ts`)

| Hook | Purpose |
|------|---------|
| `useDomains()` | Fetch all business domains |
| `useDepartments(domainId?)` | Fetch departments, optionally filtered |
| `useRoles(departmentId?)` | Fetch roles, optionally filtered |
| `usePeople(departmentId?)` | Fetch people, optionally filtered |
| `useHAPs(filters?)` | Fetch HAPs with optional filters |
| `useHAPDetail(id)` | Fetch single HAP with full details |
| `useHAPStats()` | Fetch aggregated statistics |
| `useDepartmentStats(id)` | Fetch department-level stats |
| `useCreateHAP()` | Mutation to create HAP |
| `useUpdateHAP()` | Mutation to update HAP |
| `useDeleteHAP()` | Mutation to delete HAP |

## UI Components

### Organization Pages

#### `/organization` - Organization Browser
- **Overview Mode**: OrgSummary cards + expandable OrgChart
- **Browse Mode**: Drill-down navigation (Domain → Department → Role/People/HAPs)
- Toggle between modes via header buttons

#### `/organization/departments/[id]` - Department Dashboard
- Summary metrics (HAP count, task count, avg progress, AI adoption target)
- Tabs: Overview, Transformation, HAPs
- As-Is vs To-Be comparison visualization
- Blocked transitions alert panel

#### `/organization/haps` - HAPs List
- Filter by status and department
- Stats overview cards
- Export button (opens HAPExportPanel)
- HAP cards with progress indicators

#### `/organization/haps/[id]` - HAP Detail
- Person/Role/Agent info cards
- Tabs: Task Assignments, As-Is vs To-Be, Details
- Edit mode for modifying task ownership
- Link to Agent Story

#### `/organization/haps/new` - HAP Creation Wizard
5-step wizard:
1. Select Person
2. Select Role
3. Link Agent Story
4. Configure Task Assignments
5. Review & Create

### Visualization Components (`/components/hap/`)

| Component | Purpose |
|-----------|---------|
| `OwnershipChart` | Donut chart showing human/agent/shared breakdown |
| `ProgressRing` | Circular progress indicator with auto-coloring |
| `TransformationBar` | Horizontal stacked bar for As-Is → To-Be |
| `StatusBadge` | Consistent status display with icons |
| `TransitionTimeline` | Vertical/horizontal timeline of transitions |
| `HAPExportPanel` | Export to JSON/CSV/Markdown |

### Organization Components (`/components/organization/`)

| Component | Purpose |
|-----------|---------|
| `OrgChart` | Expandable tree view of org hierarchy |
| `OrgSummary` | Summary cards with overall metrics |

### Story Integration (`/components/story-editor/`)

| Component | Purpose |
|-----------|---------|
| `LinkedHAPsSection` | Shows HAPs using a story (tab on story detail) |

## Integration Points

### Story ↔ HAP Bidirectional Links
- Story detail page shows "HAPs" tab listing linked pairs
- HAP detail page shows clickable Agent Story card

### As-Is / To-Be Tracking
- Each task has `currentOwner` (As-Is) and `targetOwner` (To-Be)
- Progress calculated as tasks where current matches target
- Percentages aggregated at HAP, department, and org levels

### Export Formats
- **JSON**: Full structured data with optional task details
- **CSV**: Tabular format for spreadsheet analysis
- **Markdown**: Human-readable report with summary stats

## Helper Functions

```typescript
// Calculate ownership percentages from tasks
calculateHAPPercentages(tasks, useTarget?): { humanPercent, agentPercent }

// Determine status from task states
determineTransitionStatus(tasks): TransitionStatus

// Generate timeline events from HAP
generateHAPTimeline(hap, includeProjected?): TimelineEvent[]
```

## Mock Data

Located in `/services/mock-hap-data.ts`:
- 3 Business Domains
- 5 Departments
- 5 Roles with responsibilities
- 5 People with role assignments
- 2 Sample HAPs with task assignments

## Future Considerations

1. **Persistence**: Currently uses mock data; needs backend API integration
2. **Real-time Updates**: WebSocket support for live collaboration
3. **Historical Tracking**: Audit log of transition changes
4. **Notifications**: Alerts for blocked transitions or missed targets
5. **Bulk Operations**: Import/export of organization structure
6. **Analytics Dashboard**: Trends, forecasting, bottleneck analysis
