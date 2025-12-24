"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Archive,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Terminal,
  Brain,
  GitBranch,
  Users,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Server,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { AgentStory } from "@/lib/schemas";
import {
  getAdapters,
  checkAllCompatibility,
  exportToHarnesses,
  type HarnessAdapter,
  type HarnessCompatibility,
  type HarnessExportResult,
} from "@/lib/export";
import { TryItChat } from "./try-it-chat";

interface HarnessExportDialogProps {
  story: AgentStory;
}

// Icon mapping for adapters
const ADAPTER_ICONS: Record<string, React.ReactNode> = {
  claude: <Terminal className="h-4 w-4" />,
  letta: <Brain className="h-4 w-4" />,
  langgraph: <GitBranch className="h-4 w-4" />,
  crewai: <Users className="h-4 w-4" />,
};

export function HarnessExportDialog({ story }: HarnessExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [adapters, setAdapters] = useState<HarnessAdapter[]>([]);
  const [compatibility, setCompatibility] = useState<Record<string, HarnessCompatibility>>({});
  const [selectedAdapters, setSelectedAdapters] = useState<Set<string>>(new Set());
  const [exportResult, setExportResult] = useState<HarnessExportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedAdapter, setExpandedAdapter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"select" | "preview" | "tryit">("select");

  // Load adapters and check compatibility
  useEffect(() => {
    if (open) {
      const loadedAdapters = getAdapters();
      setAdapters(loadedAdapters);
      const compat = checkAllCompatibility(story);
      setCompatibility(compat);

      // Pre-select all compatible adapters
      const compatible = loadedAdapters
        .filter((a) => compat[a.id]?.compatible)
        .map((a) => a.id);
      setSelectedAdapters(new Set(compatible));
    }
  }, [open, story]);

  const toggleAdapter = (adapterId: string) => {
    const newSet = new Set(selectedAdapters);
    if (newSet.has(adapterId)) {
      newSet.delete(adapterId);
    } else {
      newSet.add(adapterId);
    }
    setSelectedAdapters(newSet);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const result = exportToHarnesses(story, {
        adapterIds: Array.from(selectedAdapters),
        includeSource: true,
      });
      setExportResult(result);
      setActiveTab("preview");
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!exportResult) return;

    // Dynamic import JSZip
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Add files from each adapter
    for (const [adapterId, output] of Object.entries(exportResult.outputs)) {
      for (const file of output.files) {
        zip.file(file.path, file.content);
      }
    }

    // Add source.json if present
    if (exportResult.source) {
      zip.file(".agentstories/source.json", exportResult.source);
    }

    // Generate and download
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story.identifier || story.name || "agent"}-harnesses.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCompatibilityIcon = (compat: HarnessCompatibility) => {
    if (!compat.compatible) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (compat.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getCompatibilityBadge = (compat: HarnessCompatibility) => {
    if (!compat.compatible) {
      return <Badge variant="destructive">Incompatible</Badge>;
    }
    if (compat.warnings.length > 0) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Has Warnings</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 border-green-300">Compatible</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Server className="mr-2 h-4 w-4" />
          Export to Harness
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Export to Agent Harnesses</DialogTitle>
          <DialogDescription>
            Generate framework-specific configurations for your agent
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select" className="flex items-center gap-2">
              <Server className="mr-2 h-4 w-4" />
              Select Harnesses
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!exportResult}>
              <Archive className="mr-2 h-4 w-4" />
              Preview Export
            </TabsTrigger>
            <TabsTrigger value="tryit">
              <Play className="mr-2 h-4 w-4" />
              Try It
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="flex-1 overflow-hidden mt-4">
            <SelectHarnessesTab
              adapters={adapters}
              compatibility={compatibility}
              selectedAdapters={selectedAdapters}
              toggleAdapter={toggleAdapter}
              expandedAdapter={expandedAdapter}
              setExpandedAdapter={setExpandedAdapter}
              getCompatibilityIcon={getCompatibilityIcon}
              getCompatibilityBadge={getCompatibilityBadge}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
            <PreviewTab
              exportResult={exportResult}
              onDownload={handleDownload}
            />
          </TabsContent>

          <TabsContent value="tryit" className="flex-1 mt-4 overflow-hidden" style={{ minHeight: '450px' }}>
            <TryItChat story={story} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Select Harnesses Tab
// ============================================================================

interface SelectHarnessesTabProps {
  adapters: HarnessAdapter[];
  compatibility: Record<string, HarnessCompatibility>;
  selectedAdapters: Set<string>;
  toggleAdapter: (id: string) => void;
  expandedAdapter: string | null;
  setExpandedAdapter: (id: string | null) => void;
  getCompatibilityIcon: (compat: HarnessCompatibility) => React.ReactNode;
  getCompatibilityBadge: (compat: HarnessCompatibility) => React.ReactNode;
  onExport: () => void;
  isExporting: boolean;
}

function SelectHarnessesTab({
  adapters,
  compatibility,
  selectedAdapters,
  toggleAdapter,
  expandedAdapter,
  setExpandedAdapter,
  getCompatibilityIcon,
  getCompatibilityBadge,
  onExport,
  isExporting,
}: SelectHarnessesTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Available Harnesses</Label>
        <ScrollArea className="h-80">
          <div className="space-y-2 pr-4">
            {adapters.map((adapter) => {
              const compat = compatibility[adapter.id];
              const isExpanded = expandedAdapter === adapter.id;
              const isSelected = selectedAdapters.has(adapter.id);
              const isCompatible = compat?.compatible ?? false;

              return (
                <div key={adapter.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={adapter.id}
                        checked={isSelected}
                        disabled={!isCompatible}
                        onCheckedChange={() => toggleAdapter(adapter.id)}
                      />
                      <div className="flex items-center gap-2">
                        {ADAPTER_ICONS[adapter.id] || <Server className="h-4 w-4" />}
                        <Label htmlFor={adapter.id} className="font-medium cursor-pointer">
                          {adapter.name}
                        </Label>
                      </div>
                      {compat && getCompatibilityIcon(compat)}
                    </div>
                    <div className="flex items-center gap-2">
                      {compat && getCompatibilityBadge(compat)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedAdapter(isExpanded ? null : adapter.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-1 ml-7">
                    {adapter.description}
                  </p>

                  {isExpanded && (
                    <div className="mt-3 ml-7 space-y-2">
                      {compat?.warnings.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-yellow-600">Warnings:</span>
                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                            {compat.warnings.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {compat?.unsupportedFeatures.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-orange-600">Unsupported:</span>
                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                            {compat.unsupportedFeatures.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {compat?.missingFeatures.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-red-600">Missing:</span>
                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                            {compat.missingFeatures.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <a
                        href={adapter.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        Learn more <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectedAdapters.size} harness{selectedAdapters.size !== 1 ? "es" : ""} selected
        </span>
        <Button onClick={onExport} disabled={selectedAdapters.size === 0 || isExporting}>
          <Archive className="mr-2 h-4 w-4" />
          {isExporting ? "Generating..." : "Generate Configs"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Preview Tab
// ============================================================================

interface PreviewTabProps {
  exportResult: HarnessExportResult | null;
  onDownload: () => void;
}

function PreviewTab({ exportResult, onDownload }: PreviewTabProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!exportResult) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Generate configs first to preview
      </div>
    );
  }

  // Collect all files
  const allFiles: { path: string; content: string; adapter: string }[] = [];
  for (const [adapterId, output] of Object.entries(exportResult.outputs)) {
    for (const file of output.files) {
      allFiles.push({ ...file, adapter: adapterId });
    }
  }

  const selectedFileContent = allFiles.find((f) => f.path === selectedFile)?.content || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(selectedFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {exportResult.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm">
              {exportResult.warnings.slice(0, 3).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
              {exportResult.warnings.length > 3 && (
                <li>...and {exportResult.warnings.length - 3} more</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* File tree */}
        <div className="w-48 border rounded-lg">
          <div className="p-2 border-b bg-muted/50">
            <span className="text-xs font-medium">Files</span>
          </div>
          <ScrollArea className="h-64">
            <div className="p-2 space-y-1">
              {allFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file.path)}
                  className={`w-full text-left text-xs p-1.5 rounded hover:bg-muted truncate ${
                    selectedFile === file.path ? "bg-muted font-medium" : ""
                  }`}
                  title={file.path}
                >
                  {file.path.split("/").pop()}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* File content */}
        <div className="flex-1 border rounded-lg flex flex-col min-w-0">
          <div className="p-2 border-b bg-muted/50 flex items-center justify-between">
            <span className="text-xs font-medium truncate">
              {selectedFile || "Select a file"}
            </span>
            {selectedFile && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1">
            <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
              {selectedFileContent || "Select a file to preview"}
            </pre>
          </ScrollArea>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download All (ZIP)
        </Button>
      </div>
    </div>
  );
}

