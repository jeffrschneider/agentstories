"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, Loader2, Trash2, Copy, Eye, Download, User, Zap, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentSection, SkillsSection, LinkedHAPsSection } from "@/components/story-editor";
import { ValidationPanel } from "@/components/story-editor/validation-panel";
import { StoryPreview, ExportPanel } from "@/components/story-preview";
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
import type { AgentStory } from "@/lib/schemas";

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

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
    router.push("/");
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
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Validation errors */}
        {editor.draft.validationErrors.length > 0 && (
          <ValidationPanel errors={editor.draft.validationErrors} />
        )}

        {/* Agent/Skills Tabs - Main content */}
        <Tabs defaultValue="agent" className="space-y-4">
          <div className="flex items-center justify-between">
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

            <div className="flex items-center gap-1">
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

              {/* Export Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" title="Export">
                    <Download className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[600px] sm:max-w-[600px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Export</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    {currentStoryData.id ? (
                      <ExportPanel story={currentStoryData} />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Loading export...
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="ghost" size="icon" onClick={handleDuplicate} title="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>

              {/* Delete Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
            </div>
          </div>

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

        {/* Save button at bottom */}
        <div className="flex justify-end pt-4 border-t">
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
