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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useIdeation } from '@/stores';
import type { IdeatedAgent, IdeatedSkill } from '@/lib/ideation/agent-context';

interface AgentPanelProps {
  isExtracting?: boolean;
  onRefresh?: () => void;
}

export function AgentPanel({ isExtracting, onRefresh }: AgentPanelProps) {
  const ideation = useIdeation();
  const agent = ideation.ideatedAgent as IdeatedAgent;

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

  return (
    <div className="flex h-full flex-col border-l bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Agent Specification</h3>
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
              onClick={handleExport}
              title="Export as JSON"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {!hasContent ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <Bot className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your agent specification will appear here as you discuss it with
              the AI assistant.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {/* Identity Section */}
            {(agent.name || agent.role || agent.purpose) && (
              <CollapsibleSection
                title="Identity"
                icon={Bot}
                defaultOpen
              >
                <div className="space-y-2 text-sm">
                  {agent.name && (
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  )}
                  {agent.identifier && (
                    <div>
                      <span className="text-muted-foreground">ID: </span>
                      <code className="rounded bg-muted px-1 text-xs">
                        {agent.identifier}
                      </code>
                    </div>
                  )}
                  {agent.role && (
                    <div>
                      <span className="text-muted-foreground">Role: </span>
                      <span>{agent.role}</span>
                    </div>
                  )}
                  {agent.purpose && (
                    <div>
                      <span className="text-muted-foreground">Purpose: </span>
                      <span>{agent.purpose}</span>
                    </div>
                  )}
                  {agent.autonomyLevel && (
                    <div>
                      <span className="text-muted-foreground">Autonomy: </span>
                      <Badge variant="secondary" className="text-xs">
                        {agent.autonomyLevel}
                      </Badge>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* Skills Section */}
            {agent.skills.length > 0 && (
              <CollapsibleSection
                title={`Skills (${agent.skills.length})`}
                icon={Zap}
                defaultOpen
              >
                <div className="space-y-3">
                  {agent.skills.map((skill: IdeatedSkill, index: number) => (
                    <SkillCard key={skill.name || index} skill={skill} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Human Interaction Section */}
            {agent.humanInteraction && (
              <CollapsibleSection title="Human Interaction" icon={Users}>
                <div className="space-y-2 text-sm">
                  {agent.humanInteraction.mode && (
                    <div>
                      <span className="text-muted-foreground">Mode: </span>
                      <Badge variant="outline" className="text-xs">
                        {agent.humanInteraction.mode.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  )}
                  {agent.humanInteraction.checkpoints &&
                    agent.humanInteraction.checkpoints.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          Checkpoints:
                        </span>
                        <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                          {agent.humanInteraction.checkpoints.map(
                            (cp: string, i: number) => (
                              <li key={i}>{cp}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </CollapsibleSection>
            )}

            {/* Collaboration Section */}
            {agent.collaboration && (
              <CollapsibleSection title="Collaboration" icon={Users}>
                <div className="space-y-2 text-sm">
                  {agent.collaboration.role && (
                    <div>
                      <span className="text-muted-foreground">Role: </span>
                      <Badge variant="outline" className="text-xs">
                        {agent.collaboration.role}
                      </Badge>
                    </div>
                  )}
                  {agent.collaboration.reportsTo && (
                    <div>
                      <span className="text-muted-foreground">
                        Reports to:{' '}
                      </span>
                      <span>{agent.collaboration.reportsTo}</span>
                    </div>
                  )}
                  {agent.collaboration.coordinates &&
                    agent.collaboration.coordinates.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          Coordinates:
                        </span>
                        <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                          {agent.collaboration.coordinates.map(
                            (coord: string, i: number) => (
                              <li key={i}>{coord}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </CollapsibleSection>
            )}

            {/* Guardrails Section */}
            {agent.guardrails && agent.guardrails.length > 0 && (
              <CollapsibleSection
                title={`Guardrails (${agent.guardrails.length})`}
                icon={Shield}
              >
                <div className="space-y-2">
                  {agent.guardrails.map((guardrail, index) => (
                    <div
                      key={guardrail.name || index}
                      className="rounded-md border bg-background p-2 text-sm"
                    >
                      <div className="font-medium">{guardrail.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {guardrail.constraint}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Notes Section */}
            {agent.notes && (
              <CollapsibleSection title="Notes" icon={Bot}>
                <p className="text-sm text-muted-foreground">{agent.notes}</p>
              </CollapsibleSection>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{title}</span>
      </button>
      {isOpen && (
        <div className="mt-2 pl-6">{children}</div>
      )}
    </div>
  );
}

interface SkillCardProps {
  skill: IdeatedSkill;
}

function SkillCard({ skill }: SkillCardProps) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium text-sm">{skill.name}</span>
        {skill.acquired && (
          <Badge variant="secondary" className="text-xs">
            {skill.acquired.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>
      {skill.description && (
        <p className="mb-2 text-xs text-muted-foreground">{skill.description}</p>
      )}
      {skill.domain && (
        <div className="mb-1 text-xs">
          <span className="text-muted-foreground">Domain: </span>
          <span>{skill.domain}</span>
        </div>
      )}
      {skill.triggers && skill.triggers.length > 0 && (
        <div className="mb-1">
          <span className="text-xs text-muted-foreground">Triggers: </span>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {skill.triggers.map((trigger: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">
                {trigger}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {skill.tools && skill.tools.length > 0 && (
        <div className="mb-1">
          <span className="text-xs text-muted-foreground">Tools: </span>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {skill.tools.map((tool: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {skill.acceptance && skill.acceptance.length > 0 && (
        <div>
          <span className="text-xs text-muted-foreground">
            Success criteria:
          </span>
          <ul className="mt-0.5 list-inside list-disc text-xs text-muted-foreground">
            {skill.acceptance.map((criteria: string, i: number) => (
              <li key={i}>{criteria}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
