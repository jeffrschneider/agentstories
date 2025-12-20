"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Bot, ArrowRight, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/hap";
import { useHAPs, usePeople, useRoles, useDepartments } from "@/hooks";

interface LinkedHAPsSectionProps {
  storyId: string;
}

export function LinkedHAPsSection({ storyId }: LinkedHAPsSectionProps) {
  const { data: allHAPs = [], isLoading } = useHAPs();
  const { data: people = [] } = usePeople();
  const { data: roles = [] } = useRoles();
  const { data: departments = [] } = useDepartments();

  // Filter HAPs that use this story
  const linkedHAPs = React.useMemo(
    () => allHAPs.filter((hap) => hap.agentStoryId === storyId),
    [allHAPs, storyId]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (linkedHAPs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Linked Human-Agent Pairs
          </CardTitle>
          <CardDescription>
            People using this agent story in their role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No Human-Agent Pairs are using this story yet</p>
            <p className="text-sm mt-1">
              Create a HAP to link a person&apos;s role with this agent
            </p>
            <Button className="mt-4" asChild>
              <Link href="/organization/haps/new">
                <Plus className="h-4 w-4 mr-2" />
                Create HAP
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Linked Human-Agent Pairs ({linkedHAPs.length})
        </CardTitle>
        <CardDescription>
          People using this agent story in their role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {linkedHAPs.map((hap) => {
          const person = people.find((p) => p.id === hap.personId);
          const role = roles.find((r) => r.id === hap.roleId);
          const department = departments.find((d) => d.id === role?.departmentId);

          const completedTasks = hap.asIs.taskAssignments.filter(
            (t) => t.currentOwner === t.targetOwner
          ).length;
          const totalTasks = hap.asIs.taskAssignments.length;
          const progress = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

          return (
            <Link
              key={hap.id}
              href={`/organization/haps/${hap.id}`}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{person?.name || "Unknown Person"}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{role?.name || "Unknown Role"}</span>
                    {department && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {department.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{progress}% complete</p>
                  <Progress value={progress} className="h-1.5 w-24" />
                </div>
                <StatusBadge status={hap.transitionStatus} size="sm" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}

        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/organization/haps/new">
              <Plus className="h-4 w-4 mr-2" />
              Create New HAP
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
