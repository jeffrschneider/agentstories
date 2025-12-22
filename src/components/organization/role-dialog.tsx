"use client";

import { useState, useEffect } from "react";
import { Briefcase, Plus, Trash2, Bot, X, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCreateRole,
  useUpdateRole,
  useDomains,
  useDepartments,
} from "@/hooks";
import { ROLE_LEVEL_METADATA, SKILL_DOMAINS, createEmptyResponsibility } from "@/lib/schemas";
import type { Role, Responsibility } from "@/lib/schemas";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  defaultDepartmentId?: string;
}

export function RoleDialog({
  open,
  onOpenChange,
  role,
  defaultDepartmentId,
}: RoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel] = useState<string>("");
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([]);
  const [errors, setErrors] = useState<{ name?: string; departmentId?: string }>({});

  const { data: domains } = useDomains();
  const { data: allDepartments } = useDepartments();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const isEditing = !!role;
  const isLoading = createRole.isPending || updateRole.isPending;

  // Group departments by domain for the select
  const departmentsByDomain = allDepartments?.reduce((acc, dept) => {
    const domain = domains?.find((d) => d.id === dept.domainId);
    const domainName = domain?.name || "Unknown";
    if (!acc[domainName]) acc[domainName] = [];
    acc[domainName].push(dept);
    return acc;
  }, {} as Record<string, typeof allDepartments>);

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setDescription(role.description || "");
        setDepartmentId(role.departmentId);
        setLevel(role.level || "");
        setResponsibilities(role.responsibilities || []);
      } else {
        setName("");
        setDescription("");
        setDepartmentId(defaultDepartmentId || "");
        setLevel("");
        setResponsibilities([]);
      }
      setErrors({});
    }
  }, [open, role, defaultDepartmentId]);

  const validate = () => {
    const newErrors: { name?: string; departmentId?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name must be 100 characters or less";
    }
    if (!departmentId) {
      newErrors.departmentId = "Department is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addResponsibility = () => {
    setResponsibilities([...responsibilities, createEmptyResponsibility()]);
  };

  const updateResponsibility = (index: number, updates: Partial<Responsibility>) => {
    setResponsibilities(
      responsibilities.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const toggleSkillDomain = (index: number, domain: string) => {
    const resp = responsibilities[index];
    const currentDomains = resp.requiredSkillDomains || [];
    const newDomains = currentDomains.includes(domain)
      ? currentDomains.filter((d) => d !== domain)
      : [...currentDomains, domain];
    updateResponsibility(index, { requiredSkillDomains: newDomains });
  };

  const removeSkillDomain = (index: number, domain: string) => {
    const resp = responsibilities[index];
    const newDomains = (resp.requiredSkillDomains || []).filter((d) => d !== domain);
    updateResponsibility(index, { requiredSkillDomains: newDomains });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Filter out empty responsibilities
    const validResponsibilities = responsibilities.filter((r) => r.name.trim());

    try {
      if (isEditing && role) {
        await updateRole.mutateAsync({
          id: role.id,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            departmentId,
            level: level as Role["level"] || undefined,
            responsibilities: validResponsibilities,
          },
        });
      } else {
        await createRole.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          departmentId,
          level: level as Role["level"] || undefined,
          responsibilities: validResponsibilities,
        });
      }
      onOpenChange(false);
    } catch {
      // Error handling is done in the mutation hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {isEditing ? "Edit Role" : "Add Role"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the role details and responsibilities."
              : "Create a new role with its responsibilities."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              id="role-department"
              label="Department"
              required
              error={errors.departmentId}
            >
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsByDomain &&
                    Object.entries(departmentsByDomain).map(([domainName, depts]) => (
                      <div key={domainName}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {domainName}
                        </div>
                        {depts?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField id="role-name" label="Name" required error={errors.name}>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Senior Engineer"
                  disabled={isLoading}
                />
              </FormField>

              <FormField id="role-level" label="Level">
                <Select value={level} onValueChange={setLevel} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LEVEL_METADATA).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField id="role-description" label="Description">
              <Textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role's purpose..."
                rows={2}
                disabled={isLoading}
              />
            </FormField>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Responsibilities</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addResponsibility}
                  disabled={isLoading}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>

              {responsibilities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                  No responsibilities defined yet
                </p>
              ) : (
                <div className="space-y-2">
                  {responsibilities.map((resp, index) => (
                    <div
                      key={resp.id}
                      className="flex items-start gap-2 p-3 border rounded-md bg-muted/30"
                    >
                      <div className="flex-1 space-y-2">
                        <Input
                          value={resp.name}
                          onChange={(e) =>
                            updateResponsibility(index, { name: e.target.value })
                          }
                          placeholder="Responsibility name"
                          disabled={isLoading}
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`ai-candidate-${index}`}
                            checked={resp.aiCandidate}
                            onCheckedChange={(checked) =>
                              updateResponsibility(index, { aiCandidate: !!checked })
                            }
                            disabled={isLoading}
                          />
                          <Label
                            htmlFor={`ai-candidate-${index}`}
                            className="text-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Bot className="h-3 w-3 text-purple-500" />
                            AI Candidate
                          </Label>
                        </div>

                        {/* Skill Domains - shown when AI Candidate is checked */}
                        {resp.aiCandidate && (
                          <div className="space-y-2 pt-2 border-t mt-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">
                                Required Capabilities
                              </Label>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    disabled={isLoading}
                                  >
                                    Add Capability
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-auto">
                                  {SKILL_DOMAINS.map((domain) => (
                                    <DropdownMenuCheckboxItem
                                      key={domain}
                                      checked={(resp.requiredSkillDomains || []).includes(domain)}
                                      onCheckedChange={() => toggleSkillDomain(index, domain)}
                                    >
                                      {domain}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {(resp.requiredSkillDomains || []).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {resp.requiredSkillDomains?.map((domain) => (
                                  <Badge
                                    key={domain}
                                    variant="secondary"
                                    className="text-xs pr-1"
                                  >
                                    {domain}
                                    <button
                                      type="button"
                                      onClick={() => removeSkillDomain(index, domain)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                No capabilities specified yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeResponsibility(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
