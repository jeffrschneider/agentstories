# UI Components Specification

## Overview

This specification defines the component architecture for Agent Story Builder, built on shadcn/ui with Tailwind CSS. Components follow atomic design principles and prioritize accessibility.

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
  /story                 # Story-specific components
    story-canvas.tsx
    story-card.tsx
    story-library.tsx
    trigger-selector.tsx
    autonomy-picker.tsx
    ...
  /template              # Template components
    template-browser.tsx
    template-card.tsx
    template-preview.tsx
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

The main story editing interface.

```tsx
// /components/story/story-canvas.tsx

interface StoryCanvasProps {
  storyId: string;
  mode?: 'edit' | 'view';
  onSave?: () => void;
}

export function StoryCanvas({ storyId, mode = 'edit', onSave }: StoryCanvasProps) {
  const { story, isLoading, updateField, save } = useStoryEditor(storyId);

  if (isLoading) return <StoryCanvasSkeleton />;
  if (!story) return <StoryNotFound />;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <StoryHeader story={story} mode={mode} onSave={save} />

      {/* Core Story Section */}
      <section className="mt-8 p-6 bg-card rounded-lg border shadow-sm">
        <h2 className="text-story-label mb-6">Core Story</h2>

        <IdentifierField
          value={story.identifier}
          onChange={(v) => updateField('identifier', v)}
          disabled={mode === 'view'}
        />

        <RoleField
          value={story.role}
          onChange={(v) => updateField('role', v)}
          disabled={mode === 'view'}
        />

        <TriggerSelector
          value={story.trigger}
          onChange={(v) => updateField('trigger', v)}
          disabled={mode === 'view'}
        />

        <ActionField
          value={story.action}
          onChange={(v) => updateField('action', v)}
          disabled={mode === 'view'}
        />

        <OutcomeField
          value={story.outcome}
          onChange={(v) => updateField('outcome', v)}
          disabled={mode === 'view'}
        />

        <AutonomyPicker
          value={story.autonomyLevel}
          onChange={(v) => updateField('autonomyLevel', v)}
          disabled={mode === 'view'}
        />
      </section>

      {/* Structured Annotations (Full format only) */}
      {story.format === 'full' && (
        <div className="mt-6 space-y-4">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Structured Annotations
          </div>

          <CollapsibleSection
            id="triggerSpec"
            title="Trigger Specification"
            optional
          >
            <TriggerSpecEditor
              value={story.triggerSpec}
              onChange={(v) => updateField('triggerSpec', v)}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="behavior"
            title="Behavior Model"
            optional
            completionStatus={getBehaviorCompletionStatus(story)}
          >
            <BehaviorModelEditor
              value={story.behavior}
              onChange={(v) => updateField('behavior', v)}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="reasoning"
            title="Reasoning & Decisions"
            optional
          >
            <ReasoningEditor
              value={story.reasoning}
              onChange={(v) => updateField('reasoning', v)}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="memory"
            title="Memory & State"
            optional
          >
            <MemoryEditor
              value={story.memory}
              onChange={(v) => updateField('memory', v)}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="tools"
            title="Tools & Integrations"
            optional
            completionStatus={getToolsCompletionStatus(story)}
          >
            <ToolsEditor
              value={story.tools}
              onChange={(v) => updateField('tools', v)}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="skills"
            title="Skills"
            completionStatus={getSkillsCompletionStatus(story)}
          >
            <SkillsEditor
              value={story.skills}
              onChange={(v) => updateField('skills', v)}
              availableTools={story.tools || []}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="humanInteraction"
            title="Human Collaboration"
            optional
          >
            <HumanInteractionEditor
              value={story.humanInteraction}
              onChange={(v) => updateField('humanInteraction', v)}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="collaboration"
            title="Agent Collaboration"
            optional
          >
            <AgentCollabEditor
              value={story.collaboration}
              onChange={(v) => updateField('collaboration', v)}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="acceptance"
            title="Acceptance Criteria"
            completionStatus={getAcceptanceCompletionStatus(story)}
          >
            <AcceptanceCriteriaEditor
              value={story.acceptance}
              onChange={(v) => updateField('acceptance', v)}
              disabled={mode === 'view'}
            />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
```

---

### TriggerSelector

Type-aware trigger configuration component.

```tsx
// /components/story/trigger-selector.tsx

interface TriggerSelectorProps {
  value: Trigger;
  onChange: (trigger: Trigger) => void;
  disabled?: boolean;
}

export function TriggerSelector({ value, onChange, disabled }: TriggerSelectorProps) {
  const [triggerType, setTriggerType] = useState(value.type);

  const handleTypeChange = (newType: TriggerType) => {
    setTriggerType(newType);
    onChange(getDefaultTrigger(newType));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-story-body font-medium">triggered by</span>
        <Select
          value={triggerType}
          onValueChange={handleTypeChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-48">
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

      {/* Type-specific configuration */}
      <div className="pl-4 border-l-2 border-muted">
        {triggerType === 'message' && (
          <MessageTriggerConfig value={value} onChange={onChange} disabled={disabled} />
        )}
        {triggerType === 'schedule' && (
          <ScheduleTriggerConfig value={value} onChange={onChange} disabled={disabled} />
        )}
        {triggerType === 'resource_change' && (
          <ResourceChangeTriggerConfig value={value} onChange={onChange} disabled={disabled} />
        )}
        {triggerType === 'cascade' && (
          <CascadeTriggerConfig value={value} onChange={onChange} disabled={disabled} />
        )}
        {triggerType === 'manual' && (
          <ManualTriggerConfig value={value} onChange={onChange} disabled={disabled} />
        )}
      </div>
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
// /components/story/collapsible-section.tsx

interface CollapsibleSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  optional?: boolean;
  completionStatus?: { completed: number; total: number };
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  id,
  title,
  children,
  optional = false,
  completionStatus,
  defaultOpen = false
}: CollapsibleSectionProps) {
  const { expandedSections, toggleSection } = useStoryEditorStore();
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
          </div>

          {completionStatus && (
            <span className="text-sm text-muted-foreground">
              {completionStatus.completed} of {completionStatus.total} fields
            </span>
          )}
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
          As a {story.role}, I {story.action}
        </p>

        <div className="mt-4 flex items-center gap-4">
          <AutonomyBadge level={story.autonomyLevel} />
          <TriggerBadge type={story.trigger.type} />
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

### FormatBadge

```tsx
// /components/story/format-badge.tsx

interface FormatBadgeProps {
  format: 'light' | 'full';
  size?: 'sm' | 'md';
}

export function FormatBadge({ format, size = 'sm' }: FormatBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        format === 'light'
          ? 'bg-format-light-bg text-format-light border-format-light/30'
          : 'bg-format-full-bg text-format-full border-format-full/30',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      )}
    >
      {format === 'light' ? 'Light' : 'Full'}
    </Badge>
  );
}
```

---

### AutonomyBadge

```tsx
// /components/story/autonomy-badge.tsx

interface AutonomyBadgeProps {
  level: AutonomyLevel;
  showLabel?: boolean;
}

export function AutonomyBadge({ level, showLabel = true }: AutonomyBadgeProps) {
  const config = AUTONOMY_LEVEL_METADATA[level];

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          `bg-autonomy-${level}`
        )}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}
```

---

### TriggerBadge

```tsx
// /components/story/trigger-badge.tsx

interface TriggerBadgeProps {
  type: TriggerType;
  showLabel?: boolean;
}

export function TriggerBadge({ type, showLabel = true }: TriggerBadgeProps) {
  return (
    <div className="flex items-center gap-1.5">
      <TriggerTypeIcon
        type={type}
        className={cn("w-4 h-4", `text-trigger-${type}`)}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground capitalize">
          {type.replace('_', ' ')}
        </span>
      )}
    </div>
  );
}
```

---

### StoryLibrary

Library view with grid/list toggle.

```tsx
// /components/story/story-library.tsx

interface StoryLibraryProps {
  initialStories?: AgentStory[];
}

export function StoryLibrary({ initialStories }: StoryLibraryProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<StoryFilters>({});

  const { data, isLoading } = useStories(filters, { initialData: initialStories });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <SearchInput
            placeholder="Search stories..."
            value={filters.search ?? ''}
            onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          />
          <FilterDropdown
            label="Format"
            options={FORMAT_OPTIONS}
            value={filters.format}
            onChange={(v) => setFilters(f => ({ ...f, format: v }))}
          />
          <FilterDropdown
            label="Autonomy"
            options={AUTONOMY_OPTIONS}
            value={filters.autonomyLevel}
            onChange={(v) => setFilters(f => ({ ...f, autonomyLevel: v }))}
          />
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={() => router.push('/stories/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Story
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          count={selectedIds.size}
          onExport={() => handleBulkExport(selectedIds)}
          onDelete={() => handleBulkDelete(selectedIds)}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* Stories */}
      {isLoading ? (
        <StoryLibrarySkeleton view={view} />
      ) : data?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No stories yet"
          description="Create your first Agent Story to get started"
          action={
            <Button onClick={() => router.push('/stories/new')}>
              Create Story
            </Button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              selected={selectedIds.has(story.id)}
              onSelect={() => toggleSelect(story.id)}
            />
          ))}
        </div>
      ) : (
        <StoryTable
          stories={data ?? []}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}
    </div>
  );
}
```

---

### CommentsPanel

Side panel for story comments.

```tsx
// /components/collaboration/comments-panel.tsx

interface CommentsPanelProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsPanel({ storyId, isOpen, onClose }: CommentsPanelProps) {
  const { data: comments, isLoading } = useComments(storyId);
  const [showResolved, setShowResolved] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filteredComments = useMemo(() => {
    let result = comments ?? [];
    if (!showResolved) {
      result = result.filter(c => !c.resolved);
    }
    if (activeSection) {
      result = result.filter(c => c.anchor?.section === activeSection);
    }
    return result;
  }, [comments, showResolved, activeSection]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Comments ({comments?.length ?? 0})</span>
            <Button size="sm" variant="outline" onClick={() => setShowNewComment(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Button
              variant={showResolved ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Hide' : 'Show'} Resolved
            </Button>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {isLoading ? (
              <CommentsSkeleton />
            ) : filteredComments.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No comments"
                description="Add a comment to start the discussion"
                size="sm"
              />
            ) : (
              filteredComments.map(comment => (
                <CommentThread key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

### CommentThread

Threaded comment component.

```tsx
// /components/collaboration/comment-thread.tsx

interface CommentThreadProps {
  comment: Comment;
  depth?: number;
}

export function CommentThread({ comment, depth = 0 }: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const { mutate: resolve } = useResolveComment();
  const { data: replies } = useCommentReplies(comment.id);

  return (
    <div className={cn("space-y-3", depth > 0 && "ml-6 pl-4 border-l-2 border-muted")}>
      <div className={cn(
        "p-3 rounded-lg",
        comment.resolved ? "bg-muted/50" : "bg-card border"
      )}>
        {/* Anchor badge */}
        {comment.anchor && depth === 0 && (
          <Badge variant="outline" className="mb-2 text-xs">
            <Pin className="w-3 h-3 mr-1" />
            {formatAnchorLabel(comment.anchor)}
          </Badge>
        )}

        {/* Author and timestamp */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={comment.author?.avatarUrl} />
            <AvatarFallback>{getInitials(comment.author?.name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{comment.author?.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.resolved && (
            <Badge variant="secondary" className="ml-auto text-xs">
              <Check className="w-3 h-3 mr-1" />
              Resolved
            </Badge>
          )}
        </div>

        {/* Content */}
        <p className="text-sm">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3">
          <ReactionButton
            reactions={comment.reactions}
            commentId={comment.id}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setIsReplying(true)}
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
          {!comment.resolved && depth === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => resolve({ id: comment.id, resolved: true })}
            >
              <Check className="w-3 h-3 mr-1" />
              Resolve
            </Button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {isReplying && (
        <CommentForm
          storyId={comment.storyId}
          parentId={comment.id}
          onCancel={() => setIsReplying(false)}
          onSubmit={() => setIsReplying(false)}
        />
      )}

      {/* Replies */}
      {replies?.map(reply => (
        <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
}
```

---

### ShareDialog

Story sharing modal.

```tsx
// /components/collaboration/share-dialog.tsx

interface ShareDialogProps {
  story: AgentStory;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ story, isOpen, onClose }: ShareDialogProps) {
  const { data: shares, isLoading } = useStoryShares(story.id);
  const { mutate: createShare } = useCreateShare();
  const { mutate: removeShare } = useRemoveShare();
  const [linkSharing, setLinkSharing] = useState<'restricted' | 'public'>('restricted');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{story.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* People with access */}
          <div>
            <Label className="text-sm font-medium">People with access</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {isLoading ? (
                <ShareListSkeleton />
              ) : (
                shares?.map(share => (
                  <ShareListItem
                    key={share.id}
                    share={share}
                    onRemove={() => removeShare(share.id)}
                    onUpdatePermission={(p) => updateShare(share.id, { permission: p })}
                  />
                ))
              )}
            </div>
          </div>

          {/* Add people */}
          <div>
            <Label className="text-sm font-medium">Add people or teams</Label>
            <div className="mt-2 flex items-center gap-2">
              <UserSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={(user) => {
                  createShare({
                    storyId: story.id,
                    targetType: 'user',
                    targetId: user.id,
                    permission: 'viewer'
                  });
                  setSearchQuery('');
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Link sharing */}
          <div>
            <Label className="text-sm font-medium">Link sharing</Label>
            <RadioGroup
              value={linkSharing}
              onValueChange={(v) => setLinkSharing(v as typeof linkSharing)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="restricted" id="restricted" />
                <Label htmlFor="restricted" className="font-normal">
                  Restricted - Only people added above
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal">
                  Anyone with the link can view
                </Label>
              </div>
            </RadioGroup>

            {linkSharing === 'public' && (
              <div className="mt-4">
                <PublicLinkControls storyId={story.id} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### TemplateBrowser

Template selection interface.

```tsx
// /components/template/template-browser.tsx

interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

export function TemplateBrowser({ isOpen, onClose, onSelect }: TemplateBrowserProps) {
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const { data: templates, isLoading } = useTemplates({ category, search });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search and filters */}
          <div className="flex items-center gap-4 mb-4">
            <SearchInput
              placeholder="Search templates..."
              value={search}
              onChange={setSearch}
              className="flex-1"
            />
          </div>

          {/* Category tabs */}
          <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <TabsList className="flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all">All</TabsTrigger>
              {TEMPLATE_CATEGORIES.map(cat => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Template grid */}
          <ScrollArea className="flex-1 mt-4">
            {isLoading ? (
              <TemplateGridSkeleton />
            ) : templates?.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No templates found"
                description="Try adjusting your search or filters"
                size="sm"
              />
            ) : (
              <div className="grid grid-cols-3 gap-4 p-1">
                {templates?.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => setPreviewTemplate(template)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Template preview modal */}
        {previewTemplate && (
          <TemplatePreview
            template={previewTemplate}
            isOpen={!!previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onSelect={() => {
              onSelect(previewTemplate);
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
export function StoryCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
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
