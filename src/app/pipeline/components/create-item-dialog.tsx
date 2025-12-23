"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePipelineItem } from "@/hooks";
import {
  PIPELINE_ITEM_TYPE_METADATA,
  PIPELINE_PRIORITY_METADATA,
  type PipelineItemType,
  type PipelinePriority,
} from "@/lib/schemas";

export function CreateItemDialog() {
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
