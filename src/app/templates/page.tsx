"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, LayoutTemplate, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemplates, useCreateFromTemplate } from "@/hooks";
import type { TemplateCategory } from "@/lib/schemas";

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  customer_service: "Customer Service",
  scheduled_tasks: "Scheduled Tasks",
  event_driven: "Event-Driven",
  data_pipeline: "Data Pipeline",
  monitoring_alerting: "Monitoring & Alerting",
  content_generation: "Content Generation",
  multi_agent: "Multi-Agent",
  analysis_reporting: "Analysis & Reporting",
  background_processing: "Background Processing",
  custom: "Custom",
};

export default function TemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");

  const { data: templates, isLoading } = useTemplates({
    search: search || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  });

  const createFromTemplate = useCreateFromTemplate();

  const handleUseTemplate = async (templateId: string) => {
    try {
      const newStory = await createFromTemplate.mutateAsync(templateId);
      router.push(`/stories/${newStory.id}`);
    } catch (error) {
      console.error("Failed to create from template:", error);
    }
  };

  return (
    <AppShell className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Start with a pre-built template for common agent patterns
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as TemplateCategory | "all")}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {CATEGORY_LABELS[template.category]}
                    </Badge>
                    <Badge variant={template.storyTemplate.format === "full" ? "default" : "secondary"}>
                      {template.storyTemplate.format}
                    </Badge>
                  </div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LayoutTemplate className="h-4 w-4" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-sm font-medium">When to use:</p>
                    <p className="text-sm text-muted-foreground">
                      {template.whenToUse}
                    </p>
                  </div>

                  {template.exampleScenarios && template.exampleScenarios.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Examples:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {template.exampleScenarios.slice(0, 3).map((ex, i) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <Button
                    className="w-full"
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={createFromTemplate.isPending}
                  >
                    {createFromTemplate.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Use Template
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Used {template.usageCount} times
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold">No templates found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or category filter
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
