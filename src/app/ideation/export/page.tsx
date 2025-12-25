'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
  Bot,
  MessageSquare,
  Github,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIdeation } from '@/stores';
import {
  getAdapters,
  checkAllCompatibility,
  exportToHarnesses,
  type HarnessAdapter,
  type HarnessCompatibility,
  type HarnessExportResult,
} from '@/lib/export';
import { GitHubPublish } from '@/components/story-editor/github-publish';
import { ideatedAgentToStory } from '@/lib/ideation/convert-to-story';

// Icon mapping for adapters
const ADAPTER_ICONS: Record<string, React.ReactNode> = {
  claude: <Terminal className="h-4 w-4" />,
  letta: <Brain className="h-4 w-4" />,
  langgraph: <GitBranch className="h-4 w-4" />,
  crewai: <Users className="h-4 w-4" />,
};

export default function IdeationExportPage() {
  const ideation = useIdeation();
  const hasAgent = ideation.ideatedAgent.name && ideation.ideatedAgent.name.trim() !== '';

  const [adapters, setAdapters] = useState<HarnessAdapter[]>([]);
  const [compatibility, setCompatibility] = useState<Record<string, HarnessCompatibility>>({});
  const [selectedAdapters, setSelectedAdapters] = useState<Set<string>>(new Set());
  const [exportResult, setExportResult] = useState<HarnessExportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedAdapter, setExpandedAdapter] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'github'>('download');

  const story = hasAgent ? ideatedAgentToStory(ideation.ideatedAgent) : null;

  // Load adapters and check compatibility
  useEffect(() => {
    if (story) {
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
  }, [story?.name]); // Re-run when agent name changes

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
    if (!story) return;
    setIsExporting(true);
    try {
      const result = exportToHarnesses(story, {
        adapterIds: Array.from(selectedAdapters),
        includeSource: true,
      });
      setExportResult(result);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!exportResult || !story) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const [, output] of Object.entries(exportResult.outputs)) {
      for (const file of output.files) {
        zip.file(file.path, file.content);
      }
    }

    if (exportResult.source) {
      zip.file('.agentstories/source.json', exportResult.source);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.identifier || story.name || 'agent'}-harnesses.zip`;
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

  // Collect all files from export result
  const allFiles: { path: string; content: string; adapter: string }[] = [];
  if (exportResult) {
    for (const [adapterId, output] of Object.entries(exportResult.outputs)) {
      for (const file of output.files) {
        allFiles.push({ ...file, adapter: adapterId });
      }
    }
  }

  const selectedFileContent = allFiles.find((f) => f.path === selectedFile)?.content || '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(selectedFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasAgent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No Agent to Export</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Start a conversation in the Chat tab to ideate your agent first.
            Once you have an agent defined, you can export it to different frameworks.
          </p>
          <Button asChild>
            <Link href="/ideation">
              <MessageSquare className="mr-2 h-4 w-4" />
              Go to Chat
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <div className="border-b px-4 shrink-0">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger
              value="download"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </TabsTrigger>
            <TabsTrigger
              value="github"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Github className="mr-2 h-4 w-4" />
              Push to GitHub
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="download" className="flex-1 overflow-hidden mt-0 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-6 pr-4 max-w-3xl">
              {/* Harness Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Select Frameworks</Label>
                  <span className="text-sm text-muted-foreground">
                    {selectedAdapters.size} selected
                  </span>
                </div>

                <div className="space-y-2">
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

                        {isExpanded && compat && (
                          <div className="mt-3 ml-7 space-y-2">
                            {compat.warnings.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-yellow-600">Warnings:</span>
                                <ul className="text-xs text-muted-foreground list-disc list-inside">
                                  {compat.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {compat.unsupportedFeatures.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-orange-600">Unsupported:</span>
                                <ul className="text-xs text-muted-foreground list-disc list-inside">
                                  {compat.unsupportedFeatures.map((f, i) => (
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
              </div>

              <Separator />

              {/* Generate Button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Generate configuration files for the selected frameworks
                </p>
                <Button onClick={handleExport} disabled={selectedAdapters.size === 0 || isExporting}>
                  <Archive className="mr-2 h-4 w-4" />
                  {isExporting ? 'Generating...' : 'Generate Configs'}
                </Button>
              </div>

              {/* Preview Section */}
              {exportResult && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Generated Files</Label>
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download ZIP
                      </Button>
                    </div>

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

                    <div className="flex gap-4 h-64">
                      {/* File tree */}
                      <div className="w-48 border rounded-lg flex flex-col shrink-0">
                        <div className="p-2 border-b bg-muted/50 shrink-0">
                          <span className="text-xs font-medium">Files ({allFiles.length})</span>
                        </div>
                        <ScrollArea className="flex-1">
                          <div className="p-2 space-y-1">
                            {allFiles.map((file) => (
                              <button
                                key={file.path}
                                onClick={() => setSelectedFile(file.path)}
                                className={`w-full text-left text-xs p-1.5 rounded hover:bg-muted truncate ${
                                  selectedFile === file.path ? 'bg-muted font-medium' : ''
                                }`}
                                title={file.path}
                              >
                                {file.path.split('/').pop()}
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* File content */}
                      <div className="flex-1 border rounded-lg flex flex-col min-w-0">
                        <div className="p-2 border-b bg-muted/50 flex items-center justify-between shrink-0">
                          <span className="text-xs font-medium truncate">
                            {selectedFile || 'Select a file'}
                          </span>
                          {selectedFile && (
                            <Button variant="ghost" size="sm" onClick={handleCopy}>
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                        <ScrollArea className="flex-1">
                          <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
                            {selectedFileContent || 'Select a file to preview'}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="github" className="flex-1 overflow-hidden mt-0 p-4">
          <div className="h-full max-w-3xl">
            <GitHubPublish
              exportResult={exportResult}
              onExportNeeded={() => {
                setActiveTab('download');
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
