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

  // Generate JSON export
  const generateJSON = () => {
    const data = haps.map((hap) => {
      const base = {
        id: hap.id,
        person: getPersonName(hap.personId),
        role: getRoleName(hap.roleId),
        department: getDeptName(hap.roleId),
        status: hap.transitionStatus,
        asIs: {
          humanPercent: hap.asIs.humanPercent,
          agentPercent: hap.asIs.agentPercent,
        },
        toBe: {
          humanPercent: hap.toBe.humanPercent,
          agentPercent: hap.toBe.agentPercent,
        },
        targetCompletionDate: hap.targetCompletionDate || null,
      };

      if (includeTasks) {
        return {
          ...base,
          taskCount: hap.asIs.taskAssignments.length,
          tasks: hap.asIs.taskAssignments.map((t) => ({
            name: t.taskName,
            currentOwner: t.currentOwner,
            targetOwner: t.targetOwner,
            completed: t.currentOwner === t.targetOwner,
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
      "As-Is Human %",
      "As-Is Agent %",
      "To-Be Human %",
      "To-Be Agent %",
      "Target Date",
    ];

    if (includeTasks) {
      headers.push("Task Count", "Tasks Completed");
    }

    const rows = haps.map((hap) => {
      const completedTasks = hap.asIs.taskAssignments.filter(
        (t) => t.currentOwner === t.targetOwner
      ).length;

      const row = [
        hap.id,
        getPersonName(hap.personId),
        getRoleName(hap.roleId),
        getDeptName(hap.roleId),
        hap.transitionStatus,
        hap.asIs.humanPercent,
        hap.asIs.agentPercent,
        hap.toBe.humanPercent,
        hap.toBe.agentPercent,
        hap.targetCompletionDate || "",
      ];

      if (includeTasks) {
        row.push(hap.asIs.taskAssignments.length, completedTasks);
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

    lines.push("# HAP Transformation Report");
    lines.push("");
    lines.push(`**Generated:** ${new Date().toLocaleString()}`);
    lines.push(`**Total HAPs:** ${haps.length}`);
    lines.push("");

    // Summary stats
    const completed = haps.filter((h) => h.transitionStatus === "completed").length;
    const inProgress = haps.filter((h) => h.transitionStatus === "in_progress").length;
    const blocked = haps.filter((h) => h.transitionStatus === "blocked").length;

    lines.push("## Summary");
    lines.push("");
    lines.push(`- ✅ Completed: ${completed}`);
    lines.push(`- 🔄 In Progress: ${inProgress}`);
    lines.push(`- ⛔ Blocked: ${blocked}`);
    lines.push(`- 📋 Not Started/Planned: ${haps.length - completed - inProgress - blocked}`);
    lines.push("");

    if (includeDetails) {
      lines.push("## HAP Details");
      lines.push("");

      haps.forEach((hap) => {
        const progress =
          hap.asIs.taskAssignments.length > 0
            ? Math.round(
                (hap.asIs.taskAssignments.filter((t) => t.currentOwner === t.targetOwner).length /
                  hap.asIs.taskAssignments.length) *
                  100
              )
            : 0;

        lines.push(`### ${getPersonName(hap.personId)} - ${getRoleName(hap.roleId)}`);
        lines.push("");
        lines.push(`**Department:** ${getDeptName(hap.roleId)}`);
        lines.push(`**Status:** ${hap.transitionStatus.replace("_", " ")}`);
        lines.push(`**Progress:** ${progress}%`);
        lines.push("");
        lines.push("| Metric | As-Is | To-Be |");
        lines.push("|--------|-------|-------|");
        lines.push(`| Human | ${hap.asIs.humanPercent}% | ${hap.toBe.humanPercent}% |`);
        lines.push(`| Agent | ${hap.asIs.agentPercent}% | ${hap.toBe.agentPercent}% |`);
        lines.push("");

        if (includeTasks && hap.asIs.taskAssignments.length > 0) {
          lines.push("**Tasks:**");
          lines.push("");
          hap.asIs.taskAssignments.forEach((task) => {
            const status = task.currentOwner === task.targetOwner ? "✅" : "⏳";
            lines.push(`- ${status} ${task.taskName}: ${task.currentOwner} → ${task.targetOwner}`);
          });
          lines.push("");
        }

        if (hap.topBlockers && hap.topBlockers.length > 0) {
          lines.push("**Blockers:**");
          hap.topBlockers.forEach((blocker) => {
            lines.push(`- ⚠️ ${blocker}`);
          });
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
