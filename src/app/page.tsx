"use client";

import {
  Users,
  Puzzle,
  FileText,
  Target,
  ArrowRight,
  Layers,
  GitBranch,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Welcome and Challenge - Side by Side */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Value Proposition */}
          <Card>
            <CardContent className="flex items-center py-6">
              <p className="text-xl leading-relaxed text-muted-foreground">
                Agent Planner helps you define what AI agents should do, specify
                how humans and agents share responsibilities, and track your
                organization&apos;s readiness for AI-assisted work.
              </p>
            </CardContent>
          </Card>

          {/* The Challenge */}
          <Card>
            <CardHeader>
              <CardTitle>The Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Organizations want to deploy AI agents but lack a structured
                framework to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Specify</span>{" "}
                    exactly what agents should do
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Define</span>{" "}
                    how humans and AI collaborate
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Track</span>{" "}
                    which capabilities can be automated
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <GitBranch className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Manage</span>{" "}
                    the organizational change journey
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              The path from organizational analysis to deployed agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              {/* Step 1 */}
              <div className="flex-1 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-lg font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold">Map Organization</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define domains, departments, roles, and responsibilities
                </p>
              </div>

              <ArrowRight className="mx-auto h-6 w-6 rotate-90 text-muted-foreground md:mt-6 md:rotate-0" />

              {/* Step 2 */}
              <div className="flex-1 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <span className="text-lg font-bold text-purple-600">2</span>
                </div>
                <h3 className="font-semibold">Identify Agent Candidates</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Flag tasks suitable for AI automation or augmentation
                </p>
              </div>

              <ArrowRight className="mx-auto h-6 w-6 rotate-90 text-muted-foreground md:mt-6 md:rotate-0" />

              {/* Step 3 */}
              <div className="flex-1 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <span className="text-lg font-bold text-green-600">3</span>
                </div>
                <h3 className="font-semibold">Design Collaboration</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create HAPs with phase-by-phase responsibility assignments
                </p>
              </div>

              <ArrowRight className="mx-auto h-6 w-6 rotate-90 text-muted-foreground md:mt-6 md:rotate-0" />

              {/* Step 4 */}
              <div className="flex-1 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                  <span className="text-lg font-bold text-orange-600">4</span>
                </div>
                <h3 className="font-semibold">Specify Agents</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Build detailed Agent Stories with skills and behaviors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Capabilities */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Key Capabilities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Transformation Dashboard */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  Transformation Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Executive visibility into AI initiative progress: skill
                  coverage, automation candidates, HAP creation funnels, and
                  gap analysis.
                </p>
              </CardContent>
            </Card>

            {/* Human-Agent Pairs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-900">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  Human-Agent Pairs (HAPs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Moves beyond the &quot;fully automated vs. fully manual&quot;
                  binary. Organizations can assign responsibility phases
                  (Manage → Define → Perform → Review) between humans and
                  agents for nuanced collaboration.
                </p>
              </CardContent>
            </Card>

            {/* Skill-First Architecture */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="rounded-md bg-green-100 p-2 dark:bg-green-900">
                    <Puzzle className="h-4 w-4 text-green-600" />
                  </div>
                  Skill-First Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Agents are composed of reusable, modular skills—not
                  monolithic designs. Skills can be tested, versioned, and
                  shared across the organization.
                </p>
              </CardContent>
            </Card>

            {/* Agent Stories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="rounded-md bg-orange-100 p-2 dark:bg-orange-900">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  Agent Stories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A comprehensive specification format that captures triggers,
                  behaviors, reasoning approaches, guardrails, memory
                  requirements, and acceptance criteria—ensuring agents are
                  production-ready before development begins.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
