/**
 * Convert an IdeatedAgent to an AgentStory for testing and export.
 *
 * This provides sensible defaults for required fields that may not
 * have been specified during ideation.
 */

import type { AgentStory } from '@/lib/schemas/story';
import type { IdeatedAgent } from './agent-context';

// Use a deep readonly type to accept Valtio snapshots
type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
    : T;

// Accept any readonly-compatible input
type IdeatedAgentInput = DeepReadonly<IdeatedAgent> | IdeatedAgent;

export function ideatedAgentToStory(ideatedAgent: DeepReadonly<IdeatedAgent> | IdeatedAgent): AgentStory {
  // Cast through unknown to handle Valtio readonly snapshots
  const result = {
    id: 'ideation-draft',
    version: '1.0',
    identifier: ideatedAgent.identifier || 'draft-agent',
    name: ideatedAgent.name || 'Untitled Agent',
    role: ideatedAgent.role || '',
    purpose: ideatedAgent.purpose || '',
    autonomyLevel: ideatedAgent.autonomyLevel || 'supervised',
    skills: ideatedAgent.skills?.map((skill, index) => ({
      id: `skill-${index}`,
      name: skill.name,
      description: skill.description || '',
      domain: skill.domain || 'General',
      acquired: skill.acquired || 'built_in',
      triggers: (skill.triggers || []).map(t => ({
        type: t.type,
        description: t.description,
        conditions: t.conditions,
        examples: t.examples,
      })),
      inputs: skill.inputs?.map(i => ({
        name: i.name,
        type: i.type,
        description: i.description,
        required: i.required ?? true,
      })),
      outputs: skill.outputs?.map(o => ({
        name: o.name,
        type: o.type,
        description: o.description,
      })),
      tools: skill.tools?.map(t => ({
        name: t.name,
        description: t.purpose,
        type: 'api' as const,
        permissions: t.permissions,
      })),
      behavior: skill.behavior ? {
        model: skill.behavior.model,
        steps: skill.behavior.steps,
      } : undefined,
      reasoning: skill.reasoning ? {
        strategy: skill.reasoning.strategy,
        decisionPoints: skill.reasoning.decisionPoints,
      } : undefined,
      acceptance: {
        successConditions: skill.acceptance?.successConditions || ['Task completed successfully'],
        qualityMetrics: skill.acceptance?.qualityMetrics,
        timeout: skill.acceptance?.timeout,
      },
      failureHandling: skill.failureHandling ? {
        modes: skill.failureHandling.modes,
        defaultFallback: skill.failureHandling.defaultFallback,
        notifyOnFailure: skill.failureHandling.notifyOnFailure ?? true,
      } : undefined,
      guardrails: skill.guardrails?.map(g => ({
        name: g.name,
        constraint: g.constraint,
        enforcement: g.enforcement || 'hard',
        onViolation: g.onViolation,
      })),
    })) || [],
    guardrails: ideatedAgent.guardrails?.map((g, index) => ({
      id: `guardrail-${index}`,
      name: g.name || `Guardrail ${index + 1}`,
      constraint: g.constraint || '',
      rationale: g.rationale || '',
      enforcement: g.enforcement === 'soft' ? 'soft' : 'strict',
    })) || [],
    humanInteraction: ideatedAgent.humanInteraction ? {
      mode: ideatedAgent.humanInteraction.mode,
      checkpoints: ideatedAgent.humanInteraction.checkpoints?.map(c => ({
        name: c.name,
        trigger: c.trigger,
        type: c.type,
        timeout: c.timeout,
      })),
      escalation: ideatedAgent.humanInteraction.escalation,
    } : undefined,
    memory: ideatedAgent.memory ? {
      working: ideatedAgent.memory.working,
      persistent: ideatedAgent.memory.persistent?.map(p => ({
        name: p.name,
        type: p.type,
        purpose: p.purpose,
        updateMode: p.updateMode,
      })),
      learning: ideatedAgent.memory.learning,
    } : undefined,
    collaboration: ideatedAgent.collaboration ? {
      role: ideatedAgent.collaboration.role,
      coordinates: ideatedAgent.collaboration.coordinates,
      reportsTo: ideatedAgent.collaboration.reportsTo,
      peers: ideatedAgent.collaboration.peers,
    } : undefined,
    tags: ideatedAgent.tags ? [...ideatedAgent.tags] : undefined,
    notes: ideatedAgent.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return result as unknown as AgentStory;
}
