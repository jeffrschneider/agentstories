"use client";

import { useState } from "react";
import { Upload, FileJson, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AgentStorySchema } from "@/lib/schemas";
import type { AgentStory } from "@/lib/schemas";

interface ImportPanelProps {
  onImport: (story: Partial<AgentStory>) => void;
}

// Simple YAML parser for agent story format
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

    // Array item
    if (content.startsWith("- ")) {
      const value = content.slice(2).trim();
      if (currentArray && currentArrayKey) {
        // Check if it's an object start
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

    // Key-value or object start
    const colonIndex = content.indexOf(":");
    if (colonIndex !== -1) {
      const key = content.slice(0, colonIndex).trim();
      const value = content.slice(colonIndex + 1).trim();

      // Pop stack to find parent at correct indent
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1].obj;

      if (value === "" || value === "[]" || value === "{}") {
        // Object or array start
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
        // Simple value
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

export function ImportPanel({ onImport }: ImportPanelProps) {
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

      // Validate against schema
      const result = AgentStorySchema.safeParse(parsed);

      if (!result.success) {
        const errors = result.error.issues.map((e) =>
          `${e.path.join(".")}: ${e.message}`
        );
        setError(`Validation failed:\n${errors.join("\n")}`);
        return;
      }

      onImport(result.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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

      // Auto-detect format
      if (file.name.endsWith(".json")) {
        setFormat("json");
      } else if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
        setFormat("yaml");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Import</span>
          <div className="flex gap-2">
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
            <Button size="sm" onClick={handleImport} disabled={!content.trim()}>
              Import
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <AlertDescription>Story imported successfully!</AlertDescription>
          </Alert>
        )}

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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste JSON here..."
              className="font-mono text-xs h-80"
            />
          </TabsContent>
          <TabsContent value="yaml">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste YAML here..."
              className="font-mono text-xs h-80"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
