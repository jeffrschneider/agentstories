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

interface AgentPanelProps {
  isExtracting?: boolean;
  onRefresh?: () => void;
}

export function AgentPanel({ isExtracting, onRefresh }: AgentPanelProps) {
  const ideation = useIdeation();
  const agent = ideation.ideatedAgent as IdeatedAgent;
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasContent =
    agent.name ||
    agent.role ||
    agent.purpose ||
    agent.skills.length > 0 ||
    (agent.guardrails && agent.guardrails.length > 0);

  const handleExport = () => {
    const json = JSON.stringify(agent, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.identifier || agent.name || 'agent'}-ideation.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate completeness score
  const completenessScore = React.useMemo(() => {
    let score = 0;
    let total = 0;

    // Identity (20 points)
    total += 20;
    if (agent.name) score += 5;
    if (agent.role) score += 5;
    if (agent.purpose) score += 5;
    if (agent.autonomyLevel) score += 5;

    // Skills (40 points)
    total += 40;
    if (agent.skills.length > 0) {
      score += 10;
      const skillScore = agent.skills.reduce((acc, skill) => {
        let s = 0;
        if (skill.triggers?.length) s += 2;
        if (skill.tools?.length) s += 2;
        if (skill.acceptance?.successConditions?.length) s += 2;
        if (skill.behavior) s += 2;
        return acc + s;
      }, 0);
      score += Math.min(30, skillScore);
    }

    // Configuration (40 points)
    total += 40;
    if (agent.humanInteraction?.mode) score += 10;
    if (agent.collaboration?.role) score += 10;
    if (agent.guardrails?.length) score += 10;
    if (agent.memory) score += 10;

    return Math.round((score / total) * 100);
  }, [agent]);

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
              completenessScore={completenessScore}
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
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
            <SheetDescription>
              {agent.purpose || 'Define your agent through conversation'}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <ExpandedView agent={agent} completenessScore={completenessScore} />
          </ScrollArea>
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
  completenessScore: number;
  onExpand: () => void;
}

function CompactView({ agent, completenessScore, onExpand }: CompactViewProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Completeness Indicator */}
      <div
        className="p-3 rounded-lg bg-background border cursor-pointer hover:border-primary/50 transition-colors"
        onClick={onExpand}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Completeness
          </span>
          <span className="text-sm font-semibold">{completenessScore}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${completenessScore}%` }}
          />
        </div>
      </div>

      {/* Identity Summary */}
      {(agent.name || agent.role) && (
        <div
          className="p-3 rounded-lg bg-background border cursor-pointer hover:border-primary/50 transition-colors"
          onClick={onExpand}
        >
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Identity
            </span>
          </div>
          {agent.name && (
            <div className="font-medium text-sm mb-1">{agent.name}</div>
          )}
          {agent.role && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {agent.role}
            </div>
          )}
          {agent.autonomyLevel && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {agent.autonomyLevel}
            </Badge>
          )}
        </div>
      )}

      {/* Skills Summary */}
      {agent.skills.length > 0 && (
        <div
          className="p-3 rounded-lg bg-background border cursor-pointer hover:border-primary/50 transition-colors"
          onClick={onExpand}
        >
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
            {agent.skills.slice(0, 3).map((skill, i) => (
              <div key={i} className="text-sm truncate">
                {skill.name}
              </div>
            ))}
            {agent.skills.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{agent.skills.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="flex flex-wrap gap-2">
        {agent.humanInteraction?.mode && (
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {agent.humanInteraction.mode.replace(/_/g, ' ')}
          </Badge>
        )}
        {agent.collaboration?.role && (
          <Badge variant="outline" className="text-xs">
            <GitBranch className="h-3 w-3 mr-1" />
            {agent.collaboration.role}
          </Badge>
        )}
        {agent.guardrails && agent.guardrails.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            {agent.guardrails.length} guardrails
          </Badge>
        )}
        {agent.memory && (
          <Badge variant="outline" className="text-xs">
            <Database className="h-3 w-3 mr-1" />
            memory
          </Badge>
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
  );
}

interface ExpandedViewProps {
  agent: IdeatedAgent;
  completenessScore: number;
}

function ExpandedView({ agent, completenessScore }: ExpandedViewProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Completeness */}
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Specification Completeness</span>
          <span className="text-lg font-bold">{completenessScore}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${completenessScore}%` }}
          />
        </div>
      </div>

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
              <SkillCard key={skill.id || index} skill={skill} index={index} />
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
}

function SkillCard({ skill, index }: SkillCardProps) {
  const [isOpen, setIsOpen] = React.useState(index === 0);

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
