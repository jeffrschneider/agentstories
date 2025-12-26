"use client";

import { useState, useMemo } from "react";
import {
  Download,
  FolderTree,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  exportAgentToFilesystem,
  downloadAgentZip,
  AgentExportOptions,
  AgentExportResult,
} from "@/lib/export";
import { AgentStory } from "@/lib/schemas";

interface AgentExportDialogProps {
  story: AgentStory;
  trigger?: React.ReactNode;
}

export function AgentExportDialog({ story, trigger }: AgentExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<AgentExportOptions>({
    includeSkills: true,
    includeMemoryStructure: true,
    includeSharedTools: false,
    includeLogs: false,
    includeExamples: true,
    includePrompts: true,
    includeToolImplementations: true,
    generateReadme: true,
    includeGitkeep: true,
    validateAgentSkillsCompat: true,
  });

  // Generate preview
  const preview = useMemo<AgentExportResult | null>(() => {
    if (!isOpen) return null;
    try {
      return exportAgentToFilesystem(story, options);
    } catch {
      return null;
    }
  }, [story, options, isOpen]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadAgentZip(story, options);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyTree = () => {
    if (preview) {
      const tree = generateTreeView(preview.files, preview.rootDir);
      navigator.clipboard.writeText(tree);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateOption = (key: keyof AgentExportOptions, value: boolean) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Export Agent
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Export Agent Filesystem
          </DialogTitle>
          <DialogDescription>
            Export your agent as a complete directory structure with skills,
            prompts, tools, and configuration.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" className="gap-2">
              <FileText className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="options" className="gap-2">
              <Settings className="h-4 w-4" />
              Options
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
            {preview && (
              <div className="space-y-4 h-full flex flex-col">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="secondary">
                    {preview.totalFiles} files
                  </Badge>
                  <Badge variant="secondary">
                    {preview.skillCount} skills
                  </Badge>
                  <Badge variant="secondary">
                    {formatBytes(preview.estimatedSize)}
                  </Badge>
                  {preview.warnings.length > 0 && (
                    <Badge variant="outline" className="text-amber-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {preview.warnings.length} warnings
                    </Badge>
                  )}
                </div>

                {/* Tree view */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Directory Structure</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={handleCopyTree}
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px] border rounded-md">
                    <pre className="p-4 text-sm font-mono">
                      {generateTreeView(preview.files, preview.rootDir)}
                    </pre>
                  </ScrollArea>
                </div>

                {/* Warnings */}
                {preview.warnings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-amber-600">
                      Warnings
                    </Label>
                    <ScrollArea className="h-[100px] border border-amber-200 rounded-md bg-amber-50 dark:bg-amber-950/20">
                      <div className="p-3 space-y-1 text-sm">
                        {preview.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="options" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-6 pr-4">
                {/* Content Options */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Content</Label>
                  <div className="grid gap-3">
                    <OptionCheckbox
                      id="includeSkills"
                      checked={options.includeSkills ?? true}
                      onChange={(v) => updateOption("includeSkills", v)}
                      label="Include Skills"
                      description="Export skill directories with SKILL.md and config.yaml"
                    />
                    <OptionCheckbox
                      id="includePrompts"
                      checked={options.includePrompts ?? true}
                      onChange={(v) => updateOption("includePrompts", v)}
                      label="Include Prompts"
                      description="Export prompt templates in prompts/ directories"
                    />
                    <OptionCheckbox
                      id="includeToolImplementations"
                      checked={options.includeToolImplementations ?? true}
                      onChange={(v) => updateOption("includeToolImplementations", v)}
                      label="Include Tool Implementations"
                      description="Export tool source code in tools/ directories"
                    />
                    <OptionCheckbox
                      id="includeExamples"
                      checked={options.includeExamples ?? true}
                      onChange={(v) => updateOption("includeExamples", v)}
                      label="Include Examples"
                      description="Export usage examples in examples/ directories"
                    />
                  </div>
                </div>

                {/* Structure Options */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Structure</Label>
                  <div className="grid gap-3">
                    <OptionCheckbox
                      id="includeMemoryStructure"
                      checked={options.includeMemoryStructure ?? true}
                      onChange={(v) => updateOption("includeMemoryStructure", v)}
                      label="Include Memory Structure"
                      description="Create memory/ directory with config and subdirectories"
                    />
                    <OptionCheckbox
                      id="includeSharedTools"
                      checked={options.includeSharedTools ?? false}
                      onChange={(v) => updateOption("includeSharedTools", v)}
                      label="Include Shared Tools"
                      description="Create shared/tools/ with base_tool.py template"
                    />
                    <OptionCheckbox
                      id="includeLogs"
                      checked={options.includeLogs ?? false}
                      onChange={(v) => updateOption("includeLogs", v)}
                      label="Include Logs Directory"
                      description="Create logs/ directory for runtime logs"
                    />
                    <OptionCheckbox
                      id="includeGitkeep"
                      checked={options.includeGitkeep ?? true}
                      onChange={(v) => updateOption("includeGitkeep", v)}
                      label="Include .gitkeep Files"
                      description="Add .gitkeep to empty directories for git tracking"
                    />
                  </div>
                </div>

                {/* Output Options */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Output</Label>
                  <div className="grid gap-3">
                    <OptionCheckbox
                      id="generateReadme"
                      checked={options.generateReadme ?? true}
                      onChange={(v) => updateOption("generateReadme", v)}
                      label="Generate README.md"
                      description="Create auto-generated documentation"
                    />
                    <OptionCheckbox
                      id="validateAgentSkillsCompat"
                      checked={options.validateAgentSkillsCompat ?? true}
                      onChange={(v) => updateOption("validateAgentSkillsCompat", v)}
                      label="Validate AgentSkills.io Compatibility"
                      description="Check skill slugs and descriptions for compatibility"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface OptionCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}

function OptionCheckbox({
  id,
  checked,
  onChange,
  label,
  description,
}: OptionCheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-1"
      />
      <div className="grid gap-0.5">
        <Label htmlFor={id} className="cursor-pointer font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/**
 * Generate tree view from files
 */
function generateTreeView(
  files: { path: string; content: string }[],
  rootDir: string
): string {
  const lines: string[] = [`${rootDir}/`];

  // Sort files by path
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  // Track seen directories
  const seenDirs = new Set<string>();

  for (const file of sortedFiles) {
    const parts = file.path.split("/");
    const filename = parts.pop()!;

    // Add directory entries
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      currentPath += (currentPath ? "/" : "") + parts[i];
      if (!seenDirs.has(currentPath)) {
        seenDirs.add(currentPath);
        const indent = "│   ".repeat(i);
        lines.push(`${indent}├── ${parts[i]}/`);
      }
    }

    // Add file entry
    const indent = "│   ".repeat(parts.length);
    lines.push(`${indent}├── ${filename}`);
  }

  // Fix last entries to use └── instead of ├──
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes("├──")) {
      // Check if this is the last entry at this level
      const indent = lines[i].match(/^(│   )*/)?.[0] || "";
      let isLast = true;
      for (let j = i + 1; j < lines.length; j++) {
        const nextIndent = lines[j].match(/^(│   )*/)?.[0] || "";
        if (nextIndent.length <= indent.length) {
          if (nextIndent.length === indent.length) {
            isLast = false;
          }
          break;
        }
      }
      if (isLast) {
        lines[i] = lines[i].replace("├──", "└──");
      }
    }
  }

  return lines.join("\n");
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
