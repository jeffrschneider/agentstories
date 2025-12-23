"use client";

import { useState } from "react";
import { Link2, Trash2, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createExternalLink,
  EXTERNAL_LINK_TYPE_METADATA,
  type Agent,
  type ExternalLinkType,
  type ExternalLink as ExternalLinkSchema,
} from "@/lib/schemas";

interface AgentLinksCardProps {
  currentAgent: Agent;
  isEditing: boolean;
  editedAgent: Agent | null;
  onUpdateEditedAgent: (updates: Partial<Agent>) => void;
}

export function AgentLinksCard({
  currentAgent,
  isEditing,
  editedAgent,
  onUpdateEditedAgent,
}: AgentLinksCardProps) {
  const [newLinkType, setNewLinkType] = useState<ExternalLinkType>("documentation");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const addLink = () => {
    if (!editedAgent || !newLinkLabel.trim() || !newLinkUrl.trim()) return;

    try {
      new URL(newLinkUrl);
    } catch {
      return;
    }

    const newLink = createExternalLink(newLinkType, newLinkLabel.trim(), newLinkUrl.trim());

    onUpdateEditedAgent({
      externalLinks: [...(editedAgent.externalLinks || []), newLink],
    });

    setNewLinkType("documentation");
    setNewLinkLabel("");
    setNewLinkUrl("");
  };

  const removeLink = (linkId: string) => {
    if (!editedAgent) return;
    onUpdateEditedAgent({
      externalLinks: editedAgent.externalLinks?.filter((l) => l.id !== linkId),
    });
  };

  const links = currentAgent.externalLinks || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          External Links
        </CardTitle>
        <CardDescription>
          Links to tracing, monitoring, documentation, and other systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link: ExternalLinkSchema) => (
              <div
                key={link.id}
                className="flex items-center gap-2 p-3 border rounded-lg"
              >
                <Badge variant="outline">
                  {EXTERNAL_LINK_TYPE_METADATA[link.type].label}
                </Badge>
                {isEditing ? (
                  <>
                    <span className="flex-1">{link.label}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 hover:underline"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No external links added
          </p>
        )}

        {isEditing && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newLinkType}
                  onValueChange={(v) => setNewLinkType(v as ExternalLinkType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXTERNAL_LINK_TYPE_METADATA).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  placeholder="e.g., Datadog APM"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={addLink}
              disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
