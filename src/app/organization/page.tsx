"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Briefcase,
  UserCircle,
  ChevronRight,
  Plus,
  Loader2,
  Bot,
  LayoutGrid,
  GitBranch,
  User,
  Cpu,
  MoreVertical,
  Pencil,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  useDomains,
  useDepartments,
  useRoles,
  usePeople,
  useHAPs,
  useHAPStats,
  useDeleteDomain,
  useDeleteDepartment,
  useDeleteRole,
  useDeletePerson,
} from "@/hooks";
import { INTEGRATION_STATUS_METADATA, calculatePhaseDistribution } from "@/lib/schemas";
import type { HAPIntegrationStatus, BusinessDomain, Department, Role, Person } from "@/lib/schemas";
import {
  OrgChart,
  OrgSummary,
  DomainDialog,
  DepartmentDialog,
  RoleDialog,
  PersonDialog,
  DeleteConfirmationDialog,
} from "@/components/organization";

type EntityType = "domain" | "department" | "role" | "person";

interface DeleteState {
  type: EntityType;
  id: string;
  name: string;
}

export default function OrganizationPage() {
  const [viewMode, setViewMode] = useState<"overview" | "browse">("overview");
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

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

  const { data: domains, isLoading: domainsLoading } = useDomains();
  const { data: allDepartments } = useDepartments();
  const { data: departments, isLoading: deptsLoading } = useDepartments(
    selectedDomainId || undefined
  );
  const { data: allRoles } = useRoles();
  const { data: roles, isLoading: rolesLoading } = useRoles(
    selectedDeptId || undefined
  );
  const { data: allPeople } = usePeople();
  const { data: people, isLoading: peopleLoading } = usePeople(
    selectedDeptId || undefined
  );
  const { data: allHAPs } = useHAPs();
  const { data: haps } = useHAPs(
    selectedDeptId ? { departmentId: selectedDeptId } : undefined
  );
  const { data: stats } = useHAPStats();

  // Delete mutations
  const deleteDomain = useDeleteDomain();
  const deleteDepartment = useDeleteDepartment();
  const deleteRole = useDeleteRole();
  const deletePerson = useDeletePerson();

  const selectedDomain = domains?.find((d) => d.id === selectedDomainId);
  const selectedDept = departments?.find((d) => d.id === selectedDeptId);

  const isDeleting =
    deleteDomain.isPending ||
    deleteDepartment.isPending ||
    deleteRole.isPending ||
    deletePerson.isPending;

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
          if (selectedDomainId === deleteState.id) {
            setSelectedDomainId(null);
            setSelectedDeptId(null);
          }
          break;
        case "department":
          await deleteDepartment.mutateAsync({ id: deleteState.id, name: deleteState.name });
          if (selectedDeptId === deleteState.id) {
            setSelectedDeptId(null);
          }
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

            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "overview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("overview")}
                className="rounded-none"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Overview
              </Button>
              <Button
                variant={viewMode === "browse" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("browse")}
                className="rounded-none"
              >
                <GitBranch className="mr-2 h-4 w-4" />
                Browse
              </Button>
            </div>
            <Button variant="outline" asChild>
              <Link href="/haps">
                <Bot className="mr-2 h-4 w-4" />
                View HAPs
              </Link>
            </Button>
          </div>
        </div>

        {/* Overview Mode */}
        {viewMode === "overview" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {domains && allDepartments && allRoles && allPeople && allHAPs && (
              <OrgSummary
                domains={domains}
                departments={allDepartments}
                roles={allRoles}
                people={allPeople}
                haps={allHAPs}
              />
            )}

            {/* Org Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Hierarchy</CardTitle>
                <CardDescription>
                  Explore domains, departments, roles, and Human-Agent Pairs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {domainsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : domains && allDepartments && allRoles && allPeople && allHAPs ? (
                  <OrgChart
                    domains={domains}
                    departments={allDepartments}
                    roles={allRoles}
                    people={allPeople}
                    haps={allHAPs}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No organization data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Browse Mode */}
        {viewMode === "browse" && (
          <>
            {/* Stats Overview */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{stats.domainCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Domains</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{stats.departmentCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Departments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{stats.roleCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Roles</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{stats.peopleCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">People</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{stats.hapCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Human-Agent Pairs</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => {
                  setSelectedDomainId(null);
                  setSelectedDeptId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                All Domains
              </button>
              {selectedDomain && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <button
                    onClick={() => setSelectedDeptId(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {selectedDomain.name}
                  </button>
                </>
              )}
              {selectedDept && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedDept.name}</span>
                </>
              )}
            </div>

            {/* Main Content */}
            {!selectedDomainId ? (
              // Domain List
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Business Domains</h2>
                  <Button size="sm" onClick={openAddDomain}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Domain
                  </Button>
                </div>
                {domainsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : domains && domains.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {domains.map((domain) => {
                      const deptCount =
                        allDepartments?.filter((d) => d.domainId === domain.id).length || 0;
                      return (
                        <Card
                          key={domain.id}
                          className="cursor-pointer transition-colors hover:border-primary hover:bg-accent/50"
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDomain(domain);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteDialog("domain", domain.id, domain.name);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <CardTitle
                              onClick={() => setSelectedDomainId(domain.id)}
                            >
                              {domain.name}
                            </CardTitle>
                            <CardDescription
                              className="line-clamp-2"
                              onClick={() => setSelectedDomainId(domain.id)}
                            >
                              {domain.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent onClick={() => setSelectedDomainId(domain.id)}>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{deptCount} department{deptCount !== 1 ? "s" : ""}</span>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <h3 className="text-lg font-semibold">No domains yet</h3>
                      <p className="text-muted-foreground mt-1">
                        Create your first business domain to get started
                      </p>
                      <Button className="mt-4" onClick={openAddDomain}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Domain
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : !selectedDeptId ? (
              // Department List within Domain
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Departments in {selectedDomain?.name}
                  </h2>
                  <Button size="sm" onClick={openAddDepartment}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </div>
                {deptsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : departments && departments.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {departments.map((dept) => {
                      const roleCount =
                        allRoles?.filter((r) => r.departmentId === dept.id).length || 0;
                      const personCount =
                        allPeople?.filter((p) => p.departmentId === dept.id).length || 0;
                      return (
                        <Card
                          key={dept.id}
                          className="cursor-pointer transition-colors hover:border-primary hover:bg-accent/50"
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <Users className="h-5 w-5 text-muted-foreground" />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDepartment(dept);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteDialog("department", dept.id, dept.name);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <CardTitle onClick={() => setSelectedDeptId(dept.id)}>
                              {dept.name}
                            </CardTitle>
                            <CardDescription
                              className="line-clamp-2"
                              onClick={() => setSelectedDeptId(dept.id)}
                            >
                              {dept.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent onClick={() => setSelectedDeptId(dept.id)}>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex gap-4">
                                <span>{roleCount} roles</span>
                                <span>{personCount} people</span>
                              </div>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <h3 className="text-lg font-semibold">No departments yet</h3>
                      <p className="text-muted-foreground mt-1">
                        Add departments to this domain
                      </p>
                      <Button className="mt-4" onClick={openAddDepartment}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // Department Detail with Roles, People, HAPs
              <Tabs defaultValue="roles" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="roles" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Roles
                  </TabsTrigger>
                  <TabsTrigger value="people" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    People
                  </TabsTrigger>
                  <TabsTrigger value="haps" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    HAPs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="roles" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Roles in {selectedDept?.name}
                    </h2>
                    <Button size="sm" onClick={openAddRole}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Role
                    </Button>
                  </div>
                  {rolesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : roles && roles.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {roles.map((role) => (
                        <Card key={role.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{role.level || "unspecified"}</Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditRole(role)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => openDeleteDialog("role", role.id, role.name)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <CardTitle className="text-lg">{role.name}</CardTitle>
                            <CardDescription>{role.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                Responsibilities ({role.responsibilities.length})
                              </p>
                              <div className="space-y-1">
                                {role.responsibilities.slice(0, 3).map((resp) => (
                                  <div
                                    key={resp.id}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    {resp.aiCandidate && (
                                      <Bot className="h-3 w-3 text-purple-500" />
                                    )}
                                    <span
                                      className={
                                        resp.aiCandidate ? "text-purple-600" : ""
                                      }
                                    >
                                      {resp.name}
                                    </span>
                                  </div>
                                ))}
                                {role.responsibilities.length > 3 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{role.responsibilities.length - 3} more
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <h3 className="text-lg font-semibold">No roles yet</h3>
                        <p className="text-muted-foreground mt-1">
                          Define roles for this department
                        </p>
                        <Button className="mt-4" onClick={openAddRole}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Role
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="people" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      People in {selectedDept?.name}
                    </h2>
                    <Button size="sm" onClick={openAddPerson}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Person
                    </Button>
                  </div>
                  {peopleLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : people && people.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {people.map((person) => {
                        const personRoles = roles?.filter((r) =>
                          person.roleAssignments.some((ra) => ra.roleId === r.id)
                        );
                        const personHaps = haps?.filter(
                          (h) => h.personId === person.id
                        );
                        return (
                          <Card key={person.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    {person.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">
                                      {person.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      {person.title}
                                    </CardDescription>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditPerson(person)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => openDeleteDialog("person", person.id, person.name)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <p className="text-muted-foreground">
                                  {person.email}
                                </p>
                                {personRoles && personRoles.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {personRoles.map((role) => (
                                      <Badge key={role.id} variant="secondary">
                                        {role.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {personHaps && personHaps.length > 0 && (
                                  <div className="flex items-center gap-1 text-purple-600">
                                    <Bot className="h-3 w-3" />
                                    <span className="text-xs">
                                      {personHaps.length} HAP
                                      {personHaps.length !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <h3 className="text-lg font-semibold">No people yet</h3>
                        <p className="text-muted-foreground mt-1">
                          Add people to this department
                        </p>
                        <Button className="mt-4" onClick={openAddPerson}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Person
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="haps" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Human-Agent Pairs in {selectedDept?.name}
                    </h2>
                    <Button size="sm" asChild>
                      <Link href="/haps/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create HAP
                      </Link>
                    </Button>
                  </div>
                  {haps && haps.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {haps.map((hap) => {
                        const person = people?.find((p) => p.id === hap.personId);
                        const role = roles?.find((r) => r.id === hap.roleId);
                        const distribution = calculatePhaseDistribution(hap.tasks);
                        return (
                          <Card key={hap.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-2 w-2 rounded-full ${getStatusColor(
                                      hap.integrationStatus
                                    )}`}
                                  />
                                  <Badge variant="outline">
                                    {INTEGRATION_STATUS_METADATA[hap.integrationStatus].label}
                                  </Badge>
                                </div>
                              </div>
                              <CardTitle className="text-base">
                                {person?.name} + Agent
                              </CardTitle>
                              <CardDescription>{role?.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {/* Responsibility Distribution */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" /> Human: {distribution.humanPercent}%
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Cpu className="h-3 w-3" /> Agent: {distribution.agentPercent}%
                                    </span>
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
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>
                                    {hap.tasks.length} tasks
                                  </span>
                                  <Link
                                    href={`/haps/${hap.id}`}
                                    className="text-primary hover:underline"
                                  >
                                    View details
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <h3 className="text-lg font-semibold">No HAPs yet</h3>
                        <p className="text-muted-foreground mt-1">
                          Create Human-Agent Pairs to start AI transformation
                        </p>
                        <Button className="mt-4" asChild>
                          <Link href="/haps/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create HAP
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
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
        defaultDomainId={selectedDomainId || undefined}
      />

      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
        defaultDepartmentId={selectedDeptId || undefined}
      />

      <PersonDialog
        open={personDialogOpen}
        onOpenChange={setPersonDialogOpen}
        person={editingPerson}
        defaultDepartmentId={selectedDeptId || undefined}
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
