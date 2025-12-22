"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  User,
  Bot,
  Lightbulb,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Responsibility, Person } from "@/lib/schemas";

interface ResponsibilityDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responsibility: Responsibility | null;
  people: Person[];
  roleName?: string;
  onEditRole?: () => void;
}

interface PersonSkillMatch {
  person: Person;
  matchedSkills: string[];
  missingSkills: string[];
  coveragePercent: number;
}

interface SuggestedPairing {
  person: Person;
  coveredByPerson: string[];
  coveredByAgent: string[];
  combinedCoverage: number;
}

export function ResponsibilityDetailDialog({
  open,
  onOpenChange,
  responsibility,
  people,
  roleName,
  onEditRole,
}: ResponsibilityDetailDialogProps) {
  const requiredSkills = responsibility?.requiredSkillDomains || [];

  // Analyze each person's skill coverage for this responsibility
  const personMatches = useMemo<PersonSkillMatch[]>(() => {
    if (!responsibility || requiredSkills.length === 0) return [];

    return people
      .map((person) => {
        const personSkills = person.skills || [];
        const matchedSkills = requiredSkills.filter((skill) =>
          personSkills.includes(skill)
        );
        const missingSkills = requiredSkills.filter(
          (skill) => !personSkills.includes(skill)
        );
        const coveragePercent =
          requiredSkills.length > 0
            ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
            : 0;

        return {
          person,
          matchedSkills,
          missingSkills,
          coveragePercent,
        };
      })
      .filter((match) => match.matchedSkills.length > 0)
      .sort((a, b) => b.coveragePercent - a.coveragePercent);
  }, [responsibility, people, requiredSkills]);

  // For now, assume an AI agent can cover all skills (we can refine this later)
  // In a full implementation, this would come from agent story skills
  const agentSkills = requiredSkills; // Agent can potentially cover all required skills

  // Generate suggested pairings (Human + Agent combinations)
  const suggestedPairings = useMemo<SuggestedPairing[]>(() => {
    if (!responsibility || requiredSkills.length === 0) return [];

    return people
      .map((person) => {
        const personSkills = person.skills || [];
        const coveredByPerson = requiredSkills.filter((skill) =>
          personSkills.includes(skill)
        );
        const coveredByAgent = requiredSkills.filter(
          (skill) => !personSkills.includes(skill) && agentSkills.includes(skill)
        );
        const totalCovered = new Set([...coveredByPerson, ...coveredByAgent]);
        const combinedCoverage =
          requiredSkills.length > 0
            ? Math.round((totalCovered.size / requiredSkills.length) * 100)
            : 0;

        return {
          person,
          coveredByPerson,
          coveredByAgent,
          combinedCoverage,
        };
      })
      .filter((pairing) => pairing.combinedCoverage === 100)
      .sort((a, b) => b.coveredByPerson.length - a.coveredByPerson.length);
  }, [responsibility, people, requiredSkills, agentSkills]);

  // Check if any person alone can cover all skills
  const fullyCapablePeople = personMatches.filter(
    (match) => match.coveragePercent === 100
  );

  // Missing skills across all people
  const allPeopleSkills = new Set(people.flatMap((p) => p.skills || []));
  const missingFromTeam = requiredSkills.filter(
    (skill) => !allPeopleSkills.has(skill)
  );

  if (!responsibility) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {responsibility.aiCandidate && (
                <Bot className="h-5 w-5 text-purple-500" />
              )}
              {responsibility.name}
            </DialogTitle>
            {onEditRole && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEditRole();
                }}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit Role
              </Button>
            )}
          </div>
          <DialogDescription>
            {responsibility.description}
            {roleName && (
              <span className="block mt-1 text-xs">Role: {roleName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Required Capabilities */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Required Capabilities</h3>
            {requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill) => {
                  const isCoveredByTeam = allPeopleSkills.has(skill);
                  return (
                    <Badge
                      key={skill}
                      variant={isCoveredByTeam ? "default" : "destructive"}
                      className="flex items-center gap-1"
                    >
                      {isCoveredByTeam ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {skill}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No specific capabilities defined for this responsibility
              </p>
            )}
          </div>

          {requiredSkills.length > 0 && (
            <>
              <Separator />

              {/* Team Capability Gap Alert */}
              {missingFromTeam.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Capability Gap Detected
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          No team members have:{" "}
                          {missingFromTeam.join(", ")}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                          An AI agent can fill this gap
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* People with Matching Capabilities */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  People with Matching Capabilities
                </h3>
                {personMatches.length > 0 ? (
                  <div className="space-y-2">
                    {personMatches.map((match) => (
                      <Card key={match.person.id}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {match.person.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {match.person.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {match.person.title}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                match.coveragePercent === 100
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {match.coveragePercent}% match
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {match.matchedSkills.map((skill) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-xs text-green-600 border-green-300"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                {skill}
                              </Badge>
                            ))}
                            {match.missingSkills.map((skill) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-xs text-red-600 border-red-300"
                              >
                                <XCircle className="h-2.5 w-2.5 mr-1" />
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No team members have any of the required capabilities
                  </p>
                )}
              </div>

              {/* Agent Capabilities */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-500" />
                  AI Agent Capabilities
                </h3>
                <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950">
                  <CardContent className="py-3">
                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                      An AI agent can provide these capabilities:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {requiredSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-xs text-purple-600 border-purple-300"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Suggested HAP Pairings */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Suggested Human-Agent Pairings
                </h3>
                {fullyCapablePeople.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {fullyCapablePeople.length} team member(s) can handle this
                    independently, but pairing with an agent can increase
                    efficiency.
                  </p>
                )}
                {suggestedPairings.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedPairings.slice(0, 3).map((pairing) => (
                      <Card
                        key={pairing.person.id}
                        className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                      >
                        <CardContent className="py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-sm">
                                {pairing.person.name}
                              </span>
                            </div>
                            <span className="text-muted-foreground">+</span>
                            <div className="flex items-center gap-1">
                              <Bot className="h-4 w-4 text-purple-500" />
                              <span className="font-medium text-sm">
                                AI Agent
                              </span>
                            </div>
                            <Badge
                              variant="default"
                              className="ml-auto bg-green-600"
                            >
                              100% Coverage
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground mb-1">
                                Human provides:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {pairing.coveredByPerson.length > 0 ? (
                                  pairing.coveredByPerson.map((skill) => (
                                    <Badge
                                      key={skill}
                                      variant="outline"
                                      className="text-[10px] text-blue-600 border-blue-300"
                                    >
                                      {skill}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    Oversight & judgment
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">
                                Agent provides:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {pairing.coveredByAgent.length > 0 ? (
                                  pairing.coveredByAgent.map((skill) => (
                                    <Badge
                                      key={skill}
                                      variant="outline"
                                      className="text-[10px] text-purple-600 border-purple-300"
                                    >
                                      {skill}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    Speed & consistency
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No viable pairings found. Consider adding team members with
                    relevant capabilities.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
