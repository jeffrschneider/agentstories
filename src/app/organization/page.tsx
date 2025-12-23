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
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
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
  useRoles,
  useHAPs,
} from "@/hooks";
import type { BusinessDomain, Department, Role, Person } from "@/lib/schemas";
import {
  DomainDialog,
  DepartmentDialog,
  RoleDialog,
  PersonDialog,
  DeleteConfirmationDialog,
  OrgTreeView,
} from "@/components/organization";
import { AgentsPanel, TaskResponsibilitiesPanel } from "./components";

type EntityType = "domain" | "department" | "role" | "person";

interface DeleteState {
  type: EntityType;
  id: string;
  name: string;
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

  const openAddDepartment = () => {
    setEditingDepartment(null);
    setDepartmentDialogOpen(true);
  };

  const openAddRole = () => {
    setEditingRole(null);
    setRoleDialogOpen(true);
  };

  const openAddPerson = () => {
    setEditingPerson(null);
    setPersonDialogOpen(true);
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
