"use client";

import Link from "next/link";
import {
  Bot,
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  Loader2,
  X,
  Lightbulb,
  Activity,
  CheckCircle,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  LIFECYCLE_STATE_METADATA,
  type Agent,
  type AgentLifecycle,
} from "@/lib/schemas";

// Lifecycle icon mapping
const lifecycleIcons: Record<AgentLifecycle, React.ComponentType<{ className?: string }>> = {
  planned: Lightbulb,
  development: Activity,
  operational: CheckCircle,
  sunset: Archive,
};

interface AgentDetailHeaderProps {
  agent: Agent;
  currentAgent: Agent;
  isEditing: boolean;
  isSaving: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function AgentDetailHeader({
  agent,
  currentAgent,
  isEditing,
  isSaving,
  onStartEditing,
  onCancelEditing,
  onSave,
  onDelete,
}: AgentDetailHeaderProps) {
  const LifecycleIcon = lifecycleIcons[currentAgent.lifecycleState];
  const lifecycleMeta = LIFECYCLE_STATE_METADATA[currentAgent.lifecycleState];

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/agents">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">
            {currentAgent.name || "Untitled Agent"}
          </h1>
          <Badge variant="outline">
            <LifecycleIcon className="mr-1 h-3 w-3" />
            {lifecycleMeta.label}
          </Badge>
        </div>
        {currentAgent.identifier && (
          <p className="text-muted-foreground font-mono text-sm">
            {currentAgent.identifier}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button variant="ghost" onClick={onCancelEditing}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onStartEditing}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{agent.name}"? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}
