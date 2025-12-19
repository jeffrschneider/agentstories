# Story Management Specification

## Overview

This specification covers the creation, editing, and validation of Agent Stories. It defines the user flows, business rules, and component interactions for the core story management functionality.

---

## User Flows

### UF-001: Create New Story from Scratch

**Entry Points:**
- Dashboard "New Story" button
- Story Library "+" button
- Keyboard shortcut `Cmd/Ctrl + N`

**Flow:**
1. User clicks "New Story"
2. System displays format selection modal:
   - Option A: "Agent Story Light" - with description
   - Option B: "Agent Story Full" - with description
   - Option C: "Start from Template" - links to template browser
3. User selects format
4. System creates new story with generated UUID and defaults:
   - `id`: UUID v4
   - `format`: selected format
   - `createdAt`: current timestamp
   - `updatedAt`: current timestamp
   - `createdBy`: current user ID
   - `autonomyLevel`: organization default or 'supervised'
5. System navigates to Story Canvas with new story loaded
6. Story is auto-saved as draft (not visible in library until first manual save)

**Acceptance Criteria:**
- [ ] Time from click to editable canvas < 500ms
- [ ] Draft stories are recoverable for 7 days
- [ ] User can cancel creation at any point without side effects

---

### UF-002: Edit Existing Story

**Entry Points:**
- Story Library row click
- Direct URL `/stories/{id}`
- Recent stories quick access

**Flow:**
1. User navigates to story
2. System fetches story from API
3. System displays Story Canvas with story data populated
4. User makes edits in any field
5. System validates field on blur
6. System auto-saves after 2 seconds of inactivity (debounced)
7. System shows save indicator ("Saved" / "Saving..." / "Unsaved changes")

**Concurrent Edit Handling:**
- System polls for updates every 30 seconds
- If remote changes detected, show banner: "This story was updated by {user}. [Refresh] [Keep my changes]"
- Phase 2: Real-time collaboration with operational transforms

**Acceptance Criteria:**
- [ ] Auto-save debounce prevents excessive API calls
- [ ] Optimistic updates for immediate feedback
- [ ] Conflict detection with user-friendly resolution

---

### UF-003: Upgrade Light to Full Format

**Trigger:** User clicks "Upgrade to Full" in story header

**Flow:**
1. System displays confirmation modal explaining:
   - What additional sections become available
   - That this action is reversible
2. User confirms upgrade
3. System updates story format to 'full'
4. System reveals extended specification panels
5. All existing data preserved

**Acceptance Criteria:**
- [ ] No data loss during upgrade
- [ ] New sections clearly indicated as "new"
- [ ] Downgrade path available (strips extended sections with warning)

---

### UF-004: Delete Story

**Trigger:** Story context menu → Delete, or delete button in story header

**Flow:**
1. System displays confirmation dialog:
   - "Delete '{story.name}'?"
   - "This action cannot be undone. The story will be permanently deleted."
   - [Cancel] [Delete]
2. User confirms
3. System soft-deletes story (retained 30 days for recovery)
4. System navigates to Story Library
5. Toast: "Story deleted. [Undo]" (undo available for 10 seconds)

**Acceptance Criteria:**
- [ ] Soft delete with 30-day retention
- [ ] Undo available immediately after delete
- [ ] Deleted stories excluded from all queries by default

---

### UF-005: Duplicate Story

**Trigger:** Story context menu → Duplicate

**Flow:**
1. System creates copy with:
   - New UUID
   - Name: "{original.name} (copy)"
   - Identifier: "{original.identifier}-copy" or next available
   - createdAt/updatedAt: current timestamp
2. System opens duplicate in Story Canvas
3. Toast: "Story duplicated"

**Acceptance Criteria:**
- [ ] All story content copied
- [ ] Unique identifier generated
- [ ] Original story unchanged

---

## Story Canvas Component

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: [Back] Story Name (editable) [Format Badge] [Actions ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CORE STORY                                               │   │
│  │                                                          │   │
│  │ Identifier: [____________]                               │   │
│  │                                                          │   │
│  │ As a [___________________] (role)                        │   │
│  │                                                          │   │
│  │ triggered by [TRIGGER SELECTOR]                          │   │
│  │                                                          │   │
│  │ I [_________________________________] (action)           │   │
│  │                                                          │   │
│  │ so that [______________________________] (outcome)       │   │
│  │                                                          │   │
│  │ Autonomy: [○ Full ○ Supervised ● Collaborative ○ Dir.]   │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ── STRUCTURED ANNOTATIONS (Full format only) ──────────────    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Trigger Specification                     [Optional]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Behavior Model                            [Optional]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Reasoning & Decisions                     [Optional]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Memory & State                            [Optional]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Tools & Integrations                      [Optional]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Skills                                    [Required]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Human Collaboration                       [Optional]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Agent Collaboration                       [Optional]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▶ Acceptance Criteria                       [Required]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Notes:**
- Structured annotations only visible in Full format
- Two sections are required for Full format: Skills and Acceptance Criteria
- All other annotation sections are optional - add only what's relevant
- Collapsed sections show completion indicator (e.g., "2 skills defined")
- Sections expand inline, not as modals
- Tools must be defined before Skills can reference them

---

## Trigger Configuration

### Trigger Selector Component

The trigger selector is a critical component that adapts its UI based on trigger type.

```
┌─────────────────────────────────────────────────────────────┐
│ Trigger Type: [Message ▼]                                   │
├─────────────────────────────────────────────────────────────┤
│ MESSAGE TRIGGER CONFIGURATION                               │
│                                                             │
│ Source Agents:                                              │
│ [+ Add agent] [support-router] [×] [priority-classifier] [×]│
│                                                             │
│ Message Format (optional):                                  │
│ [____________________________________________________]     │
│                                                             │
│ Protocol: ○ A2A  ○ Webhook  ○ Queue                         │
└─────────────────────────────────────────────────────────────┘
```

### Trigger Type-Specific Fields

| Trigger Type | Required Fields | Optional Fields |
|--------------|-----------------|-----------------|
| Message | sourceAgents | messageFormat, protocol |
| Resource Change | resourceType, resourceIdentifier, changeTypes | - |
| Schedule | cronExpression | timezone |
| Cascade | upstreamAgentId, eventType | conditions |
| Manual | - | requiredRole, confirmationRequired |

### Cron Expression Helper

For schedule triggers, provide a visual cron builder:

```
┌─────────────────────────────────────────────────────────────┐
│ SCHEDULE CONFIGURATION                                      │
│                                                             │
│ ○ Simple: Every [5 ▼] [minutes ▼]                           │
│ ● Advanced: [0 */15 9-17 * * 1-5]                           │
│                                                             │
│ Preview: "At minute 0 and 15 and 30 and 45 past every hour  │
│           from 9 through 17 on every day-of-week from       │
│           Monday through Friday"                            │
│                                                             │
│ Next 5 runs:                                                │
│   • Mon Dec 16, 2025 09:00                                  │
│   • Mon Dec 16, 2025 09:15                                  │
│   • Mon Dec 16, 2025 09:30                                  │
│   • Mon Dec 16, 2025 09:45                                  │
│   • Mon Dec 16, 2025 10:00                                  │
│                                                             │
│ Timezone: [America/New_York ▼]                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### Real-Time Validation

Fields are validated on blur and before save. Validation errors appear inline below the field.

### Core Story Validation

| Field | Validation Rules |
|-------|-----------------|
| identifier | Required, 1-50 chars, lowercase alphanumeric + hyphens, must start with letter, unique within org |
| name | Required, 1-100 chars |
| role | Required, 1-200 chars |
| trigger | Required, must pass trigger type-specific validation |
| action | Required, 1-500 chars |
| outcome | Required, 1-500 chars |
| autonomyLevel | Required, must be valid enum value |

### Cross-Field Validation (Warnings)

These produce warnings, not blocking errors:

| Condition | Warning Message |
|-----------|-----------------|
| autonomyLevel='full' AND humanInteraction.mode='in_the_loop' | "Full autonomy with in-the-loop collaboration may be contradictory" |
| autonomyLevel='directed' AND humanInteraction.mode='out_of_loop' | "Directed autonomy with out-of-loop collaboration may be contradictory" |
| behavior.type='workflow' AND behavior.stages.length < 2 | "Workflow agents typically have multiple stages" |
| trigger.type='schedule' AND autonomyLevel='directed' | "Scheduled triggers with directed autonomy require human availability" |
| skill.toolsUsed references non-existent tool | "Skill references unknown tool: {toolName}" |

### Full Format Required Sections

When upgrading to Full format, the following sections must be completed before saving:

| Section | Requirement |
|---------|-------------|
| Skills | At least one skill with name, domain, proficiencies, and qualityBar |
| Acceptance Criteria | At least one functional criterion |

### Validation Error Display

```
┌─────────────────────────────────────────────────────────────┐
│ Identifier: [sup@port-agent_________]                       │
│ ⚠️ Must contain only lowercase letters, numbers, and hyphens │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management

### Valtio Store Structure

```typescript
// /stores/story-editor.ts

import { proxy, subscribe } from 'valtio';
import { AgentStory, ValidationResult } from '@/lib/schemas';

interface StoryEditorState {
  // Current story being edited
  story: AgentStory | null;
  originalStory: AgentStory | null; // For dirty checking

  // UI state
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;

  // Validation
  validationResult: ValidationResult | null;
  touchedFields: Set<string>;

  // Expanded sections (Full format)
  expandedSections: Set<string>;

  // Actions
  loadStory: (id: string) => Promise<void>;
  updateField: (path: string, value: unknown) => void;
  markFieldTouched: (path: string) => void;
  save: () => Promise<void>;
  validate: () => ValidationResult;
  reset: () => void;
  toggleSection: (sectionId: string) => void;
}

export const storyEditorStore = proxy<StoryEditorState>({
  story: null,
  originalStory: null,
  isLoading: false,
  isSaving: false,
  lastSavedAt: null,
  validationResult: null,
  touchedFields: new Set(),
  expandedSections: new Set(),

  async loadStory(id: string) {
    this.isLoading = true;
    try {
      const response = await fetch(`/api/stories/${id}`);
      const story = await response.json();
      this.story = story;
      this.originalStory = structuredClone(story);
      this.validationResult = null;
      this.touchedFields.clear();
    } finally {
      this.isLoading = false;
    }
  },

  updateField(path: string, value: unknown) {
    if (!this.story) return;
    setNestedValue(this.story, path, value);
    this.story.updatedAt = new Date().toISOString();
    debouncedAutoSave();
  },

  markFieldTouched(path: string) {
    this.touchedFields.add(path);
    this.validate();
  },

  async save() {
    if (!this.story) return;
    this.isSaving = true;
    try {
      await fetch(`/api/stories/${this.story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.story)
      });
      this.originalStory = structuredClone(this.story);
      this.lastSavedAt = new Date();
    } finally {
      this.isSaving = false;
    }
  },

  validate() {
    if (!this.story) return { valid: true, errors: [], warnings: [] };
    this.validationResult = validateStory(this.story);
    return this.validationResult;
  },

  reset() {
    this.story = null;
    this.originalStory = null;
    this.validationResult = null;
    this.touchedFields.clear();
    this.expandedSections.clear();
  },

  toggleSection(sectionId: string) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  }
});
```

### React Query Integration

```typescript
// /lib/hooks/use-story.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentStory } from '@/lib/schemas';

export function useStory(id: string) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${id}`);
      if (!response.ok) throw new Error('Failed to fetch story');
      return response.json() as Promise<AgentStory>;
    },
    staleTime: 30_000, // 30 seconds
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (story: AgentStory) => {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story)
      });
      if (!response.ok) throw new Error('Failed to save story');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['story', variables.id], data);
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (story: Partial<AgentStory>) => {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story)
      });
      if (!response.ok) throw new Error('Failed to create story');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete story');
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['story', id] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
```

---

## Story Library

### Library View Modes

1. **Grid View**: Cards showing story name, identifier, format badge, and last updated
2. **List View**: Table with sortable columns

### Filtering and Search

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search stories...]  [Format ▼] [Autonomy ▼] [Tags ▼]    │
├─────────────────────────────────────────────────────────────┤
│ ☐ support-triage     Support Triage Agent    Light  Collab │
│ ☐ order-processor    Order Processing Agent  Full   Super  │
│ ☐ alert-monitor      System Alert Monitor    Light  Full   │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Bulk Actions

When stories are selected:
- Export selected (Markdown/JSON)
- Delete selected
- Tag selected
- Move to folder (Phase 2)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New story |
| `Cmd/Ctrl + S` | Save current story |
| `Cmd/Ctrl + E` | Export current story |
| `Cmd/Ctrl + D` | Duplicate current story |
| `Escape` | Close modal / Cancel current action |
| `Cmd/Ctrl + /` | Show keyboard shortcuts |

---

## Error Handling

### Network Errors

- Auto-retry failed saves up to 3 times with exponential backoff
- Show persistent banner for offline state
- Queue changes locally during offline, sync when back online

### Validation Errors on Save

- Prevent save if blocking errors exist
- Scroll to first error field
- Show toast: "Please fix errors before saving"

### Concurrent Edit Conflicts

- Detect via `updatedAt` comparison
- Show conflict resolution UI
- Options: Keep mine, Take theirs, Merge manually

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Time to interactive (Story Canvas) | < 1s |
| Auto-save latency | < 500ms |
| Field validation | < 50ms |
| Story list load (100 stories) | < 2s |

---

## Accessibility

- All form fields have associated labels
- Error messages announced to screen readers
- Keyboard navigation for all interactions
- Focus management on modal open/close
- ARIA live regions for save status updates
