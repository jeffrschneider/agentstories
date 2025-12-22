"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  Kanban,
  ChevronRight,
  ChevronLeft,
  Bot,
  PlusCircle,
  Edit,
  MinusCircle,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipelineByStage, useMovePipelineItem, useCreatePipelineItem, usePipelineStats } from "@/hooks";
import {
  PIPELINE_STAGE_METADATA,
  PIPELINE_ITEM_TYPE_METADATA,
  PIPELINE_PRIORITY_METADATA,
  KANBAN_STAGES,
  type PipelineItem,
  type PipelineStage,
  type PipelineItemType,
  type PipelinePriority,
} from "@/lib/schemas";

// Icon mapping for item types
const typeIcons: Record<PipelineItemType, React.ComponentType<{ className?: string }>> = {
  "new-agent": Bot,
  "capability-add": PlusCircle,
  "capability-modify": Edit,
  "capability-remove": MinusCircle,
  "agent-update": Settings,
};

// Stage column background colors
const stageColors: Record<PipelineStage, string> = {
  proposed: "bg-gray-50",
  "under-review": "bg-blue-50",
  approved: "bg-green-50",
  "in-progress": "bg-yellow-50",
  completed: "bg-emerald-50",
  rejected: "bg-red-50",
};

function ItemDetailDialog({ item, children }: { item: PipelineItem; children: React.ReactNode }) {
  const TypeIcon = typeIcons[item.type];
  const typeMetadata = PIPELINE_ITEM_TYPE_METADATA[item.type];
  const priorityMetadata = PIPELINE_PRIORITY_METADATA[item.priority];
  const stageMetadata = PIPELINE_STAGE_METADATA[item.stage];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5" />
            {item.title}
          </DialogTitle>
          <DialogDescription>
            Pipeline item details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{typeMetadata.label}</Badge>
            <Badge variant="outline">{priorityMetadata.label} Priority</Badge>
            <Badge variant="secondary">{stageMetadata.label}</Badge>
          </div>

          {item.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{item.description}</p>
            </div>
          )}

          {(item.agentName || item.proposedAgentName) && (
            <div>
              <Label className="text-xs text-muted-foreground">
                {item.type === "new-agent" ? "Proposed Agent" : "Related Agent"}
              </Label>
              <p className="text-sm mt-1 flex items-center gap-1">
                <Bot className="h-4 w-4" />
                {item.agentName || item.proposedAgentName}
              </p>
            </div>
          )}

          {item.capabilityName && (
            <div>
              <Label className="text-xs text-muted-foreground">Capability</Label>
              <p className="text-sm mt-1">{item.capabilityName}</p>
              {item.capabilityDescription && (
                <p className="text-xs text-muted-foreground mt-1">{item.capabilityDescription}</p>
              )}
            </div>
          )}

          {item.proposedCapabilities && item.proposedCapabilities.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Proposed Capabilities</Label>
              <ul className="text-sm mt-1 list-disc list-inside">
                {item.proposedCapabilities.map((cap, i) => (
                  <li key={i}>{cap}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {item.requestedBy && (
              <div>
                <Label className="text-xs text-muted-foreground">Requested By</Label>
                <p className="mt-1">{item.requestedBy}</p>
              </div>
            )}
            {item.assignedTo && (
              <div>
                <Label className="text-xs text-muted-foreground">Assigned To</Label>
                <p className="mt-1">{item.assignedTo}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <Label className="text-xs">Created</Label>
              <p className="mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-xs">Updated</Label>
              <p className="mt-1">{new Date(item.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PipelineCard({
  item,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight
}: {
  item: PipelineItem;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}) {
  return (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow group">
      <CardContent className="p-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-1 flex-1">
            {item.title}
          </p>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {canMoveLeft && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveLeft?.();
                }}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            )}
            {canMoveRight && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveRight?.();
                }}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {item.description}
          </p>
        )}

        {/* More link */}
        <div className="mt-2">
          <ItemDetailDialog item={item}>
            <button
              className="text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              More...
            </button>
          </ItemDetailDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  stage,
  items,
  onMoveItem
}: {
  stage: PipelineStage;
  items: PipelineItem[];
  onMoveItem: (itemId: string, newStage: PipelineStage) => void;
}) {
  const metadata = PIPELINE_STAGE_METADATA[stage];
  const stageIndex = KANBAN_STAGES.indexOf(stage);

  const handleMoveLeft = (itemId: string) => {
    if (stageIndex > 0) {
      onMoveItem(itemId, KANBAN_STAGES[stageIndex - 1]);
    }
  };

  const handleMoveRight = (itemId: string) => {
    if (stageIndex < KANBAN_STAGES.length - 1) {
      onMoveItem(itemId, KANBAN_STAGES[stageIndex + 1]);
    }
  };

  return (
    <div className={`flex-1 min-w-[280px] max-w-[320px] rounded-lg ${stageColors[stage]} p-3`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{metadata.label}</h3>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="pr-2">
          {items.length > 0 ? (
            items.map((item) => (
              <PipelineCard
                key={item.id}
                item={item}
                onMoveLeft={() => handleMoveLeft(item.id)}
                onMoveRight={() => handleMoveRight(item.id)}
                canMoveLeft={stageIndex > 0}
                canMoveRight={stageIndex < KANBAN_STAGES.length - 1}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No items
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function CreateItemDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PipelineItemType>("new-agent");
  const [priority, setPriority] = useState<PipelinePriority>("medium");
  const [proposedAgentName, setProposedAgentName] = useState("");

  const createItem = useCreatePipelineItem();

  const handleSubmit = () => {
    if (!title.trim()) return;

    createItem.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      stage: "proposed",
      priority,
      proposedAgentName: type === "new-agent" ? proposedAgentName.trim() || undefined : undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        setTitle("");
        setDescription("");
        setType("new-agent");
        setPriority("medium");
        setProposedAgentName("");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Pipeline Item</DialogTitle>
          <DialogDescription>
            Add a new agent proposal or change request to the pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as PipelineItemType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PIPELINE_ITEM_TYPE_METADATA).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
            />
          </div>
          {type === "new-agent" && (
            <div className="grid gap-2">
              <Label htmlFor="agentName">Proposed Agent Name</Label>
              <Input
                id="agentName"
                value={proposedAgentName}
                onChange={(e) => setProposedAgentName(e.target.value)}
                placeholder="e.g., Customer Support Agent"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the proposal or change request..."
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as PipelinePriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PIPELINE_PRIORITY_METADATA).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createItem.isPending}>
            {createItem.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PipelinePage() {
  const { data: itemsByStage, isLoading } = usePipelineByStage();
  const { data: stats } = usePipelineStats();
  const moveItem = useMovePipelineItem();

  const handleMoveItem = (itemId: string, newStage: PipelineStage) => {
    moveItem.mutate({ id: itemId, stage: newStage });
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Kanban className="h-8 w-8" />
              Pipeline
            </h1>
            <p className="text-muted-foreground">
              Track agent proposals and change requests through the approval process
            </p>
          </div>
          <CreateItemDialog />
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{stats.total} total items</span>
            <span className="text-gray-300">•</span>
            <span>{stats.proposed + stats.underReview} awaiting review</span>
            <span className="text-gray-300">•</span>
            <span>{stats.inProgress} in progress</span>
            <span className="text-gray-300">•</span>
            <span>{stats.byType["new-agent"]} new agent proposals</span>
          </div>
        )}

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : itemsByStage ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {KANBAN_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                items={itemsByStage[stage] || []}
                onMoveItem={handleMoveItem}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Kanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No pipeline items</h3>
              <p className="text-muted-foreground mt-1">
                Create your first proposal to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
