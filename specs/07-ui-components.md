# UI Components Specification

## Overview

This specification defines the component architecture for Agent Story Builder, built on shadcn/ui with Tailwind CSS. Components follow atomic design principles and prioritize accessibility.

The UI is organized around the **skill-based architecture**:
- **Agent Canvas**: Edit agent identity + agent-level configuration
- **Skill Editor**: Full editing interface for individual skills
- **Skill List**: Manage the collection of skills an agent possesses

---

## Component Organization

```
/components
  /ui                    # shadcn/ui base components
    button.tsx
    input.tsx
    select.tsx
    dialog.tsx
    ...
  /story                 # Agent story components
    story-canvas.tsx     # Main agent editing interface
    story-card.tsx       # Card for story library
    story-library.tsx    # Library grid/list view
    agent-identity.tsx   # Identity section editor
    autonomy-picker.tsx  # Autonomy level selector
    ...
  /skill                 # Skill editing components
    skill-list.tsx       # List of skills with add/remove
    skill-card.tsx       # Skill summary card
    skill-editor.tsx     # Full skill editing interface
    skill-trigger.tsx    # Trigger configuration
    skill-tools.tsx      # Tools configuration
    skill-behavior.tsx   # Behavior model editor
    skill-reasoning.tsx  # Reasoning configuration
    skill-acceptance.tsx # Acceptance criteria editor
    skill-failure.tsx    # Failure handling editor
    skill-guardrails.tsx # Skill guardrails editor
    skill-io.tsx         # Inputs/outputs editor
    ...
  /template              # Template components
    template-browser.tsx
    template-card.tsx
    template-preview.tsx
    skill-template-browser.tsx
    ...
  /collaboration         # Collaboration components
    comments-panel.tsx
    comment-thread.tsx
    share-dialog.tsx
    activity-log.tsx
    ...
  /layout                # Layout components
    header.tsx
    sidebar.tsx
    page-container.tsx
    ...
  /common                # Shared components
    loading-spinner.tsx
    empty-state.tsx
    error-boundary.tsx
    collapsible-section.tsx
    ...
```

---

## Design Tokens

### Colors

Using Tailwind CSS with shadcn/ui theme:

```css
/* tailwind.config.js theme extension */
{
  colors: {
    /* Autonomy level colors */
    autonomy: {
      full: {
        DEFAULT: '#10B981',      /* emerald-500 */
        light: '#D1FAE5',        /* emerald-100 */
      },
      supervised: {
        DEFAULT: '#3B82F6',      /* blue-500 */
        light: '#DBEAFE',        /* blue-100 */
      },
      collaborative: {
        DEFAULT: '#8B5CF6',      /* violet-500 */
        light: '#EDE9FE',        /* violet-100 */
      },
      directed: {
        DEFAULT: '#F59E0B',      /* amber-500 */
        light: '#FEF3C7',        /* amber-100 */
      }
    },
    /* Story format colors */
    format: {
      light: {
        DEFAULT: '#6366F1',      /* indigo-500 */
        bg: '#EEF2FF',           /* indigo-50 */
      },
      full: {
        DEFAULT: '#EC4899',      /* pink-500 */
        bg: '#FDF2F8',           /* pink-50 */
      }
    },
    /* Trigger type colors */
    trigger: {
      message: '#06B6D4',        /* cyan-500 */
      resource_change: '#F97316', /* orange-500 */
      schedule: '#84CC16',       /* lime-500 */
      cascade: '#A855F7',        /* purple-500 */
      manual: '#64748B',         /* slate-500 */
      condition: '#EAB308',      /* yellow-500 */
    },
    /* Behavior model colors */
    behavior: {
      sequential: '#3B82F6',     /* blue-500 */
      workflow: '#8B5CF6',       /* violet-500 */
      adaptive: '#10B981',       /* emerald-500 */
      iterative: '#F59E0B',      /* amber-500 */
    }
  }
}
```

### Typography

```css
/* Font sizes aligned with Tailwind defaults */
.text-story-label    { @apply text-xs font-medium uppercase tracking-wide text-muted-foreground; }
.text-story-role     { @apply text-2xl font-semibold leading-tight; }
.text-story-body     { @apply text-base leading-relaxed; }
.text-story-meta     { @apply text-sm text-muted-foreground; }
```

### Spacing

All spacing uses Tailwind's default scale (4px base).

---

## Core Components

### StoryCanvas

The main agent story editing interface. In Full format, shows agent identity at top with skills below.

```tsx
// /components/story/story-canvas.tsx

interface StoryCanvasProps {
  storyId: string;
  mode?: 'edit' | 'view';
  onSave?: () => void;
}

export function StoryCanvas({ storyId, mode = 'edit', onSave }: StoryCanvasProps) {
  const { story, isLoading, updateField, save } = useStoryEditor(storyId);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);

  if (isLoading) return <StoryCanvasSkeleton />;
  if (!story) return <StoryNotFound />;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <StoryHeader story={story} mode={mode} onSave={save} />

      {/* Light Format: Simple capability statement */}
      {story.format === 'light' && (
        <LightFormatEditor story={story} updateField={updateField} mode={mode} />
      )}

      {/* Full Format: Agent identity + Skills */}
      {story.format === 'full' && (
        <div className="mt-8 grid grid-cols-[1fr_320px] gap-8">
          {/* Main content area */}
          <div className="space-y-6">
            {/* Agent Identity Section */}
            <section className="p-6 bg-card rounded-lg border shadow-sm">
              <h2 className="text-story-label mb-6">Agent Identity</h2>
              <AgentIdentityEditor
                story={story}
                updateField={updateField}
                mode={mode}
              />
            </section>

            {/* Active Skill Editor or Skill List */}
            {activeSkillId ? (
              <SkillEditor
                skill={story.skills.find(s => s.id === activeSkillId)!}
                onChange={(updated) => updateSkill(activeSkillId, updated)}
                onClose={() => setActiveSkillId(null)}
                mode={mode}
              />
            ) : (
              <SkillList
                skills={story.skills}
                onSelect={setActiveSkillId}
                onAdd={() => addSkill()}
                onRemove={(id) => removeSkill(id)}
                mode={mode}
              />
            )}
          </div>

          {/* Right sidebar: Agent-level config */}
          <aside className="space-y-4">
            <CollapsibleSection id="humanInteraction" title="Human Interaction" optional>
              <AgentHumanInteractionEditor
                value={story.humanInteraction}
                onChange={(v) => updateField('humanInteraction', v)}
                disabled={mode === 'view'}
              />
            </CollapsibleSection>

            <CollapsibleSection id="collaboration" title="Agent Collaboration" optional>
              <AgentCollaborationEditor
                value={story.collaboration}
                onChange={(v) => updateField('collaboration', v)}
                disabled={mode === 'view'}
              />
            </CollapsibleSection>

            <CollapsibleSection id="memory" title="Memory & State" optional>
              <AgentMemoryEditor
                value={story.memory}
                onChange={(v) => updateField('memory', v)}
                disabled={mode === 'view'}
              />
            </CollapsibleSection>

            <CollapsibleSection id="guardrails" title="Agent Guardrails" optional>
              <AgentGuardrailsEditor
                value={story.guardrails}
                onChange={(v) => updateField('guardrails', v)}
                disabled={mode === 'view'}
              />
            </CollapsibleSection>
          </aside>
        </div>
      )}
    </div>
  );
}
```

---

### SkillList

Displays all skills for an agent with ability to add, remove, reorder.

```tsx
// /components/skill/skill-list.tsx

interface SkillListProps {
  skills: Skill[];
  onSelect: (skillId: string) => void;
  onAdd: () => void;
  onRemove: (skillId: string) => void;
  mode?: 'edit' | 'view';
}

export function SkillList({ skills, onSelect, onAdd, onRemove, mode }: SkillListProps) {
  return (
    <section className="p-6 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-story-label">Skills ({skills.length})</h2>
        {mode === 'edit' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openSkillTemplates()}>
              <Library className="w-4 h-4 mr-2" />
              From Template
            </Button>
            <Button size="sm" onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </div>
        )}
      </div>

      {skills.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No skills defined"
          description="Skills are the capabilities your agent possesses. Add at least one skill to define what your agent can do."
          action={
            mode === 'edit' && (
              <Button onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Skill
              </Button>
            )
          }
          size="sm"
        />
      ) : (
        <div className="space-y-3">
          {skills.map((skill, index) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              index={index}
              onClick={() => onSelect(skill.id!)}
              onRemove={mode === 'edit' ? () => onRemove(skill.id!) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

---

### SkillCard

Summary card for a skill in the list.

```tsx
// /components/skill/skill-card.tsx

interface SkillCardProps {
  skill: Skill;
  index: number;
  onClick: () => void;
  onRemove?: () => void;
}

export function SkillCard({ skill, index, onClick, onRemove }: SkillCardProps) {
  const triggerCount = skill.triggers?.length ?? 0;
  const toolCount = skill.tools?.length ?? 0;

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
        "hover:bg-muted/50 hover:border-primary/30"
      )}
      onClick={onClick}
    >
      {/* Index badge */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm shrink-0">
        {index + 1}
      </div>

      {/* Skill info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{skill.name}</h3>
          <Badge variant="outline" className="text-xs shrink-0">
            {skill.domain}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {skill.description}
        </p>

        {/* Skill metadata */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {triggerCount} trigger{triggerCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            {toolCount} tool{toolCount !== 1 ? 's' : ''}
          </span>
          {skill.behavior && (
            <BehaviorBadge model={skill.behavior.model} />
          )}
          <SkillAcquisitionBadge type={skill.acquired} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <Edit className="w-4 h-4" />
        </Button>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

### SkillEditor

Full editing interface for a single skill. This is the most complex component.

```tsx
// /components/skill/skill-editor.tsx

interface SkillEditorProps {
  skill: Skill;
  onChange: (skill: Skill) => void;
  onClose: () => void;
  mode?: 'edit' | 'view';
}

export function SkillEditor({ skill, onChange, onClose, mode }: SkillEditorProps) {
  const updateField = <K extends keyof Skill>(field: K, value: Skill[K]) => {
    onChange({ ...skill, [field]: value });
  };

  return (
    <section className="bg-card rounded-lg border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{skill.name || 'New Skill'}</h2>
            <p className="text-sm text-muted-foreground">{skill.domain || 'Uncategorized'}</p>
          </div>
        </div>
        <SkillValidationStatus skill={skill} />
      </div>

      {/* Skill content */}
      <div className="p-6 space-y-8">
        {/* Identity */}
        <div className="space-y-4">
          <h3 className="text-story-label">Skill Identity</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name" required>
              <Input
                value={skill.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Request Classification"
                disabled={mode === 'view'}
              />
            </FormField>
            <FormField label="Domain" required>
              <Input
                value={skill.domain}
                onChange={(e) => updateField('domain', e.target.value)}
                placeholder="e.g., Natural Language Understanding"
                disabled={mode === 'view'}
              />
            </FormField>
          </div>
          <FormField label="Description" required>
            <Textarea
              value={skill.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="What does this skill do?"
              rows={2}
              disabled={mode === 'view'}
            />
          </FormField>
          <FormField label="Acquisition">
            <SkillAcquisitionPicker
              value={skill.acquired}
              onChange={(v) => updateField('acquired', v)}
              disabled={mode === 'view'}
            />
          </FormField>
        </div>

        <Separator />

        {/* Triggers - When does this skill activate? */}
        <CollapsibleSection id="triggers" title="Triggers" badge={`${skill.triggers?.length ?? 0}`}>
          <SkillTriggersEditor
            value={skill.triggers}
            onChange={(v) => updateField('triggers', v)}
            disabled={mode === 'view'}
          />
        </CollapsibleSection>

        {/* Inputs/Outputs */}
        <CollapsibleSection id="interface" title="Inputs & Outputs" optional>
          <SkillIOEditor
            inputs={skill.inputs}
            outputs={skill.outputs}
            onInputsChange={(v) => updateField('inputs', v)}
            onOutputsChange={(v) => updateField('outputs', v)}
            disabled={mode === 'view'}
          />
        </CollapsibleSection>

        {/* Tools */}
        <CollapsibleSection id="tools" title="Tools" optional badge={`${skill.tools?.length ?? 0}`}>
          <SkillToolsEditor
            value={skill.tools}
            onChange={(v) => updateField('tools', v)}
            disabled={mode === 'view'}
          />
        </CollapsibleSection>

        {/* Behavior */}
        <CollapsibleSection id="behavior" title="Behavior Model" optional>
          <SkillBehaviorEditor
            value={skill.behavior}
            onChange={(v) => updateField('behavior', v)}
            disabled={mode === 'view'}
          />
        </CollapsibleSection>

        {/* Reasoning */}
        <CollapsibleSection id="reasoning" title="Reasoning & Decisions" optional>
          <SkillReasoningEditor
            value={skill.reasoning}
            onChange={(v) => updateField('reasoning', v)}
            disabled={mode === 'view'}
          />
        </CollapsibleSection>

        {/* Acceptance Criteria */}
        <CollapsibleSection id="acceptance" title="Acceptance Criteria" required>
          <SkillAcceptanceEditor
            value={skill.acceptance}
            onChange={(v) => updateField('acceptance', v)}
            disabled={mode === 'view'}
          />
        </CollapsibleSection>

        {/* Failure Handling */}
        <CollapsibleSection id="failure" title="Failure Handling" optional>
          <SkillFailureEditor
            value={skill.failureHandling}
            onChange={(v) => updateField('failureHandling', v)}
            disabled={mode === 'view'}
          />
        </CollapsibleSection>

        {/* Guardrails */}
        <CollapsibleSection id="guardrails" title="Guardrails" optional badge={`${skill.guardrails?.length ?? 0}`}>
          <SkillGuardrailsEditor
            value={skill.guardrails}
            onChange={(v) => updateField('guardrails', v)}
            disabled={mode === 'view'}
          />
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t bg-muted/50">
        <Button variant="outline" onClick={onClose}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Skills
        </Button>
        {mode === 'edit' && (
          <Button onClick={() => onChange(skill)}>
            Save Skill
          </Button>
        )}
      </div>
    </section>
  );
}
```

---

### SkillTriggersEditor

Editor for skill trigger configuration.

```tsx
// /components/skill/skill-trigger.tsx

interface SkillTriggersEditorProps {
  value: SkillTrigger[] | undefined;
  onChange: (triggers: SkillTrigger[]) => void;
  disabled?: boolean;
}

export function SkillTriggersEditor({ value = [], onChange, disabled }: SkillTriggersEditorProps) {
  const addTrigger = () => {
    onChange([...value, { type: 'manual', description: '' }]);
  };

  const updateTrigger = (index: number, trigger: SkillTrigger) => {
    const updated = [...value];
    updated[index] = trigger;
    onChange(updated);
  };

  const removeTrigger = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define when this skill activates. A skill must have at least one trigger.
      </p>

      {value.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No triggers"
          description="Add a trigger to define when this skill activates"
          action={!disabled && <Button size="sm" onClick={addTrigger}>Add Trigger</Button>}
          size="sm"
        />
      ) : (
        <div className="space-y-4">
          {value.map((trigger, index) => (
            <TriggerItem
              key={index}
              trigger={trigger}
              onChange={(t) => updateTrigger(index, t)}
              onRemove={() => removeTrigger(index)}
              disabled={disabled}
              canRemove={value.length > 1}
            />
          ))}
        </div>
      )}

      {!disabled && value.length > 0 && (
        <Button variant="outline" size="sm" onClick={addTrigger}>
          <Plus className="w-4 h-4 mr-2" />
          Add Another Trigger
        </Button>
      )}
    </div>
  );
}

interface TriggerItemProps {
  trigger: SkillTrigger;
  onChange: (trigger: SkillTrigger) => void;
  onRemove: () => void;
  disabled?: boolean;
  canRemove?: boolean;
}

function TriggerItem({ trigger, onChange, onRemove, disabled, canRemove }: TriggerItemProps) {
  return (
    <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <TriggerTypeIcon type={trigger.type} className="w-5 h-5" />
          <Select
            value={trigger.type}
            onValueChange={(type) => onChange({ ...trigger, type: type as TriggerType })}
            disabled={disabled}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <TriggerTypeIcon type={type.value} className="w-4 h-4" />
                    {type.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canRemove && !disabled && (
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <FormField label="Description" required>
        <Input
          value={trigger.description}
          onChange={(e) => onChange({ ...trigger, description: e.target.value })}
          placeholder="When does this trigger fire?"
          disabled={disabled}
        />
      </FormField>

      <FormField label="Conditions" description="Guard conditions that must be true">
        <TagInput
          value={trigger.conditions ?? []}
          onChange={(conditions) => onChange({ ...trigger, conditions })}
          placeholder="Add condition..."
          disabled={disabled}
        />
      </FormField>

      <FormField label="Examples" description="Concrete examples of triggering events">
        <TagInput
          value={trigger.examples ?? []}
          onChange={(examples) => onChange({ ...trigger, examples })}
          placeholder="Add example..."
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}
```

---

### SkillToolsEditor

Editor for skill tool declarations.

```tsx
// /components/skill/skill-tools.tsx

interface SkillToolsEditorProps {
  value: SkillTool[] | undefined;
  onChange: (tools: SkillTool[]) => void;
  disabled?: boolean;
}

export function SkillToolsEditor({ value = [], onChange, disabled }: SkillToolsEditorProps) {
  const addTool = () => {
    onChange([...value, { name: '', purpose: '', permissions: ['read'], required: true }]);
  };

  const updateTool = (index: number, tool: SkillTool) => {
    const updated = [...value];
    updated[index] = tool;
    onChange(updated);
  };

  const removeTool = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Declare the tools (MCP servers, APIs, databases) this skill needs to execute.
      </p>

      {value.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No tools"
          description="This skill doesn't require any external tools"
          action={!disabled && <Button size="sm" onClick={addTool}>Add Tool</Button>}
          size="sm"
        />
      ) : (
        <div className="space-y-4">
          {value.map((tool, index) => (
            <ToolItem
              key={index}
              tool={tool}
              onChange={(t) => updateTool(index, t)}
              onRemove={() => removeTool(index)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {!disabled && value.length > 0 && (
        <Button variant="outline" size="sm" onClick={addTool}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tool
        </Button>
      )}
    </div>
  );
}

interface ToolItemProps {
  tool: SkillTool;
  onChange: (tool: SkillTool) => void;
  onRemove: () => void;
  disabled?: boolean;
}

function ToolItem({ tool, onChange, onRemove, disabled }: ToolItemProps) {
  return (
    <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">{tool.name || 'New Tool'}</span>
          {tool.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
        </div>

        {!disabled && (
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Name" required>
          <Input
            value={tool.name}
            onChange={(e) => onChange({ ...tool, name: e.target.value })}
            placeholder="e.g., Customer Database MCP"
            disabled={disabled}
          />
        </FormField>

        <FormField label="Permissions" required>
          <MultiSelect
            value={tool.permissions}
            onChange={(permissions) => onChange({ ...tool, permissions: permissions as ToolPermission[] })}
            options={PERMISSION_OPTIONS}
            disabled={disabled}
          />
        </FormField>
      </div>

      <FormField label="Purpose" required>
        <Input
          value={tool.purpose}
          onChange={(e) => onChange({ ...tool, purpose: e.target.value })}
          placeholder="Why does this skill use this tool?"
          disabled={disabled}
        />
      </FormField>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`required-${tool.name}`}
            checked={tool.required}
            onCheckedChange={(checked) => onChange({ ...tool, required: !!checked })}
            disabled={disabled}
          />
          <Label htmlFor={`required-${tool.name}`} className="text-sm">
            Required for skill execution
          </Label>
        </div>
      </div>

      {!tool.required && (
        <FormField label="Conditions" description="When is this optional tool used?">
          <Input
            value={tool.conditions ?? ''}
            onChange={(e) => onChange({ ...tool, conditions: e.target.value })}
            placeholder="e.g., Only for VIP customers"
            disabled={disabled}
          />
        </FormField>
      )}
    </div>
  );
}
```

---

### SkillBehaviorEditor

Editor for skill behavior model.

```tsx
// /components/skill/skill-behavior.tsx

interface SkillBehaviorEditorProps {
  value: SkillBehavior | undefined;
  onChange: (behavior: SkillBehavior | undefined) => void;
  disabled?: boolean;
}

export function SkillBehaviorEditor({ value, onChange, disabled }: SkillBehaviorEditorProps) {
  const [enabled, setEnabled] = useState(!!value);

  const handleModelChange = (model: BehaviorModel) => {
    switch (model) {
      case 'sequential':
        onChange({ model: 'sequential', steps: [''] });
        break;
      case 'workflow':
        onChange({ model: 'workflow', stages: [{ name: '', purpose: '' }] });
        break;
      case 'adaptive':
        onChange({ model: 'adaptive', capabilities: [''] });
        break;
      case 'iterative':
        onChange({ model: 'iterative', body: [''], terminationCondition: '' });
        break;
    }
  };

  if (!enabled) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-4">
          Define how this skill executes - its internal workflow or approach
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setEnabled(true);
            handleModelChange('sequential');
          }}
          disabled={disabled}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Behavior Model
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model selector */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Behavior Model</Label>
        <RadioGroup
          value={value?.model}
          onValueChange={handleModelChange}
          className="flex gap-4"
          disabled={disabled}
        >
          {BEHAVIOR_MODELS.map(model => (
            <div key={model.value} className="flex items-center gap-2">
              <RadioGroupItem value={model.value} id={`behavior-${model.value}`} />
              <Label htmlFor={`behavior-${model.value}`} className="flex items-center gap-1 cursor-pointer">
                <BehaviorIcon model={model.value} className="w-4 h-4" />
                {model.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Model-specific editor */}
      {value?.model === 'sequential' && (
        <SequentialBehaviorEditor
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {value?.model === 'workflow' && (
        <WorkflowBehaviorEditor
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {value?.model === 'adaptive' && (
        <AdaptiveBehaviorEditor
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      {value?.model === 'iterative' && (
        <IterativeBehaviorEditor
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {!disabled && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => {
            setEnabled(false);
            onChange(undefined);
          }}
        >
          Remove Behavior Model
        </Button>
      )}
    </div>
  );
}
```

---

### SkillAcceptanceEditor

Editor for skill acceptance criteria.

```tsx
// /components/skill/skill-acceptance.tsx

interface SkillAcceptanceEditorProps {
  value: SkillAcceptanceCriteria | undefined;
  onChange: (acceptance: SkillAcceptanceCriteria) => void;
  disabled?: boolean;
}

export function SkillAcceptanceEditor({ value, onChange, disabled }: SkillAcceptanceEditorProps) {
  const criteria = value ?? { successConditions: [] };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Define what "done" looks like for this skill. At least one success condition is required.
      </p>

      {/* Success Conditions */}
      <FormField label="Success Conditions" required description="What must be true for this skill to be considered successful?">
        <TagInput
          value={criteria.successConditions}
          onChange={(successConditions) => onChange({ ...criteria, successConditions })}
          placeholder="Add success condition..."
          disabled={disabled}
          allowMultiLine
        />
      </FormField>

      {/* Quality Metrics */}
      <FormField label="Quality Metrics" description="Measurable performance targets">
        <QualityMetricsEditor
          value={criteria.qualityMetrics ?? []}
          onChange={(qualityMetrics) => onChange({ ...criteria, qualityMetrics })}
          disabled={disabled}
        />
      </FormField>

      {/* Timeout */}
      <FormField label="Timeout" description="Maximum execution time for this skill">
        <Input
          value={criteria.timeout ?? ''}
          onChange={(e) => onChange({ ...criteria, timeout: e.target.value || undefined })}
          placeholder="e.g., 30 seconds, 5 minutes"
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}

function QualityMetricsEditor({
  value,
  onChange,
  disabled
}: {
  value: Array<{ name: string; target: string; measurement?: string }>;
  onChange: (metrics: typeof value) => void;
  disabled?: boolean;
}) {
  const addMetric = () => {
    onChange([...value, { name: '', target: '' }]);
  };

  const updateMetric = (index: number, metric: typeof value[0]) => {
    const updated = [...value];
    updated[index] = metric;
    onChange(updated);
  };

  const removeMetric = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {value.map((metric, index) => (
        <div key={index} className="flex items-start gap-2">
          <Input
            value={metric.name}
            onChange={(e) => updateMetric(index, { ...metric, name: e.target.value })}
            placeholder="Metric name"
            className="w-1/3"
            disabled={disabled}
          />
          <Input
            value={metric.target}
            onChange={(e) => updateMetric(index, { ...metric, target: e.target.value })}
            placeholder="Target (e.g., >= 95%)"
            className="flex-1"
            disabled={disabled}
          />
          {!disabled && (
            <Button variant="ghost" size="icon" onClick={() => removeMetric(index)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}

      {!disabled && (
        <Button variant="outline" size="sm" onClick={addMetric}>
          <Plus className="w-4 h-4 mr-2" />
          Add Metric
        </Button>
      )}
    </div>
  );
}
```

---

### AgentIdentityEditor

Editor for agent-level identity fields.

```tsx
// /components/story/agent-identity.tsx

interface AgentIdentityEditorProps {
  story: AgentStoryFull;
  updateField: <K extends keyof AgentStoryFull>(field: K, value: AgentStoryFull[K]) => void;
  mode?: 'edit' | 'view';
}

export function AgentIdentityEditor({ story, updateField, mode }: AgentIdentityEditorProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Identifier" required description="Unique machine-readable ID">
          <Input
            value={story.identifier}
            onChange={(e) => updateField('identifier', e.target.value)}
            placeholder="e.g., support-router"
            disabled={mode === 'view'}
          />
        </FormField>

        <FormField label="Name" required>
          <Input
            value={story.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Support Request Router"
            disabled={mode === 'view'}
          />
        </FormField>
      </div>

      <FormField label="Role" required description="What role does this agent play?">
        <Input
          value={story.role}
          onChange={(e) => updateField('role', e.target.value)}
          placeholder="e.g., Customer Support Triage Agent"
          disabled={mode === 'view'}
        />
      </FormField>

      <FormField label="Purpose" required description="Why does this agent exist?">
        <Textarea
          value={story.purpose}
          onChange={(e) => updateField('purpose', e.target.value)}
          placeholder="e.g., Ensure support requests reach the right team quickly with full context"
          rows={2}
          disabled={mode === 'view'}
        />
      </FormField>

      <AutonomyPicker
        value={story.autonomyLevel}
        onChange={(v) => updateField('autonomyLevel', v)}
        disabled={mode === 'view'}
      />
    </div>
  );
}
```

---

### AutonomyPicker

Autonomy level selector with descriptions.

```tsx
// /components/story/autonomy-picker.tsx

interface AutonomyPickerProps {
  value: AutonomyLevel;
  onChange: (level: AutonomyLevel) => void;
  disabled?: boolean;
}

export function AutonomyPicker({ value, onChange, disabled }: AutonomyPickerProps) {
  return (
    <div className="space-y-4">
      <Label className="text-story-label">Autonomy Level</Label>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className="grid grid-cols-2 gap-4"
      >
        {AUTONOMY_LEVELS.map(level => (
          <div key={level.value} className="relative">
            <RadioGroupItem
              value={level.value}
              id={`autonomy-${level.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`autonomy-${level.value}`}
              className={cn(
                "flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                "hover:border-primary/50",
                "peer-checked:border-primary peer-checked:bg-primary/5",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <AutonomyIcon level={level.value} className="w-5 h-5" />
                <span className="font-medium">{level.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {level.description}
              </p>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* Selected level details */}
      <div className={cn(
        "p-4 rounded-lg",
        `bg-autonomy-${value}-light/50`
      )}>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Human Involvement</dt>
            <dd className="mt-1">{AUTONOMY_LEVEL_METADATA[value].humanInvolvement}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Agent Authority</dt>
            <dd className="mt-1">{AUTONOMY_LEVEL_METADATA[value].agentAuthority}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
```

---

### CollapsibleSection

Expandable section for progressive disclosure.

```tsx
// /components/common/collapsible-section.tsx

interface CollapsibleSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  optional?: boolean;
  required?: boolean;
  badge?: string;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  id,
  title,
  children,
  optional = false,
  required = false,
  badge,
  defaultOpen = false
}: CollapsibleSectionProps) {
  const { expandedSections, toggleSection } = useEditorStore();
  const isOpen = expandedSections.has(id);

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleSection(id)}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-lg border",
            "hover:bg-muted/50 transition-colors",
            isOpen && "bg-muted/50 border-primary/30"
          )}
        >
          <div className="flex items-center gap-3">
            <ChevronRight
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isOpen && "rotate-90"
              )}
            />
            <span className="font-medium">{title}</span>
            {optional && (
              <Badge variant="outline" className="text-xs">Optional</Badge>
            )}
            {required && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
            {badge && (
              <Badge className="text-xs">{badge}</Badge>
            )}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="p-6 border border-t-0 rounded-b-lg">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

### StoryCard

Card component for story library grid view.

```tsx
// /components/story/story-card.tsx

interface StoryCardProps {
  story: AgentStory;
  onSelect?: () => void;
  selected?: boolean;
}

export function StoryCard({ story, onSelect, selected }: StoryCardProps) {
  const router = useRouter();
  const skillCount = story.format === 'full' ? story.skills?.length ?? 0 : 0;

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => router.push(`/stories/${story.id}`)}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 left-4"
        />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{story.name}</CardTitle>
            <code className="text-sm text-muted-foreground">{story.identifier}</code>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FormatBadge format={story.format} />
            <StoryCardMenu story={story} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {story.role}
        </p>

        <div className="mt-4 flex items-center gap-4">
          <AutonomyBadge level={story.autonomyLevel} />
          {story.format === 'full' && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {skillCount} skill{skillCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Updated {formatRelativeTime(story.updatedAt)}
      </CardFooter>
    </Card>
  );
}
```

---

### Skill Template Browser

Browser for selecting skill templates.

```tsx
// /components/template/skill-template-browser.tsx

interface SkillTemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (skill: Skill) => void;
}

export function SkillTemplateBrowser({ isOpen, onClose, onSelect }: SkillTemplateBrowserProps) {
  const [domain, setDomain] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const [previewSkill, setPreviewSkill] = useState<SkillTemplate | null>(null);

  const { data: templates, isLoading } = useSkillTemplates({ domain, search });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Skill from Template</DialogTitle>
          <DialogDescription>
            Choose a pre-built skill to add to your agent
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search and filters */}
          <div className="flex items-center gap-4 mb-4">
            <SearchInput
              placeholder="Search skills..."
              value={search}
              onChange={setSearch}
              className="flex-1"
            />
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {SKILL_DOMAINS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill template grid */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <SkillTemplateGridSkeleton />
            ) : templates?.length === 0 ? (
              <EmptyState
                icon={Zap}
                title="No skill templates found"
                description="Try adjusting your search or filters"
                size="sm"
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 p-1">
                {templates?.map(template => (
                  <SkillTemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => setPreviewSkill(template)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Skill preview */}
        {previewSkill && (
          <SkillTemplatePreview
            template={previewSkill}
            isOpen={!!previewSkill}
            onClose={() => setPreviewSkill(null)}
            onSelect={() => {
              onSelect(previewSkill.skillTemplate as Skill);
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Common Patterns

### Loading States

Use Skeleton components for loading states:

```tsx
export function SkillCardSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-4 mt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
```

### Empty States

Consistent empty state component:

```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon: Icon, title, description, action, size = 'md' }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      size === 'sm' && 'py-8',
      size === 'md' && 'py-16',
      size === 'lg' && 'py-24'
    )}>
      <div className="rounded-full bg-muted p-3 mb-4">
        <Icon className={cn(
          "text-muted-foreground",
          size === 'sm' && 'w-6 h-6',
          size === 'md' && 'w-8 h-8',
          size === 'lg' && 'w-12 h-12'
        )} />
      </div>
      <h3 className={cn(
        "font-medium",
        size === 'sm' && 'text-base',
        size === 'md' && 'text-lg',
        size === 'lg' && 'text-xl'
      )}>{title}</h3>
      <p className={cn(
        "text-muted-foreground mt-1 max-w-md",
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base'
      )}>{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

### Form Fields

Consistent form field wrapper:

```tsx
interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, description, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
```

---

## Badges and Indicators

### BehaviorBadge

```tsx
interface BehaviorBadgeProps {
  model: BehaviorModel;
}

export function BehaviorBadge({ model }: BehaviorBadgeProps) {
  const config = BEHAVIOR_MODELS.find(b => b.value === model);

  return (
    <Badge
      variant="outline"
      className={cn("text-xs", `border-behavior-${model}/50 text-behavior-${model}`)}
    >
      <BehaviorIcon model={model} className="w-3 h-3 mr-1" />
      {config?.label}
    </Badge>
  );
}
```

### SkillAcquisitionBadge

```tsx
interface SkillAcquisitionBadgeProps {
  type: SkillAcquisition;
}

export function SkillAcquisitionBadge({ type }: SkillAcquisitionBadgeProps) {
  const config = ACQUISITION_TYPES.find(a => a.value === type);

  return (
    <Badge variant="outline" className="text-xs">
      {config?.icon && <config.icon className="w-3 h-3 mr-1" />}
      {config?.label}
    </Badge>
  );
}
```

---

## Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus order follows logical reading order
- [ ] Focus indicators are visible
- [ ] ARIA labels on icon-only buttons
- [ ] Form fields have associated labels
- [ ] Error messages are announced by screen readers
- [ ] Color is not the only means of conveying information
- [ ] Sufficient color contrast (4.5:1 for text)
- [ ] Reduced motion support for animations
- [ ] Skip links for main content
- [ ] Skill list is navigable with arrow keys
- [ ] Collapsible sections announce their state
