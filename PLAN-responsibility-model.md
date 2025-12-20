# Implementation Plan: HAP Responsibility Model

## Overview

Replace the As-Is/To-Be ownership model with the Responsibility Phase Model (Manage/Define/Perform/Review) and add automatic skill requirement generation.

## Phase 1: Schema Updates

### Step 1.1: Update HAP Schema (`src/lib/schemas/hap.ts`)

**Changes:**
- Remove `TaskOwnerEnum` (human/agent/shared)
- Remove `TaskAssignmentSchema`
- Remove `HAPStateSchema`
- Remove `TransitionStatusEnum`
- Add `ResponsibilityPhaseEnum` (manage/define/perform/review)
- Add `PhaseOwnerEnum` (human/agent)
- Add `PhaseAssignmentSchema`
- Add `TaskResponsibilitySchema`
- Add `SkillRequirementSchema`
- Update `HumanAgentPairSchema` to use new structure
- Add `RESPONSIBILITY_PRESETS` constant
- Add `RESPONSIBILITY_PHASE_METADATA` constant
- Update helper functions

**Files affected:**
- `src/lib/schemas/hap.ts` - Complete rewrite

### Step 1.2: Create Skill Requirement Schema (`src/lib/schemas/skill-requirement.ts`)

**New file with:**
- `SkillRequirementSchema`
- `SkillGenerationContextSchema`
- Helper functions for requirement management
- Status enums and metadata

---

## Phase 2: Store Updates

### Step 2.1: Update HAP Store (`src/stores/hap.ts`)

**Changes:**
- Update state types to use new schemas
- Remove As-Is/To-Be related state
- Add skill requirements queue state
- Add actions for phase assignment
- Add actions for preset application
- Add actions for skill requirement management
- Update computed selectors

**Key new actions:**
```typescript
setPhaseOwner(taskId: string, phase: ResponsibilityPhase, owner: PhaseOwner)
applyPreset(taskId: string, preset: ResponsibilityPreset)
createSkillRequirement(taskId: string, phase: ResponsibilityPhase)
updateSkillRequirementStatus(requirementId: string, status: SkillRequirementStatus)
```

---

## Phase 3: Component Updates

### Step 3.1: Remove Old Components

**Delete:**
- `src/components/hap/transformation-bar.tsx` - Replaced by phase grid

### Step 3.2: Create New Components

**New files:**

1. `src/components/hap/phase-assignment-grid.tsx`
   - 4-column grid (Manage/Define/Perform/Review)
   - Human/Agent toggle for each cell
   - Skill status indicator (linked/missing/generating)
   - Actions (Generate Skill, Link Existing)

2. `src/components/hap/preset-selector.tsx`
   - Quick preset buttons
   - Visual preview of each preset pattern (HHHH, AAAA, etc.)
   - Apply preset to single task or all tasks

3. `src/components/hap/skill-requirement-card.tsx`
   - Single skill requirement display
   - Status badge
   - Actions (Generate, Link, Dismiss)
   - Generated skill preview

4. `src/components/hap/skill-requirements-queue.tsx`
   - List of pending requirements
   - Filtering by HAP, agent, status
   - Bulk actions

5. `src/components/hap/phase-owner-toggle.tsx`
   - Reusable Human/Agent toggle component
   - Shows skill status when Agent selected

### Step 3.3: Update Existing Components

**Files to update:**

1. `src/components/hap/export-panel.tsx`
   - Update export format to use new schema
   - Include phase assignments in export

2. `src/components/hap/ownership-chart.tsx`
   - Change from human/agent/shared percentages
   - Show phase distribution instead

3. `src/components/hap/progress-ring.tsx`
   - Update to show integration status
   - Show skills pending vs ready

4. `src/components/hap/status-badge.tsx`
   - Update status values to new integration statuses

5. `src/components/hap/transition-timeline.tsx`
   - Repurpose for skill requirement timeline
   - Or remove if no longer needed

---

## Phase 4: Page Updates

### Step 4.1: HAP Detail Page (`src/app/organization/haps/[id]/page.tsx`)

**Changes:**
- Replace As-Is/To-Be tabs with:
  - "Responsibilities" tab - Phase assignment grid
  - "Skill Queue" tab - Pending skill requirements
  - "Details" tab - Notes, status, metadata
- Update overview cards for new metrics
- Add preset selector

### Step 4.2: HAP Creation Wizard (`src/app/organization/haps/new/page.tsx`)

**Changes:**
- Update Step 4 (Task Assignments) to use phase grid
- Add preset selector in task assignment step
- Remove As-Is/To-Be concepts from UI copy
- Show skill requirements summary before creation

### Step 4.3: HAP List Page (`src/app/organization/haps/page.tsx`)

**Changes:**
- Update list items to show integration status
- Add skill requirements count badge
- Update filters for new statuses

### Step 4.4: Organization Overview (`src/app/organization/page.tsx`)

**Changes:**
- Update HAP summary metrics
- Show organization-wide skill queue depth

### Step 4.5: Department Page (`src/app/organization/departments/[id]/page.tsx`)

**Changes:**
- Update HAP summary display
- Show department skill requirements

---

## Phase 5: Service Layer

### Step 5.1: Update Mock Data (`src/services/mock-hap-data.ts`)

**Changes:**
- Migrate mock HAPs to new schema
- Add mock skill requirements
- Update generator functions

### Step 5.2: Create Skill Generation Service (`src/services/skill-generation.ts`)

**New file with:**
- `generateSkillFromRequirement(requirement: SkillRequirement): Promise<Skill>`
- LLM prompt templates
- Context building functions
- Response parsing

### Step 5.3: Create Migration Utility (`src/lib/utils/hap-migration.ts`)

**New file with:**
- `migrateTaskAssignment(old: OldTaskAssignment): TaskResponsibility`
- `migrateHAP(old: OldHAP): HumanAgentPair`
- Batch migration functions

---

## Phase 6: API Routes (if needed)

### Step 6.1: Skill Requirements API

**New routes:**
- `GET /api/skill-requirements` - List requirements
- `POST /api/skill-requirements/:id/generate` - Trigger LLM generation
- `PUT /api/skill-requirements/:id` - Update status
- `POST /api/skill-requirements/:id/apply` - Apply to Agent Story

---

## Phase 7: Testing & Cleanup

### Step 7.1: Update Tests
- Update any existing tests for HAP schemas
- Add tests for new schemas and utilities
- Add tests for phase assignment logic

### Step 7.2: Cleanup
- Remove unused As-Is/To-Be related code
- Update TypeScript types across codebase
- Update any documentation

---

## Implementation Order

Execute in this order to maintain working state:

1. **Schema updates** (Step 1.1, 1.2) - Foundation
2. **Store updates** (Step 2.1) - State management
3. **New components** (Step 3.2) - UI building blocks
4. **Update components** (Step 3.3) - Adapt existing
5. **Remove old components** (Step 3.1) - Cleanup
6. **Page updates** (Step 4.x) - Wire everything together
7. **Service layer** (Step 5.x) - Backend logic
8. **Testing & cleanup** (Step 7.x) - Polish

---

## Files Summary

### Files to Create
- `src/lib/schemas/skill-requirement.ts`
- `src/components/hap/phase-assignment-grid.tsx`
- `src/components/hap/preset-selector.tsx`
- `src/components/hap/skill-requirement-card.tsx`
- `src/components/hap/skill-requirements-queue.tsx`
- `src/components/hap/phase-owner-toggle.tsx`
- `src/services/skill-generation.ts`
- `src/lib/utils/hap-migration.ts`

### Files to Update
- `src/lib/schemas/hap.ts` (major rewrite)
- `src/stores/hap.ts`
- `src/services/mock-hap-data.ts`
- `src/components/hap/export-panel.tsx`
- `src/components/hap/ownership-chart.tsx`
- `src/components/hap/progress-ring.tsx`
- `src/components/hap/status-badge.tsx`
- `src/app/organization/haps/[id]/page.tsx`
- `src/app/organization/haps/new/page.tsx`
- `src/app/organization/haps/page.tsx`
- `src/app/organization/page.tsx`
- `src/app/organization/departments/[id]/page.tsx`
- `src/components/organization/org-chart.tsx`
- `src/components/organization/org-summary.tsx`
- `src/components/story-editor/linked-haps-section.tsx`

### Files to Delete
- `src/components/hap/transformation-bar.tsx`

---

## Risk Mitigation

1. **Data Migration**: Create migration utilities before updating schemas
2. **Incremental Updates**: Update one page at a time, test between each
3. **Feature Flag**: Consider a feature flag to toggle between old/new model during transition
4. **Backwards Compatibility**: Keep old types temporarily with deprecation notices

---

## Success Criteria

- [ ] All HAPs use new TaskResponsibility schema
- [ ] Phase assignment grid functional for all tasks
- [ ] Presets can be applied to tasks
- [ ] Skill requirements created when agent phases have no linked skill
- [ ] LLM can generate draft skills from requirements
- [ ] Integration status accurately reflects skill readiness
- [ ] Export includes phase assignments
- [ ] No references to As-Is/To-Be remain in codebase
