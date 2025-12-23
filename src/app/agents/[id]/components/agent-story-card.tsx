"use client";

import Link from "next/link";
import { FileText, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AgentStory } from "@/lib/schemas";

interface AgentStoryCardProps {
  linkedStory: AgentStory | null | undefined;
}

export function AgentStoryCard({ linkedStory }: AgentStoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Agent Story
        </CardTitle>
        <CardDescription>
          Detailed specification for this agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkedStory ? (
          <Link
            href={`/stories/${linkedStory.id}`}
            className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <FileText className="h-5 w-5" />
            <div className="flex-1">
              <div className="font-medium">{linkedStory.name}</div>
              <div className="text-sm text-muted-foreground">
                {linkedStory.role}
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-3">
              No Agent Story linked yet
            </p>
            <Button variant="outline" asChild>
              <Link href="/stories/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Agent Story
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
