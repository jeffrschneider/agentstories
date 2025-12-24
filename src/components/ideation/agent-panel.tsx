'use client';

import * as React from 'react';
import {
  Bot,
  Zap,
  Users,
  Shield,
  Loader2,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Wrench,
  Brain,
  Target,
  AlertTriangle,
  Database,
  GitBranch,
  Play,
  CheckCircle2,
  ArrowRightLeft,
  Copy,
  Check,
  FileJson,
  FileText,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIdeation } from '@/stores';
import type {
  IdeatedAgent,
  IdeatedSkill,
  IdeatedTrigger,
  IdeatedTool,
  IdeatedBehavior,
  IdeatedAcceptance,
  IdeatedGuardrail,
  IdeatedHumanInteraction,
  IdeatedCollaboration,
  IdeatedMemory,
} from '@/lib/ideation/agent-context';

// ============ Export Utilities ============

/**
 * Convert a value to YAML format (simple implementation)
 */
function toYaml(obj: unknown, indent = 0): string {
  const prefix = '  '.repeat(indent);

  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'string') {
    // Escape strings that need quoting
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') ||
        obj.includes('"') || obj.includes("'") || obj.trim() !== obj ||
        obj === '' || /^[\d.]+$/.test(obj) || ['true', 'false', 'null'].includes(obj.toLowerCase())) {
      return `"${obj.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map((item) => {
      const value = toYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null) {
        return `${prefix}- ${value.trim().split('\n').join(`\n${prefix}  `)}`;
      }
      return `${prefix}- ${value}`;
    }).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null);
    if (entries.length === 0) return '{}';

    return entries.map(([key, value]) => {
      const yamlValue = toYaml(value, indent + 1);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `${prefix}${key}:\n${yamlValue}`;
      }
      if (Array.isArray(value) && value.length > 0) {
        return `${prefix}${key}:\n${yamlValue}`;
      }
      return `${prefix}${key}: ${yamlValue}`;
    }).join('\n');
  }

  return String(obj);
}

/**
 * Convert agent to Markdown format
 */
function toMarkdown(agent: IdeatedAgent): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${agent.name || 'Untitled Agent'}`);
  lines.push('');

  // Identity
  if (agent.role || agent.purpose || agent.autonomyLevel) {
    lines.push('## Identity');
    lines.push('');
    if (agent.identifier) lines.push(`**Identifier:** \`${agent.identifier}\``);
    if (agent.role) lines.push(`**Role:** ${agent.role}`);
    if (agent.purpose) lines.push(`**Purpose:** ${agent.purpose}`);
    if (agent.autonomyLevel) lines.push(`**Autonomy Level:** ${agent.autonomyLevel.replace(/_/g, ' ')}`);
    if (agent.tags?.length) lines.push(`**Tags:** ${agent.tags.join(', ')}`);
    lines.push('');
  }

  // Skills
  if (agent.skills.length > 0) {
    lines.push('## Skills');
    lines.push('');

    agent.skills.forEach((skill, index) => {
      lines.push(`### ${index + 1}. ${skill.name}`);
      lines.push('');

      if (skill.description) lines.push(skill.description);
      if (skill.domain) lines.push(`**Domain:** ${skill.domain}`);
      if (skill.acquired) lines.push(`**Acquired:** ${skill.acquired.replace(/_/g, ' ')}`);
      lines.push('');

      if (skill.triggers?.length) {
        lines.push('#### Triggers');
        skill.triggers.forEach((t) => {
          lines.push(`- **${t.type}:** ${t.description}`);
        });
        lines.push('');
      }

      if (skill.tools?.length) {
        lines.push('#### Tools');
        skill.tools.forEach((t) => {
          lines.push(`- **${t.name}** (${t.permissions.join(', ')}): ${t.purpose}`);
        });
        lines.push('');
      }

      if (skill.behavior) {
        lines.push('#### Behavior');
        lines.push(`**Model:** ${skill.behavior.model}`);
        if (skill.behavior.steps?.length) {
          lines.push('**Steps:**');
          skill.behavior.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
        }
        lines.push('');
      }

      if (skill.acceptance?.successConditions?.length) {
        lines.push('#### Acceptance Criteria');
        skill.acceptance.successConditions.forEach((c) => lines.push(`- ${c}`));
        lines.push('');
      }

      if (skill.guardrails?.length) {
        lines.push('#### Guardrails');
        skill.guardrails.forEach((g) => {
          lines.push(`- **${g.name}:** ${g.constraint}`);
        });
        lines.push('');
      }
    });
  }

  // Human Interaction
  if (agent.humanInteraction) {
    lines.push('## Human Interaction');
    lines.push('');
    if (agent.humanInteraction.mode) {
      lines.push(`**Mode:** ${agent.humanInteraction.mode.replace(/_/g, ' ')}`);
    }
    if (agent.humanInteraction.checkpoints?.length) {
      lines.push('**Checkpoints:**');
      agent.humanInteraction.checkpoints.forEach((cp) => {
        lines.push(`- ${cp.name} (${cp.type}): ${cp.trigger}`);
      });
    }
    lines.push('');
  }

  // Collaboration
  if (agent.collaboration) {
    lines.push('## Collaboration');
    lines.push('');
    if (agent.collaboration.role) lines.push(`**Role:** ${agent.collaboration.role}`);
    if (agent.collaboration.reportsTo) lines.push(`**Reports To:** ${agent.collaboration.reportsTo}`);
    lines.push('');
  }

  // Memory
  if (agent.memory) {
    lines.push('## Memory');
    lines.push('');
    if (agent.memory.working?.length) {
      lines.push('**Working Memory:** ' + agent.memory.working.join(', '));
    }
    if (agent.memory.persistent?.length) {
      lines.push('**Persistent Stores:**');
      agent.memory.persistent.forEach((p) => {
        lines.push(`- ${p.name} (${p.type}): ${p.purpose}`);
      });
    }
    lines.push('');
  }

  // Guardrails
  if (agent.guardrails?.length) {
    lines.push('## Guardrails');
    lines.push('');
    agent.guardrails.forEach((g) => {
      lines.push(`### ${g.name}`);
      lines.push(g.constraint);
      if (g.rationale) lines.push(`*${g.rationale}*`);
      if (g.enforcement) lines.push(`**Enforcement:** ${g.enforcement}`);
      lines.push('');
    });
  }

  // Notes
  if (agent.notes) {
    lines.push('## Notes');
    lines.push('');
    lines.push(agent.notes);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Clean agent object for export (remove undefined/null values)
 */
function cleanForExport(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    const cleaned = obj.map(cleanForExport).filter((v) => v !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleaned = cleanForExport(value);
    if (cleaned !== undefined) {
      result[key] = cleaned;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

interface AgentPanelProps {
  isExtracting?: boolean;
  onRefresh?: () => void;
}

export function AgentPanel({ isExtracting, onRefresh }: AgentPanelProps) {
  const ideation = useIdeation();
  const agent = ideation.ideatedAgent as IdeatedAgent;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [scrollToSkillIndex, setScrollToSkillIndex] = React.useState<number | null>(null);

  const hasContent =
    agent.name ||
    agent.role ||
    agent.purpose ||
    agent.skills.length > 0 ||
    (agent.guardrails && agent.guardrails.length > 0);

  const handleExpandToSkill = React.useCallback((skillIndex: number) => {
    setScrollToSkillIndex(skillIndex);
    setIsExpanded(true);
  }, []);

  // Clear scroll target when panel closes
  React.useEffect(() => {
    if (!isExpanded) {
      setScrollToSkillIndex(null);
    }
  }, [isExpanded]);

  return (
    <>
      {/* Compact Side Panel */}
      <div className="flex h-full flex-col border-l bg-muted/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Agent Spec</h3>
          </div>
          <div className="flex items-center gap-1">
            {isExtracting && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                disabled={isExtracting}
                title="Refresh extraction"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
            {hasContent && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded(true)}
                title="Expand panel"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Compact Content */}
        <ScrollArea className="flex-1">
          {!hasContent ? (
            <EmptyState />
          ) : (
            <CompactView
              agent={agent}
              onExpandToSkill={handleExpandToSkill}
              onExpand={() => setIsExpanded(true)}
            />
          )}
        </ScrollArea>
      </div>

      {/* Expanded Sheet */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-hidden flex flex-col"
        >
          <SheetHeader className="flex-shrink-0">
            <div className="flex items-center justify-between pr-8">
              <SheetTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {agent.name || 'Agent Specification'}
              </SheetTitle>
              <div className="flex items-center gap-2">
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Refresh
                  </Button>
                )}
              </div>
            </div>
            <SheetDescription>
              {agent.purpose || 'Define your agent through conversation'}
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="spec" className="flex-1 flex flex-col overflow-hidden mt-4">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="spec" className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Spec</span>
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-1.5">
                <FileJson className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </TabsTrigger>
              <TabsTrigger value="yaml" className="flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">YAML</span>
              </TabsTrigger>
              <TabsTrigger value="markdown" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">MD</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spec" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full -mx-6 px-6">
                <ExpandedView
                  agent={agent}
                  scrollToSkillIndex={scrollToSkillIndex}
                  onScrollComplete={() => setScrollToSkillIndex(null)}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="json" className="flex-1 overflow-hidden mt-4">
              <ExportView
                content={JSON.stringify(cleanForExport(agent), null, 2)}
                filename={`${agent.identifier || agent.name || 'agent'}.json`}
                language="json"
              />
            </TabsContent>

            <TabsContent value="yaml" className="flex-1 overflow-hidden mt-4">
              <ExportView
                content={toYaml(cleanForExport(agent))}
                filename={`${agent.identifier || agent.name || 'agent'}.yaml`}
                language="yaml"
              />
            </TabsContent>

            <TabsContent value="markdown" className="flex-1 overflow-hidden mt-4">
              <ExportView
                content={toMarkdown(agent)}
                filename={`${agent.identifier || agent.name || 'agent'}.md`}
                language="markdown"
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-3 rounded-full bg-muted p-3">
        <Bot className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        Your agent specification will appear here as you discuss it.
      </p>
    </div>
  );
}

interface CompactViewProps {
  agent: IdeatedAgent;
  onExpandToSkill: (skillIndex: number) => void;
  onExpand: () => void;
}

function CompactView({ agent, onExpandToSkill, onExpand }: CompactViewProps) {
  return (
    <TooltipProvider>
      <div className="p-4 space-y-4">
        {/* Agent Name */}
        {(agent.name || agent.role) && (
          <div
            className="p-3 rounded-lg bg-background border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={onExpand}
          >
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Agent:
              </span>
              {agent.name && (
                <span className="font-medium text-sm">{agent.name}</span>
              )}
            </div>
            {agent.role && (
              <div className="text-xs text-muted-foreground line-clamp-2 ml-6">
                {agent.role}
              </div>
            )}
          </div>
        )}

      {/* Skills Summary */}
      {agent.skills.length > 0 && (
        <div className="p-3 rounded-lg bg-background border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Skills
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {agent.skills.length}
            </Badge>
          </div>
          <div className="space-y-1">
            {agent.skills.map((skill, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onExpandToSkill(i)}
                className="flex items-center gap-2 w-full text-left text-sm text-primary hover:underline truncate"
              >
                <span className="text-muted-foreground text-xs w-4">{i + 1}.</span>
                <span className="truncate">{skill.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

        {/* Configuration Summary */}
        <div className="flex flex-wrap gap-2">
          {agent.humanInteraction?.mode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs cursor-help">
                  <Users className="h-3 w-3 mr-1" />
                  {agent.humanInteraction.mode.replace(/_/g, ' ')}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  {agent.humanInteraction.mode === 'out_of_loop'
                    ? 'Agent operates autonomously without human intervention during execution'
                    : agent.humanInteraction.mode === 'in_the_loop'
                    ? 'Human reviews and approves each action before the agent proceeds'
                    : agent.humanInteraction.mode === 'on_the_loop'
                    ? 'Agent operates autonomously but human monitors and can intervene'
                    : 'Defines how humans interact with the agent during execution'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {agent.collaboration?.role && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs cursor-help">
                  <GitBranch className="h-3 w-3 mr-1" />
                  {agent.collaboration.role}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Agent&apos;s role in multi-agent collaboration (e.g., orchestrator, worker, peer)
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {agent.guardrails && agent.guardrails.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs cursor-help">
                  <Shield className="h-3 w-3 mr-1" />
                  {agent.guardrails.length} guardrails
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Safety constraints that limit agent behavior to prevent harmful or unwanted actions
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {agent.memory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs cursor-help">
                  <Database className="h-3 w-3 mr-1" />
                  memory
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Agent has persistent memory to retain context across sessions or interactions
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Expand Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onExpand}
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          View Full Specification
        </Button>
      </div>
    </TooltipProvider>
  );
}

interface ExpandedViewProps {
  agent: IdeatedAgent;
  scrollToSkillIndex: number | null;
  onScrollComplete: () => void;
}

function ExpandedView({ agent, scrollToSkillIndex, onScrollComplete }: ExpandedViewProps) {
  const skillRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to skill when scrollToSkillIndex changes
  React.useEffect(() => {
    if (scrollToSkillIndex !== null && skillRefs.current[scrollToSkillIndex]) {
      // Small delay to ensure the sheet is fully open
      const timer = setTimeout(() => {
        skillRefs.current[scrollToSkillIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        onScrollComplete();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scrollToSkillIndex, onScrollComplete]);

  return (
    <div className="space-y-6 py-4">
      {/* Identity Section */}
      <CollapsibleSection
        title="Identity"
        icon={Bot}
        defaultOpen
        badge={agent.autonomyLevel}
      >
        <div className="space-y-3">
          {agent.name && (
            <Field label="Name" value={agent.name} />
          )}
          {agent.identifier && (
            <Field label="Identifier" value={agent.identifier} code />
          )}
          {agent.role && (
            <Field label="Role" value={agent.role} />
          )}
          {agent.purpose && (
            <Field label="Purpose" value={agent.purpose} />
          )}
          {agent.tags && agent.tags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {agent.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Skills Section */}
      {agent.skills.length > 0 && (
        <CollapsibleSection
          title="Skills"
          icon={Zap}
          defaultOpen
          badge={`${agent.skills.length}`}
        >
          <div className="space-y-4">
            {agent.skills.map((skill, index) => (
              <div
                key={skill.id || index}
                ref={(el) => { skillRefs.current[index] = el; }}
              >
                <SkillCard
                  skill={skill}
                  index={index}
                  defaultOpen={scrollToSkillIndex === index}
                />
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Human Interaction Section */}
      {agent.humanInteraction && (
        <CollapsibleSection title="Human Interaction" icon={Users}>
          <HumanInteractionView interaction={agent.humanInteraction} />
        </CollapsibleSection>
      )}

      {/* Collaboration Section */}
      {agent.collaboration && (
        <CollapsibleSection title="Collaboration" icon={GitBranch}>
          <CollaborationView collaboration={agent.collaboration} />
        </CollapsibleSection>
      )}

      {/* Memory Section */}
      {agent.memory && (
        <CollapsibleSection title="Memory" icon={Database}>
          <MemoryView memory={agent.memory} />
        </CollapsibleSection>
      )}

      {/* Guardrails Section */}
      {agent.guardrails && agent.guardrails.length > 0 && (
        <CollapsibleSection
          title="Guardrails"
          icon={Shield}
          badge={`${agent.guardrails.length}`}
        >
          <div className="space-y-2">
            {agent.guardrails.map((guardrail, index) => (
              <GuardrailCard key={index} guardrail={guardrail} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Notes */}
      {agent.notes && (
        <CollapsibleSection title="Notes" icon={Bot}>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {agent.notes}
          </p>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ============ Skill Card ============

interface SkillCardProps {
  skill: IdeatedSkill;
  index: number;
  defaultOpen?: boolean;
}

function SkillCard({ skill, index, defaultOpen }: SkillCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen ?? index === 0);

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {index + 1}
          </div>
          <div className="text-left">
            <div className="font-medium text-sm">{skill.name}</div>
            {skill.domain && (
              <div className="text-xs text-muted-foreground">{skill.domain}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {skill.acquired && (
            <Badge variant="secondary" className="text-xs">
              {skill.acquired.replace(/_/g, ' ')}
            </Badge>
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t p-4 space-y-4">
          {skill.description && (
            <p className="text-sm text-muted-foreground">{skill.description}</p>
          )}

          {/* Triggers */}
          {skill.triggers && skill.triggers.length > 0 && (
            <div>
              <Label icon={Play}>Triggers</Label>
              <div className="mt-2 space-y-2">
                {skill.triggers.map((trigger, i) => (
                  <TriggerItem key={i} trigger={trigger} />
                ))}
              </div>
            </div>
          )}

          {/* Inputs/Outputs */}
          {(skill.inputs?.length || skill.outputs?.length) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {skill.inputs && skill.inputs.length > 0 && (
                <div>
                  <Label icon={ArrowRightLeft}>Inputs</Label>
                  <div className="mt-2 space-y-1">
                    {skill.inputs.map((input, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-muted">
                        <span className="font-medium">{input.name}</span>
                        <span className="text-muted-foreground">
                          : {input.type}
                        </span>
                        {input.required && (
                          <Badge variant="destructive" className="ml-2 text-[10px]">
                            required
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {skill.outputs && skill.outputs.length > 0 && (
                <div>
                  <Label icon={ArrowRightLeft}>Outputs</Label>
                  <div className="mt-2 space-y-1">
                    {skill.outputs.map((output, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-muted">
                        <span className="font-medium">{output.name}</span>
                        <span className="text-muted-foreground">
                          : {output.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tools */}
          {skill.tools && skill.tools.length > 0 && (
            <div>
              <Label icon={Wrench}>Tools</Label>
              <div className="mt-2 space-y-2">
                {skill.tools.map((tool, i) => (
                  <ToolItem key={i} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* Behavior */}
          {skill.behavior && (
            <div>
              <Label icon={GitBranch}>Behavior</Label>
              <BehaviorView behavior={skill.behavior} />
            </div>
          )}

          {/* Reasoning */}
          {skill.reasoning && (
            <div>
              <Label icon={Brain}>Reasoning</Label>
              <div className="mt-2 p-3 rounded-lg bg-muted/50">
                <Badge variant="outline" className="mb-2">
                  {skill.reasoning.strategy?.replace(/_/g, ' ')}
                </Badge>
                {skill.reasoning.decisionPoints &&
                  skill.reasoning.decisionPoints.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {skill.reasoning.decisionPoints.map((dp, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium">{dp.name}:</span>{' '}
                          <span className="text-muted-foreground">
                            {dp.approach}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Acceptance */}
          {skill.acceptance && (
            <div>
              <Label icon={Target}>Acceptance Criteria</Label>
              <AcceptanceView acceptance={skill.acceptance} />
            </div>
          )}

          {/* Failure Handling */}
          {skill.failureHandling && (
            <div>
              <Label icon={AlertTriangle}>Failure Handling</Label>
              <div className="mt-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                {skill.failureHandling.defaultFallback && (
                  <div className="text-xs mb-2">
                    <span className="font-medium">Default fallback:</span>{' '}
                    {skill.failureHandling.defaultFallback}
                  </div>
                )}
                {skill.failureHandling.modes &&
                  skill.failureHandling.modes.length > 0 && (
                    <div className="space-y-1">
                      {skill.failureHandling.modes.map((mode, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-destructive">
                            {mode.condition}
                          </span>
                          {' → '}
                          <span>{mode.recovery}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Skill Guardrails */}
          {skill.guardrails && skill.guardrails.length > 0 && (
            <div>
              <Label icon={Shield}>Guardrails</Label>
              <div className="mt-2 space-y-2">
                {skill.guardrails.map((g, i) => (
                  <div
                    key={i}
                    className="text-xs p-2 rounded bg-muted border-l-2 border-yellow-500"
                  >
                    <span className="font-medium">{g.name}:</span>{' '}
                    <span className="text-muted-foreground">{g.constraint}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Sub-components ============

function TriggerItem({ trigger }: { trigger: IdeatedTrigger }) {
  return (
    <div className="p-2 rounded bg-muted/50 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-[10px]">
          {trigger.type}
        </Badge>
        <span>{trigger.description}</span>
      </div>
      {trigger.conditions && trigger.conditions.length > 0 && (
        <div className="mt-1 pl-2 border-l text-muted-foreground">
          {trigger.conditions.map((c, i) => (
            <div key={i}>• {c}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolItem({ tool }: { tool: IdeatedTool }) {
  return (
    <div className="p-2 rounded bg-muted/50 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium">{tool.name}</span>
        {tool.required && (
          <Badge variant="secondary" className="text-[10px]">
            required
          </Badge>
        )}
      </div>
      <div className="text-muted-foreground mb-1">{tool.purpose}</div>
      <div className="flex gap-1">
        {tool.permissions.map((p, i) => (
          <Badge key={i} variant="outline" className="text-[10px]">
            {p}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function BehaviorView({ behavior }: { behavior: IdeatedBehavior }) {
  return (
    <div className="mt-2 p-3 rounded-lg bg-muted/50">
      <Badge variant="outline" className="mb-2">
        {behavior.model}
      </Badge>

      {behavior.model === 'sequential' && behavior.steps && (
        <ol className="mt-2 space-y-1 list-decimal list-inside text-xs">
          {behavior.steps.map((step, i) => (
            <li key={i} className="text-muted-foreground">
              {step}
            </li>
          ))}
        </ol>
      )}

      {behavior.model === 'adaptive' && behavior.capabilities && (
        <div className="mt-2 flex flex-wrap gap-1">
          {behavior.capabilities.map((cap, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {cap}
            </Badge>
          ))}
        </div>
      )}

      {behavior.model === 'iterative' && (
        <div className="mt-2 text-xs">
          {behavior.body && (
            <div className="mb-2">
              <span className="font-medium">Loop:</span>
              <ul className="mt-1 list-disc list-inside text-muted-foreground">
                {behavior.body.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          {behavior.terminationCondition && (
            <div>
              <span className="font-medium">Until:</span>{' '}
              <span className="text-muted-foreground">
                {behavior.terminationCondition}
              </span>
            </div>
          )}
        </div>
      )}

      {behavior.model === 'workflow' && behavior.stages && (
        <div className="mt-2 space-y-2">
          {behavior.stages.map((stage, i) => (
            <div key={i} className="text-xs p-2 bg-background rounded">
              <span className="font-medium">{stage.name}:</span>{' '}
              <span className="text-muted-foreground">{stage.purpose}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AcceptanceView({ acceptance }: { acceptance: IdeatedAcceptance }) {
  return (
    <div className="mt-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
      <div className="space-y-1">
        {acceptance.successConditions.map((condition, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{condition}</span>
          </div>
        ))}
      </div>
      {acceptance.timeout && (
        <div className="mt-2 text-xs text-muted-foreground">
          Timeout: {acceptance.timeout}
        </div>
      )}
      {acceptance.qualityMetrics && acceptance.qualityMetrics.length > 0 && (
        <div className="mt-2 pt-2 border-t border-green-500/20">
          {acceptance.qualityMetrics.map((metric, i) => (
            <div key={i} className="text-xs">
              <span className="font-medium">{metric.name}:</span>{' '}
              <span className="text-muted-foreground">{metric.target}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HumanInteractionView({
  interaction,
}: {
  interaction: IdeatedHumanInteraction;
}) {
  return (
    <div className="space-y-3">
      {interaction.mode && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{interaction.mode.replace(/_/g, ' ')}</Badge>
        </div>
      )}
      {interaction.checkpoints && interaction.checkpoints.length > 0 && (
        <div>
          <Label>Checkpoints</Label>
          <div className="mt-2 space-y-2">
            {interaction.checkpoints.map((cp, i) => (
              <div key={i} className="text-xs p-2 rounded bg-muted">
                <div className="font-medium">{cp.name}</div>
                <div className="text-muted-foreground">
                  {cp.trigger} ({cp.type})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {interaction.escalation && (
        <div>
          <Label>Escalation</Label>
          <div className="mt-2 text-xs p-2 rounded bg-muted">
            {interaction.escalation.conditions && (
              <div>
                <span className="font-medium">When:</span>{' '}
                {interaction.escalation.conditions}
              </div>
            )}
            {interaction.escalation.channel && (
              <div>
                <span className="font-medium">Via:</span>{' '}
                {interaction.escalation.channel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CollaborationView({
  collaboration,
}: {
  collaboration: IdeatedCollaboration;
}) {
  return (
    <div className="space-y-3">
      {collaboration.role && (
        <Badge variant="outline">{collaboration.role}</Badge>
      )}
      {collaboration.reportsTo && (
        <Field label="Reports To" value={collaboration.reportsTo} />
      )}
      {collaboration.coordinates && collaboration.coordinates.length > 0 && (
        <div>
          <Label>Coordinates</Label>
          <div className="mt-2 space-y-2">
            {collaboration.coordinates.map((coord, i) => (
              <div key={i} className="text-xs p-2 rounded bg-muted">
                <span className="font-medium">{coord.agent}</span>
                <span className="text-muted-foreground">
                  {' '}
                  via {coord.via} for {coord.for}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {collaboration.peers && collaboration.peers.length > 0 && (
        <div>
          <Label>Peers</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {collaboration.peers.map((peer, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {peer.agent} ({peer.interaction.replace(/_/g, ' ')})
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryView({ memory }: { memory: IdeatedMemory }) {
  return (
    <div className="space-y-3">
      {memory.working && memory.working.length > 0 && (
        <div>
          <Label>Working Memory</Label>
          <div className="mt-2 flex flex-wrap gap-1">
            {memory.working.map((item, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {memory.persistent && memory.persistent.length > 0 && (
        <div>
          <Label>Persistent Stores</Label>
          <div className="mt-2 space-y-2">
            {memory.persistent.map((store, i) => (
              <div key={i} className="text-xs p-2 rounded bg-muted">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{store.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {store.type}
                  </Badge>
                </div>
                <div className="text-muted-foreground">{store.purpose}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {memory.learning && memory.learning.length > 0 && (
        <div>
          <Label>Learning</Label>
          <div className="mt-2 space-y-2">
            {memory.learning.map((l, i) => (
              <div key={i} className="text-xs p-2 rounded bg-muted">
                <Badge variant="secondary" className="text-[10px] mb-1">
                  {l.type.replace(/_/g, ' ')}
                </Badge>
                <div className="text-muted-foreground">{l.signal}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GuardrailCard({ guardrail }: { guardrail: IdeatedGuardrail }) {
  return (
    <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{guardrail.name}</span>
        {guardrail.enforcement && (
          <Badge
            variant={guardrail.enforcement === 'hard' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {guardrail.enforcement}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{guardrail.constraint}</p>
      {guardrail.rationale && (
        <p className="text-xs text-muted-foreground mt-1 italic">
          {guardrail.rationale}
        </p>
      )}
    </div>
  );
}

// ============ Export View ============

interface ExportViewProps {
  content: string;
  filename: string;
  language: 'json' | 'yaml' | 'markdown';
}

function ExportView({ content, filename, language }: ExportViewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const mimeTypes = {
      json: 'application/json',
      yaml: 'text/yaml',
      markdown: 'text/markdown',
    };
    const blob = new Blob([content], { type: mimeTypes[language] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {filename}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Code Display */}
      <ScrollArea className="flex-1 -mx-6 px-6">
        <pre className="p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words">
          <code>{content}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}

// ============ Utility Components ============

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{title}</span>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function Field({
  label,
  value,
  code,
}: {
  label: string;
  value: string;
  code?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      {code ? (
        <code className="block mt-0.5 text-sm bg-muted px-2 py-1 rounded">
          {value}
        </code>
      ) : (
        <div className="text-sm">{value}</div>
      )}
    </div>
  );
}

function Label({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </div>
  );
}
