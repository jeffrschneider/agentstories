# UI Innovation Specification

> **DEPRECATED**: This specification describes the old form-based UI which has been replaced by the file-tree based editor. See `12-file-tree-editor.md` for the current UI specification.

## Problem Statement

The current form is 8 flat tabs with long, scrolling forms. This creates:
- Cognitive overload from too many tabs
- No visual hierarchy or relationships
- Repetitive "add item" patterns
- No progressive disclosure

## Solution: Grouped Navigation + Progressive Disclosure

### 1. Conceptual Groupings

Replace 8 flat tabs with 4 conceptual groups:

| Group | Icon | Sections | Purpose |
|-------|------|----------|---------|
| **Activation** | Zap | Trigger | When/how the agent starts |
| **Execution** | Cog | Behavior, Reasoning | How the agent works |
| **Capabilities** | Layers | Tools, Skills, Memory | What the agent can do |
| **Collaboration** | Users | Human Interaction, Agent Collaboration | Who the agent works with |

Plus:
- **Core Story** - Always visible at top (not in tabs)
- **Acceptance** - Always visible at bottom as "success criteria" summary

### 2. Two-Column Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Core Story Section (always visible)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────────────────────────┐  │
│  │ Navigation   │  │  Active Section Content             │  │
│  │              │  │                                     │  │
│  │ ○ Activation │  │  ┌─────────────────────────────┐    │  │
│  │   └ Trigger  │  │  │ Section Card               │    │  │
│  │              │  │  │ with collapsible advanced  │    │  │
│  │ ○ Execution  │  │  │ options                    │    │  │
│  │   └ Behavior │  │  └─────────────────────────────┘    │  │
│  │   └ Reasoning│  │                                     │  │
│  │              │  │  ┌─────────────────────────────┐    │  │
│  │ ○ Capabil... │  │  │ Related Section            │    │  │
│  │   └ Tools    │  │  │ (if in same group)         │    │  │
│  │   └ Skills   │  │  └─────────────────────────────┘    │  │
│  │   └ Memory   │  │                                     │  │
│  │              │  │                                     │  │
│  │ ○ Collab...  │  │                                     │  │
│  │   └ Human    │  │                                     │  │
│  │   └ Agents   │  │                                     │  │
│  └──────────────┘  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Acceptance Criteria (always visible summary)               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Progressive Disclosure Pattern

Each section uses a "Basic → Advanced" pattern:

```
┌─────────────────────────────────────────────────────┐
│ Section Title                           [Expand ▼] │
├─────────────────────────────────────────────────────┤
│ Essential Fields (always visible)                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Field 1: _________________________              │ │
│ │ Field 2: [Dropdown ▼]                           │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Advanced Options ──────────────────────────────┐ │
│ │ (collapsed by default, expands on click)        │ │
│ │ Field 3: _________________________              │ │
│ │ Field 4: _________________________              │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 4. Conditional Field Rendering

Show fields based on context:

**Trigger Section:**
- Base fields: type, source, conditions, examples
- When type = `schedule`: Show cron expression, timezone
- When type = `message`: Show source agents, protocol
- When type = `resource_change`: Show resource type, change types
- When type = `cascade`: Show upstream agent, event type
- When type = `manual`: Show required role, confirmation toggle

**Behavior Section:**
- Base fields: type, planning strategy
- When type = `workflow` or `hybrid`: Show stages with transitions
- When type = `adaptive` or `hybrid`: Show capabilities list

### 5. Inline Relationship Visualization

**Skills Section:**
- Show tool references as clickable badges that highlight in Tools section
- "Uses: [Customer DB] [Ticket API]" with visual connection

**Agent Collaboration:**
- Visual mini-diagram showing relationships
- Supervisor: Show agents being coordinated with arrows
- Worker: Show reporting relationship
- Peer: Show bidirectional connections

```
        ┌──────────────┐
        │ This Agent   │
        │ (Supervisor) │
        └──────┬───────┘
               │ coordinates
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌───────┐  ┌───────┐  ┌───────┐
│Worker1│  │Worker2│  │Worker3│
└───────┘  └───────┘  └───────┘
```

### 6. Completion Indicators

Show visual progress on navigation:

```
○ Activation          (empty circle = not started)
● Execution           (filled circle = has content)
◐ Capabilities        (half circle = partially complete)
```

### 7. Smart Defaults & Templates

When a section is empty, show:
- Suggested starting templates
- "Common patterns" quick-add buttons
- Example preview

---

## Implementation Components

### New Components Needed

1. `SectionNavigation` - Left sidebar with grouped navigation
2. `CollapsibleAdvanced` - Expandable advanced options wrapper
3. `ConditionalFields` - Wrapper that shows/hides based on state
4. `RelationshipBadge` - Clickable badge for cross-references
5. `CollaborationDiagram` - Visual agent relationship diagram
6. `CompletionIndicator` - Progress indicator for sections

### Modified Components

1. `StoryForm` - New two-column layout
2. `TriggerSection` - Add conditional type-specific fields
3. `BehaviorSection` - Add transitions, capabilities
4. `SkillsSection` - Add skill-level reasoning, tool badges
5. `ReasoningSection` - Add iteration config
6. `MemorySection` - Add learning config
7. NEW: `AgentCollaborationSection` - Full new section

---

## Mobile Considerations

On mobile, collapse to:
- Single column layout
- Navigation becomes horizontal scrollable tabs or dropdown
- Same progressive disclosure within sections
