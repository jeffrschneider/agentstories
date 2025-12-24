"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wand2, CheckCircle, AlertCircle, FileCode, FileText, Download, Archive } from "lucide-react";
import {
  Skill,
  AgentSkillsPortability,
  SkillScript,
  SkillReference,
  COMMON_LICENSES,
  generateSlug,
  isValidSlug,
  getPortabilityCompleteness,
} from "@/lib/schemas/skill";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadSkillMd, downloadSkillZip } from "@/lib/export";

interface SkillPortabilityEditorProps {
  skill: Skill;
  onUpdate: (updates: Partial<Skill>) => void;
}

export function SkillPortabilityEditor({ skill, onUpdate }: SkillPortabilityEditorProps) {
  const [showScriptForm, setShowScriptForm] = useState(false);
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const portability = skill.portability || {};
  const completeness = getPortabilityCompleteness(skill);

  const handleDownloadMd = () => {
    try {
      downloadSkillMd(skill);
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      await downloadSkillZip(skill);
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const updatePortability = (updates: Partial<AgentSkillsPortability>) => {
    onUpdate({
      portability: {
        ...portability,
        ...updates,
      } as AgentSkillsPortability,
    });
  };

  const handleAutoFill = () => {
    const generatedSlug = generateSlug(skill.name);
    const compatibility = skill.tools?.length
      ? `Requires: ${skill.tools.map((t) => t.name).join(", ")}`
      : undefined;

    updatePortability({
      slug: generatedSlug,
      compatibility: compatibility || portability.compatibility,
    });
  };

  const addScript = (script: SkillScript) => {
    const scripts = portability.scripts || [];
    updatePortability({ scripts: [...scripts, script] });
    setShowScriptForm(false);
  };

  const removeScript = (index: number) => {
    const scripts = portability.scripts || [];
    updatePortability({ scripts: scripts.filter((_, i) => i !== index) });
  };

  const addReference = (reference: SkillReference) => {
    const references = portability.references || [];
    updatePortability({ references: [...references, reference] });
    setShowReferenceForm(false);
  };

  const removeReference = (index: number) => {
    const references = portability.references || [];
    updatePortability({ references: references.filter((_, i) => i !== index) });
  };

  const slugIsValid = portability.slug ? isValidSlug(portability.slug) : true;

  return (
    <div className="space-y-6">
      {/* Status Banner with Export Buttons */}
      <div className={`flex items-center justify-between p-3 rounded-lg ${
        completeness.ready
          ? "bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      }`}>
        <div className="flex items-center gap-2">
          {completeness.ready ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ready for AgentSkills.io export</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Missing: {completeness.missing.join(", ")}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMd}
                  disabled={!completeness.ready}
                  className="bg-background"
                >
                  <Download className="mr-1 h-3 w-3" />
                  SKILL.md
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download SKILL.md file only</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadZip}
                  disabled={!completeness.ready || isExporting}
                  className="bg-background"
                >
                  <Archive className="mr-1 h-3 w-3" />
                  {isExporting ? "Exporting..." : "ZIP"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download complete skill directory with scripts and references</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Fields */}
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label>
              Slug *
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 text-muted-foreground cursor-help">(?)</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The AgentSkills.io identifier. Must be lowercase letters, numbers, and hyphens only.
                      No leading/trailing hyphens. Max 64 characters.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              placeholder="e.g., ticket-triage"
              value={portability.slug || ""}
              onChange={(e) => updatePortability({ slug: e.target.value })}
              className={!slugIsValid ? "border-red-500" : ""}
            />
            {portability.slug && !slugIsValid && (
              <p className="text-xs text-red-500">
                Invalid format. Use lowercase letters, numbers, and single hyphens.
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleAutoFill}>
            <Wand2 className="mr-1 h-3 w-3" />
            Auto-fill
          </Button>
        </div>

        <div className="space-y-2">
          <Label>License</Label>
          <Select
            value={portability.license || ""}
            onValueChange={(value) => updatePortability({ license: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a license" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_LICENSES.map((license) => (
                <SelectItem key={license} value={license}>
                  {license}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            SPDX license identifier for sharing this skill
          </p>
        </div>

        <div className="space-y-2">
          <Label>Compatibility</Label>
          <Textarea
            placeholder="e.g., Requires Python 3.10+, access to Helpdesk API"
            value={portability.compatibility || ""}
            onChange={(e) => updatePortability({ compatibility: e.target.value })}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Environment requirements, dependencies, or prerequisites
          </p>
        </div>
      </div>

      {/* Scripts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Scripts ({portability.scripts?.length || 0})
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScriptForm(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Script
          </Button>
        </div>

        {portability.scripts?.map((script, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded border bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">{script.filename}</span>
              <Badge variant="outline" className="text-xs">
                {script.language}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeScript(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {showScriptForm && (
          <ScriptForm
            onSubmit={addScript}
            onCancel={() => setShowScriptForm(false)}
          />
        )}

        {!portability.scripts?.length && !showScriptForm && (
          <p className="text-xs text-muted-foreground">
            No scripts defined. Scripts are executable code the agent can run.
          </p>
        )}
      </div>

      {/* References Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            References ({portability.references?.length || 0})
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReferenceForm(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Reference
          </Button>
        </div>

        {portability.references?.map((ref, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded border bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">{ref.filename}</span>
              <span className="text-sm text-muted-foreground">- {ref.title}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeReference(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {showReferenceForm && (
          <ReferenceForm
            onSubmit={addReference}
            onCancel={() => setShowReferenceForm(false)}
          />
        )}

        {!portability.references?.length && !showReferenceForm && (
          <p className="text-xs text-muted-foreground">
            No references defined. References are additional documentation files.
          </p>
        )}
      </div>
    </div>
  );
}

// Script Form Component
interface ScriptFormProps {
  onSubmit: (script: SkillScript) => void;
  onCancel: () => void;
}

function ScriptForm({ onSubmit, onCancel }: ScriptFormProps) {
  const [filename, setFilename] = useState("");
  const [language, setLanguage] = useState<SkillScript["language"]>("python");
  const [purpose, setPurpose] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!filename || !purpose) return;
    onSubmit({ filename, language, purpose, content: content || undefined });
  };

  return (
    <div className="space-y-3 p-3 rounded border bg-muted/20">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Filename *</Label>
          <Input
            placeholder="e.g., extract.py"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Language *</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as SkillScript["language"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="bash">Bash</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Purpose *</Label>
        <Input
          placeholder="What does this script do?"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Content (optional)</Label>
        <Textarea
          placeholder="Paste script content here, or leave empty for external file reference"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!filename || !purpose}>
          Add Script
        </Button>
      </div>
    </div>
  );
}

// Reference Form Component
interface ReferenceFormProps {
  onSubmit: (reference: SkillReference) => void;
  onCancel: () => void;
}

function ReferenceForm({ onSubmit, onCancel }: ReferenceFormProps) {
  const [filename, setFilename] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!filename || !title) return;
    onSubmit({ filename, title, content: content || undefined });
  };

  return (
    <div className="space-y-3 p-3 rounded border bg-muted/20">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Filename *</Label>
          <Input
            placeholder="e.g., GUIDELINES.md"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input
            placeholder="e.g., Classification Guidelines"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Content (optional)</Label>
        <Textarea
          placeholder="Paste reference content here, or leave empty for external file reference"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!filename || !title}>
          Add Reference
        </Button>
      </div>
    </div>
  );
}
