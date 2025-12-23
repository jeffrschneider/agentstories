"use client";

import { Loader2, Kanban } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { usePipelineByStage, useMovePipelineItem, useReorderPipelineItems, usePipelineStats } from "@/hooks";
import { KANBAN_STAGES, type PipelineStage } from "@/lib/schemas";
import { KanbanColumn, CreateItemDialog } from "./components";

export default function PipelinePage() {
  const { data: itemsByStage, isLoading } = usePipelineByStage();
  const { data: stats } = usePipelineStats();
  const moveItem = useMovePipelineItem();
  const reorderItems = useReorderPipelineItems();

  const handleMoveItem = (itemId: string, newStage: PipelineStage, targetIndex?: number) => {
    moveItem.mutate({ id: itemId, stage: newStage, targetIndex });
  };

  const handleReorderItems = (stage: PipelineStage, itemIds: string[]) => {
    reorderItems.mutate({ stage, itemIds });
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
                onReorderItems={handleReorderItems}
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
