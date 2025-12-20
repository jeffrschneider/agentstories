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
  Users,
  Plus,
  Trash2,
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
  createEmptyHAPState,
  calculateHAPPercentages,
  TASK_OWNER_METADATA,
} from "@/lib/schemas";
import type { TaskAssignment, TaskOwner, Person, Role, AgentStory } from "@/lib/schemas";

type WizardStep = "person" | "role" | "agent" | "tasks" | "review";

const STEPS: { key: WizardStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "person", label: "Select Person", icon: User },
  { key: "role", label: "Select Role", icon: Briefcase },
  { key: "agent", label: "Select Agent", icon: Bot },
  { key: "tasks", label: "Define Tasks", icon: Users },
  { key: "review", label: "Review", icon: Check },
];

export default function NewHAPPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("person");

  // Selection state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentStory | null>(null);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [notes, setNotes] = useState("");
  const [targetDate, setTargetDate] = useState("");

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
        return taskAssignments.length > 0 && taskAssignments.every((t) => t.taskName.trim());
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
      if (STEPS[nextIndex].key === "tasks" && taskAssignments.length === 0 && selectedRole) {
        const seededTasks: TaskAssignment[] = selectedRole.responsibilities.map((resp) => ({
          id: crypto.randomUUID(),
          taskName: resp.name,
          description: resp.description,
          currentOwner: "human" as TaskOwner,
          targetOwner: resp.aiCandidate ? "agent" : "human",
        }));
        setTaskAssignments(seededTasks);
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

    const asIsPercents = calculateHAPPercentages(taskAssignments, false);
    const toBePercents = calculateHAPPercentages(taskAssignments, true);

    await createHAP.mutateAsync({
      personId: selectedPerson.id,
      roleId: selectedRole.id,
      agentStoryId: selectedAgent.id,
      asIs: {
        taskAssignments,
        humanPercent: asIsPercents.humanPercent,
        agentPercent: asIsPercents.agentPercent,
        effectiveDate: new Date().toISOString(),
      },
      toBe: {
        taskAssignments,
        humanPercent: toBePercents.humanPercent,
        agentPercent: toBePercents.agentPercent,
      },
      transitionStatus: "planned",
      notes: notes || undefined,
      targetCompletionDate: targetDate ? new Date(targetDate).toISOString() : undefined,
    });

    router.push("/organization/haps");
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

  const updateTask = (index: number, updates: Partial<TaskAssignment>) => {
    const updated = [...taskAssignments];
    updated[index] = { ...updated[index], ...updates };
    setTaskAssignments(updated);
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
            <Link href="/organization/haps">
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
                    <h3 className="text-lg font-medium">Define Task Assignments</h3>
                    <p className="text-sm text-muted-foreground">
                      Specify who handles each task now (As-Is) and who should (To-Be)
                    </p>
                  </div>
                  <Button size="sm" onClick={addTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
                    <div className="col-span-4">Task</div>
                    <div className="col-span-3 text-center">As-Is (Current)</div>
                    <div className="col-span-3 text-center">To-Be (Target)</div>
                    <div className="col-span-2"></div>
                  </div>

                  {taskAssignments.map((task, index) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-12 gap-4 items-center p-2 rounded-lg bg-muted/50"
                    >
                      <div className="col-span-4">
                        <Input
                          value={task.taskName}
                          onChange={(e) =>
                            updateTask(index, { taskName: e.target.value })
                          }
                          placeholder="Task name"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={task.currentOwner}
                          onValueChange={(v) =>
                            updateTask(index, { currentOwner: v as TaskOwner })
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
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={task.targetOwner}
                          onValueChange={(v) =>
                            updateTask(index, { targetOwner: v as TaskOwner })
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
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTask(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {taskAssignments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tasks yet. Click &quot;Add Task&quot; to get started.
                    </div>
                  )}
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
                  <h4 className="font-medium">Task Assignments ({taskAssignments.length})</h4>
                  <div className="rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left">Task</th>
                          <th className="p-2 text-center">As-Is</th>
                          <th className="p-2 text-center">To-Be</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskAssignments.map((task) => (
                          <tr key={task.id} className="border-t">
                            <td className="p-2">{task.taskName}</td>
                            <td className="p-2 text-center">
                              <Badge variant="outline">
                                {TASK_OWNER_METADATA[task.currentOwner].label}
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant="outline">
                                {TASK_OWNER_METADATA[task.targetOwner].label}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Target Completion Date (Optional)</Label>
                    <Input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
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
