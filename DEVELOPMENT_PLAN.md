# Agent Story Builder - Development Plan

## Overview

This plan breaks down the development of Agent Story Builder into logical phases. Each phase builds on the previous one, ensuring a working application at each stage.

---

## Phase 1: Foundation & Schema Layer

**Goal:** Set up the project with all Zod schemas and type definitions.

### Tasks:
1. Initialize Next.js 14+ project with TypeScript
2. Install and configure dependencies (Tailwind, shadcn/ui, React Query, Valtio, Zod)
3. Create all Zod schemas in `/lib/schemas/`:
   - `trigger.ts` - Trigger specification schemas
   - `behavior.ts` - Behavior model schemas
   - `reasoning.ts` - Reasoning and decision schemas
   - `tools.ts` - Tools and integrations schemas
   - `skill.ts` - Skills schemas
   - `collaboration.ts` - Human and agent collaboration schemas
   - `memory.ts` - Memory and state schemas
   - `acceptance.ts` - Acceptance criteria schemas
   - `story.ts` - Agent Story Light and Full schemas
   - `template.ts` - Template schemas
   - `user.ts` - User and organization schemas
   - `validation.ts` - Validation utilities
   - `index.ts` - Re-exports

### Deliverable:
- Working Next.js app with complete type system

---

## Phase 2: Database & API Layer

**Goal:** Set up PostgreSQL database and REST API endpoints.

### Tasks:
1. Set up PostgreSQL database connection
2. Create database migrations
3. Implement API routes in `/app/api/`:
   - `stories/` - CRUD operations
   - `templates/` - Template management
   - `export/` - Export endpoints
4. Add authentication scaffolding (NextAuth.js)

### Deliverable:
- Functional API for story management

---

## Phase 3: State Management

**Goal:** Implement Valtio stores and React Query hooks.

### Tasks:
1. Create Valtio stores in `/stores/`:
   - `story-editor.ts` - Story editor state
   - `ui.ts` - UI state (modals, panels)
2. Create React Query hooks in `/lib/hooks/`:
   - `use-story.ts` - Story CRUD operations
   - `use-stories.ts` - Story list operations
   - `use-templates.ts` - Template operations
3. Set up React Query provider

### Deliverable:
- Complete state management layer

---

## Phase 4: Core UI Components

**Goal:** Build the shadcn/ui foundation and core components.

### Tasks:
1. Initialize shadcn/ui with all required components
2. Create base components in `/components/ui/`
3. Create story components in `/components/story/`:
   - `story-canvas.tsx` - Main editing interface
   - `story-card.tsx` - Library card view
   - `story-library.tsx` - Library with filters
   - `trigger-selector.tsx` - Trigger configuration
   - `autonomy-picker.tsx` - Autonomy level selector
   - `collapsible-section.tsx` - Progressive disclosure
   - Format/Autonomy/Trigger badges
4. Create layout components

### Deliverable:
- Reusable component library

---

## Phase 5: Section Editors

**Goal:** Build all structured annotation editors.

### Tasks:
1. Create section editors in `/components/story/editors/`:
   - `trigger-spec-editor.tsx`
   - `behavior-model-editor.tsx`
   - `reasoning-editor.tsx`
   - `memory-editor.tsx`
   - `tools-editor.tsx`
   - `skills-editor.tsx`
   - `human-interaction-editor.tsx`
   - `agent-collab-editor.tsx`
   - `acceptance-criteria-editor.tsx`
2. Add validation and error display
3. Add auto-save functionality

### Deliverable:
- Complete story editing experience

---

## Phase 6: Pages & Navigation

**Goal:** Build all application pages.

### Tasks:
1. Create dashboard layout in `/app/(dashboard)/`
2. Create pages:
   - `/stories` - Story library
   - `/stories/new` - New story creation
   - `/stories/[id]` - Story canvas
   - `/templates` - Template browser
   - `/settings` - User settings
3. Add navigation and routing
4. Add keyboard shortcuts

### Deliverable:
- Complete navigation flow

---

## Phase 7: Template System

**Goal:** Implement template browser and management.

### Tasks:
1. Create template components in `/components/template/`:
   - `template-browser.tsx`
   - `template-card.tsx`
   - `template-preview.tsx`
2. Create built-in templates
3. Implement "Save as Template" flow
4. Add template categories and filtering

### Deliverable:
- Working template system

---

## Phase 8: Export System

**Goal:** Implement Markdown and JSON export.

### Tasks:
1. Create export utilities in `/lib/export/`:
   - `markdown.ts` - Markdown generator
   - `json.ts` - JSON generator
2. Create export UI components
3. Implement bulk export with ZIP
4. Add export options modal

### Deliverable:
- Complete export functionality

---

## Phase 9: Collaboration Basics (Phase 1 MVP)

**Goal:** Implement basic sharing and comments.

### Tasks:
1. Create collaboration components in `/components/collaboration/`:
   - `share-dialog.tsx`
   - `comments-panel.tsx`
   - `comment-thread.tsx`
2. Implement sharing API
3. Implement comments API
4. Add activity history

### Deliverable:
- Basic collaboration features

---

## Phase 10: Polish & Testing

**Goal:** Final polish and quality assurance.

### Tasks:
1. Add loading states and skeletons
2. Add empty states
3. Improve error handling
4. Add accessibility features
5. Performance optimization
6. Write tests
7. Documentation

### Deliverable:
- Production-ready MVP

---

## Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | In Progress | Starting now |
| Phase 2 | Not Started | |
| Phase 3 | Not Started | |
| Phase 4 | Not Started | |
| Phase 5 | Not Started | |
| Phase 6 | Not Started | |
| Phase 7 | Not Started | |
| Phase 8 | Not Started | |
| Phase 9 | Not Started | |
| Phase 10 | Not Started | |

---

## Next Steps

Starting with **Phase 1: Foundation & Schema Layer**
