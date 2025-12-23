"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PIPELINE_STAGE_METADATA,
  KANBAN_STAGES,
  type PipelineItem,
  type PipelineStage,
} from "@/lib/schemas";
import { stageColors } from "./pipeline-utils";
import { PipelineCard } from "./pipeline-card";

interface KanbanColumnProps {
  stage: PipelineStage;
  items: PipelineItem[];
  onMoveItem: (itemId: string, newStage: PipelineStage, targetIndex?: number) => void;
  onReorderItems: (stage: PipelineStage, itemIds: string[]) => void;
}

export function KanbanColumn({
  stage,
  items,
  onMoveItem,
  onReorderItems,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ index: number; position: 'before' | 'after' } | null>(null);
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

  const handleCardDragOver = (index: number, position: 'before' | 'after') => {
    setDropTarget({ index, position });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if leaving the column entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
      setDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDropTarget(null);

    const itemId = e.dataTransfer.getData("text/plain");
    const sourceStage = e.dataTransfer.getData("application/x-source-stage");

    if (!itemId) return;

    // Calculate target index based on drop position
    let targetIndex: number | undefined;
    if (dropTarget) {
      targetIndex = dropTarget.position === 'before' ? dropTarget.index : dropTarget.index + 1;
    }

    // Check if we're reordering within the same stage
    if (sourceStage === stage) {
      const currentIndex = items.findIndex(item => item.id === itemId);
      if (currentIndex === -1) return;

      // If no specific target, don't reorder
      if (targetIndex === undefined) return;

      // Adjust target index if moving down
      if (currentIndex < targetIndex) {
        targetIndex--;
      }

      // Don't reorder if dropping in the same position
      if (currentIndex === targetIndex) return;

      // Create new order array
      const newOrder = items.map(item => item.id);
      newOrder.splice(currentIndex, 1);
      newOrder.splice(targetIndex, 0, itemId);

      onReorderItems(stage, newOrder);
    } else {
      // Moving to a different stage
      onMoveItem(itemId, stage, targetIndex);
    }
  };

  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[320px] rounded-lg ${stageColors[stage]} p-3 transition-all ${
        isDragOver ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
            items.map((item, index) => (
              <PipelineCard
                key={item.id}
                item={item}
                index={index}
                onMoveLeft={() => handleMoveLeft(item.id)}
                onMoveRight={() => handleMoveRight(item.id)}
                canMoveLeft={stageIndex > 0}
                canMoveRight={stageIndex < KANBAN_STAGES.length - 1}
                onDragOver={handleCardDragOver}
                dropIndicator={
                  dropTarget?.index === index ? dropTarget.position : null
                }
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isDragOver ? "Drop here" : "No items"}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
