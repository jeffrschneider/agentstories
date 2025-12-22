"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  User,
  Save,
  Loader2,
  Plus,
  ArrowRight,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskResponsibilityGrid } from "@/components/hap";
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

  const { data: hap, isLoading } = useHAPDetail(id);
  const updateHAP = useUpdateHAP();

  const { data: person } = usePerson(hap?.personId || "");
  const { data: role } = useRole(hap?.roleId || "");
  const { data: agentStory } = useStory(hap?.agentStoryId || "", { trackView: false });

  const [editMode, setEditMode] = useState(false);
  const [tasks, setTasks] = useState<TaskResponsibility[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<HAPIntegrationStatus>("not_started");
  const [notes, setNotes] = useState("");

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
      data: { tasks, integrationStatus, notes },
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
            <Link href="/haps">Back to HAPs</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const distribution = calculatePhaseDistribution(editMode ? tasks : hap.tasks);
  const pendingCapabilities = hap.capabilityRequirements?.filter(
    r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
  ).length || 0;

  const getStatusColor = (status: HAPIntegrationStatus) => {
    const meta = INTEGRATION_STATUS_METADATA[status];
    const colorMap: Record<string, string> = {
      green: "bg-green-500",
      emerald: "bg-emerald-500",
      yellow: "bg-yellow-500",
      orange: "bg-orange-500",
      blue: "bg-blue-500",
    };
    return colorMap[meta.color] || "bg-gray-500";
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/haps">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(hap.integrationStatus)}`} />
                <Badge variant="outline">
                  {INTEGRATION_STATUS_METADATA[hap.integrationStatus].label}
                </Badge>
                {pendingCapabilities > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    {pendingCapabilities} capabilities pending
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                {person?.name || "Unknown"} + {agentStory?.name || "Unassigned Agent"}
              </h1>
              <p className="text-muted-foreground">{role?.name || "Unknown Role"}</p>
            </div>
          </div>
          {!editMode ? (
            <Button onClick={initEditState}>Edit HAP</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Person</CardTitle>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Agent Story</CardTitle>
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
                  <p className="font-medium">{agentStory?.name || "Unknown Agent"}</p>
                  <p className="text-sm text-muted-foreground">{agentStory?.skills?.length || 0} skills</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Responsibility Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Human: {distribution.humanPercent}%</span>
                  <span>Agent: {distribution.agentPercent}%</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div className="bg-blue-500" style={{ width: `${distribution.humanPercent}%` }} />
                  <div className="bg-purple-500" style={{ width: `${distribution.agentPercent}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Task Responsibilities</TabsTrigger>
            <TabsTrigger value="capabilities">Capability Requirements</TabsTrigger>
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
                    <Button size="sm" onClick={() => setTasks([...tasks, createEmptyTaskResponsibility("")])}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
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
                  <div className="mt-6 pt-4 border-t">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Capability Requirements</CardTitle>
                <CardDescription>Agent phases that need capabilities to be defined</CardDescription>
              </CardHeader>
              <CardContent>
                {hap.capabilityRequirements && hap.capabilityRequirements.length > 0 ? (
                  <div className="space-y-3">
                    {hap.capabilityRequirements.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{req.taskName}</p>
                          <p className="text-sm text-muted-foreground">
                            Phase: {RESPONSIBILITY_PHASE_METADATA[req.phase].label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Suggested capability: {req.suggestedCapabilityName}
                          </p>
                        </div>
                        <Badge variant={req.status === "applied" ? "default" : req.status === "ready" ? "secondary" : "outline"}>
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending capability requirements</p>
                    <p className="text-sm">Assign phases to the agent to generate capability requirements</p>
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
                      <Select value={integrationStatus} onValueChange={(v) => setIntegrationStatus(v as HAPIntegrationStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(INTEGRATION_STATUS_METADATA).map(([key, meta]) => (
                            <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Add notes..." />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Integration Status</Label>
                        <p className="font-medium">{INTEGRATION_STATUS_METADATA[hap.integrationStatus].label}</p>
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
                      <p className="mt-1">{new Date(hap.createdAt).toLocaleDateString()}</p>
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
