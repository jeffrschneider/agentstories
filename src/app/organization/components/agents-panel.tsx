"use client";

import { useState } from "react";
import { Bot, Briefcase, ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Role, AgentStory } from "@/lib/schemas";

interface AgentsPanelProps {
  selectedRoleId: string | null;
  roles?: Role[];
  haps?: { id: string; roleId: string; agentStoryId: string }[];
  stories?: AgentStory[];
}

export function AgentsPanel({ selectedRoleId, roles, haps, stories }: AgentsPanelProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  // Get the selected role
  const selectedRole = roles?.find((r) => r.id === selectedRoleId);

  // Get HAPs for the selected role
  const roleHaps = haps?.filter((h) => h.roleId === selectedRoleId) || [];

  // Get unique agent stories for the role
  const roleAgents = roleHaps
    .map((hap) => stories?.find((s) => s.id === hap.agentStoryId))
    .filter((story): story is AgentStory => !!story)
    .filter((story, index, arr) => arr.findIndex((s) => s.id === story.id) === index);

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  if (!selectedRoleId) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Select a Role or Employee</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Click on a role to see associated agents, or an employee to see their task responsibilities
          </p>
        </CardContent>
      </Card>
    );
  }

  if (roleAgents.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{selectedRole?.name}</CardTitle>
          <CardDescription>Associated Agents</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No agents assigned to this role
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{selectedRole?.name}</CardTitle>
        <CardDescription>{roleAgents.length} agent{roleAgents.length !== 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {roleAgents.map((agent) => {
          const isExpanded = expandedAgents.has(agent.id);
          const capabilities = agent.skills || [];

          return (
            <div key={agent.id} className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAgent(agent.id)}
                className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    {agent.role && (
                      <div className="text-xs text-muted-foreground">{agent.role}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {capabilities.length} skill{capabilities.length !== 1 ? "s" : ""}
                  </Badge>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {isExpanded && capabilities.length > 0 && (
                <div className="border-t px-3 py-2 bg-muted/20">
                  <div className="space-y-1.5">
                    {capabilities.map((skill, idx) => (
                      <div key={skill.id || idx} className="text-xs">
                        <div className="font-medium text-muted-foreground">
                          {skill.name}
                        </div>
                        {skill.description && (
                          <div className="text-[11px] text-muted-foreground/70 line-clamp-2">
                            {skill.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isExpanded && capabilities.length === 0 && (
                <div className="border-t px-3 py-2 bg-muted/20">
                  <p className="text-xs text-muted-foreground italic">
                    No skills defined yet
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
