"use client";

import * as React from "react";
import { Download, FileJson, FileText, FileSpreadsheet, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HumanAgentPair, BusinessDomain, Department, Role, Person } from "@/lib/schemas";

interface HAPExportPanelProps {
  haps: HumanAgentPair[];
  domains?: BusinessDomain[];
  departments?: Department[];
  roles?: Role[];
  people?: Person[];
  onClose?: () => void;
}

type ExportFormat = "json" | "csv" | "markdown";

export function HAPExportPanel({
  haps,
  domains = [],
  departments = [],
  roles = [],
  people = [],
  onClose,
}: HAPExportPanelProps) {
  const [format, setFormat] = React.useState<ExportFormat>("json");
  const [includeDetails, setIncludeDetails] = React.useState(true);
  const [includeTasks, setIncludeTasks] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const getPersonName = (personId: string) =>
    people.find((p) => p.id === personId)?.name || "Unknown";

  const getRoleName = (roleId: string) =>
    roles.find((r) => r.id === roleId)?.name || "Unknown";

  const getDeptName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return "Unknown";
    return departments.find((d) => d.id === role.departmentId)?.name || "Unknown";
  };

  // Helper to calculate phase distribution for a HAP
  const getPhaseDistribution = (hap: HumanAgentPair) => {
    const tasks = hap.tasks ?? [];
    let humanPhases = 0;
    let agentPhases = 0;
    let agentPhasesWithSkills = 0;

    tasks.forEach((task) => {
      Object.values(task.phases).forEach((phase) => {
        if (phase.owner === "human") {
          humanPhases++;
        } else {
          agentPhases++;
          if (phase.skillId) agentPhasesWithSkills++;
        }
      });
    });

    const totalPhases = humanPhases + agentPhases;
    return {
      humanPercent: totalPhases > 0 ? Math.round((humanPhases / totalPhases) * 100) : 100,
      agentPercent: totalPhases > 0 ? Math.round((agentPhases / totalPhases) * 100) : 0,
      progress: agentPhases > 0 ? Math.round((agentPhasesWithSkills / agentPhases) * 100) : 100,
    };
  };

  // Generate JSON export
  const generateJSON = () => {
    const data = haps.map((hap) => {
      const distribution = getPhaseDistribution(hap);
      const base = {
        id: hap.id,
        person: getPersonName(hap.personId),
        role: getRoleName(hap.roleId),
        department: getDeptName(hap.roleId),
        status: hap.integrationStatus,
        phaseDistribution: {
          humanPercent: distribution.humanPercent,
          agentPercent: distribution.agentPercent,
        },
        progress: distribution.progress,
      };

      if (includeTasks) {
        const tasks = hap.tasks ?? [];
        return {
          ...base,
          taskCount: tasks.length,
          tasks: tasks.map((t) => ({
            name: t.taskName,
            phases: {
              manage: t.phases.manage.owner,
              define: t.phases.define.owner,
              perform: t.phases.perform.owner,
              review: t.phases.review.owner,
            },
            integrationStatus: t.integrationStatus,
          })),
        };
      }

      return base;
    });

    return JSON.stringify(includeDetails ? { haps: data, exportedAt: new Date().toISOString() } : data, null, 2);
  };

  // Generate CSV export
  const generateCSV = () => {
    const headers = [
      "ID",
      "Person",
      "Role",
      "Department",
      "Status",
      "Human Phases %",
      "Agent Phases %",
      "Progress %",
    ];

    if (includeTasks) {
      headers.push("Task Count");
    }

    const rows = haps.map((hap) => {
      const distribution = getPhaseDistribution(hap);

      const row: (string | number)[] = [
        hap.id,
        getPersonName(hap.personId),
        getRoleName(hap.roleId),
        getDeptName(hap.roleId),
        hap.integrationStatus,
        distribution.humanPercent,
        distribution.agentPercent,
        distribution.progress,
      ];

      if (includeTasks) {
        row.push((hap.tasks ?? []).length);
      }

      return row;
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  // Generate Markdown report
  const generateMarkdown = () => {
    const lines: string[] = [];

    lines.push("# HAP Integration Report");
    lines.push("");
    lines.push(`**Generated:** ${new Date().toLocaleString()}`);
    lines.push(`**Total HAPs:** ${haps.length}`);
    lines.push("");

    // Summary stats
    const ready = haps.filter((h) => h.integrationStatus === "ready" || h.integrationStatus === "active").length;
    const skillsPending = haps.filter((h) => h.integrationStatus === "skills_pending").length;
    const planning = haps.filter((h) => h.integrationStatus === "planning").length;
    const paused = haps.filter((h) => h.integrationStatus === "paused").length;

    lines.push("## Summary");
    lines.push("");
    lines.push(`- ✅ Ready/Active: ${ready}`);
    lines.push(`- ⏳ Skills Pending: ${skillsPending}`);
    lines.push(`- 📝 Planning: ${planning}`);
    lines.push(`- ⏸️ Paused: ${paused}`);
    lines.push(`- 📋 Not Started: ${haps.length - ready - skillsPending - planning - paused}`);
    lines.push("");

    if (includeDetails) {
      lines.push("## HAP Details");
      lines.push("");

      haps.forEach((hap) => {
        const distribution = getPhaseDistribution(hap);

        lines.push(`### ${getPersonName(hap.personId)} - ${getRoleName(hap.roleId)}`);
        lines.push("");
        lines.push(`**Department:** ${getDeptName(hap.roleId)}`);
        lines.push(`**Status:** ${hap.integrationStatus.replace("_", " ")}`);
        lines.push(`**Progress:** ${distribution.progress}%`);
        lines.push("");
        lines.push("| Phase Type | Percentage |");
        lines.push("|------------|------------|");
        lines.push(`| Human | ${distribution.humanPercent}% |`);
        lines.push(`| Agent | ${distribution.agentPercent}% |`);
        lines.push("");

        const tasks = hap.tasks ?? [];
        if (includeTasks && tasks.length > 0) {
          lines.push("**Tasks:**");
          lines.push("");
          lines.push("| Task | Manage | Define | Perform | Review |");
          lines.push("|------|--------|--------|---------|--------|");
          tasks.forEach((task) => {
            const m = task.phases.manage.owner === "human" ? "👤" : "🤖";
            const d = task.phases.define.owner === "human" ? "👤" : "🤖";
            const p = task.phases.perform.owner === "human" ? "👤" : "🤖";
            const r = task.phases.review.owner === "human" ? "👤" : "🤖";
            lines.push(`| ${task.taskName} | ${m} | ${d} | ${p} | ${r} |`);
          });
          lines.push("");
        }

        if (hap.notes) {
          lines.push("**Notes:**");
          lines.push(hap.notes);
          lines.push("");
        }
      });
    }

    return lines.join("\n");
  };

  const getExportContent = () => {
    switch (format) {
      case "json":
        return generateJSON();
      case "csv":
        return generateCSV();
      case "markdown":
        return generateMarkdown();
      default:
        return "";
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getExportContent();
    const mimeTypes = {
      json: "application/json",
      csv: "text/csv",
      markdown: "text/markdown",
    };
    const extensions = {
      json: "json",
      csv: "csv",
      markdown: "md",
    };

    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hap-report-${new Date().toISOString().split("T")[0]}.${extensions[format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatIcons = {
    json: FileJson,
    csv: FileSpreadsheet,
    markdown: FileText,
  };

  const FormatIcon = formatIcons[format];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export HAP Data
        </CardTitle>
        <CardDescription>
          Download or copy HAP transformation data in various formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </div>
              </SelectItem>
              <SelectItem value="markdown">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Markdown Report
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <Label>Options</Label>
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-details"
              checked={includeDetails}
              onCheckedChange={(v) => setIncludeDetails(!!v)}
            />
            <Label htmlFor="include-details" className="font-normal">
              Include detailed information
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-tasks"
              checked={includeTasks}
              onCheckedChange={(v) => setIncludeTasks(!!v)}
            />
            <Label htmlFor="include-tasks" className="font-normal">
              Include task assignments
            </Label>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="max-h-64 overflow-auto rounded-lg border bg-muted p-3">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {getExportContent().slice(0, 1000)}
              {getExportContent().length > 1000 && "..."}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleDownload} className="flex-1">
            <FormatIcon className="mr-2 h-4 w-4" />
            Download {format.toUpperCase()}
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
