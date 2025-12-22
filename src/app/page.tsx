"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Briefcase,
  UserCircle,
  Bot,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useDomains,
  useDepartments,
  useRoles,
  usePeople,
  useHAPs,
  useHAPStats,
} from "@/hooks";
import { analyzeRoleSkillCoverage } from "@/lib/schemas";

export default function Home() {
  const { data: domains, isLoading: domainsLoading } = useDomains();
  const { data: departments } = useDepartments();
  const { data: roles } = useRoles();
  const { data: people } = usePeople();
  const { data: haps } = useHAPs();
  const { data: hapStats } = useHAPStats();

  // Calculate transformation metrics
  const metrics = useMemo(() => {
    if (!roles || !people) {
      return {
        totalResponsibilities: 0,
        aiCandidateResponsibilities: 0,
        totalSkillCoverage: 0,
        fullyCovered: 0,
        partiallyCovered: 0,
        notCovered: 0,
        skillGaps: [] as { skill: string; count: number }[],
        topMissingSkills: [] as string[],
      };
    }

    // Get all available skills from people
    const allPeopleSkills = [...new Set(people.flatMap((p) => p.skills || []))];

    // Analyze all roles
    let totalResponsibilities = 0;
    let aiCandidateResponsibilities = 0;
    let fullyCovered = 0;
    let partiallyCovered = 0;
    let notCovered = 0;
    let totalCoverageSum = 0;
    let totalAiCandidates = 0;
    const skillGapCounts: Record<string, number> = {};

    roles.forEach((role) => {
      totalResponsibilities += role.responsibilities.length;
      const aiCandidates = role.responsibilities.filter((r) => r.aiCandidate);
      aiCandidateResponsibilities += aiCandidates.length;

      const coverage = analyzeRoleSkillCoverage(role, allPeopleSkills);
      fullyCovered += coverage.fullyCovered;
      partiallyCovered += coverage.partiallyCovered;
      notCovered += coverage.notCovered;
      totalCoverageSum += coverage.overallCoveragePercent * coverage.totalAiCandidates;
      totalAiCandidates += coverage.totalAiCandidates;

      // Track skill gaps
      coverage.responsibilities.forEach((resp) => {
        resp.missingSkills.forEach((skill) => {
          skillGapCounts[skill] = (skillGapCounts[skill] || 0) + 1;
        });
      });
    });

    const totalSkillCoverage =
      totalAiCandidates > 0 ? Math.round(totalCoverageSum / totalAiCandidates) : 100;

    // Sort skill gaps by frequency
    const skillGaps = Object.entries(skillGapCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalResponsibilities,
      aiCandidateResponsibilities,
      totalSkillCoverage,
      fullyCovered,
      partiallyCovered,
      notCovered,
      skillGaps,
      topMissingSkills: skillGaps.slice(0, 3).map((g) => g.skill),
    };
  }, [roles, people]);

  const isLoading = domainsLoading;

  // Calculate funnel percentages
  const funnelData = useMemo(() => {
    const aiCandidates = metrics.aiCandidateResponsibilities;
    const withCoverage = metrics.fullyCovered + metrics.partiallyCovered;
    const hapsCreated = hapStats?.hapCount || 0;

    return {
      aiCandidates,
      withCoverage,
      hapsCreated,
      coveragePercent: aiCandidates > 0 ? Math.round((withCoverage / aiCandidates) * 100) : 0,
      hapPercent: aiCandidates > 0 ? Math.round((hapsCreated / aiCandidates) * 100) : 0,
    };
  }, [metrics, hapStats]);

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Transformation Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your organization&apos;s journey to an agentic enterprise
            </p>
          </div>
          <Button asChild>
            <Link href="/organization">
              <Building2 className="mr-2 h-4 w-4" />
              Manage Organization
            </Link>
          </Button>
        </div>

        {/* Top Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {isLoading ? "..." : domains?.length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Domains</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {isLoading ? "..." : roles?.length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Roles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? "..." : metrics.aiCandidateResponsibilities}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">AI-Ready Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {isLoading ? "..." : people?.length || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">People</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold">
                  {isLoading ? "..." : hapStats?.hapCount || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">HAPs Created</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Capability Coverage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Capability Coverage
              </CardTitle>
              <CardDescription>
                How well your team&apos;s capabilities match AI-ready responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Coverage Gauge */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="h-32 w-32 -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${metrics.totalSkillCoverage * 3.52} 352`}
                      className={
                        metrics.totalSkillCoverage >= 80
                          ? "text-green-500"
                          : metrics.totalSkillCoverage >= 50
                          ? "text-yellow-500"
                          : "text-red-500"
                      }
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">
                    {metrics.totalSkillCoverage}%
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Overall capability coverage for AI tasks
                </p>
              </div>

              {/* Coverage Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Fully Covered</span>
                  </div>
                  <span className="font-medium">{metrics.fullyCovered} tasks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Partially Covered</span>
                  </div>
                  <span className="font-medium">{metrics.partiallyCovered} tasks</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>Not Covered</span>
                  </div>
                  <span className="font-medium">{metrics.notCovered} tasks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capability Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Capability Gaps
              </CardTitle>
              <CardDescription>
                Capabilities needed but not available in your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.skillGaps.length > 0 ? (
                <div className="space-y-4">
                  {metrics.skillGaps.slice(0, 5).map((gap) => (
                    <div key={gap.skill} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{gap.skill}</span>
                        <Badge variant="outline" className="text-orange-600">
                          {gap.count} {gap.count === 1 ? "task" : "tasks"} affected
                        </Badge>
                      </div>
                      <Progress
                        value={(gap.count / metrics.aiCandidateResponsibilities) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                  {metrics.skillGaps.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{metrics.skillGaps.length - 5} more capability gaps
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">No capability gaps detected</p>
                  <p className="text-sm text-muted-foreground">
                    Your team has all required capabilities covered
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transformation Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Transformation Progress
            </CardTitle>
            <CardDescription>
              From AI-ready responsibilities to active Human-Agent Pairs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {/* Stage 1: AI Candidates */}
              <div className="flex-1 text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{funnelData.aiCandidates}</p>
                <p className="text-xs text-muted-foreground">AI-Ready Tasks</p>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

              {/* Stage 2: Capabilities Matched */}
              <div className="flex-1 text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold">{funnelData.withCoverage}</p>
                <p className="text-xs text-muted-foreground">Capabilities Matched</p>
                <Badge variant="outline" className="mt-1">
                  {funnelData.coveragePercent}%
                </Badge>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

              {/* Stage 3: HAPs Created */}
              <div className="flex-1 text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Bot className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{funnelData.hapsCreated}</p>
                <p className="text-xs text-muted-foreground">HAPs Created</p>
                <Badge variant="outline" className="mt-1">
                  {funnelData.hapPercent}%
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-purple-500 transition-all"
                  style={{
                    width: `${100 - funnelData.coveragePercent}%`,
                  }}
                />
                <div
                  className="bg-yellow-500 transition-all"
                  style={{
                    width: `${funnelData.coveragePercent - funnelData.hapPercent}%`,
                  }}
                />
                <div
                  className="bg-green-500 transition-all"
                  style={{
                    width: `${funnelData.hapPercent}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Needs Capabilities</span>
                <span>Ready for HAPs</span>
                <span>Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Continue building your agentic enterprise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href="/organization"
                className="group rounded-lg border p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-100 dark:bg-blue-900 p-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary">
                      Define Structure
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add roles & responsibilities
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/organization"
                className="group rounded-lg border p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-yellow-100 dark:bg-yellow-900 p-2">
                    <Users className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary">
                      Assign Capabilities
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Map capabilities to your team
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/haps"
                className="group rounded-lg border p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-green-100 dark:bg-green-900 p-2">
                    <Bot className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary">
                      Create HAPs
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Pair humans with agents
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
