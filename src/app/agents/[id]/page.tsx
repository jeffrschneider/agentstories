"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useAgent, useUpdateAgent, useDeleteAgent, useStory } from "@/hooks";
import type { Agent } from "@/lib/schemas";
import {
  AgentDetailHeader,
  AgentIdentityCard,
  AgentStoryCard,
  AgentCapabilitiesCard,
  AgentLinksCard,
  AgentTagsCard,
} from "./components";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: agent, isLoading } = useAgent(id);
  const { data: linkedStory } = useStory(agent?.agentStoryId || "", { trackView: false });
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const [isEditing, setIsEditing] = useState(false);
  const [editedAgent, setEditedAgent] = useState<Agent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <AppShell className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!agent) {
    return (
      <AppShell className="p-6">
        <div className="mx-auto max-w-3xl text-center py-12">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Agent not found</h2>
          <p className="text-muted-foreground mt-2">
            The agent you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild className="mt-4">
            <Link href="/agents">Back to Catalog</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const currentAgent = isEditing && editedAgent ? editedAgent : agent;

  const startEditing = () => {
    setEditedAgent({ ...agent });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedAgent(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedAgent) return;

    setIsSaving(true);
    try {
      await updateAgent.mutateAsync({
        id: agent.id,
        data: {
          name: editedAgent.name,
          description: editedAgent.description,
          identifier: editedAgent.identifier,
          lifecycleState: editedAgent.lifecycleState,
          lifecycleNotes: editedAgent.lifecycleNotes,
          plannedCapabilities: editedAgent.plannedCapabilities,
          externalLinks: editedAgent.externalLinks,
          tags: editedAgent.tags,
        },
      });
      setIsEditing(false);
      setEditedAgent(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteAgent.mutateAsync({ id: agent.id, name: agent.name });
    router.push("/agents");
  };

  const handleUpdateEditedAgent = (updates: Partial<Agent>) => {
    if (!editedAgent) return;
    setEditedAgent({ ...editedAgent, ...updates });
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <AgentDetailHeader
          agent={agent}
          currentAgent={currentAgent}
          isEditing={isEditing}
          isSaving={isSaving}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onSave={handleSave}
          onDelete={handleDelete}
        />

        <AgentIdentityCard
          currentAgent={currentAgent}
          isEditing={isEditing}
          editedAgent={editedAgent}
          onUpdateEditedAgent={handleUpdateEditedAgent}
        />

        {(currentAgent.agentStoryId || isEditing) && (
          <AgentStoryCard linkedStory={linkedStory} />
        )}

        <AgentCapabilitiesCard
          currentAgent={currentAgent}
          isEditing={isEditing}
          editedAgent={editedAgent}
          onUpdateEditedAgent={handleUpdateEditedAgent}
        />

        <AgentLinksCard
          currentAgent={currentAgent}
          isEditing={isEditing}
          editedAgent={editedAgent}
          onUpdateEditedAgent={handleUpdateEditedAgent}
        />

        <AgentTagsCard
          currentAgent={currentAgent}
          isEditing={isEditing}
          editedAgent={editedAgent}
          onUpdateEditedAgent={handleUpdateEditedAgent}
        />
      </div>
    </AppShell>
  );
}
