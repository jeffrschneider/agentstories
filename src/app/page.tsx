"use client";

import Link from "next/link";
import { Plus, FileText, LayoutTemplate } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Create and manage your agent stories
            </p>
          </div>
          <Button asChild>
            <Link href="/stories/new">
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Stories</CardDescription>
              <CardTitle className="text-4xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Create your first story to get started
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Templates</CardDescription>
              <CardTitle className="text-4xl">9</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Built-in templates available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Projects</CardDescription>
              <CardTitle className="text-4xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Organize stories into projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Start building specifications for your AI agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href="/stories/new"
                className="group rounded-lg border p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary">
                      Create from Scratch
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Build a custom agent story
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/templates"
                className="group rounded-lg border p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary">
                      Use a Template
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Start with a pre-built template
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Autonomy Levels Info */}
        <Card>
          <CardHeader>
            <CardTitle>Autonomy Levels</CardTitle>
            <CardDescription>
              Agent stories support four levels of autonomy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Badge variant="full">Full</Badge>
                <p className="text-sm text-muted-foreground">
                  Agent operates independently with minimal oversight
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="supervised">Supervised</Badge>
                <p className="text-sm text-muted-foreground">
                  Agent works autonomously with human monitoring
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="collaborative">Collaborative</Badge>
                <p className="text-sm text-muted-foreground">
                  Agent and human work together on tasks
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="directed">Directed</Badge>
                <p className="text-sm text-muted-foreground">
                  Human leads, agent assists with specific tasks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
