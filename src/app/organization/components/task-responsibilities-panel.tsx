"use client";

import Link from "next/link";
import { UserCircle, User, Bot, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useHAPDetail,
  usePerson,
  useRole,
  useStories,
} from "@/hooks";
import { TaskResponsibilityGrid } from "@/components/hap";
import { calculatePhaseDistribution } from "@/lib/schemas";

interface TaskResponsibilitiesPanelProps {
  selectedPersonId: string | null;
  selectedRoleId: string | null;
  selectedHapId?: string | null;
}

export function TaskResponsibilitiesPanel({
  selectedPersonId,
  selectedRoleId,
  selectedHapId,
}: TaskResponsibilitiesPanelProps) {
  const { data: person } = usePerson(selectedPersonId || "");
  const { data: role } = useRole(selectedRoleId || "");
  const { data: hap } = useHAPDetail(selectedHapId || "");
  const { data: stories } = useStories();

  const agentStory = hap ? stories?.find((s) => s.id === hap.agentStoryId) : undefined;

  if (!selectedPersonId) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center">
          <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Select an Employee</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Click on an employee in the tree to see their task responsibilities
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hap) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{person?.name || "Unknown"}</CardTitle>
              <CardDescription>{role?.name || "Unknown Role"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No Human-Agent Pair configured for this employee
          </p>
          <Button className="mt-4" asChild variant="outline" size="sm">
            <Link href="/haps/new">
              <Plus className="mr-2 h-4 w-4" />
              Create HAP
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const distribution = calculatePhaseDistribution(hap.tasks);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{person?.name || "Unknown"}</CardTitle>
              <CardDescription>{role?.name || "Unknown Role"}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/haps/${hap.id}`}>
              View HAP Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Agent Story Info */}
        {agentStory && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{agentStory.name}</p>
              <p className="text-xs text-muted-foreground">{agentStory.skills?.length || 0} skills</p>
            </div>
          </div>
        )}

        {/* Distribution Summary */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Human: {distribution.humanPercent}%</span>
            <span>Agent: {distribution.agentPercent}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-blue-500" style={{ width: `${distribution.humanPercent}%` }} />
            <div className="bg-purple-500" style={{ width: `${distribution.agentPercent}%` }} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Task Responsibilities</h4>
        </div>
        {hap.tasks.length > 0 ? (
          <TaskResponsibilityGrid tasks={hap.tasks} />
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No tasks defined yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
