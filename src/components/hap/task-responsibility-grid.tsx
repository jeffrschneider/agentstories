"use client";

import {
  Bot,
  User,
  Plus,
  Trash2,
  Target,
  FileText,
  Play,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RESPONSIBILITY_PRESETS,
  PHASE_OWNER_METADATA,
} from "@/lib/schemas";
import type {
  TaskResponsibility,
  ResponsibilityPhase,
  PhaseOwner,
  ResponsibilityPreset,
} from "@/lib/schemas";

const PHASES: ResponsibilityPhase[] = ["manage", "define", "perform", "review"];

const PHASE_ICONS: Record<ResponsibilityPhase, React.ReactNode> = {
  manage: <Target className="h-3 w-3" />,
  define: <FileText className="h-3 w-3" />,
  perform: <Play className="h-3 w-3" />,
  review: <CheckCircle className="h-3 w-3" />,
};

const PHASE_LABELS: Record<ResponsibilityPhase, string> = {
  manage: "Manage",
  define: "Define",
  perform: "Perform",
  review: "Review",
};

interface TaskResponsibilityGridProps {
  tasks: TaskResponsibility[];
  editMode?: boolean;
  compact?: boolean;
  onUpdateTask?: (index: number, updates: Partial<TaskResponsibility>) => void;
  onUpdatePhaseOwner?: (index: number, phase: ResponsibilityPhase, owner: PhaseOwner) => void;
  onApplyPreset?: (index: number, preset: ResponsibilityPreset) => void;
  onAddTask?: () => void;
  onRemoveTask?: (index: number) => void;
}

export function TaskResponsibilityGrid({
  tasks,
  editMode = false,
  compact = false,
  onUpdateTask,
  onUpdatePhaseOwner,
  onApplyPreset,
  onAddTask,
  onRemoveTask,
}: TaskResponsibilityGridProps) {
  const handleApplyPresetToAll = (preset: ResponsibilityPreset) => {
    if (onApplyPreset) {
      tasks.forEach((_, i) => onApplyPreset(i, preset));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className={`grid gap-2 text-sm font-medium text-muted-foreground px-2 ${
        compact ? "grid-cols-12" : "grid-cols-12"
      }`}>
        <div className="col-span-3">Task</div>
        {PHASES.map((phase) => (
          <div key={phase} className="col-span-2 text-center">
            <div className="flex items-center justify-center gap-1">
              {PHASE_ICONS[phase]}
              {compact ? phase[0].toUpperCase() : PHASE_LABELS[phase]}
            </div>
          </div>
        ))}
        <div className="col-span-1"></div>
      </div>

      {/* Task Rows */}
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/50"
        >
          <div className="col-span-3">
            {editMode ? (
              <Input
                value={task.taskName}
                onChange={(e) => onUpdateTask?.(index, { taskName: e.target.value })}
                placeholder="Task name"
              />
            ) : (
              <span className="font-medium">{task.taskName}</span>
            )}
          </div>
          {PHASES.map((phase) => (
            <div key={phase} className="col-span-2">
              {editMode ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentOwner = task.phases[phase].owner;
                    const newOwner: PhaseOwner = currentOwner === "human" ? "agent" : "human";
                    onUpdatePhaseOwner?.(index, phase, newOwner);
                  }}
                  className={`
                    w-full h-8 flex items-center justify-center gap-1 rounded-md border
                    transition-all duration-150 hover:scale-105
                    ${task.phases[phase].owner === "human"
                      ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800"
                      : "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100 dark:bg-purple-950 dark:border-purple-800"
                    }
                  `}
                  title={`Click to toggle ${phase} owner (currently ${task.phases[phase].owner})`}
                >
                  {task.phases[phase].owner === "human" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">
                    {task.phases[phase].owner === "human" ? "H" : "A"}
                  </span>
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  {task.phases[phase].owner === "human" ? (
                    <User className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Bot className="h-4 w-4 text-purple-500" />
                  )}
                  {!compact && (
                    <span className="text-xs">
                      {PHASE_OWNER_METADATA[task.phases[phase].owner].label}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="col-span-1 flex justify-end">
            {editMode && onRemoveTask && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRemoveTask(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No tasks defined yet.{" "}
          {editMode && onAddTask && "Click 'Add Task' to get started."}
        </div>
      )}

      {/* Presets (in edit mode) */}
      {editMode && tasks.length > 0 && onApplyPreset && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground mr-2">Apply to all:</span>
          {Object.entries(RESPONSIBILITY_PRESETS).slice(0, 4).map(([key, preset]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleApplyPresetToAll(key as ResponsibilityPreset)}
            >
              {preset.pattern}
            </Button>
          ))}
        </div>
      )}

      {/* Legend */}
      {compact && (
        <div className="text-xs text-muted-foreground">
          <p><strong>M</strong> = Manage | <strong>D</strong> = Define | <strong>P</strong> = Perform | <strong>R</strong> = Review</p>
          <p className="mt-1"><strong>H</strong> = Human | <strong>A</strong> = Agent</p>
        </div>
      )}
    </div>
  );
}

interface TaskResponsibilityTableProps {
  tasks: TaskResponsibility[];
}

export function TaskResponsibilityTable({ tasks }: TaskResponsibilityTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-2 text-left">Task</th>
            {PHASES.map((phase) => (
              <th key={phase} className="p-2 text-center">{PHASE_LABELS[phase]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t">
              <td className="p-2">{task.taskName}</td>
              {PHASES.map((phase) => (
                <td key={phase} className="p-2 text-center">
                  {task.phases[phase].owner === "human" ? (
                    <User className="h-4 w-4 text-blue-500 inline" />
                  ) : (
                    <Bot className="h-4 w-4 text-purple-500 inline" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
