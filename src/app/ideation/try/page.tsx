'use client';

import * as React from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdeation } from '@/stores';
import { TryItChat } from '@/components/story-editor/try-it-chat';
import { ideatedAgentToStory } from '@/lib/ideation/convert-to-story';
import Link from 'next/link';

export default function IdeationTryItPage() {
  const ideation = useIdeation();
  const hasAgent = ideation.ideatedAgent.name && ideation.ideatedAgent.name.trim() !== '';

  if (!hasAgent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No Agent to Test</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Start a conversation in the Chat tab to ideate your agent first.
            Once you have an agent defined, you can test it here.
          </p>
          <Button asChild>
            <Link href="/ideation">
              <MessageSquare className="mr-2 h-4 w-4" />
              Go to Chat
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const story = ideatedAgentToStory(ideation.ideatedAgent);

  return (
    <div className="h-full">
      <TryItChat story={story} />
    </div>
  );
}
