"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AgentStory, AgentStoryFull } from "@/lib/schemas";
import {
  Brain,
  Target,
  Zap,
  Database,
  Wrench,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface StoryPreviewProps {
  story: AgentStory;
}

function isFullFormat(story: AgentStory): story is AgentStoryFull {
  return story.format === "full";
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

      {/* Core Story */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Core Story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Role</h4>
              <p>{story.role || "Not specified"}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Trigger</h4>
              <p>{story.trigger.specification.source || "Not specified"}</p>
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

      {/* Full Format Sections */}
      {isFull && (
        <>
          {/* Trigger Spec */}
          {story.triggerSpec && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Trigger Specification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Type</h4>
                    <Badge variant="outline">{story.triggerSpec.type}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Source</h4>
                    <p>{story.triggerSpec.source}</p>
                  </div>
                </div>
                {story.triggerSpec.conditions && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Conditions</h4>
                    <p className="text-sm">{story.triggerSpec.conditions}</p>
                  </div>
                )}
                {story.triggerSpec.examples && story.triggerSpec.examples.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Examples</h4>
                    <ul className="list-disc list-inside text-sm">
                      {story.triggerSpec.examples.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Behavior */}
          {story.behavior && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Type</h4>
                    <Badge variant="outline">{story.behavior.type}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Planning</h4>
                    <Badge variant="outline">{story.behavior.planning}</Badge>
                  </div>
                </div>
                {"stages" in story.behavior && story.behavior.stages && story.behavior.stages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Stages</h4>
                    <div className="space-y-2">
                      {story.behavior.stages.map((stage, i) => (
                        <div key={i} className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">{stage.name}</div>
                          <p className="text-sm text-muted-foreground">{stage.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {"capabilities" in story.behavior && story.behavior.capabilities && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Capabilities</h4>
                    <div className="flex flex-wrap gap-1">
                      {story.behavior.capabilities.map((cap, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reasoning */}
          {story.reasoning && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Reasoning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Strategy</h4>
                  <Badge variant="outline">{story.reasoning.strategy}</Badge>
                </div>
                {story.reasoning.decisionPoints && story.reasoning.decisionPoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Decision Points</h4>
                    <div className="space-y-2">
                      {story.reasoning.decisionPoints.map((dp, i) => (
                        <div key={i} className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">{dp.name}</div>
                          <p className="text-sm text-muted-foreground">Inputs: {dp.inputs}</p>
                          <p className="text-sm text-muted-foreground">Approach: {dp.approach}</p>
                          {dp.fallback && (
                            <p className="text-sm text-muted-foreground">Fallback: {dp.fallback}</p>
                          )}
                        </div>
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
                      {story.memory.working.map((m, i) => (
                        <li key={i}>{m}</li>
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
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {store.updates}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tools */}
          {story.tools && story.tools.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {story.tools.map((tool, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tool.name}</span>
                        <div className="flex gap-1">
                          {tool.permissions.map((perm, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{tool.purpose}</p>
                      {tool.conditions && (
                        <p className="text-xs text-muted-foreground mt-1">Conditions: {tool.conditions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {story.skills && story.skills.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {story.skills.map((skill, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{skill.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {skill.acquired}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{skill.domain}</p>
                      {skill.proficiencies && skill.proficiencies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {skill.proficiencies.map((p, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Quality: {skill.qualityBar}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                          {cp.timeout && (
                            <p className="text-xs text-muted-foreground">Timeout: {cp.timeout}</p>
                          )}
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

          {/* Acceptance Criteria */}
          {story.acceptance && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Acceptance Criteria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {story.acceptance.functional && story.acceptance.functional.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Functional</h4>
                    <ul className="list-disc list-inside text-sm">
                      {story.acceptance.functional.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {story.acceptance.quality && story.acceptance.quality.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Quality</h4>
                    <ul className="list-disc list-inside text-sm">
                      {story.acceptance.quality.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {story.acceptance.guardrails && story.acceptance.guardrails.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Guardrails
                    </h4>
                    <ul className="list-disc list-inside text-sm">
                      {story.acceptance.guardrails.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
