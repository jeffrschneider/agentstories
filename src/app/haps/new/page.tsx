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
  Target,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  WizardSteps,
  PersonCard,
  RoleCard,
  AgentCard,
  SelectionGrid,
  TaskResponsibilityGrid,
  TaskResponsibilityTable,
  type WizardStep,
} from "@/components/hap";
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

type WizardStepKey = "person" | "role" | "agent" | "tasks" | "review";

const STEPS: WizardStep[] = [
  { key: "person", label: "Select Person", icon: User },
  { key: "role", label: "Select Role", icon: Briefcase },
  { key: "agent", label: "Select Agent", icon: Bot },
  { key: "tasks", label: "Define Tasks", icon: Target },
  { key: "review", label: "Review", icon: Check },
];

export default function NewHAPPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStepKey>("person");

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
          const preset: ResponsibilityPreset = resp.aiCandidate ? 'human-controlled' : 'human-only';
          const task = createTaskFromPreset(resp.name, preset);
          task.description = resp.description;
          return task;
        });
        setTasks(seededTasks);
      }
      setCurrentStep(STEPS[nextIndex].key as WizardStepKey);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key as WizardStepKey);
    }
  };

  const handleCreate = async () => {
    if (!selectedPerson || !selectedRole || !selectedAgent) return;

    await createHAP.mutateAsync({
      personId: selectedPerson.id,
      roleId: selectedRole.id,
      agentStoryId: selectedAgent.id,
      tasks,
      capabilityRequirements: [],
      integrationStatus: "planning",
      notes: notes || undefined,
    });

    router.push("/haps");
  };

  const getDeptName = (deptId: string) => {
    return departments?.find((d) => d.id === deptId)?.name || "Unknown";
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
            <h1 className="text-2xl font-bold tracking-tight">Create Human-Agent Pair</h1>
            <p className="text-muted-foreground">
              Define how a person and AI agent will share responsibilities
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <WizardSteps steps={STEPS} currentStepIndex={currentStepIndex} />

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
                <SelectionGrid
                  items={people}
                  isLoading={peopleLoading}
                  keyExtractor={(p) => p.id}
                  renderCard={(person) => (
                    <PersonCard
                      person={person}
                      isSelected={selectedPerson?.id === person.id}
                      onSelect={setSelectedPerson}
                      getDeptName={getDeptName}
                    />
                  )}
                />
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
                <SelectionGrid
                  items={roles}
                  isLoading={rolesLoading}
                  keyExtractor={(r) => r.id}
                  renderCard={(role) => (
                    <RoleCard
                      role={role}
                      isSelected={selectedRole?.id === role.id}
                      onSelect={setSelectedRole}
                    />
                  )}
                />
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
                <SelectionGrid
                  items={stories}
                  isLoading={storiesLoading}
                  keyExtractor={(s) => s.id}
                  renderCard={(agent) => (
                    <AgentCard
                      agent={agent}
                      isSelected={selectedAgent?.id === agent.id}
                      onSelect={setSelectedAgent}
                    />
                  )}
                />
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
                  <Button size="sm" onClick={() => setTasks([...tasks, createEmptyTaskResponsibility("")])}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>

                <TaskResponsibilityGrid
                  tasks={tasks}
                  editMode
                  compact
                  onUpdateTask={(index, updates) => {
                    const updated = [...tasks];
                    updated[index] = { ...updated[index], ...updates };
                    setTasks(updated);
                  }}
                  onUpdatePhaseOwner={updatePhaseOwner}
                  onApplyPreset={applyPresetToTask}
                  onRemoveTask={(index) => setTasks(tasks.filter((_, i) => i !== index))}
                />
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
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-1">Person</p>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">{selectedPerson?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-1">Role</p>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-green-500" />
                        <span className="font-medium">{selectedRole?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-1">Agent</p>
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">{selectedAgent?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Task Responsibilities ({tasks.length})</h4>
                  <TaskResponsibilityTable tasks={tasks} />
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
          <Button variant="outline" onClick={goBack} disabled={currentStepIndex === 0}>
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
