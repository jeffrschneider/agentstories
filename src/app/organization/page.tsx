"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Briefcase,
  UserCircle,
  Plus,
  Bot,
  User,
  ArrowRight,
  ChevronDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteDomain,
  useDeleteDepartment,
  useDeleteRole,
  useDeletePerson,
  useStories,
  useHAPDetail,
  usePerson,
  useRole,
  useRoles,
  useHAPs,
} from "@/hooks";
import { TaskResponsibilityGrid } from "@/components/hap";
import { calculatePhaseDistribution } from "@/lib/schemas";
import type { BusinessDomain, Department, Role, Person, AgentStory } from "@/lib/schemas";
import {
  DomainDialog,
  DepartmentDialog,
  RoleDialog,
  PersonDialog,
  DeleteConfirmationDialog,
  OrgTreeView,
} from "@/components/organization";

type EntityType = "domain" | "department" | "role" | "person";

interface DeleteState {
  type: EntityType;
  id: string;
  name: string;
}

// Agents Panel Component for Role Selection
interface AgentsPanelProps {
  selectedRoleId: string | null;
  roles?: Role[];
  haps?: { id: string; roleId: string; agentStoryId: string }[];
  stories?: AgentStory[];
}

function AgentsPanel({ selectedRoleId, roles, haps, stories }: AgentsPanelProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  // Get the selected role
  const selectedRole = roles?.find((r) => r.id === selectedRoleId);

  // Get HAPs for the selected role
  const roleHaps = haps?.filter((h) => h.roleId === selectedRoleId) || [];

  // Get unique agent stories for the role
  const roleAgents = roleHaps
    .map((hap) => stories?.find((s) => s.id === hap.agentStoryId))
    .filter((story): story is AgentStory => !!story)
    .filter((story, index, arr) => arr.findIndex((s) => s.id === story.id) === index);

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  if (!selectedRoleId) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Select a Role or Employee</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Click on a role to see associated agents, or an employee to see their task responsibilities
          </p>
        </CardContent>
      </Card>
    );
  }

  if (roleAgents.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{selectedRole?.name}</CardTitle>
          <CardDescription>Associated Agents</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No agents assigned to this role
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{selectedRole?.name}</CardTitle>
        <CardDescription>{roleAgents.length} agent{roleAgents.length !== 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {roleAgents.map((agent) => {
          const isExpanded = expandedAgents.has(agent.id);
          const capabilities = agent.skills || [];

          return (
            <div key={agent.id} className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAgent(agent.id)}
                className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    {agent.role && (
                      <div className="text-xs text-muted-foreground">{agent.role}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {capabilities.length} skill{capabilities.length !== 1 ? "s" : ""}
                  </Badge>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {isExpanded && capabilities.length > 0 && (
                <div className="border-t px-3 py-2 bg-muted/20">
                  <div className="space-y-1.5">
                    {capabilities.map((skill, idx) => (
                      <div key={skill.id || idx} className="text-xs">
                        <div className="font-medium text-muted-foreground">
                          {skill.name}
                        </div>
                        {skill.description && (
                          <div className="text-[11px] text-muted-foreground/70 line-clamp-2">
                            {skill.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isExpanded && capabilities.length === 0 && (
                <div className="border-t px-3 py-2 bg-muted/20">
                  <p className="text-xs text-muted-foreground italic">
                    No skills defined yet
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Task Responsibilities Panel Component
interface TaskResponsibilitiesPanelProps {
  selectedPersonId: string | null;
  selectedRoleId: string | null;
  selectedHapId?: string | null;
}

function TaskResponsibilitiesPanel({
  selectedPersonId,
  selectedRoleId,
  selectedHapId,
}: TaskResponsibilitiesPanelProps) {
  const { data: person } = usePerson(selectedPersonId || "");
  const { data: role } = useRole(selectedRoleId || "");
  const { data: hap } = useHAPDetail(selectedHapId || "");
  const { data: stories } = useStories();

  const agentStory = hap ? stories?.find((s) => s.id === hap.agentStoryId) : undefined;

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

  if (!hap) {
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

  const distribution = calculatePhaseDistribution(hap.tasks);

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
              <CardDescription>{role?.name || "Unknown Role"}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/haps/${hap.id}`}>
              View HAP Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Agent Story Info */}
        {agentStory && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{agentStory.name}</p>
              <p className="text-xs text-muted-foreground">{agentStory.skills?.length || 0} skills</p>
            </div>
          </div>
        )}

        {/* Distribution Summary */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Human: {distribution.humanPercent}%</span>
            <span>Agent: {distribution.agentPercent}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-blue-500" style={{ width: `${distribution.humanPercent}%` }} />
            <div className="bg-purple-500" style={{ width: `${distribution.agentPercent}%` }} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Task Responsibilities</h4>
        </div>
        {hap.tasks.length > 0 ? (
          <TaskResponsibilityGrid tasks={hap.tasks} />
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No tasks defined yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrganizationPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedHapId, setSelectedHapId] = useState<string | null>(null);

  // Dialog states
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit states
  const [editingDomain, setEditingDomain] = useState<BusinessDomain | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);

  // Data for panels
  const { data: allRoles } = useRoles();
  const { data: allHaps } = useHAPs();
  const { data: stories } = useStories();

  // Delete mutations
  const deleteDomain = useDeleteDomain();
  const deleteDepartment = useDeleteDepartment();
  const deleteRole = useDeleteRole();
  const deletePerson = useDeletePerson();

  const isDeleting =
    deleteDomain.isPending ||
    deleteDepartment.isPending ||
    deleteRole.isPending ||
    deletePerson.isPending;

  // Dialog handlers
  const openAddDomain = () => {
    setEditingDomain(null);
    setDomainDialogOpen(true);
  };

  const openEditDomain = (domain: BusinessDomain) => {
    setEditingDomain(domain);
    setDomainDialogOpen(true);
  };

  const openAddDepartment = () => {
    setEditingDepartment(null);
    setDepartmentDialogOpen(true);
  };

  const openEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentDialogOpen(true);
  };

  const openAddRole = () => {
    setEditingRole(null);
    setRoleDialogOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleDialogOpen(true);
  };

  const openAddPerson = () => {
    setEditingPerson(null);
    setPersonDialogOpen(true);
  };

  const openEditPerson = (person: Person) => {
    setEditingPerson(person);
    setPersonDialogOpen(true);
  };

  const openDeleteDialog = (type: EntityType, id: string, name: string) => {
    setDeleteState({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteState) return;

    try {
      switch (deleteState.type) {
        case "domain":
          await deleteDomain.mutateAsync({ id: deleteState.id, name: deleteState.name });
          break;
        case "department":
          await deleteDepartment.mutateAsync({ id: deleteState.id, name: deleteState.name });
          break;
        case "role":
          await deleteRole.mutateAsync({ id: deleteState.id, name: deleteState.name });
          break;
        case "person":
          await deletePerson.mutateAsync({ id: deleteState.id, name: deleteState.name });
          break;
      }
      setDeleteDialogOpen(false);
      setDeleteState(null);
    } catch {
      // Error handling is done in the mutation hooks
    }
  };

  const getDeleteDescription = () => {
    if (!deleteState) return "";
    switch (deleteState.type) {
      case "domain":
        return "Deleting this domain will also delete all departments, roles, and people within it.";
      case "department":
        return "Deleting this department will also remove all roles and people associations.";
      case "role":
        return "Deleting this role will remove it from all people assignments.";
      case "person":
        return "Deleting this person will remove all their role assignments and HAPs.";
      default:
        return "";
    }
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
            <p className="text-muted-foreground">
              Manage domains, departments, roles, and people
            </p>
          </div>
          <div className="flex gap-2">
            {/* Add Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Add New</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openAddDomain}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Domain
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openAddDepartment}>
                  <Users className="mr-2 h-4 w-4" />
                  Department
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openAddRole}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Role
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openAddPerson}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Person
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" asChild>
              <Link href="/haps">
                <Bot className="mr-2 h-4 w-4" />
                View HAPs
              </Link>
            </Button>
          </div>
        </div>

        {/* Tree View with Task Responsibilities Panel */}
        <div className="flex gap-4">
          {/* Tree Panel - 27% width */}
          <div className="w-[27%]">
            <OrgTreeView
              onSelectRole={(roleId) => {
                setSelectedRoleId(roleId);
                setSelectedPersonId(null);
                setSelectedHapId(null);
              }}
              onSelectPerson={(personId, roleId, hapId) => {
                setSelectedPersonId(personId);
                setSelectedRoleId(roleId);
                setSelectedHapId(hapId || null);
              }}
              selectedRoleId={selectedRoleId}
              selectedPersonId={selectedPersonId}
            />
          </div>

          {/* Right Panel - 73% width */}
          <div className="w-[73%]">
            {selectedPersonId ? (
              <TaskResponsibilitiesPanel
                selectedPersonId={selectedPersonId}
                selectedRoleId={selectedRoleId}
                selectedHapId={selectedHapId}
              />
            ) : (
              <AgentsPanel
                selectedRoleId={selectedRoleId}
                roles={allRoles}
                haps={allHaps}
                stories={stories}
              />
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DomainDialog
        open={domainDialogOpen}
        onOpenChange={setDomainDialogOpen}
        domain={editingDomain}
      />

      <DepartmentDialog
        open={departmentDialogOpen}
        onOpenChange={setDepartmentDialogOpen}
        department={editingDepartment}
      />

      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
      />

      <PersonDialog
        open={personDialogOpen}
        onOpenChange={setPersonDialogOpen}
        person={editingPerson}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${deleteState?.type || ""}`}
        description={getDeleteDescription()}
        itemName={deleteState?.name || ""}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </AppShell>
  );
}
