"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Trash2, Copy, Eye, Download, Pencil } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryForm } from "@/components/story-editor";
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
import type { AgentStory } from "@/lib/schemas";

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("edit");

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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/stories">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {story.name || "Untitled Story"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(story.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
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

        {/* Tabs for Edit/Preview/Export */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-6">
            <StoryForm onSave={handleSave} />
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            {currentStoryData.id ? (
              <StoryPreview story={currentStoryData} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Loading preview...
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            {currentStoryData.id ? (
              <ExportPanel story={currentStoryData} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Loading export...
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
