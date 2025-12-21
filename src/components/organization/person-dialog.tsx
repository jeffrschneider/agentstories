"use client";

import { useState, useEffect } from "react";
import { UserCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import {
  useCreatePerson,
  useUpdatePerson,
  useDomains,
  useDepartments,
} from "@/hooks";
import { PERSON_STATUS_METADATA } from "@/lib/schemas";
import type { Person } from "@/lib/schemas";

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
  defaultDepartmentId?: string;
}

export function PersonDialog({
  open,
  onOpenChange,
  person,
  defaultDepartmentId,
}: PersonDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<Person["status"]>("active");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    departmentId?: string;
  }>({});

  const { data: domains } = useDomains();
  const { data: allDepartments } = useDepartments();
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();

  const isEditing = !!person;
  const isLoading = createPerson.isPending || updatePerson.isPending;

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
      if (person) {
        setName(person.name);
        setEmail(person.email);
        setTitle(person.title || "");
        setDepartmentId(person.departmentId);
        setStatus(person.status);
      } else {
        setName("");
        setEmail("");
        setTitle("");
        setDepartmentId(defaultDepartmentId || "");
        setStatus("active");
      }
      setErrors({});
    }
  }, [open, person, defaultDepartmentId]);

  const validate = () => {
    const newErrors: { name?: string; email?: string; departmentId?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name must be 100 characters or less";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!departmentId) {
      newErrors.departmentId = "Department is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditing && person) {
        await updatePerson.mutateAsync({
          id: person.id,
          data: {
            name: name.trim(),
            email: email.trim(),
            title: title.trim() || undefined,
            departmentId,
            status,
          },
        });
      } else {
        await createPerson.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          title: title.trim() || undefined,
          departmentId,
          status,
          roleAssignments: [],
        });
      }
      onOpenChange(false);
    } catch {
      // Error handling is done in the mutation hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            {isEditing ? "Edit Person" : "Add Person"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the person's details."
              : "Add a new person to the organization."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="person-department"
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

          <FormField id="person-name" label="Name" required error={errors.name}>
            <Input
              id="person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              disabled={isLoading}
            />
          </FormField>

          <FormField id="person-email" label="Email" required error={errors.email}>
            <Input
              id="person-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@company.com"
              disabled={isLoading}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField id="person-title" label="Title">
              <Input
                id="person-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Engineer"
                disabled={isLoading}
              />
            </FormField>

            <FormField id="person-status" label="Status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Person["status"])}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERSON_STATUS_METADATA).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
