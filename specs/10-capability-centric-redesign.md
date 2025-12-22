# Capability-Centric Redesign

## Vision

Transform the system to use **Capability** as the lingua franca that connects:
- **Organization side**: What responsibilities require
- **Agent/Human side**: What they can provide
- **HAP**: The operational pairing with phase-level control
- **Agent Stories**: Detailed implementation specs for capabilities

The goal is to make it easy to "see across the lines" from any entry point.

---

## Part 1: Data Model Changes

### 1.1 New Entity: Capability

```typescript
// The shared vocabulary - both org requirements and agent/human offerings reference this
export const CapabilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),        // e.g., "Screen Resumes"
  description: z.string().max(500),         // What this capability entails
  domain: z.string().optional(),            // e.g., "Recruiting", "Customer Service"

  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
```

Create new file: `src/lib/schemas/capability.ts`

### 1.2 Update: Responsibility (in role.ts)

**Before:**
```typescript
requiredSkillDomains: z.array(z.string()).default([])  // loose strings
```

**After:**
```typescript
requiredCapabilityIds: z.array(z.string().uuid()).default([])  // references Capability
```

### 1.3 Update: Person (in person.ts)

**Before:**
```typescript
skills: z.array(z.string()).default([])  // loose strings like "Resume Screening"
```

**After:**
```typescript
capabilityIds: z.array(z.string().uuid()).default([])  // references Capability
```

### 1.4 Update: Skill in Agent Story (in skill.ts)

**Add:**
```typescript
capabilityId: z.string().uuid().optional()  // which Capability this skill implements
```

The detailed skill spec (triggers, inputs, outputs, behavior, etc.) is the *implementation* of the capability.

### 1.5 New Concept: Capability Gap (replaces Skills Queue)

```typescript
export const CapabilityGapSchema = z.object({
  id: z.string().uuid(),
  capabilityId: z.string().uuid(),          // the missing capability

  // Demand side - which responsibilities need this
  demandingSources: z.array(z.object({
    roleId: z.string().uuid(),
    responsibilityId: z.string().uuid()
  })),

  // Resolution tracking
  status: z.enum(['open', 'in_progress', 'resolved']),

  // When resolved, which agent story provides it
  resolvedByAgentStoryId: z.string().uuid().optional(),
  resolvedBySkillId: z.string().uuid().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
```

---

## Part 2: Service Layer Changes

### 2.1 New Service: capabilityService

```typescript
// src/services/capability-service.ts
interface CapabilityService {
  // CRUD
  getCapabilities(): Capability[];
  getCapability(id: string): Capability | undefined;
  createCapability(data: Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>): Capability;
  updateCapability(id: string, data: Partial<Capability>): Capability;
  deleteCapability(id: string): void;

  // Analysis
  getCapabilityDemand(capabilityId: string): { roles: Role[]; responsibilities: Responsibility[] };
  getCapabilitySupply(capabilityId: string): { people: Person[]; agentSkills: { story: AgentStory; skill: Skill }[] };
  getCapabilityGaps(): CapabilityGap[];  // capabilities required but not provided
  getUnmatchedCapabilities(): Capability[];  // capabilities provided but not required
}
```

### 2.2 Update: Mock Data

Update `mock-hap-data.ts` to:
- Include a set of Capabilities
- Update Responsibilities to reference Capability IDs
- Update People to reference Capability IDs
- Update Agent Story Skills to reference Capability IDs

---

## Part 3: UI Changes

### 3.1 New Page: Capabilities (`/capabilities`)

**Purpose:** The central hub showing the shared vocabulary.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Capabilities                                    [+ Add Capability] │
├─────────────────────────────────────────────────────────────────┤
│  Filters: [Domain ▼] [Status ▼] [Search...]                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Screen Resumes                              [Matched ✓]  │   │
│  │ Parse and evaluate candidate resumes                     │   │
│  │                                                          │   │
│  │ Required by: 2 responsibilities                          │   │
│  │ Provided by: 1 agent, 3 people                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Conduct Phone Screens                        [Gap ⚠]    │   │
│  │ Initial candidate phone interviews                       │   │
│  │                                                          │   │
│  │ Required by: 1 responsibility                            │   │
│  │ Provided by: 0 agents, 2 people                         │   │
│  │                        [Create Agent Story →]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Click on a capability → Detail view:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Capabilities                                         │
│                                                                 │
│  Screen Resumes                                                 │
│  Parse and evaluate candidate resumes against job requirements  │
│                                                                 │
├───────────────────────────┬─────────────────────────────────────┤
│  DEMAND (Who needs this)  │  SUPPLY (Who provides this)         │
├───────────────────────────┼─────────────────────────────────────┤
│                           │                                     │
│  Recruiter Role           │  AGENTS                             │
│  └─ Screen applications   │  ┌─ RecruitBot                      │
│     [View Role →]         │  │  Skill: Resume Parser            │
│                           │  │  [View Story →]                  │
│  Talent Acquisition       │  │                                  │
│  └─ Initial screening     │  PEOPLE                             │
│     [View Role →]         │  ├─ Sarah Johnson (has capability)  │
│                           │  ├─ Mike Chen (has capability)      │
│                           │  └─ [View all 3 →]                  │
│                           │                                     │
├───────────────────────────┴─────────────────────────────────────┤
│  HAPs using this capability                                     │
│  ┌─ Sarah + RecruitBot on "Screen applications"                │
│  │  M[H] D[A] P[A] R[H]    [View HAP →]                        │
│  └─────────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Rename: Skills Queue → Capability Gaps (`/capability-gaps`)

**Purpose:** Show capabilities required by the organization but not yet available from any agent or person.

**Changes:**
- Rename route from `/skills-queue` to `/capability-gaps`
- Update sidebar nav
- Show capability-centric view instead of HAP-skill-requirement-centric
- Each gap links to the capability, shows demanding responsibilities
- Action: "Create Agent Story" to resolve the gap

### 3.3 Update: Organization View

**Responsibility detail should show:**
- Required capabilities (clickable → go to capability)
- Coverage status (fulfilled by whom?)

**Person detail should show:**
- Capabilities they possess (clickable → go to capability)

### 3.4 Update: HAP View

**Phase assignment improvements:**
- Quick toggle buttons for Human/Agent on each phase
- Visual: `M[H] D[A] P[A] R[H]` style compact display
- Click phase → expand to see which capability/skill is linked

**Cross-linking:**
- From HAP task → show which capabilities are involved
- Link to capability detail view

### 3.5 Update: Agent Story View

**Skill section should show:**
- Which capability each skill implements (clickable → go to capability)
- "Link to Capability" action if not yet linked

### 3.6 Update: Dashboard

**Transformation funnel should reference:**
- Responsibilities with required capabilities
- Capability coverage (matched vs gaps)
- HAPs created

### 3.7 Update: Sidebar Navigation

```typescript
const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Organization", href: "/organization", icon: Building2 },
  { title: "Capabilities", href: "/capabilities", icon: Layers },  // NEW
  { title: "HAPs", href: "/haps", icon: Users },
  { title: "Stories", href: "/stories", icon: FileText },
  { title: "Capability Gaps", href: "/capability-gaps", icon: AlertTriangle },  // RENAMED
  { title: "Templates", href: "/templates", icon: LayoutTemplate },
];
```

---

## Part 4: Navigation Flow (See Across the Lines)

### 4.1 Entry Point: Organization (Responsibility)

```
Responsibility "Screen applications"
  → Requires: [Screen Resumes] capability (click)
    → Capability detail: see who provides it
      → Click agent skill → Agent Story
      → Click person → Person detail
      → Click HAP → HAP detail
```

### 4.2 Entry Point: Capability

```
Capability "Screen Resumes"
  → Demand side: which responsibilities need it (click → Role/Responsibility)
  → Supply side:
    → Agents: which skills provide it (click → Agent Story)
    → People: who has it (click → Person)
  → HAPs: which HAPs use this capability (click → HAP)
```

### 4.3 Entry Point: Capability Gap

```
Gap: "Conduct Phone Screens" not provided
  → See which responsibilities need it (click → Role)
  → Action: Create Agent Story → pre-populate with capability context
```

### 4.4 Entry Point: Agent Story

```
Agent Story "RecruitBot"
  → Skill "Resume Parser"
    → Provides capability: [Screen Resumes] (click → Capability)
      → See who else provides it
      → See which responsibilities need it
```

### 4.5 Entry Point: HAP

```
HAP: Sarah + RecruitBot
  → Task "Screen applications"
    → Phases: M[H] D[A] P[A] R[H] (toggleable)
    → Involves capability: [Screen Resumes] (click → Capability)
```

---

## Part 5: Implementation Order

### Phase 1: Data Model Foundation
1. Create `capability.ts` schema
2. Create capability service with mock data
3. Add hooks for capabilities (`useCapabilities`, `useCapability`, etc.)

### Phase 2: Schema Updates
4. Update `role.ts` - Responsibility to use `requiredCapabilityIds`
5. Update `person.ts` - use `capabilityIds`
6. Update `skill.ts` - add `capabilityId`
7. Update mock data to use new references

### Phase 3: Capabilities UI
8. Create `/capabilities` page (list view)
9. Create `/capabilities/[id]` page (detail view with demand/supply)
10. Update sidebar navigation

### Phase 4: Cross-Linking Updates
11. Update Organization view - show capability links on responsibilities
12. Update Person view - show capability links
13. Update HAP view - show capability links, improve phase toggles
14. Update Agent Story view - show capability links on skills

### Phase 5: Capability Gaps
15. Rename `/skills-queue` to `/capability-gaps`
16. Rewrite to be capability-centric
17. Add "Create Agent Story" flow from gap

### Phase 6: Dashboard Updates
18. Update dashboard metrics to use capability model
19. Show capability coverage in transformation funnel

---

## Part 6: Migration Considerations

### Existing Data
- `requiredSkillDomains` strings → Create capabilities, map to IDs
- `skills` on Person → Create capabilities, map to IDs
- Skills on Agent Stories → Link to appropriate capabilities

### Backwards Compatibility
- Keep old fields during transition
- Service layer handles both old strings and new IDs
- UI progressively migrates to new model

---

## Summary

This redesign makes **Capability** the central concept that ties together:
- What the organization needs (responsibilities require capabilities)
- What can fulfill those needs (agents and people have capabilities)
- How they work together (HAPs with phase-level control)
- How to fill gaps (agent stories implement capabilities)

The UI enables navigation "across the lines" from any starting point, making the connections visible and actionable.
