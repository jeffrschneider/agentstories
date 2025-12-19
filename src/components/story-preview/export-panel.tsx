"use client";

import { useState } from "react";
import { Copy, Download, Check, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { AgentStory } from "@/lib/schemas";

interface ExportPanelProps {
  story: AgentStory;
}

function toYaml(obj: unknown, indent = 0): string {
  const spaces = "  ".repeat(indent);

  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj === "string") {
    // Multi-line strings or strings with special chars need quoting
    if (obj.includes("\n") || obj.includes(":") || obj.includes("#")) {
      return `"${obj.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
    }
    return obj;
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return String(obj);
  }

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
          const nested = toYaml(value, indent + 1);
          return `${spaces}${key}:\n${nested}`;
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

export function ExportPanel({ story }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<"json" | "yaml">("json");

  const jsonContent = JSON.stringify(story, null, 2);
  const yamlContent = toYaml(story);

  const content = format === "json" ? jsonContent : yamlContent;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story.identifier || "story"}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Export</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={format} onValueChange={(v) => setFormat(v as "json" | "yaml")}>
          <TabsList className="mb-4">
            <TabsTrigger value="json" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="yaml" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              YAML
            </TabsTrigger>
          </TabsList>
          <TabsContent value="json">
            <Textarea
              value={jsonContent}
              readOnly
              className="font-mono text-xs h-80"
            />
          </TabsContent>
          <TabsContent value="yaml">
            <Textarea
              value={yamlContent}
              readOnly
              className="font-mono text-xs h-80"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
