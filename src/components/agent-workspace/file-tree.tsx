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
  Code,
  BookOpen,
  FileBox,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FileTreeNode, AgentFileType } from '@/lib/agent-files';

// File creation types aligned with Agent Skills spec
export type CreateFileType = 'skill' | 'script' | 'reference' | 'asset' | 'config' | 'file';

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (parentPath: string, type: CreateFileType) => void;
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
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Plus className="h-4 w-4 mr-2" />
                Add to Agent
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onCreateFile('', 'config')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Config File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateFile('tools', 'file')}>
                  <Braces className="h-4 w-4 mr-2" />
                  MCP Tool Config
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateFile('', 'file')}>
                  <File className="h-4 w-4 mr-2" />
                  Other File
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
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
  onCreateFile: (parentPath: string, type: CreateFileType) => void;
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
      case 'skill-config':
      case 'config':
        return <Settings className="h-4 w-4 text-slate-500" />;
      case 'script':
        return <Code className="h-4 w-4 text-purple-500" />;
      case 'reference':
        return <BookOpen className="h-4 w-4 text-cyan-500" />;
      case 'asset':
        return <FileBox className="h-4 w-4 text-amber-500" />;
      case 'mcp-config':
        return <Braces className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Check if this is a skill directory (contains SKILL.md)
  const isSkillDirectory = isFolder && node.path.startsWith('skills/') &&
    node.path.split('/').length === 2 && node.path !== 'skills';

  // Check if this is a skill subdirectory (scripts, references, assets)
  const isSkillSubdirectory = isFolder && node.path.startsWith('skills/') &&
    node.path.split('/').length === 3 &&
    ['scripts', 'references', 'assets'].includes(node.name);

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
            {/* Skills folder - add new skill */}
            {isFolder && node.path === 'skills' && (
              <>
                <DropdownMenuItem onClick={() => onCreateFile(node.path, 'skill')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Skill
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Skill directory - add scripts, references, assets */}
            {isSkillDirectory && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Skill
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onCreateFile(`${node.path}/scripts`, 'script')}>
                      <Code className="h-4 w-4 mr-2" />
                      Script
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCreateFile(`${node.path}/references`, 'reference')}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Reference Doc
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCreateFile(`${node.path}/assets`, 'asset')}>
                      <FileBox className="h-4 w-4 mr-2" />
                      Asset
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Skill subdirectory - add appropriate file type */}
            {isSkillSubdirectory && (
              <>
                <DropdownMenuItem onClick={() => onCreateFile(node.path,
                  node.name === 'scripts' ? 'script' :
                  node.name === 'references' ? 'reference' : 'asset'
                )}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {node.name === 'scripts' ? 'Script' :
                       node.name === 'references' ? 'Reference' : 'Asset'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {onRenameFile && (
              <DropdownMenuItem onClick={() => onRenameFile(node.path)}>
                Rename
              </DropdownMenuItem>
            )}
            {node.path !== 'agent.md' && node.path !== 'AGENTS.md' && (
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
