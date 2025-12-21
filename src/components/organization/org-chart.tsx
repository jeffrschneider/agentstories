"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Briefcase,
  Bot,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/hap";
import type { BusinessDomain, Department, Role, Person, HumanAgentPair } from "@/lib/schemas";

interface OrgChartProps {
  domains: BusinessDomain[];
  departments: Department[];
  roles: Role[];
  people: Person[];
  haps: HumanAgentPair[];
  className?: string;
}

interface TreeNodeProps {
  level: number;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  href?: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  progress?: number;
}

function TreeNode({
  level,
  icon,
  label,
  sublabel,
  href,
  children,
  defaultExpanded = false,
  badge,
  progress,
}: TreeNodeProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const hasChildren = React.Children.count(children) > 0;

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors",
        href && "cursor-pointer"
      )}
      onClick={() => !href && hasChildren && setExpanded(!expanded)}
    >
      {hasChildren ? (
        <button
          className="p-0.5 hover:bg-muted-foreground/10 rounded"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ) : (
        <div className="w-5" />
      )}
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground truncate">{sublabel}</p>
        )}
      </div>
      {progress !== undefined && (
        <div className="w-16">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">{progress}%</p>
        </div>
      )}
      {badge}
    </div>
  );

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      {href ? <Link href={href}>{content}</Link> : content}
      {expanded && hasChildren && (
        <div className="border-l ml-2.5 pl-2">{children}</div>
      )}
    </div>
  );
}

export function OrgChart({
  domains,
  departments,
  roles,
  people,
  haps,
  className,
}: OrgChartProps) {
  // Calculate progress for department (based on agent phases with skills)
  const getDeptProgress = (deptId: string) => {
    const deptRoles = roles.filter((r) => r.departmentId === deptId);
    const deptHaps = haps.filter((h) =>
      deptRoles.some((r) => r.id === h.roleId)
    );
    if (deptHaps.length === 0) return 0;

    let totalAgentPhases = 0;
    let agentPhasesWithSkills = 0;

    deptHaps.forEach((hap) => {
      (hap.tasks ?? []).forEach((task) => {
        Object.values(task.phases).forEach((phase) => {
          if (phase.owner === "agent") {
            totalAgentPhases++;
            if (phase.skillId) agentPhasesWithSkills++;
          }
        });
      });
    });

    return totalAgentPhases > 0 ? Math.round((agentPhasesWithSkills / totalAgentPhases) * 100) : 100;
  };

  // Calculate progress for HAP (based on agent phases with skills)
  const getHAPProgress = (hap: HumanAgentPair) => {
    const tasks = hap.tasks ?? [];
    let agentPhases = 0;
    let agentPhasesWithSkills = 0;

    tasks.forEach((task) => {
      Object.values(task.phases).forEach((phase) => {
        if (phase.owner === "agent") {
          agentPhases++;
          if (phase.skillId) agentPhasesWithSkills++;
        }
      });
    });

    return agentPhases > 0 ? Math.round((agentPhasesWithSkills / agentPhases) * 100) : 100;
  };

  return (
    <div className={cn("space-y-1", className)}>
      {domains.map((domain) => {
        const domainDepts = departments.filter((d) => d.domainId === domain.id);

        return (
          <TreeNode
            key={domain.id}
            level={0}
            icon={
              <div className="p-1.5 rounded bg-blue-100 text-blue-600">
                <Building2 className="h-4 w-4" />
              </div>
            }
            label={domain.name}
            sublabel={`${domainDepts.length} departments`}
            defaultExpanded={domains.length <= 3}
          >
            {domainDepts.map((dept) => {
              const deptRoles = roles.filter((r) => r.departmentId === dept.id);
              const deptHaps = haps.filter((h) =>
                deptRoles.some((r) => r.id === h.roleId)
              );
              const progress = getDeptProgress(dept.id);

              return (
                <TreeNode
                  key={dept.id}
                  level={0}
                  icon={
                    <div className="p-1.5 rounded bg-green-100 text-green-600">
                      <Users className="h-4 w-4" />
                    </div>
                  }
                  label={dept.name}
                  sublabel={`${deptRoles.length} roles • ${deptHaps.length} HAPs`}
                  href={`/organization/departments/${dept.id}`}
                  progress={deptHaps.length > 0 ? progress : undefined}
                  defaultExpanded={false}
                >
                  {deptRoles.map((role) => {
                    const roleHaps = haps.filter((h) => h.roleId === role.id);

                    return (
                      <TreeNode
                        key={role.id}
                        level={0}
                        icon={
                          <div className="p-1.5 rounded bg-purple-100 text-purple-600">
                            <Briefcase className="h-4 w-4" />
                          </div>
                        }
                        label={role.name}
                        sublabel={`${roleHaps.length} HAPs`}
                        defaultExpanded={roleHaps.length > 0 && roleHaps.length <= 3}
                      >
                        {roleHaps.map((hap) => {
                          const person = people.find((p) => p.id === hap.personId);
                          const progress = getHAPProgress(hap);

                          return (
                            <TreeNode
                              key={hap.id}
                              level={0}
                              icon={
                                <div className="p-1.5 rounded bg-orange-100 text-orange-600">
                                  <Bot className="h-4 w-4" />
                                </div>
                              }
                              label={person?.name || "Unknown"}
                              href={`/haps/${hap.id}`}
                              progress={progress}
                              badge={
                                <StatusBadge
                                  status={hap.integrationStatus}
                                  size="sm"
                                  showIcon={false}
                                />
                              }
                            />
                          );
                        })}
                      </TreeNode>
                    );
                  })}
                </TreeNode>
              );
            })}
          </TreeNode>
        );
      })}
    </div>
  );
}
