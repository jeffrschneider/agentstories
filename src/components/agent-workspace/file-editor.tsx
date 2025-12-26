'use client';

import * as React from 'react';
import { X, FileText, Bot, Braces } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AgentFile } from '@/lib/agent-files';

interface FileEditorProps {
  file: AgentFile;
  onChange: (content: string) => void;
  onClose: () => void;
  className?: string;
}

export function FileEditor({ file, onChange, onClose, className }: FileEditorProps) {
  const [content, setContent] = React.useState(file.content);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Sync content when file changes
  React.useEffect(() => {
    setContent(file.content);
  }, [file.path, file.content]);

  // Debounced save
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== file.content) {
        onChange(content);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content, file.content, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const getFileIcon = () => {
    switch (file.type) {
      case 'agents':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'skill':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'mcp-config':
        return <Braces className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isJson = file.path.endsWith('.json');

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tab bar */}
      <div className="flex items-center border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 border-r bg-background">
          {getFileIcon()}
          <span className="text-sm font-medium">{file.path.split('/').pop()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-1"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1" />
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 p-0">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          className={cn(
            'h-full w-full resize-none rounded-none border-0 focus-visible:ring-0 font-mono text-sm',
            isJson && 'bg-muted/20'
          )}
          placeholder={isJson ? '{\n  \n}' : '# Start writing...'}
          spellCheck={false}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t text-xs text-muted-foreground shrink-0">
        <span>{file.path}</span>
        <span>
          {content !== file.content ? 'Modified' : 'Saved'}
        </span>
      </div>
    </div>
  );
}

interface MultiFileEditorProps {
  files: AgentFile[];
  openPaths: string[];
  activePath: string | null;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onChangeFile: (path: string, content: string) => void;
}

export function MultiFileEditor({
  files,
  openPaths,
  activePath,
  onSelectFile,
  onCloseFile,
  onChangeFile,
}: MultiFileEditorProps) {
  const openFiles = openPaths
    .map(path => files.find(f => f.path === path))
    .filter((f): f is AgentFile => f !== undefined);

  const activeFile = activePath ? files.find(f => f.path === activePath) : null;

  if (openFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select a file to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b bg-muted/30 shrink-0 overflow-x-auto">
        {openFiles.map((file) => {
          const isActive = file.path === activePath;
          return (
            <div
              key={file.path}
              className={cn(
                'flex items-center gap-2 px-3 py-2 border-r cursor-pointer text-sm',
                isActive ? 'bg-background' : 'hover:bg-muted/50'
              )}
              onClick={() => onSelectFile(file.path)}
            >
              <FileIcon type={file.type} />
              <span className="max-w-[120px] truncate">
                {file.path.split('/').pop()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file.path);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Editor content */}
      {activeFile && (
        <div className="flex-1 min-h-0">
          <FileEditorContent
            key={activeFile.path}
            file={activeFile}
            onChange={(content) => onChangeFile(activeFile.path, content)}
          />
        </div>
      )}
    </div>
  );
}

function FileIcon({ type }: { type: AgentFile['type'] }) {
  switch (type) {
    case 'agents':
      return <Bot className="h-4 w-4 text-blue-500" />;
    case 'skill':
      return <FileText className="h-4 w-4 text-green-500" />;
    case 'mcp-config':
      return <Braces className="h-4 w-4 text-orange-500" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

function FileEditorContent({
  file,
  onChange,
}: {
  file: AgentFile;
  onChange: (content: string) => void;
}) {
  const [content, setContent] = React.useState(file.content);

  // Debounced save
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== file.content) {
        onChange(content);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content, file.content, onChange]);

  const isJson = file.path.endsWith('.json');

  return (
    <div className="flex flex-col h-full">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={cn(
          'flex-1 resize-none rounded-none border-0 focus-visible:ring-0 font-mono text-sm',
          isJson && 'bg-muted/20'
        )}
        placeholder={isJson ? '{\n  \n}' : '# Start writing...'}
        spellCheck={false}
      />
      <div className="flex items-center justify-between px-3 py-1 border-t text-xs text-muted-foreground shrink-0">
        <span>{file.path}</span>
        <span>{content !== file.content ? 'Modified' : 'Saved'}</span>
      </div>
    </div>
  );
}
