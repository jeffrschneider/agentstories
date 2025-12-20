"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  User,
  Save,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  ArrowRight,
  Target,
  FileText,
  Play,
  Timer,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useHAPDetail,
  useUpdateHAP,
  usePerson,
  useRole,
  useStory,
} from "@/hooks";
import {
  INTEGRATION_STATUS_METADATA,
  RESPONSIBILITY_PHASE_METADATA,
  PHASE_OWNER_METADATA,
  RESPONSIBILITY_PRESETS,
  calculatePhaseDistribution,
  createEmptyTaskResponsibility,
} from "@/lib/schemas";
import type {
  HAPIntegrationStatus,
  TaskResponsibility,
  ResponsibilityPhase,
  PhaseOwner,
  ResponsibilityPreset,
} from "@/lib/schemas";

export default function HAPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: hap, isLoading } = useHAPDetail(id);
  const updateHAP = useUpdateHAP();

  const { data: person } = usePerson(hap?.personId || "");
  const { data: role } = useRole(hap?.roleId || "");
  const { data: agentStory } = useStory(hap?.agentStoryId || "", { trackView: false });

  const [editMode, setEditMode] = useState(false);
  const [tasks, setTasks] = useState<TaskResponsibility[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<HAPIntegrationStatus>("not_started");
  const [notes, setNotes] = useState("");

  // Initialize edit state when HAP loads
  const initEditState = () => {
    if (hap) {
      setTasks([...hap.tasks]);
      setIntegrationStatus(hap.integrationStatus);
      setNotes(hap.notes || "");
      setEditMode(true);
    }
  };

  const handleSave = async () => {
    if (!hap) return;

    await updateHAP.mutateAsync({
      id: hap.id,
      data: {
        tasks,
        integrationStatus,
        notes,
      },
    });

    setEditMode(false);
  };

  const updatePhaseOwner = (
    taskIndex: number,
    phase: ResponsibilityPhase,
    owner: PhaseOwner
  ) => {
    const updated = [...tasks];
    updated[taskIndex] = {
      ...updated[taskIndex],
      phases: {
        ...updated[taskIndex].phases,
        [phase]: {
          ...updated[taskIndex].phases[phase],
          owner,
        },
      },
    };
    setTasks(updated);
  };

  const applyPresetToTask = (taskIndex: number, preset: ResponsibilityPreset) => {
    const updated = [...tasks];
    const presetConfig = RESPONSIBILITY_PRESETS[preset];
    updated[taskIndex] = {
      ...updated[taskIndex],
      phases: {
        manage: { ...updated[taskIndex].phases.manage, owner: presetConfig.phases.manage },
        define: { ...updated[taskIndex].phases.define, owner: presetConfig.phases.define },
        perform: { ...updated[taskIndex].phases.perform, owner: presetConfig.phases.perform },
        review: { ...updated[taskIndex].phases.review, owner: presetConfig.phases.review },
      },
    };
    setTasks(updated);
  };

  const addTask = () => {
    setTasks([...tasks, createEmptyTaskResponsibility("")]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTaskName = (index: number, name: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], taskName: name };
    setTasks(updated);
  };

  if (isLoading) {
    return (
      <AppShell className="p-6">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!hap) {
    return (
      <AppShell className="p-6">
        <div className="mx-auto max-w-4xl text-center py-24">
          <h2 className="text-xl font-semibold">HAP not found</h2>
          <Button className="mt-4" asChild>
            <Link href="/organization/haps">Back to HAPs</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  // Calculate distribution
  const distribution = calculatePhaseDistribution(editMode ? tasks : hap.tasks);
  const pendingSkills = hap.skillRequirements?.filter(
    r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
  ).length || 0;

  const getStatusColor = (status: HAPIntegrationStatus) => {
    const meta = INTEGRATION_STATUS_METADATA[status];
    switch (meta.color) {
      case "green":
        return "bg-green-500";
      case "emerald":
        return "bg-emerald-500";
      case "yellow":
        return "bg-yellow-500";
      case "orange":
        return "bg-orange-500";
      case "blue":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPhaseIcon = (phase: ResponsibilityPhase) => {
    switch (phase) {
      case "manage":
        return <Target className="h-4 w-4" />;
      case "define":
        return <FileText className="h-4 w-4" />;
      case "perform":
        return <Play className="h-4 w-4" />;
      case "review":
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/organization/haps">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${getStatusColor(hap.integrationStatus)}`}
                />
                <Badge variant="outline">
                  {INTEGRATION_STATUS_METADATA[hap.integrationStatus].label}
                </Badge>
                {pendingSkills > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    {pendingSkills} skills pending
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                {person?.name || "Unknown"} + AI Agent
              </h1>
              <p className="text-muted-foreground">{role?.name || "Unknown Role"}</p>
            </div>
          </div>
          {!editMode ? (
            <Button onClick={initEditState}>Edit HAP</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateHAP.isPending}>
                {updateHAP.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Person
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{person?.name}</p>
                  <p className="text-sm text-muted-foreground">{person?.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agent Story
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/stories/${hap?.agentStoryId}`}
                className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {agentStory?.name || "Unknown Agent"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {agentStory?.skills?.length || 0} skills
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Responsibility Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Human: {distribution.humanPercent}%</span>
                  <span>Agent: {distribution.agentPercent}%</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${distribution.humanPercent}%` }}
                  />
                  <div
                    className="bg-purple-500"
                    style={{ width: `${distribution.agentPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Task Responsibilities</TabsTrigger>
            <TabsTrigger value="skills">Skill Requirements</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Task Responsibilities</CardTitle>
                    <CardDescription>
                      Define who handles each phase: Manage, Define, Perform, Review
                    </CardDescription>
                  </div>
                  {editMode && (
                    <Button size="sm" onClick={addTask}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                    <div className="col-span-3">Task</div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="h-3 w-3" />
                        Manage
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />
                        Define
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Play className="h-3 w-3" />
                        Perform
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Review
                      </div>
                    </div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Tasks */}
                  {(editMode ? tasks : hap.tasks).map((task, index) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/50"
                    >
                      <div className="col-span-3">
                        {editMode ? (
                          <Input
                            value={task.taskName}
                            onChange={(e) => updateTaskName(index, e.target.value)}
                            placeholder="Task name"
                          />
                        ) : (
                          <span className="font-medium">{task.taskName}</span>
                        )}
                      </div>
                      {(["manage", "define", "perform", "review"] as ResponsibilityPhase[]).map(
                        (phase) => (
                          <div key={phase} className="col-span-2">
                            {editMode ? (
                              <Select
                                value={task.phases[phase].owner}
                                onValueChange={(v) =>
                                  updatePhaseOwner(index, phase, v as PhaseOwner)
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="human">
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3 text-blue-500" />
                                      Human
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="agent">
                                    <div className="flex items-center gap-1">
                                      <Bot className="h-3 w-3 text-purple-500" />
                                      Agent
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                {task.phases[phase].owner === "human" ? (
                                  <User className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Bot className="h-4 w-4 text-purple-500" />
                                )}
                                <span className="text-xs">
                                  {PHASE_OWNER_METADATA[task.phases[phase].owner].label}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      )}
                      <div className="col-span-1 flex justify-end">
                        {editMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeTask(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {(editMode ? tasks : hap.tasks).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tasks defined yet.{" "}
                      {editMode && "Click 'Add Task' to get started."}
                    </div>
                  )}
                </div>

                {/* Presets (in edit mode) */}
                {editMode && tasks.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <Label className="text-sm">Quick Apply Preset to All Tasks</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(RESPONSIBILITY_PRESETS).map(([key, preset]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            tasks.forEach((_, i) => applyPresetToTask(i, key as ResponsibilityPreset));
                          }}
                        >
                          {preset.label} ({preset.pattern})
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skill Requirements</CardTitle>
                <CardDescription>
                  Agent phases that need skills to be defined
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hap.skillRequirements && hap.skillRequirements.length > 0 ? (
                  <div className="space-y-3">
                    {hap.skillRequirements.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{req.taskName}</p>
                          <p className="text-sm text-muted-foreground">
                            Phase: {RESPONSIBILITY_PHASE_METADATA[req.phase].label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Suggested skill: {req.suggestedSkillName}
                          </p>
                        </div>
                        <Badge
                          variant={
                            req.status === "applied"
                              ? "default"
                              : req.status === "ready"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending skill requirements</p>
                    <p className="text-sm">
                      Assign phases to the agent to generate skill requirements
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>HAP Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode ? (
                  <>
                    <div className="space-y-2">
                      <Label>Integration Status</Label>
                      <Select
                        value={integrationStatus}
                        onValueChange={(v) =>
                          setIntegrationStatus(v as HAPIntegrationStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(INTEGRATION_STATUS_METADATA).map(
                            ([key, meta]) => (
                              <SelectItem key={key} value={key}>
                                {meta.label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Add notes about this HAP..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">
                          Integration Status
                        </Label>
                        <p className="font-medium">
                          {INTEGRATION_STATUS_METADATA[hap.integrationStatus].label}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tasks</Label>
                        <p className="font-medium">{hap.tasks.length} defined</p>
                      </div>
                    </div>
                    {hap.notes && (
                      <div>
                        <Label className="text-muted-foreground">Notes</Label>
                        <p className="mt-1">{hap.notes}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p className="mt-1">
                        {new Date(hap.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
