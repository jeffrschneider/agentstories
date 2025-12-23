"use client";

import {
  Bot,
  Users,
  Puzzle,
  FileText,
  Target,
  ArrowRight,
  CheckCircle2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Planner</h1>
          <p className="text-muted-foreground">
            Enterprise AI transformation platform
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Value Proposition */}
            <Card>
              <CardHeader>
                <CardTitle>What is Agent Planner?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed">
                  Agent Planner is an enterprise AI transformation platform that
                  helps organizations systematically design, document, and deploy
                  AI agents at scale—bridging the gap between strategic AI
                  planning and operational implementation.
                </p>
              </CardContent>
            </Card>

            {/* The Problem */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  The Challenge
                </CardTitle>
                <CardDescription>
                  Why organizations struggle with enterprise AI adoption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Organizations face a critical challenge: they want to deploy AI
                  agents across their enterprise, but lack a structured framework
                  to:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-red-100 p-1 dark:bg-red-900">
                      <Target className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                      <span className="font-medium">Specify</span>
                      <span className="text-muted-foreground">
                        {" "}exactly what agents should do (and shouldn&apos;t do)
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-red-100 p-1 dark:bg-red-900">
                      <Users className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                      <span className="font-medium">Define</span>
                      <span className="text-muted-foreground">
                        {" "}how humans and AI collaborate on real work
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-red-100 p-1 dark:bg-red-900">
                      <Layers className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                      <span className="font-medium">Track</span>
                      <span className="text-muted-foreground">
                        {" "}which business capabilities can be automated
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-red-100 p-1 dark:bg-red-900">
                      <GitBranch className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                      <span className="font-medium">Manage</span>
                      <span className="text-muted-foreground">
                        {" "}the organizational change journey
                      </span>
                    </div>
                  </li>
                </ul>
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
                    <h3 className="font-semibold">Identify AI Candidates</h3>
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

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Clear Accountability</p>
                      <p className="text-sm text-muted-foreground">
                        Every task phase has a defined owner—human or agent
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Reusable Components</p>
                      <p className="text-sm text-muted-foreground">
                        Skills can be shared and reused across multiple agents
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Production-Ready Specs</p>
                      <p className="text-sm text-muted-foreground">
                        Agent Stories capture everything developers need
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Progress Visibility</p>
                      <p className="text-sm text-muted-foreground">
                        Track transformation progress across the organization
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
