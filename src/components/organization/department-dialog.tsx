"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { useCreateDepartment, useUpdateDepartment, useDomains } from "@/hooks";
import type { Department } from "@/lib/schemas";

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  defaultDomainId?: string;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  defaultDomainId,
}: DepartmentDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainId, setDomainId] = useState("");
  const [errors, setErrors] = useState<{ name?: string; domainId?: string }>({});

  const { data: domains } = useDomains();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  const isEditing = !!department;
  const isLoading = createDepartment.isPending || updateDepartment.isPending;

  useEffect(() => {
    if (open) {
      if (department) {
        setName(department.name);
        setDescription(department.description || "");
        setDomainId(department.domainId);
      } else {
        setName("");
        setDescription("");
        setDomainId(defaultDomainId || "");
      }
      setErrors({});
    }
  }, [open, department, defaultDomainId]);

  const validate = () => {
    const newErrors: { name?: string; domainId?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name must be 100 characters or less";
    }
    if (!domainId) {
      newErrors.domainId = "Domain is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditing && department) {
        await updateDepartment.mutateAsync({
          id: department.id,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            domainId,
          },
        });
      } else {
        await createDepartment.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          domainId,
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
            <Users className="h-5 w-5" />
            {isEditing ? "Edit Department" : "Add Department"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the department details."
              : "Create a new department within a business domain."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="dept-domain"
            label="Business Domain"
            required
            error={errors.domainId}
          >
            <Select value={domainId} onValueChange={setDomainId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {domains?.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            id="dept-name"
            label="Name"
            required
            error={errors.name}
          >
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Support, Backend Engineering"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            id="dept-description"
            label="Description"
            description="Optional description of this department's responsibilities"
          >
            <Textarea
              id="dept-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the department's focus and responsibilities..."
              rows={3}
              disabled={isLoading}
            />
          </FormField>

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
              {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
