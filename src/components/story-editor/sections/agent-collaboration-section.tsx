"use client";

import { useSnapshot } from "valtio";
import { Plus, Trash2, ArrowDown, ArrowUp, ArrowLeftRight, Users } from "lucide-react";
import { storyEditorStore, storyEditorActions } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AGENT_COLLABORATION_ROLE_METADATA,
  PEER_INTERACTION_METADATA,
} from "@/lib/schemas/collaboration";

interface CoordinationEntry {
  agent: string;
  via: string;
  for: string;
}

interface PeerEntry {
  agent: string;
  interaction: string;
}

interface AgentCollaboration {
  role: string;
  coordinates?: CoordinationEntry[];
  reportsTo?: string;
  peers?: PeerEntry[];
}

export function AgentCollaborationSection() {
  const editor = useSnapshot(storyEditorStore);
  const collaboration = (editor.draft.data.collaboration as AgentCollaboration) || {};
  const role = collaboration.role || "";
  const coordinates = collaboration.coordinates || [];
  const peers = collaboration.peers || [];

  const updateField = (path: string, value: unknown) => {
    storyEditorActions.updateNestedField(`collaboration.${path}`, value);
  };

  // Coordination management (for supervisors)
  const addCoordination = () => {
    const newCoords = [...coordinates, { agent: "", via: "", for: "" }];
    updateField("coordinates", newCoords);
  };

  const updateCoordination = (index: number, field: keyof CoordinationEntry, value: string) => {
    const newCoords = [...coordinates];
    newCoords[index] = { ...newCoords[index], [field]: value };
    updateField("coordinates", newCoords);
  };

  const removeCoordination = (index: number) => {
    updateField("coordinates", coordinates.filter((_, i) => i !== index));
  };

  // Peer management
  const addPeer = () => {
    const newPeers = [...peers, { agent: "", interaction: "request_response" }];
    updateField("peers", newPeers);
  };

  const updatePeer = (index: number, field: keyof PeerEntry, value: string) => {
    const newPeers = [...peers];
    newPeers[index] = { ...newPeers[index], [field]: value };
    updateField("peers", newPeers);
  };

  const removePeer = (index: number) => {
    updateField("peers", peers.filter((_, i) => i !== index));
  };

  const getRoleIcon = () => {
    switch (role) {
      case "supervisor":
        return <ArrowDown className="h-4 w-4" />;
      case "worker":
        return <ArrowUp className="h-4 w-4" />;
      case "peer":
        return <ArrowLeftRight className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Agent Collaboration
          {role && (
            <Badge variant="outline" className="ml-2">
              {getRoleIcon()}
              <span className="ml-1">
                {AGENT_COLLABORATION_ROLE_METADATA[role as keyof typeof AGENT_COLLABORATION_ROLE_METADATA]?.label || role}
              </span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Define how this agent works with other agents in a multi-agent system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Selection */}
        <div className="space-y-2">
          <Label>Collaboration Role</Label>
          <Select
            value={role}
            onValueChange={(value) => updateField("role", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role in multi-agent system" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AGENT_COLLABORATION_ROLE_METADATA).map(([key, meta]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span>{meta.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {meta.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visual relationship diagram */}
        {role && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              {/* Supervisor visualization */}
              {role === "supervisor" && (
                <>
                  <div className="p-3 bg-primary/10 border-2 border-primary rounded-lg text-center">
                    <span className="font-medium">This Agent</span>
                    <Badge variant="secondary" className="ml-2">Supervisor</Badge>
                  </div>
                  <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">coordinates</div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {coordinates.length > 0 ? (
                      coordinates.map((coord, i) => (
                        <Badge key={i} variant="outline">
                          {coord.agent || `Worker ${i + 1}`}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Add workers below
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Worker visualization */}
              {role === "worker" && (
                <>
                  <Badge variant="outline">
                    {collaboration.reportsTo || "Supervisor Agent"}
                  </Badge>
                  <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">directs</div>
                  <div className="p-3 bg-primary/10 border-2 border-primary rounded-lg text-center">
                    <span className="font-medium">This Agent</span>
                    <Badge variant="secondary" className="ml-2">Worker</Badge>
                  </div>
                </>
              )}

              {/* Peer visualization */}
              {role === "peer" && (
                <div className="flex items-center gap-4">
                  <div className="flex gap-2 flex-wrap">
                    {peers.length > 0 ? (
                      peers.slice(0, 2).map((peer, i) => (
                        <Badge key={i} variant="outline">
                          {peer.agent || `Peer ${i + 1}`}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Peers
                      </span>
                    )}
                  </div>
                  <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                  <div className="p-3 bg-primary/10 border-2 border-primary rounded-lg text-center">
                    <span className="font-medium">This Agent</span>
                    <Badge variant="secondary" className="ml-2">Peer</Badge>
                  </div>
                  <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                  <div className="flex gap-2 flex-wrap">
                    {peers.length > 2 ? (
                      peers.slice(2).map((peer, i) => (
                        <Badge key={i} variant="outline">
                          {peer.agent || `Peer ${i + 3}`}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Peers
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supervisor: Agents being coordinated */}
        {role === "supervisor" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Coordinated Agents</Label>
                <p className="text-xs text-muted-foreground">
                  Agents this supervisor directs and orchestrates
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addCoordination}>
                <Plus className="mr-1 h-3 w-3" />
                Add Agent
              </Button>
            </div>
            {coordinates.map((coord, index) => (
              <div key={index} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <Input
                    placeholder="Agent ID or type"
                    value={coord.agent}
                    onChange={(e) => updateCoordination(index, "agent", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCoordination(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder="Communication protocol (e.g., A2A messaging)"
                    value={coord.via}
                    onChange={(e) => updateCoordination(index, "via", e.target.value)}
                  />
                  <Input
                    placeholder="Delegated tasks"
                    value={coord.for}
                    onChange={(e) => updateCoordination(index, "for", e.target.value)}
                  />
                </div>
              </div>
            ))}
            {coordinates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No agents being coordinated.
              </p>
            )}
          </div>
        )}

        {/* Worker: Reports to */}
        {role === "worker" && (
          <div className="space-y-2">
            <Label>Reports To</Label>
            <Input
              placeholder="Supervisor agent ID or type"
              value={collaboration.reportsTo || ""}
              onChange={(e) => updateField("reportsTo", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The supervisor agent that directs this worker
            </p>
          </div>
        )}

        {/* Peers (available for all roles) */}
        {role && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Peer Agents</Label>
                <p className="text-xs text-muted-foreground">
                  Other agents this one collaborates with as equals
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addPeer}>
                <Plus className="mr-1 h-3 w-3" />
                Add Peer
              </Button>
            </div>
            {peers.map((peer, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Input
                  placeholder="Peer agent ID or type"
                  value={peer.agent}
                  onChange={(e) => updatePeer(index, "agent", e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={peer.interaction}
                  onValueChange={(value) => updatePeer(index, "interaction", value)}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PEER_INTERACTION_METADATA).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{meta.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {meta.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePeer(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {peers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No peer relationships defined.
              </p>
            )}
          </div>
        )}

        {!role && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Select a collaboration role to define how this agent works with others
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
