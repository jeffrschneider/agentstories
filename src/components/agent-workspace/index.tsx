'use client';

import * as React from 'react';
import { Play, Wrench, Save, Loader2, MoreHorizontal, PanelRightClose, PanelRight, Eye, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileTree } from './file-tree';
import { MultiFileEditor } from './file-editor';
import { AgentChat } from './agent-chat';
import {
  type AgentFile,
  type AgentFileSystem,
  buildFileTree,
  storyToFileSystem,
  filesToStory,
  generateSlug,
} from '@/lib/agent-files';
import type { AgentStory } from '@/lib/schemas';

interface AgentWorkspaceProps {
  story: AgentStory;
  onSave: (story: AgentStory) => Promise<void>;
  onTest?: () => void;
  onGenerate?: () => void;
  onPreview?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
}

export function AgentWorkspace({
  story,
  onSave,
  onTest,
  onGenerate,
  onPreview,
  onDuplicate,
  onDelete,
  isSaving = false,
}: AgentWorkspaceProps) {
  // Convert story to file system on load
  const [fileSystem, setFileSystem] = React.useState<AgentFileSystem>(() =>
    storyToFileSystem(story)
  );
  const [selectedPath, setSelectedPath] = React.useState<string | null>('AGENTS.md');
  const [openPaths, setOpenPaths] = React.useState<string[]>(['AGENTS.md']);
  const [isChatOpen, setIsChatOpen] = React.useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold">{fileSystem.name || 'Untitled Agent'}</h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
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
            onClick={() => setIsChatOpen(!isChatOpen)}
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
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* File tree */}
        <div className="w-48 border-r shrink-0">
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

        {/* Chat panel */}
        {isChatOpen && (
          <div className="w-80 border-l shrink-0">
            <AgentChat
              files={fileSystem.files}
              activeFile={activeFile}
              agentName={fileSystem.name || 'Agent'}
              onAction={handleChatAction}
            />
          </div>
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
