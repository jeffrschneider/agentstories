"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { useCreateStory } from "@/hooks";

export default function NewStoryPage() {
  const router = useRouter();
  const createStory = useCreateStory();
  const hasCreated = useRef(false);

  // Create a new story and redirect to the workspace immediately
  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;

    const createAndRedirect = async () => {
      try {
        const newStory = await createStory.mutateAsync({
          name: 'New Agent',
          purpose: '',
          version: '1.0',
        });

        if (newStory) {
          router.replace(`/stories/${newStory.id}`);
        }
      } catch (error) {
        console.error('Failed to create story:', error);
        // Redirect to stories list on error
        router.replace('/stories');
      }
    };

    createAndRedirect();
  }, [createStory, router]);

  return (
    <AppShell className="p-6">
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Creating new agent...</p>
      </div>
    </AppShell>
  );
}
