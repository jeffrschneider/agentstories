"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Clock, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStories } from "@/hooks";
import type { AutonomyLevel, StoryFormat } from "@/lib/schemas";

export default function StoriesPage() {
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<StoryFormat | "all">("all");
  const [autonomyFilter, setAutonomyFilter] = useState<AutonomyLevel | "all">("all");

  const { data: stories, isLoading } = useStories({
    search: search || undefined,
    format: formatFilter === "all" ? undefined : formatFilter,
    autonomyLevel: autonomyFilter === "all" ? undefined : autonomyFilter,
  });

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stories</h1>
            <p className="text-muted-foreground">
              All your agent story specifications
            </p>
          </div>
          <Button asChild>
            <Link href="/stories/new">
              <Plus className="mr-2 h-4 w-4" />
              New Story
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search stories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={formatFilter}
                onValueChange={(v) => setFormatFilter(v as StoryFormat | "all")}
              >
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={autonomyFilter}
                onValueChange={(v) => setAutonomyFilter(v as AutonomyLevel | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Autonomy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Autonomy</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="supervised">Supervised</SelectItem>
                  <SelectItem value="collaborative">Collaborative</SelectItem>
                  <SelectItem value="directed">Directed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stories List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stories && stories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Link key={story.id} href={`/stories/${story.id}`}>
                <Card className="h-full transition-colors hover:border-primary hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={story.format === "full" ? "default" : "secondary"}>
                        {story.format}
                      </Badge>
                      <Badge variant="outline">{story.autonomyLevel}</Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-1">
                      {story.name || "Untitled"}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {story.role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{story.identifier}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(story.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {story.tags && story.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {story.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {story.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{story.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold">No stories found</h3>
              <p className="text-muted-foreground mt-1">
                {search || formatFilter !== "all" || autonomyFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first agent story to get started"}
              </p>
              <Button asChild className="mt-4">
                <Link href="/stories/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Story
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
