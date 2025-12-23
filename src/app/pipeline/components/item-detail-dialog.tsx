"use client";

import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PIPELINE_STAGE_METADATA,
  PIPELINE_ITEM_TYPE_METADATA,
  PIPELINE_PRIORITY_METADATA,
  type PipelineItem,
} from "@/lib/schemas";
import { typeIcons } from "./pipeline-utils";

interface ItemDetailDialogProps {
  item: PipelineItem;
  children: React.ReactNode;
}

export function ItemDetailDialog({ item, children }: ItemDetailDialogProps) {
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
