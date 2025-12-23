"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Agent } from "@/lib/schemas";

interface AgentTagsCardProps {
  currentAgent: Agent;
  isEditing: boolean;
  editedAgent: Agent | null;
  onUpdateEditedAgent: (updates: Partial<Agent>) => void;
}

export function AgentTagsCard({
  currentAgent,
  isEditing,
  editedAgent,
  onUpdateEditedAgent,
}: AgentTagsCardProps) {
  const tags = currentAgent.tags || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {tag}
                {isEditing && editedAgent && (
                  <button
                    onClick={() =>
                      onUpdateEditedAgent({
                        tags: editedAgent.tags?.filter((_, idx) => idx !== i),
                      })
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                )}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground">No tags</p>
          )}
          {isEditing && editedAgent && (
            <Input
              placeholder="Add tag"
              className="w-[150px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && !editedAgent.tags?.includes(value)) {
                    onUpdateEditedAgent({
                      tags: [...(editedAgent.tags || []), value],
                    });
                    (e.target as HTMLInputElement).value = "";
                  }
                  e.preventDefault();
                }
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
