"use client";

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
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
import { FormField } from "@/components/ui/form-field";
import { useCreateDomain, useUpdateDomain } from "@/hooks";
import type { BusinessDomain } from "@/lib/schemas";

interface DomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: BusinessDomain | null;
}

export function DomainDialog({ open, onOpenChange, domain }: DomainDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string }>({});

  const createDomain = useCreateDomain();
  const updateDomain = useUpdateDomain();

  const isEditing = !!domain;
  const isLoading = createDomain.isPending || updateDomain.isPending;

  useEffect(() => {
    if (open) {
      if (domain) {
        setName(domain.name);
        setDescription(domain.description || "");
      } else {
        setName("");
        setDescription("");
      }
      setErrors({});
    }
  }, [open, domain]);

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name must be 100 characters or less";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditing && domain) {
        await updateDomain.mutateAsync({
          id: domain.id,
          data: { name: name.trim(), description: description.trim() || undefined },
        });
      } else {
        await createDomain.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
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
            <Building2 className="h-5 w-5" />
            {isEditing ? "Edit Domain" : "Add Domain"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the business domain details."
              : "Create a new business domain to organize departments."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="domain-name"
            label="Name"
            required
            error={errors.name}
          >
            <Input
              id="domain-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Service, Engineering"
              disabled={isLoading}
            />
          </FormField>

          <FormField
            id="domain-description"
            label="Description"
            description="Optional description of this domain's scope"
          >
            <Textarea
              id="domain-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose and scope of this domain..."
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
              {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Domain"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
