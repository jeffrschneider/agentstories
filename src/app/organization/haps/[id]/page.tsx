"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  User,
  Users,
  Save,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
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
  TASK_OWNER_METADATA,
  TRANSITION_STATUS_METADATA,
  calculateHAPPercentages,
} from "@/lib/schemas";
import type { TaskOwner, TransitionStatus, TaskAssignment } from "@/lib/schemas";

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
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [transitionStatus, setTransitionStatus] = useState<TransitionStatus>("not_started");
  const [notes, setNotes] = useState("");
  const [targetDate, setTargetDate] = useState("");

  // Initialize edit state when HAP loads
  const initEditState = () => {
    if (hap) {
      setTaskAssignments([...hap.asIs.taskAssignments]);
      setTransitionStatus(hap.transitionStatus);
      setNotes(hap.notes || "");
      setTargetDate(
        hap.targetCompletionDate
          ? new Date(hap.targetCompletionDate).toISOString().split("T")[0]
          : ""
      );
      setEditMode(true);
    }
  };

  const handleSave = async () => {
    if (!hap) return;

    const asIsPercents = calculateHAPPercentages(taskAssignments, false);
    const toBePercents = calculateHAPPercentages(taskAssignments, true);

    await updateHAP.mutateAsync({
      id: hap.id,
      data: {
        asIs: {
          ...hap.asIs,
          taskAssignments,
          humanPercent: asIsPercents.humanPercent,
          agentPercent: asIsPercents.agentPercent,
        },
        toBe: {
          ...hap.toBe,
          taskAssignments,
          humanPercent: toBePercents.humanPercent,
          agentPercent: toBePercents.agentPercent,
        },
        transitionStatus,
        notes,
        targetCompletionDate: targetDate
          ? new Date(targetDate).toISOString()
          : undefined,
      },
    });

    setEditMode(false);
  };

  const updateTaskOwner = (
    index: number,
    field: "currentOwner" | "targetOwner",
    value: TaskOwner
  ) => {
    const updated = [...taskAssignments];
    updated[index] = { ...updated[index], [field]: value };
    setTaskAssignments(updated);
  };

  const addTask = () => {
    setTaskAssignments([
      ...taskAssignments,
      {
        id: crypto.randomUUID(),
        taskName: "",
        currentOwner: "human",
        targetOwner: "human",
      },
    ]);
  };

  const removeTask = (index: number) => {
    setTaskAssignments(taskAssignments.filter((_, i) => i !== index));
  };

  const updateTaskName = (index: number, name: string) => {
    const updated = [...taskAssignments];
    updated[index] = { ...updated[index], taskName: name };
    setTaskAssignments(updated);
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

  // Calculate progress
  const tasksDone = hap.asIs.taskAssignments.filter(
    (t) => t.currentOwner === t.targetOwner
  ).length;
  const totalTasks = hap.asIs.taskAssignments.length;
  const progressPercent =
    totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

  const getOwnerIcon = (owner: TaskOwner) => {
    switch (owner) {
      case "human":
        return <User className="h-4 w-4 text-blue-500" />;
      case "agent":
        return <Bot className="h-4 w-4 text-purple-500" />;
      case "shared":
        return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: TransitionStatus) => {
    const meta = TRANSITION_STATUS_METADATA[status];
    switch (meta.color) {
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-500";
      case "red":
        return "bg-red-500";
      case "blue":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
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
                  className={`h-2 w-2 rounded-full ${getStatusColor(
                    hap.transitionStatus
                  )}`}
                />
                <Badge variant="outline">
                  {TRANSITION_STATUS_METADATA[hap.transitionStatus].label}
                </Badge>
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
                Transformation Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {tasksDone} of {totalTasks} tasks
                  </span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Task Assignments</TabsTrigger>
            <TabsTrigger value="comparison">As-Is vs To-Be</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Task Assignments</CardTitle>
                    <CardDescription>
                      Define who handles each task - current state and target state
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
                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
                    <div className="col-span-5">Task</div>
                    <div className="col-span-3 text-center">As-Is</div>
                    <div className="col-span-1 text-center"></div>
                    <div className="col-span-3 text-center">To-Be</div>
                  </div>

                  {/* Tasks */}
                  {(editMode ? taskAssignments : hap.asIs.taskAssignments).map(
                    (task, index) => (
                      <div
                        key={task.id}
                        className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg bg-muted/50"
                      >
                        <div className="col-span-5">
                          {editMode ? (
                            <Input
                              value={task.taskName}
                              onChange={(e) =>
                                updateTaskName(index, e.target.value)
                              }
                              placeholder="Task name"
                            />
                          ) : (
                            <span className="font-medium">{task.taskName}</span>
                          )}
                        </div>
                        <div className="col-span-3">
                          {editMode ? (
                            <Select
                              value={task.currentOwner}
                              onValueChange={(v) =>
                                updateTaskOwner(index, "currentOwner", v as TaskOwner)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="human">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Human
                                  </div>
                                </SelectItem>
                                <SelectItem value="agent">
                                  <div className="flex items-center gap-2">
                                    <Bot className="h-4 w-4" />
                                    Agent
                                  </div>
                                </SelectItem>
                                <SelectItem value="shared">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Shared
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              {getOwnerIcon(task.currentOwner)}
                              <span className="text-sm">
                                {TASK_OWNER_METADATA[task.currentOwner].label}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {task.currentOwner !== task.targetOwner ? (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                          {editMode ? (
                            <>
                              <Select
                                value={task.targetOwner}
                                onValueChange={(v) =>
                                  updateTaskOwner(index, "targetOwner", v as TaskOwner)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="human">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      Human
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="agent">
                                    <div className="flex items-center gap-2">
                                      <Bot className="h-4 w-4" />
                                      Agent
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="shared">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      Shared
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTask(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center justify-center gap-2 w-full">
                              {getOwnerIcon(task.targetOwner)}
                              <span className="text-sm">
                                {TASK_OWNER_METADATA[task.targetOwner].label}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {(editMode ? taskAssignments : hap.asIs.taskAssignments)
                    .length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tasks defined yet.{" "}
                      {editMode && "Click 'Add Task' to get started."}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    As-Is (Current State)
                  </CardTitle>
                  <CardDescription>
                    How responsibilities are currently distributed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Human</span>
                      <span className="font-medium">{hap.asIs.humanPercent}%</span>
                    </div>
                    <div className="h-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${hap.asIs.humanPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Agent</span>
                      <span className="font-medium">{hap.asIs.agentPercent}%</span>
                    </div>
                    <div className="h-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${hap.asIs.agentPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Task Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <User className="h-3 w-3 text-blue-500" />
                          Human tasks
                        </span>
                        <span>
                          {
                            hap.asIs.taskAssignments.filter(
                              (t) => t.currentOwner === "human"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <Bot className="h-3 w-3 text-purple-500" />
                          Agent tasks
                        </span>
                        <span>
                          {
                            hap.asIs.taskAssignments.filter(
                              (t) => t.currentOwner === "agent"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-green-500" />
                          Shared tasks
                        </span>
                        <span>
                          {
                            hap.asIs.taskAssignments.filter(
                              (t) => t.currentOwner === "shared"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    To-Be (Target State)
                  </CardTitle>
                  <CardDescription>
                    How responsibilities should be distributed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Human</span>
                      <span className="font-medium">{hap.toBe.humanPercent}%</span>
                    </div>
                    <div className="h-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${hap.toBe.humanPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Agent</span>
                      <span className="font-medium">{hap.toBe.agentPercent}%</span>
                    </div>
                    <div className="h-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${hap.toBe.agentPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Task Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <User className="h-3 w-3 text-blue-500" />
                          Human tasks
                        </span>
                        <span>
                          {
                            hap.asIs.taskAssignments.filter(
                              (t) => t.targetOwner === "human"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <Bot className="h-3 w-3 text-purple-500" />
                          Agent tasks
                        </span>
                        <span>
                          {
                            hap.asIs.taskAssignments.filter(
                              (t) => t.targetOwner === "agent"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-green-500" />
                          Shared tasks
                        </span>
                        <span>
                          {
                            hap.asIs.taskAssignments.filter(
                              (t) => t.targetOwner === "shared"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      <Label>Transition Status</Label>
                      <Select
                        value={transitionStatus}
                        onValueChange={(v) =>
                          setTransitionStatus(v as TransitionStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TRANSITION_STATUS_METADATA).map(
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
                      <Label>Target Completion Date</Label>
                      <Input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                      />
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
                          Transition Status
                        </Label>
                        <p className="font-medium">
                          {TRANSITION_STATUS_METADATA[hap.transitionStatus].label}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">
                          Target Completion
                        </Label>
                        <p className="font-medium">
                          {hap.targetCompletionDate
                            ? new Date(
                                hap.targetCompletionDate
                              ).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                    {hap.notes && (
                      <div>
                        <Label className="text-muted-foreground">Notes</Label>
                        <p className="mt-1">{hap.notes}</p>
                      </div>
                    )}
                    {hap.topBlockers && hap.topBlockers.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Blockers</Label>
                        <ul className="mt-1 space-y-1">
                          {hap.topBlockers.map((blocker, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-red-600"
                            >
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              {blocker}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
