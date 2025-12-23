// ============================================
// Responsibility Presets
// ============================================

export const RESPONSIBILITY_PRESETS = {
  'human-only': {
    label: 'Human Only',
    description: 'Human handles all phases',
    pattern: 'HHHH',
    phases: {
      manage: 'human' as const,
      define: 'human' as const,
      perform: 'human' as const,
      review: 'human' as const
    }
  },
  'agent-only': {
    label: 'Agent Only',
    description: 'Agent handles all phases autonomously',
    pattern: 'AAAA',
    phases: {
      manage: 'agent' as const,
      define: 'agent' as const,
      perform: 'agent' as const,
      review: 'agent' as const
    }
  },
  'supervised-execution': {
    label: 'Supervised Execution',
    description: 'Human manages and reviews; agent defines and performs',
    pattern: 'HAAH',
    phases: {
      manage: 'human' as const,
      define: 'agent' as const,
      perform: 'agent' as const,
      review: 'human' as const
    }
  },
  'directed-execution': {
    label: 'Directed Execution',
    description: 'Human directs; agent performs and self-reviews',
    pattern: 'HHAA',
    phases: {
      manage: 'human' as const,
      define: 'human' as const,
      perform: 'agent' as const,
      review: 'agent' as const
    }
  },
  'human-controlled': {
    label: 'Human Controlled',
    description: 'Human controls all except execution',
    pattern: 'HHAH',
    phases: {
      manage: 'human' as const,
      define: 'human' as const,
      perform: 'agent' as const,
      review: 'human' as const
    }
  },
  'agent-directed': {
    label: 'Agent Directed',
    description: 'Agent directs; human performs and reviews',
    pattern: 'AAHH',
    phases: {
      manage: 'agent' as const,
      define: 'agent' as const,
      perform: 'human' as const,
      review: 'human' as const
    }
  }
} as const;

export type ResponsibilityPreset = keyof typeof RESPONSIBILITY_PRESETS;

// ============================================
// Metadata for UI
// ============================================

export const RESPONSIBILITY_PHASE_METADATA = {
  manage: {
    label: 'Manage',
    description: 'Sets goals, priorities, constraints, and deadlines',
    icon: 'target',
    color: 'blue',
    examples: [
      'Prioritize this task',
      'Set deadline for completion',
      'Define resource constraints'
    ]
  },
  define: {
    label: 'Define',
    description: 'Specifies what needs to be done and acceptance criteria',
    icon: 'file-text',
    color: 'purple',
    examples: [
      'Write requirements',
      'Define success criteria',
      'Specify expected outputs'
    ]
  },
  perform: {
    label: 'Perform',
    description: 'Executes the actual work',
    icon: 'play',
    color: 'green',
    examples: [
      'Process the data',
      'Write the code',
      'Generate the report'
    ]
  },
  review: {
    label: 'Review',
    description: 'Validates output, provides feedback, approves or rejects',
    icon: 'check-circle',
    color: 'orange',
    examples: [
      'Check for accuracy',
      'Approve the result',
      'Request revisions'
    ]
  }
} as const;

export const PHASE_OWNER_METADATA = {
  human: {
    label: 'Human',
    description: 'Human is responsible for this phase',
    icon: 'user',
    color: 'blue'
  },
  agent: {
    label: 'Agent',
    description: 'Agent is responsible for this phase',
    icon: 'bot',
    color: 'purple'
  }
} as const;

export const INTEGRATION_STATUS_METADATA = {
  not_started: {
    label: 'Not Started',
    description: 'No task responsibilities defined yet',
    color: 'gray',
    icon: 'circle'
  },
  planning: {
    label: 'Planning',
    description: 'Defining task responsibilities',
    color: 'blue',
    icon: 'edit'
  },
  skills_pending: {
    label: 'Skills Pending',
    description: 'Waiting for agent skills to be defined',
    color: 'yellow',
    icon: 'clock'
  },
  ready: {
    label: 'Ready',
    description: 'All skills defined, ready for use',
    color: 'green',
    icon: 'check-circle'
  },
  active: {
    label: 'Active',
    description: 'Currently in production use',
    color: 'emerald',
    icon: 'play-circle'
  },
  paused: {
    label: 'Paused',
    description: 'Temporarily paused',
    color: 'orange',
    icon: 'pause-circle'
  }
} as const;

export const CAPABILITY_REQUIREMENT_STATUS_METADATA = {
  pending: {
    label: 'Pending',
    description: 'Waiting to be processed',
    color: 'gray',
    icon: 'clock'
  },
  generating: {
    label: 'Generating',
    description: 'AI is generating the capability',
    color: 'blue',
    icon: 'loader'
  },
  ready: {
    label: 'Ready for Review',
    description: 'Draft capability ready for review',
    color: 'yellow',
    icon: 'eye'
  },
  applied: {
    label: 'Applied',
    description: 'Capability added to Agent Story',
    color: 'green',
    icon: 'check'
  },
  rejected: {
    label: 'Rejected',
    description: 'Requirement was dismissed',
    color: 'red',
    icon: 'x'
  }
} as const;
