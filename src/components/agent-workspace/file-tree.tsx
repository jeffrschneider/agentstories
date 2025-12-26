'use client';

import * as React from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  FileText,
  Braces,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FileTreeNode, AgentFileType } from '@/lib/agent-files';

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (parentPath: string, type: 'skill' | 'file') => void;
  onDeleteFile: (path: string) => void;
  onRenameFile?: (path: string) => void;
  className?: string;
}

export function FileTree({
  nodes,
  selectedPath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  className,
}: FileTreeProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Files
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateFile('skills', 'skill')}>
              <FileText className="h-4 w-4 mr-2" />
              New Skill
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateFile('', 'file')}>
              <File className="h-4 w-4 mr-2" />
              New File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 overflow-auto py-1">
        {nodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
            onRenameFile={onRenameFile}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (parentPath: string, type: 'skill' | 'file') => void;
  onDeleteFile: (path: string) => void;
  onRenameFile?: (path: string) => void;
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = React.useState(depth === 0);
  const isSelected = selectedPath === node.path;
  const isFolder = node.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  const getFileIcon = (fileType?: AgentFileType) => {
    switch (fileType) {
      case 'agents':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'skill':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'mcp-config':
        return <Braces className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1 cursor-pointer text-sm hover:bg-muted/50',
          isSelected && 'bg-accent text-accent-foreground'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse icon for folders */}
        {isFolder ? (
          <span className="w-4 h-4 flex items-center justify-center">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        {isFolder ? (
          isOpen ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          getFileIcon(node.fileType)
        )}

        {/* Name */}
        <span className="flex-1 truncate">{node.name}</span>

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isFolder && node.path === 'skills' && (
              <>
                <DropdownMenuItem onClick={() => onCreateFile(node.path, 'skill')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Skill
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onRenameFile && (
              <DropdownMenuItem onClick={() => onRenameFile(node.path)}>
                Rename
              </DropdownMenuItem>
            )}
            {node.path !== 'AGENTS.md' && (
              <DropdownMenuItem
                onClick={() => onDeleteFile(node.path)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              onCreateFile={onCreateFile}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
