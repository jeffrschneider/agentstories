"use client";

import { useState, useMemo } from "react";
import { useSnapshot } from "valtio";
import {
  Lightbulb,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { storyEditorStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  suggestSkills,
  getDiverseSuggestions,
  getTemplatesByCategory,
  getCategories,
  hasEnoughContext,
  SuggestionResult,
  SkillTemplate,
  SkillCategory,
  SKILL_CATEGORY_METADATA,
} from "@/lib/skill-suggestions";
import { Skill } from "@/lib/schemas/skill";

interface SkillSuggestionsProps {
  onAddSkill: (skill: Omit<Skill, "id">) => void;
  existingSkillNames: string[];
}

export function SkillSuggestions({ onAddSkill, existingSkillNames }: SkillSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const editor = useSnapshot(storyEditorStore);
  const data = editor.draft.data;

  const context = useMemo(() => ({
    name: data.name as string | undefined,
    role: data.role as string | undefined,
    purpose: data.purpose as string | undefined,
    tags: data.tags as string[] | undefined,
    existingSkillNames,
  }), [data.name, data.role, data.purpose, data.tags, existingSkillNames]);

  const suggestions = useMemo(() => {
    if (!hasEnoughContext(context)) {
      return [];
    }
    return getDiverseSuggestions(context, 6);
  }, [context]);

  const handleAddSkill = (template: SkillTemplate) => {
    const skill = { ...template.skill };
    onAddSkill(skill);
    setAddedSkills((prev) => new Set(prev).add(template.id));
  };

  const hasContext = hasEnoughContext(context);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Suggest Skills
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Skill Suggestions
          </DialogTitle>
          <DialogDescription>
            {hasContext
              ? "Based on your agent's description, here are recommended skills."
              : "Add more details to your agent (name, role, purpose) for personalized suggestions."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={hasContext ? "recommended" : "browse"} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommended" disabled={!hasContext}>
              Recommended
            </TabsTrigger>
            <TabsTrigger value="browse">Browse All</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.template.id}
                      suggestion={suggestion}
                      onAdd={() => handleAddSkill(suggestion.template)}
                      isAdded={addedSkills.has(suggestion.template.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Add more details to your agent to get skill suggestions</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="browse" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <BrowseCategories
                onAddSkill={handleAddSkill}
                addedSkills={addedSkills}
                existingSkillNames={existingSkillNames}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface SuggestionCardProps {
  suggestion: SuggestionResult;
  onAdd: () => void;
  isAdded: boolean;
}

function SuggestionCard({ suggestion, onAdd, isAdded }: SuggestionCardProps) {
  const { template, score, reason } = suggestion;
  const categoryMeta = SKILL_CATEGORY_METADATA[template.category];

  return (
    <Card className={isAdded ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{template.name}</h4>
              <Badge variant="outline" className="text-xs shrink-0">
                {categoryMeta.label}
              </Badge>
              {score >= 0.5 && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  High Match
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              {reason}
            </p>
          </div>
          <Button
            size="sm"
            variant={isAdded ? "outline" : "default"}
            onClick={onAdd}
            disabled={isAdded}
            className="shrink-0"
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface BrowseCategoriesProps {
  onAddSkill: (template: SkillTemplate) => void;
  addedSkills: Set<string>;
  existingSkillNames: string[];
}

function BrowseCategories({ onAddSkill, addedSkills, existingSkillNames }: BrowseCategoriesProps) {
  const [expandedCategory, setExpandedCategory] = useState<SkillCategory | null>(null);
  const categories = getCategories();

  return (
    <div className="space-y-2">
      {categories.map((category) => {
        const meta = SKILL_CATEGORY_METADATA[category];
        const templates = getTemplatesByCategory(category);
        const isExpanded = expandedCategory === category;

        return (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 text-left"
              onClick={() => setExpandedCategory(isExpanded ? null : category)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{meta.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {templates.length}
                </Badge>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t p-2 space-y-2">
                {templates
                  .filter((t) => !existingSkillNames.some(
                    (name) => name.toLowerCase() === t.name.toLowerCase()
                  ))
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onAdd={() => onAddSkill(template)}
                      isAdded={addedSkills.has(template.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface TemplateCardProps {
  template: SkillTemplate;
  onAdd: () => void;
  isAdded: boolean;
}

function TemplateCard({ template, onAdd, isAdded }: TemplateCardProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 rounded-md ${
        isAdded ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/30"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{template.name}</p>
        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
      </div>
      <Button
        size="sm"
        variant={isAdded ? "ghost" : "outline"}
        onClick={onAdd}
        disabled={isAdded}
        className="shrink-0 ml-2"
      >
        {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/**
 * Inline skill suggestions banner for the skills section
 * Shown when agent has context but no skills yet
 */
interface InlineSuggestionsProps {
  onAddSkill: (skill: Omit<Skill, "id">) => void;
}

export function InlineSkillSuggestions({ onAddSkill }: InlineSuggestionsProps) {
  const [dismissed, setDismissed] = useState(false);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const editor = useSnapshot(storyEditorStore);
  const data = editor.draft.data;

  const context = useMemo(() => ({
    name: data.name as string | undefined,
    role: data.role as string | undefined,
    purpose: data.purpose as string | undefined,
    tags: data.tags as string[] | undefined,
    existingSkillNames: [],
  }), [data.name, data.role, data.purpose, data.tags]);

  const suggestions = useMemo(() => {
    if (!hasEnoughContext(context)) {
      return [];
    }
    return suggestSkills(context, { maxResults: 3, minScore: 0.2 });
  }, [context]);

  if (dismissed || suggestions.length === 0) {
    return null;
  }

  const handleAddSkill = (template: SkillTemplate) => {
    const skill = { ...template.skill };
    onAddSkill(skill);
    setAddedSkills((prev) => new Set(prev).add(template.id));
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Suggested Skills
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Based on your agent&apos;s role and purpose
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.template.id}
              variant={addedSkills.has(suggestion.template.id) ? "secondary" : "outline"}
              size="sm"
              className="gap-1"
              onClick={() => handleAddSkill(suggestion.template)}
              disabled={addedSkills.has(suggestion.template.id)}
            >
              {addedSkills.has(suggestion.template.id) ? (
                <Check className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              {suggestion.template.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
