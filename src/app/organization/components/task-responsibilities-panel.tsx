"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserCircle,
  User,
  Bot,
  Plus,
  Save,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useHAPs,
  useUpdateHAP,
  usePerson,
  useRole,
  useStories,
} from "@/hooks";
import { TaskResponsibilityGrid } from "@/components/hap";
import {
  calculatePhaseDistribution,
  createEmptyTaskResponsibility,
  RESPONSIBILITY_PRESETS,
} from "@/lib/schemas";
import type {
  TaskResponsibility,
  ResponsibilityPhase,
  PhaseOwner,
  ResponsibilityPreset,
  HumanAgentPair,
  AgentStory,
} from "@/lib/schemas";

interface TaskResponsibilitiesPanelProps {
  selectedPersonId: string | null;
  selectedRoleId: string | null;
}

interface AgentSectionProps {
  hap: HumanAgentPair;
  agentStory?: AgentStory;
  isExpanded: boolean;
  onToggle: () => void;
}

function AgentSection({ hap, agentStory, isExpanded, onToggle }: AgentSectionProps) {
  const updateHAP = useUpdateHAP();
  const [editMode, setEditMode] = useState(false);
  const [tasks, setTasks] = useState<TaskResponsibility[]>([]);

  const distribution = calculatePhaseDistribution(editMode ? tasks : hap.tasks);

  const initEditState = () => {
    setTasks([...hap.tasks]);
    setEditMode(true);
  };

  const handleSave = async () => {
    await updateHAP.mutateAsync({
      id: hap.id,
      data: { tasks },
    });
    setEditMode(false);
  };

  const updatePhaseOwner = (index: number, phase: ResponsibilityPhase, owner: PhaseOwner) => {
    const updated = [...tasks];
    updated[index] = {
      ...updated[index],
      phases: {
        ...updated[index].phases,
        [phase]: { ...updated[index].phases[phase], owner },
      },
    };
    setTasks(updated);
  };

  const applyPresetToTask = (index: number, preset: ResponsibilityPreset) => {
    const updated = [...tasks];
    const presetConfig = RESPONSIBILITY_PRESETS[preset];
    updated[index] = {
      ...updated[index],
      phases: {
        manage: { ...updated[index].phases.manage, owner: presetConfig.phases.manage },
        define: { ...updated[index].phases.define, owner: presetConfig.phases.define },
        perform: { ...updated[index].phases.perform, owner: presetConfig.phases.perform },
        review: { ...updated[index].phases.review, owner: presetConfig.phases.review },
      },
    };
    setTasks(updated);
  };

  const taskCount = hap.tasks.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-sm">{agentStory?.name || "Unassigned Agent"}</div>
            <div className="text-xs text-muted-foreground">
              {taskCount} task{taskCount !== 1 ? "s" : ""} · {distribution.humanPercent}% human / {distribution.agentPercent}% agent
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Compact distribution bar */}
          <div className="hidden sm:flex h-2 w-20 overflow-hidden rounded-full bg-muted">
            <div className="bg-blue-500" style={{ width: `${distribution.humanPercent}%` }} />
            <div className="bg-purple-500" style={{ width: `${distribution.agentPercent}%` }} />
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {/* Edit Controls */}
          <div className="flex items-center justify-between">
            <div className="flex h-2 flex-1 max-w-xs overflow-hidden rounded-full bg-muted sm:hidden">
              <div className="bg-blue-500" style={{ width: `${distribution.humanPercent}%` }} />
              <div className="bg-purple-500" style={{ width: `${distribution.agentPercent}%` }} />
            </div>
            <div className="flex items-center gap-2">
              {editMode && (
                <Button size="sm" variant="outline" onClick={() => setTasks([...tasks, createEmptyTaskResponsibility("")])}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              )}
              {!editMode ? (
                <Button size="sm" onClick={initEditState}>Edit</Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={updateHAP.isPending}>
                    {updateHAP.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Task Responsibilities Grid */}
          {(editMode ? tasks : hap.tasks).length > 0 ? (
            <>
              <TaskResponsibilityGrid
                tasks={editMode ? tasks : hap.tasks}
                editMode={editMode}
                onUpdateTask={(index, updates) => {
                  const updated = [...tasks];
                  updated[index] = { ...updated[index], ...updates };
                  setTasks(updated);
                }}
                onUpdatePhaseOwner={updatePhaseOwner}
                onApplyPreset={applyPresetToTask}
                onRemoveTask={(index) => setTasks(tasks.filter((_, i) => i !== index))}
              />

              {editMode && tasks.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="text-sm">Quick Apply Preset to All Tasks</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(RESPONSIBILITY_PRESETS).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => tasks.forEach((_, i) => applyPresetToTask(i, key as ResponsibilityPreset))}
                      >
                        {preset.label} ({preset.pattern})
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No tasks defined yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskResponsibilitiesPanel({
  selectedPersonId,
  selectedRoleId,
}: TaskResponsibilitiesPanelProps) {
  const { data: person } = usePerson(selectedPersonId || "");
  const { data: role } = useRole(selectedRoleId || "");
  const { data: haps } = useHAPs(
    selectedPersonId && selectedRoleId
      ? { personId: selectedPersonId, roleId: selectedRoleId }
      : undefined
  );
  const { data: stories } = useStories();

  // Track which agent sections are expanded (first one by default)
  const [expandedHapIds, setExpandedHapIds] = useState<Set<string>>(new Set());

  // Filter HAPs for this person-role combination
  const personHaps = haps?.filter(
    (h) => h.personId === selectedPersonId && h.roleId === selectedRoleId
  ) || [];

  // Initialize first HAP as expanded when HAPs load
  const firstHapId = personHaps[0]?.id;
  if (firstHapId && expandedHapIds.size === 0 && personHaps.length > 0) {
    setExpandedHapIds(new Set([firstHapId]));
  }

  const toggleHap = (hapId: string) => {
    setExpandedHapIds((prev) => {
      const next = new Set(prev);
      if (next.has(hapId)) {
        next.delete(hapId);
      } else {
        next.add(hapId);
      }
      return next;
    });
  };

  if (!selectedPersonId) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center">
          <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Select an Employee</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Click on an employee in the tree to see their task responsibilities
          </p>
        </CardContent>
      </Card>
    );
  }

  if (personHaps.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{person?.name || "Unknown"}</CardTitle>
              <CardDescription>{role?.name || "Unknown Role"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No Human-Agent Pair configured for this employee
          </p>
          <Button className="mt-4" asChild variant="outline" size="sm">
            <Link href="/haps/new">
              <Plus className="mr-2 h-4 w-4" />
              Create HAP
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{person?.name || "Unknown"}</CardTitle>
              <CardDescription>
                {role?.name || "Unknown Role"} · {personHaps.length} agent{personHaps.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {personHaps.map((hap) => {
          const agentStory = stories?.find((s) => s.id === hap.agentStoryId);
          return (
            <AgentSection
              key={hap.id}
              hap={hap}
              agentStory={agentStory}
              isExpanded={expandedHapIds.has(hap.id)}
              onToggle={() => toggleHap(hap.id)}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
