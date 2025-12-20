"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  User,
  Briefcase,
  Check,
  Loader2,
  Plus,
  Trash2,
  Target,
  FileText,
  Play,
  CheckCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePeople,
  useRoles,
  useStories,
  useCreateHAP,
  useDepartments,
} from "@/hooks";
import {
  createEmptyTaskResponsibility,
  createTaskFromPreset,
  RESPONSIBILITY_PRESETS,
  PHASE_OWNER_METADATA,
} from "@/lib/schemas";
import type {
  TaskResponsibility,
  PhaseOwner,
  ResponsibilityPhase,
  ResponsibilityPreset,
  Person,
  Role,
  AgentStory,
} from "@/lib/schemas";

type WizardStep = "person" | "role" | "agent" | "tasks" | "review";

const STEPS: { key: WizardStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "person", label: "Select Person", icon: User },
  { key: "role", label: "Select Role", icon: Briefcase },
  { key: "agent", label: "Select Agent", icon: Bot },
  { key: "tasks", label: "Define Tasks", icon: Target },
  { key: "review", label: "Review", icon: Check },
];

export default function NewHAPPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("person");

  // Selection state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentStory | null>(null);
  const [tasks, setTasks] = useState<TaskResponsibility[]>([]);
  const [notes, setNotes] = useState("");

  // Data fetching
  const { data: people, isLoading: peopleLoading } = usePeople();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: stories, isLoading: storiesLoading } = useStories();
  const { data: departments } = useDepartments();
  const createHAP = useCreateHAP();

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case "person":
        return selectedPerson !== null;
      case "role":
        return selectedRole !== null;
      case "agent":
        return selectedAgent !== null;
      case "tasks":
        return tasks.length > 0 && tasks.every((t) => t.taskName.trim());
      case "review":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      // If moving to tasks step and no tasks yet, seed from role responsibilities
      if (STEPS[nextIndex].key === "tasks" && tasks.length === 0 && selectedRole) {
        const seededTasks: TaskResponsibility[] = selectedRole.responsibilities.map((resp) => {
          // Use human-controlled preset for AI candidates, human-only for others
          const preset: ResponsibilityPreset = resp.aiCandidate ? 'human-controlled' : 'human-only';
          const task = createTaskFromPreset(resp.name, preset);
          task.description = resp.description;
          return task;
        });
        setTasks(seededTasks);
      }
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  const handleCreate = async () => {
    if (!selectedPerson || !selectedRole || !selectedAgent) return;

    await createHAP.mutateAsync({
      personId: selectedPerson.id,
      roleId: selectedRole.id,
      agentStoryId: selectedAgent.id,
      tasks,
      skillRequirements: [],
      integrationStatus: "planning",
      notes: notes || undefined,
    });

    router.push("/haps");
  };

  const addTask = () => {
    setTasks([...tasks, createEmptyTaskResponsibility("")]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, updates: Partial<TaskResponsibility>) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], ...updates };
    setTasks(updated);
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

  const getDeptName = (deptId: string) => {
    return departments?.find((d) => d.id === deptId)?.name || "Unknown";
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/haps">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create Human-Agent Pair
            </h1>
            <p className="text-muted-foreground">
              Define how a person and AI agent will share responsibilities
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${
                  index <= currentStepIndex
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    index < currentStepIndex
                      ? "bg-primary border-primary text-primary-foreground"
                      : index === currentStepIndex
                      ? "border-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-8 md:w-16 ${
                    index < currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {currentStep === "person" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Select a Person</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose who will be part of this Human-Agent Pair
                  </p>
                </div>
                {peopleLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {people?.map((person) => (
                      <Card
                        key={person.id}
                        className={`cursor-pointer transition-colors ${
                          selectedPerson?.id === person.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedPerson(person)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              {person.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{person.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {person.title}
                              </p>
                            </div>
                            {selectedPerson?.id === person.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {getDeptName(person.departmentId)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === "role" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Select a Role</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which role will be shared with the AI agent
                  </p>
                </div>
                {rolesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {roles?.map((role) => (
                      <Card
                        key={role.id}
                        className={`cursor-pointer transition-colors ${
                          selectedRole?.id === role.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedRole(role)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{role.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {role.description}
                              </p>
                            </div>
                            {selectedRole?.id === role.id && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {role.responsibilities.length} responsibilities
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {role.responsibilities.filter((r) => r.aiCandidate).length}{" "}
                              AI candidates
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === "agent" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Select an Agent</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which AI agent will partner with {selectedPerson?.name}
                  </p>
                </div>
                {storiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {stories?.map((story) => (
                      <Card
                        key={story.id}
                        className={`cursor-pointer transition-colors ${
                          selectedAgent?.id === story.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedAgent(story)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                <Bot className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">{story.name}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {story.role}
                                </p>
                              </div>
                            </div>
                            {selectedAgent?.id === story.id && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {story.skills?.length || 0} skills
                            </Badge>
                            {story.autonomyLevel && (
                              <Badge variant="secondary" className="text-xs">
                                {story.autonomyLevel}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === "tasks" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Define Task Responsibilities</h3>
                    <p className="text-sm text-muted-foreground">
                      For each task, specify who handles each phase: Manage, Define, Perform, Review
                    </p>
                  </div>
                  <Button size="sm" onClick={addTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>

                {/* Preset quick apply */}
                {tasks.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground mr-2">Apply to all:</span>
                    {Object.entries(RESPONSIBILITY_PRESETS).slice(0, 4).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          tasks.forEach((_, i) => applyPresetToTask(i, key as ResponsibilityPreset));
                        }}
                      >
                        {preset.pattern}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                    <div className="col-span-3">Task</div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="h-3 w-3" />
                        M
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />
                        D
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Play className="h-3 w-3" />
                        P
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        R
                      </div>
                    </div>
                    <div className="col-span-1"></div>
                  </div>

                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/50"
                    >
                      <div className="col-span-3">
                        <Input
                          value={task.taskName}
                          onChange={(e) =>
                            updateTask(index, { taskName: e.target.value })
                          }
                          placeholder="Task name"
                        />
                      </div>
                      {(["manage", "define", "perform", "review"] as ResponsibilityPhase[]).map(
                        (phase) => (
                          <div key={phase} className="col-span-2">
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
                                    H
                                  </div>
                                </SelectItem>
                                <SelectItem value="agent">
                                  <div className="flex items-center gap-1">
                                    <Bot className="h-3 w-3 text-purple-500" />
                                    A
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      )}
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeTask(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tasks yet. Click &quot;Add Task&quot; to get started.
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <p><strong>M</strong> = Manage (set goals/priorities) | <strong>D</strong> = Define (specify requirements) | <strong>P</strong> = Perform (execute) | <strong>R</strong> = Review (validate)</p>
                  <p className="mt-1"><strong>H</strong> = Human | <strong>A</strong> = Agent</p>
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Review Your HAP</h3>
                  <p className="text-sm text-muted-foreground">
                    Confirm the details before creating
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Person
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">{selectedPerson?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Role
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-green-500" />
                        <span className="font-medium">{selectedRole?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Agent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">{selectedAgent?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Task Responsibilities ({tasks.length})</h4>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left">Task</th>
                          <th className="p-2 text-center">Manage</th>
                          <th className="p-2 text-center">Define</th>
                          <th className="p-2 text-center">Perform</th>
                          <th className="p-2 text-center">Review</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr key={task.id} className="border-t">
                            <td className="p-2">{task.taskName}</td>
                            {(["manage", "define", "perform", "review"] as ResponsibilityPhase[]).map(
                              (phase) => (
                                <td key={phase} className="p-2 text-center">
                                  {task.phases[phase].owner === "human" ? (
                                    <User className="h-4 w-4 text-blue-500 inline" />
                                  ) : (
                                    <Bot className="h-4 w-4 text-purple-500 inline" />
                                  )}
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this HAP..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep === "review" ? (
            <Button onClick={handleCreate} disabled={createHAP.isPending}>
              {createHAP.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Create HAP
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
