'use client';

import * as React from 'react';
import { Play, Wrench, Save, Loader2, MoreHorizontal, PanelRightClose, PanelRight, Eye, Copy, Trash2, FolderTree, Check, AlertCircle, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AgentExportDialog } from '@/components/story-editor/agent-export-dialog';
import { FileTree } from './file-tree';
import { MultiFileEditor } from './file-editor';
import { AgentChat } from './agent-chat';
import { ResizablePanel } from './resizable-panel';
import {
  type AgentFile,
  type AgentFileSystem,
  buildFileTree,
  storyToFileSystem,
  filesToStory,
  generateSlug,
} from '@/lib/agent-files';
import type { AgentStory } from '@/lib/schemas';

interface AutoSaveStatus {
  isSaving: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
  error: Error | null;
}

interface AgentWorkspaceProps {
  story: AgentStory;
  onSave: (story: AgentStory) => Promise<void>;
  onTest?: () => void;
  onGenerate?: () => void;
  onPreview?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onCreateNewAgent?: () => void;
  isSaving?: boolean;
  autoSaveStatus?: AutoSaveStatus;
}

export function AgentWorkspace({
  story,
  onSave,
  onTest,
  onGenerate,
  onPreview,
  onDuplicate,
  onDelete,
  onCreateNewAgent,
  isSaving = false,
  autoSaveStatus,
}: AgentWorkspaceProps) {
  // Convert story to file system on load
  const [fileSystem, setFileSystem] = React.useState<AgentFileSystem>(() =>
    storyToFileSystem(story)
  );
  const [selectedPath, setSelectedPath] = React.useState<string | null>('AGENTS.md');
  const [openPaths, setOpenPaths] = React.useState<string[]>(['AGENTS.md']);
  const [isChatOpen, setIsChatOpen] = React.useState(true);
  const [isChatExpanded, setIsChatExpanded] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Track story version to detect external changes
  const lastStoryRef = React.useRef<string>(JSON.stringify({
    skills: story.skills?.map(s => ({ name: s.name, id: s.id })),
    name: story.name,
    updatedAt: story.updatedAt,
  }));

  // Sync fileSystem when story changes externally (e.g., skill added via UI)
  React.useEffect(() => {
    const storySignature = JSON.stringify({
      skills: story.skills?.map(s => ({ name: s.name, id: s.id })),
      name: story.name,
      updatedAt: story.updatedAt,
    });

    // Only sync if story actually changed
    if (storySignature !== lastStoryRef.current) {
      lastStoryRef.current = storySignature;

      // Regenerate file system from story
      const newFileSystem = storyToFileSystem(story);

      setFileSystem(prev => {
        // Merge: keep local modifications to existing files,
        // but add/remove files based on story changes
        const existingPaths = new Set(prev.files.map(f => f.path));
        const newPaths = new Set(newFileSystem.files.map(f => f.path));

        // Files to keep (existed before and still exist)
        const keptFiles = prev.files.filter(f => newPaths.has(f.path));

        // New files (didn't exist before)
        const addedFiles = newFileSystem.files.filter(f => !existingPaths.has(f.path));

        // For kept files, update content only if file wasn't locally modified
        // (we use the new content since skills may have been updated via UI)
        const mergedFiles = keptFiles.map(existingFile => {
          const newFile = newFileSystem.files.find(f => f.path === existingFile.path);
          if (newFile) {
            // Use new content from story (reflects UI changes)
            return { ...existingFile, content: newFile.content };
          }
          return existingFile;
        });

        return {
          ...prev,
          name: story.name,
          files: [...mergedFiles, ...addedFiles],
          metadata: {
            ...prev.metadata,
            updatedAt: story.updatedAt,
          },
        };
      });

      // Open newly created skill files
      const newSkillFiles = newFileSystem.files.filter(
        f => f.type === 'skill' && !openPaths.includes(f.path)
      );
      if (newSkillFiles.length > 0) {
        const lastNewSkill = newSkillFiles[newSkillFiles.length - 1];
        setOpenPaths(prev => [...prev, lastNewSkill.path]);
        setSelectedPath(lastNewSkill.path);
      }
    }
  }, [story, openPaths]);

  // Build tree structure
  const treeNodes = React.useMemo(
    () => buildFileTree(fileSystem.files),
    [fileSystem.files]
  );

  // Get active file
  const activeFile = React.useMemo(
    () => fileSystem.files.find((f) => f.path === selectedPath) || null,
    [fileSystem.files, selectedPath]
  );

  // Handle file selection
  const handleSelectFile = (path: string) => {
    setSelectedPath(path);
    if (!openPaths.includes(path)) {
      setOpenPaths((prev) => [...prev, path]);
    }
  };

  // Handle file close
  const handleCloseFile = (path: string) => {
    setOpenPaths((prev) => prev.filter((p) => p !== path));
    if (selectedPath === path) {
      const remaining = openPaths.filter((p) => p !== path);
      setSelectedPath(remaining[remaining.length - 1] || null);
    }
  };

  // Handle file content change
  const handleFileChange = (path: string, content: string) => {
    setFileSystem((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.path === path
          ? { ...f, content, lastModified: new Date().toISOString() }
          : f
      ),
      metadata: {
        ...prev.metadata,
        updatedAt: new Date().toISOString(),
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Handle file creation
  const handleCreateFile = (parentPath: string, type: 'skill' | 'file') => {
    if (type === 'skill') {
      const skillName = `new-skill-${Date.now()}`;
      const skillPath = `skills/${skillName}/SKILL.md`;
      const newFile: AgentFile = {
        path: skillPath,
        content: generateSkillTemplate(skillName),
        type: 'skill',
        lastModified: new Date().toISOString(),
      };
      setFileSystem((prev) => ({
        ...prev,
        files: [...prev.files, newFile],
      }));
      handleSelectFile(skillPath);
      setHasUnsavedChanges(true);
    }
  };

  // Handle file deletion
  const handleDeleteFile = (path: string) => {
    // Don't allow deleting AGENTS.md
    if (path === 'AGENTS.md') return;

    setFileSystem((prev) => ({
      ...prev,
      files: prev.files.filter((f) => !f.path.startsWith(path)),
    }));
    handleCloseFile(path);
    setHasUnsavedChanges(true);
  };

  // Handle chat action
  const handleChatAction = (action: {
    type: 'create_file' | 'update_file' | 'delete_file';
    path: string;
    content?: string;
  }) => {
    switch (action.type) {
      case 'create_file':
        if (action.content) {
          const newFile: AgentFile = {
            path: action.path,
            content: action.content,
            type: action.path.includes('skills/') ? 'skill' : 'unknown',
            lastModified: new Date().toISOString(),
          };
          setFileSystem((prev) => ({
            ...prev,
            files: [...prev.files, newFile],
          }));
          handleSelectFile(action.path);
        }
        break;

      case 'update_file':
        if (action.content) {
          handleFileChange(action.path, action.content);
        }
        break;

      case 'delete_file':
        handleDeleteFile(action.path);
        break;
    }
    setHasUnsavedChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    const updatedStory = filesToStory(fileSystem);
    await onSave(updatedStory);
    setHasUnsavedChanges(false);
  };

  // Toggle chat expand
  const handleToggleChatExpand = () => {
    setIsChatExpanded((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{fileSystem.name || 'Untitled Agent'}</h1>
          {/* Auto-save status indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs">
                  {autoSaveStatus?.error ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-destructive">Save failed</span>
                    </>
                  ) : autoSaveStatus?.isSaving || isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Saving...</span>
                    </>
                  ) : autoSaveStatus?.isDirty || hasUnsavedChanges ? (
                    <>
                      <Cloud className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-muted-foreground">Unsaved</span>
                    </>
                  ) : autoSaveStatus?.lastSavedAt ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-muted-foreground">Saved</span>
                    </>
                  ) : null}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {autoSaveStatus?.error ? (
                  <p>Failed to save: {autoSaveStatus.error.message}</p>
                ) : autoSaveStatus?.isSaving || isSaving ? (
                  <p>Auto-saving changes...</p>
                ) : autoSaveStatus?.isDirty || hasUnsavedChanges ? (
                  <p>Changes will be saved automatically</p>
                ) : autoSaveStatus?.lastSavedAt ? (
                  <p>Last saved: {new Date(autoSaveStatus.lastSavedAt).toLocaleTimeString()}</p>
                ) : (
                  <p>Auto-save enabled</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          {onTest && (
            <Button variant="outline" size="sm" onClick={onTest}>
              <Play className="h-4 w-4 mr-1" />
              Test
            </Button>
          )}
          {onGenerate && (
            <Button variant="outline" size="sm" onClick={onGenerate}>
              <Wrench className="h-4 w-4 mr-1" />
              Generate
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) {
                setIsChatExpanded(false);
              }
            }}
            title={isChatOpen ? 'Hide chat' : 'Show chat'}
          >
            {isChatOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRight className="h-4 w-4" />
            )}
          </Button>
          {(onPreview || onDuplicate || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onPreview && (
                  <DropdownMenuItem onClick={onPreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <AgentExportDialog
                  story={filesToStory(fileSystem)}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <FolderTree className="h-4 w-4 mr-2" />
                      Export Agent
                    </DropdownMenuItem>
                  }
                />
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Manual save button - appears when there are unsaved changes or errors */}
          {(hasUnsavedChanges || autoSaveStatus?.isDirty || autoSaveStatus?.error) && (
            <Button size="sm" onClick={handleSave} disabled={isSaving || autoSaveStatus?.isSaving}>
              {isSaving || autoSaveStatus?.isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* File tree */}
        <div className="w-48 border-r shrink-0 overflow-hidden">
          <FileTree
            nodes={treeNodes}
            selectedPath={selectedPath}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          <MultiFileEditor
            files={fileSystem.files}
            openPaths={openPaths}
            activePath={selectedPath}
            onSelectFile={handleSelectFile}
            onCloseFile={handleCloseFile}
            onChangeFile={handleFileChange}
          />
        </div>

        {/* Chat panel - resizable */}
        {isChatOpen && (
          <ResizablePanel
            minWidth={280}
            maxWidth={800}
            defaultWidth={360}
            isExpanded={isChatExpanded}
            expandedWidth="50%"
          >
            <AgentChat
              files={fileSystem.files}
              activeFile={activeFile}
              agentName={fileSystem.name || 'Agent'}
              onAction={handleChatAction}
              onCreateNewAgent={onCreateNewAgent}
              isExpanded={isChatExpanded}
              onToggleExpand={handleToggleChatExpand}
            />
          </ResizablePanel>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-1 text-xs text-muted-foreground flex items-center justify-between shrink-0">
        <span>{fileSystem.files.length} files</span>
        <span>Powered by Claude Agent SDK</span>
      </div>
    </div>
  );
}

function generateSkillTemplate(name: string): string {
  const displayName = name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return `---
name: ${name}
description: Describe what this skill does
domain: General
acquired: built_in
---

# ${displayName}

## Triggers
- **manual**: When to invoke this skill

## Behavior
**Model**: sequential

### Steps
1. First step
2. Second step
3. Complete task

## Success Criteria
- Task completed successfully
`;
}

// Re-export components
export { FileTree } from './file-tree';
export { FileEditor, MultiFileEditor } from './file-editor';
export { AgentChat } from './agent-chat';
export { ResizablePanel } from './resizable-panel';
export { ContentBlock, parseContentBlocks } from './content-block';
