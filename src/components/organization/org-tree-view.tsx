"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Briefcase,
  Bot,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  useDomains,
  useDepartments,
  useRoles,
  usePeople,
  useHAPs,
  useStories,
} from "@/hooks";
import type {
  BusinessDomain,
  Department,
  Role,
  Person,
} from "@/lib/schemas";

interface TreeNodeProps {
  level: number;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  href?: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

function TreeNode({
  level,
  icon,
  label,
  sublabel,
  href,
  children,
  defaultExpanded = false,
  onClick,
  isSelected,
}: TreeNodeProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const hasChildren = React.Children.count(children) > 0;

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted transition-colors",
        (href || onClick) && "cursor-pointer",
        isSelected && "bg-primary/10 ring-1 ring-primary/20"
      )}
      onClick={() => {
        if (onClick) {
          onClick();
        } else if (!href && hasChildren) {
          setExpanded(!expanded);
        }
      }}
    >
      {hasChildren ? (
        <button
          className="p-0.5 hover:bg-muted-foreground/10 rounded flex-shrink-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      ) : (
        <div className="w-5 flex-shrink-0" />
      )}
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground truncate">{sublabel}</p>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      {href ? <Link href={href}>{content}</Link> : content}
      {expanded && hasChildren && (
        <div className="border-l border-border ml-2.5 pl-1">{children}</div>
      )}
    </div>
  );
}

interface OrgTreeViewProps {
  className?: string;
  onSelectDomain?: (domainId: string) => void;
  onSelectDepartment?: (deptId: string, domainId: string) => void;
  onSelectRole?: (roleId: string) => void;
  onSelectPerson?: (personId: string, roleId: string, hapId?: string) => void;
  selectedRoleId?: string | null;
  selectedPersonId?: string | null;
}

export function OrgTreeView({
  className,
  onSelectDomain,
  onSelectDepartment,
  onSelectRole,
  onSelectPerson,
  selectedRoleId,
  selectedPersonId,
}: OrgTreeViewProps) {
  const { data: domains, isLoading: domainsLoading } = useDomains();
  const { data: departments } = useDepartments();
  const { data: roles } = useRoles();
  const { data: people } = usePeople();
  const { data: haps } = useHAPs();
  const { data: stories } = useStories();

  if (domainsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!domains || domains.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No organization data</h3>
          <p className="text-muted-foreground mt-1">
            Create domains and departments to see the organization tree
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-1">
          {domains.map((domain) => {
            const domainDepts =
              departments?.filter((d) => d.domainId === domain.id) || [];

            return (
              <TreeNode
                key={domain.id}
                level={0}
                icon={
                  <div className="p-1.5 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                }
                label={domain.name}
                sublabel={
                  domain.description ||
                  `${domainDepts.length} department${domainDepts.length !== 1 ? "s" : ""}`
                }
                defaultExpanded={domains.length <= 3}
                onClick={
                  onSelectDomain
                    ? () => onSelectDomain(domain.id)
                    : undefined
                }
              >
                {domainDepts.map((dept) => {
                  const deptRoles =
                    roles?.filter((r) => r.departmentId === dept.id) || [];
                  const deptPeople =
                    people?.filter((p) => p.departmentId === dept.id) || [];

                  return (
                    <TreeNode
                      key={dept.id}
                      level={0}
                      icon={
                        <div className="p-1.5 rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                          <Users className="h-4 w-4" />
                        </div>
                      }
                      label={dept.name}
                      sublabel={`${deptRoles.length} roles • ${deptPeople.length} people`}
                      defaultExpanded={false}
                      onClick={
                        onSelectDepartment
                          ? () => onSelectDepartment(dept.id, domain.id)
                          : undefined
                      }
                    >
                      {deptRoles.map((role) => {
                        const roleHaps =
                          haps?.filter((h) => h.roleId === role.id) || [];
                        const rolePeople =
                          people?.filter((p) =>
                            p.roleAssignments.some((ra) => ra.roleId === role.id)
                          ) || [];

                        return (
                          <TreeNode
                            key={role.id}
                            level={0}
                            icon={
                              <div className="p-1.5 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                <Briefcase className="h-4 w-4" />
                              </div>
                            }
                            label={role.name}
                            sublabel={role.level ? `${role.level} • ${role.responsibilities?.length || 0} responsibilities` : `${role.responsibilities?.length || 0} responsibilities`}
                            defaultExpanded={
                              roleHaps.length > 0 || rolePeople.length > 0
                            }
                            onClick={
                              onSelectRole
                                ? () => onSelectRole(role.id)
                                : undefined
                            }
                            isSelected={selectedRoleId === role.id}
                          >
                            {/* People in this role */}
                            {rolePeople.map((person) => {
                              const personHap = haps?.find(
                                (h) =>
                                  h.personId === person.id &&
                                  h.roleId === role.id
                              );
                              const hapAgentStory = personHap
                                ? stories?.find((s) => s.id === personHap.agentStoryId)
                                : undefined;

                              return (
                                <TreeNode
                                  key={`person-${person.id}-${role.id}`}
                                  level={0}
                                  icon={
                                    personHap ? (
                                      <div className="p-1.5 rounded-md bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                        <Bot className="h-4 w-4" />
                                      </div>
                                    ) : (
                                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        <UserCircle className="h-4 w-4" />
                                      </div>
                                    )
                                  }
                                  label={person.name}
                                  sublabel={
                                    personHap
                                      ? `+ ${hapAgentStory?.name || "Unassigned Agent"}`
                                      : person.title || person.email
                                  }
                                  onClick={
                                    onSelectPerson
                                      ? () => onSelectPerson(person.id, role.id, personHap?.id)
                                      : undefined
                                  }
                                  isSelected={selectedPersonId === person.id}
                                />
                              );
                            })}

                            {/* HAPs without assigned people shown yet */}
                            {roleHaps
                              .filter(
                                (hap) =>
                                  !rolePeople.some((p) => p.id === hap.personId)
                              )
                              .map((hap) => {
                                const person = people?.find(
                                  (p) => p.id === hap.personId
                                );
                                const hapAgentStory = stories?.find(
                                  (s) => s.id === hap.agentStoryId
                                );
                                return (
                                  <TreeNode
                                    key={`hap-${hap.id}`}
                                    level={0}
                                    icon={
                                      <div className="p-1.5 rounded-md bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                        <Bot className="h-4 w-4" />
                                      </div>
                                    }
                                    label={person?.name || "Unknown Person"}
                                    sublabel={`+ ${hapAgentStory?.name || "Unassigned Agent"}`}
                                    onClick={
                                      onSelectPerson && person
                                        ? () => onSelectPerson(person.id, role.id, hap.id)
                                        : undefined
                                    }
                                    isSelected={selectedPersonId === person?.id}
                                  />
                                );
                              })}

                            {rolePeople.length === 0 && roleHaps.length === 0 && (
                              <div className="text-xs text-muted-foreground py-2 pl-7">
                                No people assigned to this role
                              </div>
                            )}
                          </TreeNode>
                        );
                      })}

                      {deptRoles.length === 0 && (
                        <div className="text-xs text-muted-foreground py-2 pl-7">
                          No roles defined
                        </div>
                      )}
                    </TreeNode>
                  );
                })}

                {domainDepts.length === 0 && (
                  <div className="text-xs text-muted-foreground py-2 pl-7">
                    No departments in this domain
                  </div>
                )}
              </TreeNode>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
