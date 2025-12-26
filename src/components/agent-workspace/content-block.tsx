'use client';

import * as React from 'react';
import { Check, X, FileEdit, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ContentBlockProps {
  content: string;
  language?: string;
  targetFile?: string;
  currentContent?: string;
  onApply: (content: string, targetFile: string) => void;
  availableFiles: string[];
}

export function ContentBlock({
  content,
  language,
  targetFile,
  currentContent,
  onApply,
  availableFiles,
}: ContentBlockProps) {
  const [showDiff, setShowDiff] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(targetFile || availableFiles[0] || '');

  const isNewFile = !currentContent && targetFile;
  const hasChanges = currentContent !== content;

  // Simple diff computation
  const diffLines = React.useMemo(() => {
    if (!currentContent) {
      // New content - all additions
      return content.split('\n').map((line, i) => ({
        type: 'add' as const,
        lineNumber: i + 1,
        content: line,
      }));
    }

    const oldLines = currentContent.split('\n');
    const newLines = content.split('\n');
    const result: { type: 'same' | 'add' | 'remove'; lineNumber: number; content: string }[] = [];

    // Simple line-by-line diff (not optimal but works for preview)
    const maxLen = Math.max(oldLines.length, newLines.length);
    let lineNum = 1;

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === newLine) {
        result.push({ type: 'same', lineNumber: lineNum++, content: oldLine || '' });
      } else {
        if (oldLine !== undefined) {
          result.push({ type: 'remove', lineNumber: lineNum, content: oldLine });
        }
        if (newLine !== undefined) {
          result.push({ type: 'add', lineNumber: lineNum++, content: newLine });
        }
      }
    }

    return result;
  }, [currentContent, content]);

  const addedLines = diffLines.filter((l) => l.type === 'add').length;
  const removedLines = diffLines.filter((l) => l.type === 'remove').length;

  const handleApply = () => {
    onApply(content, selectedFile);
    setShowDiff(false);
  };

  return (
    <>
      <div className="relative group rounded-md border bg-muted/50 overflow-hidden">
        {/* Code content */}
        <div className="p-3 font-mono text-xs overflow-x-auto">
          <pre className="whitespace-pre-wrap">{content}</pre>
        </div>

        {/* Action bar */}
        <div className="border-t bg-background/80 px-2 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {language && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {language}
              </Badge>
            )}
            {targetFile && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                → {targetFile}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setShowDiff(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setShowDiff(true)}
            >
              {isNewFile ? (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  Create
                </>
              ) : (
                <>
                  <FileEdit className="h-3 w-3 mr-1" />
                  Apply
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Diff Preview Dialog */}
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isNewFile ? 'Create New File' : 'Preview Changes'}
              {targetFile && (
                <Badge variant="outline" className="font-mono text-xs">
                  {targetFile}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {isNewFile ? (
                'This will create a new file with the following content.'
              ) : (
                <span className="flex items-center gap-2">
                  Review changes before applying.
                  <span className="text-green-600">+{addedLines}</span>
                  <span className="text-red-600">-{removedLines}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 border rounded-md">
            <div className="font-mono text-xs">
              {diffLines.map((line, i) => (
                <div
                  key={i}
                  className={`px-3 py-0.5 flex ${
                    line.type === 'add'
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : line.type === 'remove'
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                      : ''
                  }`}
                >
                  <span className="w-8 text-muted-foreground shrink-0 select-none">
                    {line.type === 'remove' ? '-' : line.type === 'add' ? '+' : ' '}
                    {line.lineNumber}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{line.content || ' '}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiff(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleApply}>
              <Check className="h-4 w-4 mr-1" />
              {isNewFile ? 'Create File' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Parse content to extract code blocks and text sections
export function parseContentBlocks(
  content: string,
  activeFile?: string
): { type: 'text' | 'code'; content: string; language?: string; targetFile?: string }[] {
  const blocks: { type: 'text' | 'code'; content: string; language?: string; targetFile?: string }[] = [];

  // Regex to match fenced code blocks with optional language
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before this code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        blocks.push({ type: 'text', content: textContent });
      }
    }

    const language = match[1] || undefined;
    const codeContent = match[2].trim();

    // Try to detect target file from language or content
    let targetFile = activeFile;
    if (language === 'markdown' || language === 'md') {
      targetFile = activeFile?.endsWith('.md') ? activeFile : 'AGENTS.md';
    } else if (language === 'yaml') {
      // Could be frontmatter for skill file
      if (activeFile?.includes('SKILL.md')) {
        targetFile = activeFile;
      }
    } else if (language === 'json') {
      targetFile = activeFile?.endsWith('.json') ? activeFile : 'tools/mcp-servers.json';
    }

    blocks.push({
      type: 'code',
      content: codeContent,
      language,
      targetFile,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim();
    if (textContent) {
      blocks.push({ type: 'text', content: textContent });
    }
  }

  // If no code blocks found, return the whole content as text
  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: 'text', content: content.trim() });
  }

  return blocks;
}
