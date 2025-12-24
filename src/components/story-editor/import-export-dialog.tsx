"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  FileText,
  FileCode,
  Archive,
  AlertCircle,
  CheckCircle,
  ArrowRightLeft,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AgentStorySchema, type AgentStory, type Skill } from "@/lib/schemas";
import { hasPortabilityData, generateSlug } from "@/lib/schemas/skill";
import { exportToAgentSkills, downloadSkillZip } from "@/lib/export";

interface ImportExportDialogProps {
  story: AgentStory;
  onImport?: (story: Partial<AgentStory>) => void;
}

type ExportFormat = "json" | "yaml" | "agentskills";
type ExportScope = "agent" | "skills" | "selected-skills";

// Simple YAML serializer
function toYaml(obj: unknown, indent = 0): string {
  const spaces = "  ".repeat(indent);

  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "string") {
    if (obj.includes("\n") || obj.includes(":") || obj.includes("#")) {
      return `"${obj.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    }
    return obj;
  }
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const yamlObj = toYaml(item, indent + 1);
          return `${spaces}- ${yamlObj.trimStart()}`;
        }
        return `${spaces}- ${toYaml(item, indent)}`;
      })
      .join("\n");
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, value]) => {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
        }
        if (Array.isArray(value) && value.length > 0) {
          return `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
        }
        return `${spaces}${key}: ${toYaml(value, indent)}`;
      })
      .join("\n");
  }

  return String(obj);
}

// Simple YAML parser
function parseYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  const stack: { obj: Record<string, unknown>; indent: number }[] = [{ obj: result, indent: -2 }];
  let currentArray: unknown[] | null = null;
  let currentArrayKey: string | null = null;

  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    const indent = line.search(/\S/);
    const content = line.trim();

    if (content.startsWith("- ")) {
      const value = content.slice(2).trim();
      if (currentArray && currentArrayKey) {
        if (value.includes(":")) {
          const obj: Record<string, unknown> = {};
          const [key, ...rest] = value.split(":");
          obj[key.trim()] = rest.join(":").trim();
          currentArray.push(obj);
        } else {
          currentArray.push(value);
        }
      }
      continue;
    }

    const colonIndex = content.indexOf(":");
    if (colonIndex !== -1) {
      const key = content.slice(0, colonIndex).trim();
      const value = content.slice(colonIndex + 1).trim();

      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1].obj;

      if (value === "" || value === "[]" || value === "{}") {
        if (value === "[]") {
          parent[key] = [];
          currentArray = parent[key] as unknown[];
          currentArrayKey = key;
        } else {
          parent[key] = {};
          stack.push({ obj: parent[key] as Record<string, unknown>, indent });
          currentArray = null;
          currentArrayKey = null;
        }
      } else {
        let parsedValue: unknown = value;
        if (value === "true") parsedValue = true;
        else if (value === "false") parsedValue = false;
        else if (value === "null") parsedValue = null;
        else if (/^\d+$/.test(value)) parsedValue = parseInt(value, 10);
        else if (/^\d+\.\d+$/.test(value)) parsedValue = parseFloat(value);
        else if (value.startsWith('"') && value.endsWith('"')) {
          parsedValue = value.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
        }
        parent[key] = parsedValue;
        currentArray = null;
        currentArrayKey = null;
      }
    }
  }

  return result;
}

export function ImportExportDialog({ story, onImport }: ImportExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"import" | "export">("export");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import / Export</DialogTitle>
          <DialogDescription>
            Import or export agent stories and skills in various formats
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "import" | "export")} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="flex-1 overflow-hidden mt-4">
            <ExportTab story={story} />
          </TabsContent>

          <TabsContent value="import" className="flex-1 overflow-hidden mt-4">
            <ImportTab onImport={onImport} onClose={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Export Tab
// ============================================================================

function ExportTab({ story }: { story: AgentStory }) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [scope, setScope] = useState<ExportScope>("agent");
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const skills = (story.skills as Skill[]) || [];

  const toggleSkill = (skillId: string) => {
    const newSet = new Set(selectedSkills);
    if (newSet.has(skillId)) {
      newSet.delete(skillId);
    } else {
      newSet.add(skillId);
    }
    setSelectedSkills(newSet);
  };

  const getExportContent = (): string => {
    if (format === "agentskills") {
      // For AgentSkills format, we show a preview of all selected skills
      const skillsToExport = scope === "agent" || scope === "skills"
        ? skills
        : skills.filter((s) => selectedSkills.has(s.id || s.name));

      const previews = skillsToExport.map((skill) => {
        try {
          const result = exportToAgentSkills(skill, { generateMissingSlug: true });
          return `# ${skill.name}\n\n${result.skillMd}`;
        } catch (error) {
          return `# ${skill.name}\n\nError: ${error instanceof Error ? error.message : "Export failed"}`;
        }
      });

      return previews.join("\n\n---\n\n");
    }

    // For JSON/YAML, export based on scope
    let dataToExport: unknown;
    if (scope === "agent") {
      dataToExport = story;
    } else if (scope === "skills") {
      dataToExport = { skills };
    } else {
      const selectedSkillsData = skills.filter((s) => selectedSkills.has(s.id || s.name));
      dataToExport = { skills: selectedSkillsData };
    }

    return format === "json"
      ? JSON.stringify(dataToExport, null, 2)
      : toYaml(dataToExport);
  };

  const content = getExportContent();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (format === "agentskills") {
      // Download as ZIP for AgentSkills format
      handleDownloadAgentSkillsZip();
    } else {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const suffix = scope === "agent" ? "" : "-skills";
      a.download = `${story.identifier || "story"}${suffix}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAgentSkillsZip = async () => {
    setIsExporting(true);
    try {
      const skillsToExport = scope === "agent" || scope === "skills"
        ? skills
        : skills.filter((s) => selectedSkills.has(s.id || s.name));

      // Download each skill as a ZIP
      for (const skill of skillsToExport) {
        await downloadSkillZip(skill, { generateMissingSlug: true });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Format Selection */}
      <div className="space-y-2">
        <Label>Format</Label>
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as ExportFormat)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="json" id="json" />
            <Label htmlFor="json" className="flex items-center gap-1 cursor-pointer">
              <FileJson className="h-4 w-4" />
              JSON
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yaml" id="yaml" />
            <Label htmlFor="yaml" className="flex items-center gap-1 cursor-pointer">
              <FileText className="h-4 w-4" />
              YAML
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="agentskills" id="agentskills" />
            <Label htmlFor="agentskills" className="flex items-center gap-1 cursor-pointer">
              <FileCode className="h-4 w-4" />
              AgentSkills.io
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Scope Selection */}
      <div className="space-y-2">
        <Label>What to Export</Label>
        <RadioGroup
          value={scope}
          onValueChange={(v) => setScope(v as ExportScope)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="agent" id="agent" disabled={format === "agentskills"} />
            <Label htmlFor="agent" className={`cursor-pointer ${format === "agentskills" ? "text-muted-foreground" : ""}`}>
              Entire Agent
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="skills" id="skills" />
            <Label htmlFor="skills" className="cursor-pointer">
              All Skills ({skills.length})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="selected-skills" id="selected-skills" />
            <Label htmlFor="selected-skills" className="cursor-pointer">
              Selected Skills
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Skill Selection (when selected-skills scope) */}
      {scope === "selected-skills" && (
        <div className="space-y-2">
          <Label>Select Skills</Label>
          <div className="border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
            {skills.map((skill) => (
              <div key={skill.id || skill.name} className="flex items-center space-x-2">
                <Checkbox
                  id={skill.id || skill.name}
                  checked={selectedSkills.has(skill.id || skill.name)}
                  onCheckedChange={() => toggleSkill(skill.id || skill.name)}
                />
                <Label htmlFor={skill.id || skill.name} className="flex items-center gap-2 cursor-pointer">
                  {skill.name}
                  {format === "agentskills" && hasPortabilityData(skill) && (
                    <Badge variant="outline" className="text-xs text-green-600">Ready</Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AgentSkills.io info */}
      {format === "agentskills" && (
        <Alert>
          <FileCode className="h-4 w-4" />
          <AlertTitle>AgentSkills.io Format</AlertTitle>
          <AlertDescription>
            Each skill will be exported as a SKILL.md file with YAML frontmatter.
            Skills without a slug will have one auto-generated.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Preview</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={isExporting}>
              {format === "agentskills" ? (
                <>
                  <Archive className="mr-1 h-3 w-3" />
                  {isExporting ? "Exporting..." : "Download ZIPs"}
                </>
              ) : (
                <>
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>
        <ScrollArea className="h-64 border rounded-lg">
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap">{content}</pre>
        </ScrollArea>
      </div>
    </div>
  );
}

// ============================================================================
// Import Tab
// ============================================================================

function ImportTab({
  onImport,
  onClose,
}: {
  onImport?: (story: Partial<AgentStory>) => void;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<"json" | "yaml">("json");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImport = () => {
    setError(null);
    setSuccess(false);

    try {
      let parsed: unknown;
      if (format === "json") {
        parsed = JSON.parse(content);
      } else {
        parsed = parseYaml(content);
      }

      const result = AgentStorySchema.safeParse(parsed);

      if (!result.success) {
        const errors = result.error.issues.map((e) =>
          `${e.path.join(".")}: ${e.message}`
        );
        setError(`Validation failed:\n${errors.join("\n")}`);
        return;
      }

      onImport?.(result.data);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse content");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);

      if (file.name.endsWith(".json")) {
        setFormat("json");
      } else if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
        setFormat("yaml");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Error</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Imported successfully!</AlertDescription>
        </Alert>
      )}

      {/* Format Selection */}
      <div className="space-y-2">
        <Label>Format</Label>
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as "json" | "yaml")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="json" id="import-json" />
            <Label htmlFor="import-json" className="flex items-center gap-1 cursor-pointer">
              <FileJson className="h-4 w-4" />
              JSON
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yaml" id="import-yaml" />
            <Label htmlFor="import-yaml" className="flex items-center gap-1 cursor-pointer">
              <FileText className="h-4 w-4" />
              YAML
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* File Upload */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
            <input
              type="file"
              accept=".json,.yaml,.yml"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </Button>
        <span className="text-xs text-muted-foreground">
          or paste content below
        </span>
      </div>

      {/* Content Input */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Paste ${format.toUpperCase()} content here...`}
        className="font-mono text-xs h-64"
      />

      {/* Import Button */}
      <div className="flex justify-end">
        <Button onClick={handleImport} disabled={!content.trim()}>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </div>
    </div>
  );
}
