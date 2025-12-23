"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PipelineItem } from "@/lib/schemas";
import { ItemDetailDialog } from "./item-detail-dialog";

interface PipelineCardProps {
  item: PipelineItem;
  index: number;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onDragOver?: (index: number, position: 'before' | 'after') => void;
  dropIndicator?: 'before' | 'after' | null;
}

export function PipelineCard({
  item,
  index,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  onDragOver,
  dropIndicator,
}: PipelineCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.setData("application/x-source-stage", item.stage);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    onDragOver?.(index, position);
  };

  return (
    <div className="relative">
      {/* Drop indicator before */}
      {dropIndicator === 'before' && (
        <div className="absolute -top-1.5 left-0 right-0 h-1 bg-primary rounded-full" />
      )}
      <Card
        className="mb-3 shadow-sm hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
      >
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
      {/* Drop indicator after */}
      {dropIndicator === 'after' && (
        <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-primary rounded-full" />
      )}
    </div>
  );
}
