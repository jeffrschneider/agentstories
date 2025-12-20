"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AgentStory, AgentStoryFull, AgentStoryLight, Skill } from "@/lib/schemas";
import {
  Zap,
  Database,
  Wrench,
  Users,
  CheckCircle2,
  AlertCircle,
  Target,
  Brain,
} from "lucide-react";

interface StoryPreviewProps {
  story: AgentStory;
}

function isFullFormat(story: AgentStory): story is AgentStoryFull {
  return story.format === "full";
}

function isLightFormat(story: AgentStory): story is AgentStoryLight {
  return story.format === "light";
}

// Preview a single skill
function SkillPreview({ skill, index }: { skill: Skill; index: number }) {
  return (
    <div className="p-4 bg-muted rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{skill.name || `Skill ${index + 1}`}</h4>
          <p className="text-sm text-muted-foreground">{skill.description}</p>
        </div>
        <div className="flex gap-1">
          <Badge variant="outline" className="text-xs">{skill.domain}</Badge>
          <Badge variant="secondary" className="text-xs">{skill.acquired}</Badge>
        </div>
      </div>

      {/* Triggers */}
      {skill.triggers && skill.triggers.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Triggers
          </h5>
          <div className="space-y-1">
            {skill.triggers.map((trigger, i) => (
              <div key={i} className="text-sm flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{trigger.type}</Badge>
                <span>{trigger.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      {skill.tools && skill.tools.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Wrench className="h-3 w-3" /> Tools
          </h5>
          <div className="flex flex-wrap gap-1">
            {skill.tools.map((tool, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tool.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Behavior */}
      {skill.behavior && (
        <div>
          <h5 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Target className="h-3 w-3" /> Behavior
          </h5>
          <Badge variant="outline" className="text-xs">{skill.behavior.model}</Badge>
        </div>
      )}

      {/* Acceptance */}
      {skill.acceptance && (
        <div>
          <h5 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Success Conditions
          </h5>
          <ul className="list-disc list-inside text-sm">
            {skill.acceptance.successConditions?.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StoryPreview({ story }: StoryPreviewProps) {
  const isFull = isFullFormat(story);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={isFull ? "default" : "secondary"}>
            {isFull ? "Full Format" : "Light Format"}
          </Badge>
          <Badge variant="outline">{story.autonomyLevel}</Badge>
        </div>
        <h2 className="text-2xl font-bold">{story.name || "Untitled Story"}</h2>
        <p className="text-sm text-muted-foreground font-mono">{story.identifier}</p>
      </div>

      {/* Agent Identity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Agent Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Role</h4>
            <p>{story.role || "Not specified"}</p>
          </div>

          {/* Light format: Trigger, Action, Outcome */}
          {isLightFormat(story) && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Trigger</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{story.trigger.type}</Badge>
                    <span>{story.trigger.description || "Not specified"}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Action</h4>
                <p>{story.action || "Not specified"}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Outcome</h4>
                <p>{story.outcome || "Not specified"}</p>
              </div>
            </>
          )}

          {/* Full format: Purpose */}
          {isFull && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Purpose</h4>
              <p>{story.purpose || "Not specified"}</p>
            </div>
          )}

          {story.tags && story.tags.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {story.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Format: Skills */}
      {isFull && story.skills && story.skills.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Skills ({story.skills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {story.skills.map((skill, i) => (
                <SkillPreview key={skill.id || i} skill={skill} index={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Format: Agent-Level Configuration */}
      {isFull && (
        <>
          {/* Human Interaction */}
          {story.humanInteraction && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Human Interaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Mode</h4>
                  <Badge variant="outline">{story.humanInteraction.mode}</Badge>
                </div>
                {story.humanInteraction.checkpoints && story.humanInteraction.checkpoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Checkpoints</h4>
                    <div className="space-y-2">
                      {story.humanInteraction.checkpoints.map((cp, i) => (
                        <div key={i} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{cp.name}</span>
                            <Badge variant="outline" className="text-xs">{cp.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{cp.trigger}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {story.humanInteraction.escalation && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Escalation</h4>
                    <p className="text-sm">Channel: {story.humanInteraction.escalation.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      Conditions: {story.humanInteraction.escalation.conditions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agent Collaboration */}
          {story.collaboration && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Agent Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Role</h4>
                  <Badge variant="outline">{story.collaboration.role}</Badge>
                </div>
                {story.collaboration.coordinates && story.collaboration.coordinates.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Coordinates With</h4>
                    <div className="space-y-2">
                      {story.collaboration.coordinates.map((coord, i) => (
                        <div key={i} className="p-2 bg-muted rounded text-sm">
                          <span className="font-medium">{coord.agent}</span>
                          <span className="text-muted-foreground"> via {coord.via} for {coord.for}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {story.collaboration.peers && story.collaboration.peers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Peers</h4>
                    <div className="flex flex-wrap gap-1">
                      {story.collaboration.peers.map((peer, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {peer.agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Memory */}
          {story.memory && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {story.memory.working && story.memory.working.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Working Memory</h4>
                    <ul className="list-disc list-inside text-sm">
                      {story.memory.working.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {story.memory.persistent && story.memory.persistent.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Persistent Stores</h4>
                    <div className="space-y-2">
                      {story.memory.persistent.map((store, i) => (
                        <div key={i} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{store.name}</span>
                            <Badge variant="outline" className="text-xs">{store.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{store.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Guardrails */}
          {story.guardrails && story.guardrails.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Guardrails
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {story.guardrails.map((guardrail, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{guardrail.name}</span>
                        <Badge variant="outline" className="text-xs">{guardrail.enforcement}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{guardrail.constraint}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Metadata */}
      <Separator />
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Version: {story.version}</p>
        <p>Created: {new Date(story.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(story.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
