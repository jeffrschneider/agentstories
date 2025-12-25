"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, Loader2, Trash2, Copy, Eye, User, Zap, Users, MessageSquare, Play, Wrench, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentSection, SkillsSection, LinkedHAPsSection, HarnessExportDialog } from "@/components/story-editor";
import { ValidationPanel } from "@/components/story-editor/validation-panel";
import { StoryPreview } from "@/components/story-preview";
import { TryItChat } from "@/components/story-editor/try-it-chat";
import { StoryChatInterface } from "@/components/story-editor/story-chat-interface";
import { GeneratePanel } from "@/components/story-editor/generate-panel";
import { storyEditorActions, useStoryEditor } from "@/stores";
import { useStory, useUpdateStory, useDeleteStory, useDuplicateStory } from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AgentStory } from "@/lib/schemas";

export default function AgentWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("story");

  const editor = useStoryEditor();
  const { data: story, isLoading } = useStory(id);
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();
  const duplicateStory = useDuplicateStory();

  // Load story into editor when fetched
  useEffect(() => {
    if (story) {
      storyEditorActions.loadStory(story);
    }
    return () => {
      storyEditorActions.clearDraft();
    };
  }, [story]);

  const handleSave = async () => {
    const data = editor.draft.data as Partial<AgentStory>;

    try {
      storyEditorActions.setSaving(true);
      await updateStory.mutateAsync({ id, data });
      storyEditorActions.setLastSaved(new Date().toISOString());
    } finally {
      storyEditorActions.setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteStory.mutateAsync({ id, name: story?.name || 'Untitled' });
    router.push("/stories");
  };

  const handleDuplicate = async () => {
    const duplicated = await duplicateStory.mutateAsync(id);
    if (duplicated) {
      router.push(`/stories/${duplicated.id}`);
    }
  };

  // Get current story data for preview/export
  const currentStoryData = editor.draft.data as AgentStory;

  if (isLoading) {
    return (
      <AppShell className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!story) {
    return (
      <AppShell className="p-6">
        <div className="mx-auto max-w-4xl text-center py-12">
          <h1 className="text-2xl font-bold">Story not found</h1>
          <p className="text-muted-foreground mt-2">
            The story you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/stories">Go back to stories</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Workspace Header */}
        <div className="border-b px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{currentStoryData.name || 'Untitled Agent'}</h1>
              {currentStoryData.purpose && (
                <p className="text-sm text-muted-foreground mt-0.5 max-w-xl truncate">
                  {currentStoryData.purpose}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Preview Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" title="Preview">
                    <Eye className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Preview</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    {currentStoryData.id ? (
                      <StoryPreview story={currentStoryData} />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Loading preview...
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Story</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete &quot;{story.name}&quot;? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Save button */}
              <Button
                onClick={handleSave}
                disabled={editor.isSaving || editor.draft.validationErrors.length > 0}
              >
                {editor.isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Validation errors */}
        {editor.draft.validationErrors.length > 0 && (
          <div className="px-6 py-2 shrink-0">
            <ValidationPanel errors={editor.draft.validationErrors} />
          </div>
        )}

        {/* Main Workspace Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="border-b px-6 shrink-0">
            <TabsList className="h-12">
              <TabsTrigger value="story" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Story
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Test
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Generate
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Story Tab - Form Editor */}
          <TabsContent value="story" className="flex-1 overflow-auto m-0 p-6">
            <div className="mx-auto max-w-4xl space-y-4">
              <Tabs defaultValue="agent" className="space-y-4">
                <TabsList className="grid w-auto grid-cols-3">
                  <TabsTrigger value="agent" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Agent
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Skills
                  </TabsTrigger>
                  <TabsTrigger value="haps" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    HAPs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="agent" className="space-y-4">
                  <AgentSection />
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                  <SkillsSection />
                </TabsContent>

                <TabsContent value="haps" className="space-y-4">
                  <LinkedHAPsSection storyId={id} />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Chat Tab - Natural Language Editing */}
          <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
            <StoryChatInterface
              story={currentStoryData}
              onStoryUpdate={(updates) => {
                // Update the story in the editor
                Object.entries(updates).forEach(([key, value]) => {
                  storyEditorActions.updateDraft(key as keyof AgentStory, value as AgentStory[keyof AgentStory]);
                });
              }}
            />
          </TabsContent>

          {/* Test Tab - Run Agent */}
          <TabsContent value="test" className="flex-1 m-0 overflow-hidden">
            <div className="flex flex-col h-full">
              <TryItChat story={currentStoryData} />
              <div className="border-t px-4 py-2 text-center shrink-0">
                <p className="text-xs text-muted-foreground">
                  Powered by Claude Agent SDK
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Generate Tab - Framework Configs */}
          <TabsContent value="generate" className="flex-1 overflow-auto m-0">
            <GeneratePanel story={currentStoryData} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
