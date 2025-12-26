'use client';

import * as React from 'react';
import { Check, X, FileEdit, Plus, Eye, CheckCheck, ListChecks } from 'lucide-react';
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

export interface CodeBlock {
  id: string;
  content: string;
  language?: string;
  targetFile: string;
  currentContent?: string;
}

interface ContentBlockProps {
  content: string;
  language?: string;
  targetFile: string;
  currentContent?: string;
  onApply: (content: string, targetFile: string) => void;
  availableFiles: string[];
  isApplied?: boolean;
}

// Compute diff between old and new content
function computeDiff(oldContent: string | undefined, newContent: string) {
  if (!oldContent) {
    // New content - all additions
    return newContent.split('\n').map((line, i) => ({
      type: 'add' as const,
      lineNumber: i + 1,
      content: line,
    }));
  }

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const result: { type: 'same' | 'add' | 'remove'; lineNumber: number; content: string }[] = [];

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
}

export function ContentBlock({
  content,
  language,
  targetFile,
  currentContent,
  onApply,
  availableFiles,
  isApplied = false,
}: ContentBlockProps) {
  const [showDiff, setShowDiff] = React.useState(false);
  const [applied, setApplied] = React.useState(isApplied);

  const isNewFile = !currentContent;

  const diffLines = React.useMemo(
    () => computeDiff(currentContent, content),
    [currentContent, content]
  );

  const addedLines = diffLines.filter((l) => l.type === 'add').length;
  const removedLines = diffLines.filter((l) => l.type === 'remove').length;

  // Direct apply without dialog
  const handleDirectApply = () => {
    onApply(content, targetFile);
    setApplied(true);
  };

  // Apply from dialog
  const handleApplyFromDialog = () => {
    onApply(content, targetFile);
    setApplied(true);
    setShowDiff(false);
  };

  return (
    <>
      <div className={`relative group rounded-md border overflow-hidden ${applied ? 'bg-green-500/5 border-green-500/30' : 'bg-muted/50'}`}>
        {/* Code content */}
        <div className="p-3 font-mono text-xs overflow-x-auto max-h-[200px]">
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
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              → {targetFile}
            </span>
            {applied && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-500/50">
                Applied
              </Badge>
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
              Review
            </Button>
            <Button
              variant={applied ? 'outline' : 'default'}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleDirectApply}
              disabled={applied}
            >
              {isNewFile ? (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  {applied ? 'Created' : 'Create'}
                </>
              ) : (
                <>
                  <FileEdit className="h-3 w-3 mr-1" />
                  {applied ? 'Applied' : 'Apply'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Diff Preview Dialog */}
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {isNewFile ? 'Create New File' : 'Review Changes'}
              <Badge variant="outline" className="font-mono text-xs">
                {targetFile}
              </Badge>
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

          <div className="flex-1 min-h-0 overflow-hidden border rounded-md">
            <ScrollArea className="h-full max-h-[50vh]">
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
          </div>

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setShowDiff(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleApplyFromDialog} disabled={applied}>
              <Check className="h-4 w-4 mr-1" />
              {applied ? 'Already Applied' : isNewFile ? 'Create File' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Batch actions component for multiple code blocks
interface BatchActionsProps {
  blocks: CodeBlock[];
  onApplyAll: () => void;
  onReviewAll: () => void;
  appliedCount: number;
}

export function BatchActions({ blocks, onApplyAll, onReviewAll, appliedCount }: BatchActionsProps) {
  const totalBlocks = blocks.length;
  const allApplied = appliedCount === totalBlocks;

  if (totalBlocks <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
      <span className="text-xs text-muted-foreground">
        {appliedCount}/{totalBlocks} applied
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={onReviewAll}
      >
        <ListChecks className="h-3 w-3 mr-1" />
        Review All
      </Button>
      <Button
        variant="default"
        size="sm"
        className="h-7 text-xs"
        onClick={onApplyAll}
        disabled={allApplied}
      >
        <CheckCheck className="h-3 w-3 mr-1" />
        {allApplied ? 'All Applied' : 'Apply All'}
      </Button>
    </div>
  );
}

// Review All Dialog - shows all diffs in one scrollable view
interface ReviewAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: CodeBlock[];
  appliedBlocks: Set<string>;
  onApply: (blockId: string) => void;
  onApplyAll: () => void;
}

export function ReviewAllDialog({
  open,
  onOpenChange,
  blocks,
  appliedBlocks,
  onApply,
  onApplyAll,
}: ReviewAllDialogProps) {
  const pendingBlocks = blocks.filter((b) => !appliedBlocks.has(b.id));
  const allApplied = pendingBlocks.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Review All Changes</DialogTitle>
          <DialogDescription>
            {allApplied
              ? 'All changes have been applied.'
              : `${pendingBlocks.length} of ${blocks.length} changes pending review.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full max-h-[60vh]">
            <div className="space-y-4 pr-4">
            {blocks.map((block) => {
              const isApplied = appliedBlocks.has(block.id);
              const diffLines = computeDiff(block.currentContent, block.content);
              const addedLines = diffLines.filter((l) => l.type === 'add').length;
              const removedLines = diffLines.filter((l) => l.type === 'remove').length;
              const isNewFile = !block.currentContent;

              return (
                <div
                  key={block.id}
                  className={`rounded-md border overflow-hidden ${
                    isApplied ? 'opacity-60' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {block.targetFile}
                      </Badge>
                      {!isNewFile && (
                        <span className="text-xs text-muted-foreground">
                          <span className="text-green-600">+{addedLines}</span>{' '}
                          <span className="text-red-600">-{removedLines}</span>
                        </span>
                      )}
                      {isNewFile && (
                        <Badge variant="secondary" className="text-xs">New file</Badge>
                      )}
                    </div>
                    <Button
                      variant={isApplied ? 'outline' : 'default'}
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => onApply(block.id)}
                      disabled={isApplied}
                    >
                      {isApplied ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Applied
                        </>
                      ) : (
                        <>
                          <FileEdit className="h-3 w-3 mr-1" />
                          Apply
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Diff */}
                  <div className="font-mono text-xs max-h-[200px] overflow-y-auto">
                    {diffLines.slice(0, 50).map((line, i) => (
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
                    {diffLines.length > 50 && (
                      <div className="px-3 py-1 text-muted-foreground bg-muted/30">
                        ... {diffLines.length - 50} more lines
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onApplyAll} disabled={allApplied}>
            <CheckCheck className="h-4 w-4 mr-1" />
            {allApplied ? 'All Applied' : `Apply All (${pendingBlocks.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Regex patterns for detecting file paths before code blocks
const FILE_PATH_PATTERNS = [
  // Backtick-wrapped path with colon: `skills/joke-telling/SKILL.md:`
  /`([a-zA-Z0-9_\-./]+\.(md|yaml|yml|json|ts|js|py))`:\s*$/,
  // Plain path with colon: skills/joke-telling/SKILL.md:
  /^([a-zA-Z0-9_\-./]+\.(md|yaml|yml|json|ts|js|py)):\s*$/,
  // Path in bold: **skills/joke-telling/SKILL.md:**
  /\*\*([a-zA-Z0-9_\-./]+\.(md|yaml|yml|json|ts|js|py))\*\*:\s*$/,
];

// Extract file path from the text immediately before a code block
function extractFilePathHint(textBefore: string): string | null {
  // Get the last few lines before the code block
  const lines = textBefore.trim().split('\n');
  const lastLine = lines[lines.length - 1]?.trim() || '';

  for (const pattern of FILE_PATH_PATTERNS) {
    const match = lastLine.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Convert a name to kebab-case slug
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Detect if content is a skill definition and extract skill name
function detectSkillContent(content: string): string | null {
  // Check for YAML frontmatter with name field
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1];
    const nameMatch = yaml.match(/^name:\s*(.+)$/m);
    const descMatch = yaml.match(/^description:\s*.+$/m);

    if (nameMatch && descMatch) {
      // This looks like a skill file
      return nameMatch[1].trim();
    }
  }

  // Also check for markdown title with skill-like structure
  // (e.g., "# Joke Telling" followed by "## Triggers" or "## Behavior")
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const hasSkillSections = /^##\s+(Triggers|Behavior|Tools|Success Criteria|Guardrails)/m.test(content);
    if (hasSkillSections) {
      return titleMatch[1].trim();
    }
  }

  return null;
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
    // Get text before this code block
    const textBefore = content.slice(lastIndex, match.index);

    // Check for file path hint in the text before the code block
    const filePathHint = extractFilePathHint(textBefore);

    // Add text before this code block (removing the file path line if found)
    if (textBefore.trim()) {
      let textContent = textBefore.trim();
      if (filePathHint) {
        // Remove the file path line from the text block
        const lines = textContent.split('\n');
        lines.pop(); // Remove last line (the file path hint)
        textContent = lines.join('\n').trim();
      }
      if (textContent) {
        blocks.push({ type: 'text', content: textContent });
      }
    }

    const language = match[1] || undefined;
    const codeContent = match[2].trim();

    // Determine target file: use hint if found, otherwise try to auto-detect
    let targetFile = filePathHint || activeFile;

    if (!filePathHint) {
      // Check if this looks like skill content
      const skillName = detectSkillContent(codeContent);
      if (skillName) {
        // Auto-route to skills folder
        const slug = toSlug(skillName);
        targetFile = `skills/${slug}/SKILL.md`;
      } else {
        // Fall back to language-based inference
        if (language === 'markdown' || language === 'md') {
          targetFile = activeFile?.endsWith('.md') ? activeFile : 'AGENTS.md';
        } else if (language === 'yaml') {
          if (activeFile?.includes('SKILL.md')) {
            targetFile = activeFile;
          }
        } else if (language === 'json') {
          targetFile = activeFile?.endsWith('.json') ? activeFile : 'tools/mcp-servers.json';
        }
      }
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
