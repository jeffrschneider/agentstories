/**
 * Skill Suggestion Templates
 *
 * Pre-defined skill templates organized by domain and use case.
 * These templates can be suggested based on the agent's role/purpose
 * or selected manually by users.
 */

import { Skill } from '@/lib/schemas/skill';

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  domain: string;
  keywords: string[]; // Keywords that trigger this suggestion
  category: SkillCategory;
  skill: Omit<Skill, 'id'>;
}

export type SkillCategory =
  | 'customer-service'
  | 'data-processing'
  | 'content-generation'
  | 'code-development'
  | 'workflow-automation'
  | 'research-analysis'
  | 'communication'
  | 'monitoring';

export const SKILL_CATEGORY_METADATA: Record<SkillCategory, { label: string; description: string; icon: string }> = {
  'customer-service': {
    label: 'Customer Service',
    description: 'Skills for handling customer interactions',
    icon: 'Headphones',
  },
  'data-processing': {
    label: 'Data Processing',
    description: 'Skills for processing and transforming data',
    icon: 'Database',
  },
  'content-generation': {
    label: 'Content Generation',
    description: 'Skills for creating content',
    icon: 'FileText',
  },
  'code-development': {
    label: 'Code Development',
    description: 'Skills for writing and reviewing code',
    icon: 'Code',
  },
  'workflow-automation': {
    label: 'Workflow Automation',
    description: 'Skills for automating business processes',
    icon: 'Workflow',
  },
  'research-analysis': {
    label: 'Research & Analysis',
    description: 'Skills for research and data analysis',
    icon: 'Search',
  },
  'communication': {
    label: 'Communication',
    description: 'Skills for messaging and notifications',
    icon: 'MessageSquare',
  },
  'monitoring': {
    label: 'Monitoring',
    description: 'Skills for observing and alerting',
    icon: 'Activity',
  },
};

/**
 * Pre-defined skill templates
 */
export const SKILL_TEMPLATES: SkillTemplate[] = [
  // Customer Service Skills
  {
    id: 'ticket-triage',
    name: 'Ticket Triage',
    description: 'Classify and prioritize incoming support tickets based on urgency and category',
    domain: 'Customer Service',
    keywords: ['support', 'ticket', 'triage', 'classify', 'helpdesk', 'customer', 'priority'],
    category: 'customer-service',
    skill: {
      name: 'Ticket Triage',
      description: 'Classify and prioritize incoming support tickets based on urgency, category, and sentiment',
      domain: 'Customer Service',
      acquired: 'built_in',
      triggers: [
        {
          type: 'message',
          description: 'New support ticket received',
          conditions: ['Ticket is unassigned', 'No priority set'],
        },
      ],
      tools: [
        {
          name: 'Ticket System API',
          purpose: 'Read and update ticket metadata',
          permissions: ['read', 'write'],
          required: true,
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Extract key information from ticket content',
          'Analyze sentiment and urgency indicators',
          'Match against category definitions',
          'Assign priority based on rules',
          'Update ticket with classification',
        ],
      },
      acceptance: {
        successConditions: [
          'Ticket is assigned a category',
          'Priority level is set',
          'Classification confidence is recorded',
        ],
        qualityMetrics: [
          { name: 'Classification Accuracy', target: '>= 95%' },
          { name: 'Processing Time', target: '< 5 seconds' },
        ],
      },
    },
  },
  {
    id: 'customer-response',
    name: 'Customer Response',
    description: 'Generate contextual responses to customer inquiries',
    domain: 'Customer Service',
    keywords: ['response', 'reply', 'customer', 'inquiry', 'answer', 'support'],
    category: 'customer-service',
    skill: {
      name: 'Customer Response Generation',
      description: 'Generate helpful, contextual responses to customer inquiries using knowledge base and conversation history',
      domain: 'Customer Service',
      acquired: 'built_in',
      triggers: [
        {
          type: 'message',
          description: 'Customer inquiry requires response',
        },
      ],
      tools: [
        {
          name: 'Knowledge Base',
          purpose: 'Search for relevant documentation and FAQs',
          permissions: ['read'],
          required: true,
        },
        {
          name: 'Conversation History',
          purpose: 'Access previous interactions with customer',
          permissions: ['read'],
          required: false,
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Parse and understand customer question',
          'Search knowledge base for relevant information',
          'Review conversation history for context',
          'Generate response draft',
          'Apply brand voice and tone guidelines',
          'Validate response quality',
        ],
      },
      reasoning: {
        strategy: 'llm_guided',
        confidence: {
          threshold: 0.8,
          fallbackAction: 'Escalate to human agent',
        },
      },
      acceptance: {
        successConditions: [
          'Response addresses customer question',
          'Response follows brand guidelines',
          'Response is factually accurate',
        ],
      },
      guardrails: [
        {
          name: 'No Personal Promises',
          constraint: 'Never make commitments outside established policies',
          enforcement: 'hard',
        },
      ],
    },
  },

  // Data Processing Skills
  {
    id: 'data-extraction',
    name: 'Data Extraction',
    description: 'Extract structured data from documents and files',
    domain: 'Data Processing',
    keywords: ['extract', 'data', 'document', 'parse', 'pdf', 'structured'],
    category: 'data-processing',
    skill: {
      name: 'Data Extraction',
      description: 'Extract structured data from various document formats including PDFs, images, and text files',
      domain: 'Data Processing',
      acquired: 'built_in',
      triggers: [
        {
          type: 'resource_change',
          description: 'New document uploaded for processing',
        },
        {
          type: 'manual',
          description: 'User requests data extraction',
        },
      ],
      inputs: [
        {
          name: 'document',
          type: 'file',
          description: 'The document to extract data from',
          required: true,
        },
        {
          name: 'schema',
          type: 'object',
          description: 'Expected data schema for extraction',
          required: false,
        },
      ],
      outputs: [
        {
          name: 'extractedData',
          type: 'object',
          description: 'Structured data extracted from document',
        },
        {
          name: 'confidence',
          type: 'number',
          description: 'Extraction confidence score',
        },
      ],
      tools: [
        {
          name: 'Document Parser',
          purpose: 'Parse various document formats',
          permissions: ['read'],
          required: true,
        },
        {
          name: 'OCR Service',
          purpose: 'Extract text from images',
          permissions: ['execute'],
          required: false,
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Identify document type and format',
          'Apply appropriate parsing strategy',
          'Extract raw text and structure',
          'Map to target schema',
          'Validate extracted data',
          'Return structured output',
        ],
      },
      acceptance: {
        successConditions: [
          'All required fields extracted',
          'Data matches expected format',
          'Confidence above threshold',
        ],
      },
    },
  },
  {
    id: 'data-validation',
    name: 'Data Validation',
    description: 'Validate data against rules and schemas',
    domain: 'Data Processing',
    keywords: ['validate', 'check', 'verify', 'data', 'quality', 'schema'],
    category: 'data-processing',
    skill: {
      name: 'Data Validation',
      description: 'Validate incoming data against defined schemas, business rules, and quality standards',
      domain: 'Data Processing',
      acquired: 'built_in',
      triggers: [
        {
          type: 'cascade',
          description: 'Data received from upstream process',
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Parse incoming data',
          'Validate against schema',
          'Check business rules',
          'Identify anomalies',
          'Generate validation report',
        ],
      },
      acceptance: {
        successConditions: [
          'All validation rules executed',
          'Clear pass/fail determination',
          'Detailed error report for failures',
        ],
      },
      failureHandling: {
        modes: [
          {
            condition: 'Schema validation fails',
            recovery: 'Return detailed error with field locations',
            escalate: false,
          },
          {
            condition: 'Business rule violation',
            recovery: 'Flag for review, continue processing',
            escalate: true,
          },
        ],
        defaultFallback: 'Quarantine data for manual review',
        notifyOnFailure: true,
      },
    },
  },

  // Code Development Skills
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Review code changes for bugs, security issues, and best practices',
    domain: 'Code Development',
    keywords: ['code', 'review', 'pull request', 'pr', 'bugs', 'security'],
    category: 'code-development',
    skill: {
      name: 'Code Review',
      description: 'Analyze code changes for potential bugs, security vulnerabilities, performance issues, and adherence to coding standards',
      domain: 'Code Development',
      acquired: 'built_in',
      triggers: [
        {
          type: 'resource_change',
          description: 'New pull request opened or updated',
        },
        {
          type: 'manual',
          description: 'User requests code review',
        },
      ],
      inputs: [
        {
          name: 'diff',
          type: 'string',
          description: 'Code diff to review',
          required: true,
        },
        {
          name: 'context',
          type: 'object',
          description: 'Repository context and related files',
          required: false,
        },
      ],
      tools: [
        {
          name: 'File Reader',
          purpose: 'Read related source files for context',
          permissions: ['read'],
          required: true,
        },
        {
          name: 'Git API',
          purpose: 'Access repository history and metadata',
          permissions: ['read'],
          required: false,
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Parse and understand the diff',
          'Gather context from related files',
          'Check for potential bugs and logic errors',
          'Scan for security vulnerabilities',
          'Evaluate adherence to coding standards',
          'Assess performance implications',
          'Generate review feedback',
        ],
      },
      acceptance: {
        successConditions: [
          'All changed files reviewed',
          'Feedback provided in standard format',
          'Critical issues clearly flagged',
        ],
      },
      guardrails: [
        {
          name: 'Constructive Feedback',
          constraint: 'Always provide actionable, respectful feedback',
          enforcement: 'hard',
        },
      ],
    },
  },
  {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'Generate code based on specifications or natural language descriptions',
    domain: 'Code Development',
    keywords: ['code', 'generate', 'write', 'implement', 'create', 'function'],
    category: 'code-development',
    skill: {
      name: 'Code Generation',
      description: 'Generate well-structured, tested code based on specifications, requirements, or natural language descriptions',
      domain: 'Code Development',
      acquired: 'built_in',
      triggers: [
        {
          type: 'message',
          description: 'User requests code implementation',
        },
      ],
      tools: [
        {
          name: 'File System',
          purpose: 'Read existing code and write new files',
          permissions: ['read', 'write'],
          required: true,
        },
        {
          name: 'Linter',
          purpose: 'Validate generated code',
          permissions: ['execute'],
          required: false,
        },
      ],
      behavior: {
        model: 'iterative',
        body: [
          'Analyze requirements',
          'Design solution approach',
          'Generate code',
          'Run linter and tests',
          'Refine based on errors',
        ],
        terminationCondition: 'Code passes all validations or max iterations reached',
        maxIterations: 3,
      },
      acceptance: {
        successConditions: [
          'Code compiles/parses without errors',
          'Code follows project conventions',
          'Tests pass if provided',
        ],
      },
    },
  },

  // Content Generation Skills
  {
    id: 'content-summarization',
    name: 'Content Summarization',
    description: 'Create concise summaries of long-form content',
    domain: 'Content Generation',
    keywords: ['summary', 'summarize', 'condense', 'tldr', 'brief'],
    category: 'content-generation',
    skill: {
      name: 'Content Summarization',
      description: 'Create concise, accurate summaries of documents, articles, or conversations while preserving key information',
      domain: 'Content Generation',
      acquired: 'built_in',
      triggers: [
        {
          type: 'manual',
          description: 'User requests content summary',
        },
      ],
      inputs: [
        {
          name: 'content',
          type: 'string',
          description: 'Content to summarize',
          required: true,
        },
        {
          name: 'maxLength',
          type: 'number',
          description: 'Maximum summary length',
          required: false,
        },
      ],
      outputs: [
        {
          name: 'summary',
          type: 'string',
          description: 'Concise summary of the content',
        },
        {
          name: 'keyPoints',
          type: 'array',
          description: 'List of key points extracted',
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Analyze content structure',
          'Identify main themes and key points',
          'Extract essential information',
          'Generate coherent summary',
          'Verify accuracy against source',
        ],
      },
      acceptance: {
        successConditions: [
          'Summary captures main points',
          'Summary is within length limits',
          'No hallucinated information',
        ],
      },
    },
  },
  {
    id: 'report-generation',
    name: 'Report Generation',
    description: 'Generate structured reports from data and findings',
    domain: 'Content Generation',
    keywords: ['report', 'generate', 'document', 'findings', 'analysis'],
    category: 'content-generation',
    skill: {
      name: 'Report Generation',
      description: 'Generate structured, professional reports from data, analysis results, or collected findings',
      domain: 'Content Generation',
      acquired: 'built_in',
      triggers: [
        {
          type: 'cascade',
          description: 'Analysis or data collection complete',
        },
        {
          type: 'schedule',
          description: 'Scheduled report generation',
        },
      ],
      tools: [
        {
          name: 'Template Engine',
          purpose: 'Apply report templates',
          permissions: ['read'],
          required: true,
        },
        {
          name: 'Data Store',
          purpose: 'Retrieve data for report',
          permissions: ['read'],
          required: true,
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Gather data from sources',
          'Apply analytical transformations',
          'Select appropriate template',
          'Generate narrative sections',
          'Create visualizations',
          'Compile final document',
        ],
      },
      acceptance: {
        successConditions: [
          'All required sections present',
          'Data accurately represented',
          'Report follows template structure',
        ],
      },
    },
  },

  // Workflow Automation Skills
  {
    id: 'task-routing',
    name: 'Task Routing',
    description: 'Route tasks to appropriate handlers based on rules',
    domain: 'Workflow Automation',
    keywords: ['route', 'assign', 'distribute', 'dispatch', 'queue'],
    category: 'workflow-automation',
    skill: {
      name: 'Task Routing',
      description: 'Intelligently route incoming tasks to the most appropriate handler, queue, or team based on rules and availability',
      domain: 'Workflow Management',
      acquired: 'built_in',
      triggers: [
        {
          type: 'cascade',
          description: 'Task classified and ready for routing',
        },
      ],
      tools: [
        {
          name: 'Queue Manager',
          purpose: 'Check queue status and capacity',
          permissions: ['read', 'write'],
          required: true,
        },
        {
          name: 'Availability Service',
          purpose: 'Check handler availability',
          permissions: ['read'],
          required: false,
        },
      ],
      behavior: {
        model: 'workflow',
        stages: [
          {
            name: 'Evaluate Task',
            purpose: 'Analyze task requirements',
            transitions: [{ to: 'Find Handlers', when: 'Requirements understood' }],
          },
          {
            name: 'Find Handlers',
            purpose: 'Identify capable handlers',
            transitions: [
              { to: 'Select Best', when: 'Multiple handlers available' },
              { to: 'Fallback', when: 'No handlers available' },
            ],
          },
          {
            name: 'Select Best',
            purpose: 'Choose optimal handler',
            transitions: [{ to: 'Assign', when: 'Handler selected' }],
          },
          {
            name: 'Assign',
            purpose: 'Route task to handler',
          },
          {
            name: 'Fallback',
            purpose: 'Handle no-handler scenario',
          },
        ],
        entryStage: 'Evaluate Task',
      },
      acceptance: {
        successConditions: [
          'Task assigned to handler',
          'Handler has capacity',
          'Routing logged for audit',
        ],
      },
    },
  },
  {
    id: 'approval-workflow',
    name: 'Approval Workflow',
    description: 'Manage multi-step approval processes',
    domain: 'Workflow Automation',
    keywords: ['approval', 'approve', 'workflow', 'review', 'sign-off'],
    category: 'workflow-automation',
    skill: {
      name: 'Approval Workflow',
      description: 'Manage multi-step approval processes with proper routing, reminders, and escalation',
      domain: 'Workflow Management',
      acquired: 'built_in',
      triggers: [
        {
          type: 'message',
          description: 'Approval request submitted',
        },
        {
          type: 'schedule',
          description: 'Check for pending approvals',
        },
      ],
      behavior: {
        model: 'workflow',
        stages: [
          {
            name: 'Initialize',
            purpose: 'Set up approval chain',
            transitions: [{ to: 'Route to Approver', when: 'Chain established' }],
          },
          {
            name: 'Route to Approver',
            purpose: 'Send to current approver',
            transitions: [
              { to: 'Approved', when: 'Approver accepts' },
              { to: 'Rejected', when: 'Approver rejects' },
              { to: 'Escalate', when: 'Response timeout' },
            ],
          },
          {
            name: 'Escalate',
            purpose: 'Handle timeout or escalation',
            transitions: [{ to: 'Route to Approver', when: 'New approver assigned' }],
          },
          {
            name: 'Approved',
            purpose: 'Process approved request',
          },
          {
            name: 'Rejected',
            purpose: 'Handle rejection',
          },
        ],
        entryStage: 'Initialize',
      },
      acceptance: {
        successConditions: [
          'Approval decision recorded',
          'All stakeholders notified',
          'Audit trail complete',
        ],
      },
    },
  },

  // Research & Analysis Skills
  {
    id: 'web-research',
    name: 'Web Research',
    description: 'Research topics using web search and content analysis',
    domain: 'Research & Analysis',
    keywords: ['research', 'search', 'web', 'find', 'investigate', 'look up'],
    category: 'research-analysis',
    skill: {
      name: 'Web Research',
      description: 'Conduct comprehensive web research on topics, synthesizing information from multiple sources',
      domain: 'Research',
      acquired: 'built_in',
      triggers: [
        {
          type: 'message',
          description: 'User requests research on a topic',
        },
      ],
      tools: [
        {
          name: 'Web Search',
          purpose: 'Search the web for relevant content',
          permissions: ['read'],
          required: true,
        },
        {
          name: 'Web Fetch',
          purpose: 'Retrieve and parse web pages',
          permissions: ['read'],
          required: true,
        },
      ],
      behavior: {
        model: 'iterative',
        body: [
          'Formulate search queries',
          'Execute searches',
          'Analyze results for relevance',
          'Extract key information',
          'Identify gaps in coverage',
        ],
        terminationCondition: 'Sufficient coverage achieved or max sources analyzed',
        maxIterations: 5,
      },
      reasoning: {
        strategy: 'llm_guided',
        decisionPoints: [
          {
            name: 'Source Credibility',
            inputs: ['source_domain', 'content_quality'],
            approach: 'Evaluate trustworthiness of sources',
            outcomes: ['include', 'exclude', 'verify'],
          },
        ],
      },
      acceptance: {
        successConditions: [
          'Topic adequately covered',
          'Multiple credible sources used',
          'Findings synthesized coherently',
        ],
      },
      guardrails: [
        {
          name: 'Source Attribution',
          constraint: 'Always cite sources for claims',
          enforcement: 'hard',
        },
      ],
    },
  },
  {
    id: 'sentiment-analysis',
    name: 'Sentiment Analysis',
    description: 'Analyze text for sentiment and emotional tone',
    domain: 'Research & Analysis',
    keywords: ['sentiment', 'emotion', 'tone', 'analyze', 'feeling'],
    category: 'research-analysis',
    skill: {
      name: 'Sentiment Analysis',
      description: 'Analyze text content for sentiment, emotional tone, and attitude indicators',
      domain: 'Natural Language Understanding',
      acquired: 'built_in',
      triggers: [
        {
          type: 'cascade',
          description: 'Content received for sentiment analysis',
        },
      ],
      inputs: [
        {
          name: 'text',
          type: 'string',
          description: 'Text to analyze',
          required: true,
        },
      ],
      outputs: [
        {
          name: 'sentiment',
          type: 'string',
          description: 'Overall sentiment (positive/negative/neutral)',
        },
        {
          name: 'confidence',
          type: 'number',
          description: 'Confidence score',
        },
        {
          name: 'emotions',
          type: 'array',
          description: 'Detected emotions with scores',
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Preprocess text',
          'Apply sentiment model',
          'Detect emotional indicators',
          'Calculate confidence scores',
          'Return analysis results',
        ],
      },
      acceptance: {
        successConditions: [
          'Sentiment classification returned',
          'Confidence score calculated',
        ],
        qualityMetrics: [
          { name: 'Processing Time', target: '< 1 second' },
        ],
      },
    },
  },

  // Communication Skills
  {
    id: 'notification-dispatch',
    name: 'Notification Dispatch',
    description: 'Send notifications across multiple channels',
    domain: 'Communication',
    keywords: ['notify', 'alert', 'send', 'message', 'email', 'slack'],
    category: 'communication',
    skill: {
      name: 'Notification Dispatch',
      description: 'Send notifications to users across multiple channels (email, Slack, SMS) based on preferences and urgency',
      domain: 'Communication',
      acquired: 'built_in',
      triggers: [
        {
          type: 'cascade',
          description: 'Notification request from another skill or process',
        },
      ],
      inputs: [
        {
          name: 'message',
          type: 'object',
          description: 'Notification content and metadata',
          required: true,
        },
        {
          name: 'recipients',
          type: 'array',
          description: 'List of notification recipients',
          required: true,
        },
      ],
      tools: [
        {
          name: 'Email Service',
          purpose: 'Send email notifications',
          permissions: ['execute'],
          required: false,
        },
        {
          name: 'Slack API',
          purpose: 'Send Slack messages',
          permissions: ['execute'],
          required: false,
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Validate message content',
          'Resolve recipient preferences',
          'Select appropriate channels',
          'Format message per channel',
          'Dispatch notifications',
          'Log delivery status',
        ],
      },
      acceptance: {
        successConditions: [
          'All recipients notified via at least one channel',
          'Delivery status logged',
        ],
      },
      failureHandling: {
        modes: [
          {
            condition: 'Channel unavailable',
            recovery: 'Try fallback channel',
            escalate: false,
          },
          {
            condition: 'All channels fail',
            recovery: 'Queue for retry',
            escalate: true,
          },
        ],
        defaultFallback: 'Log failure and alert admin',
        notifyOnFailure: true,
      },
    },
  },

  // Monitoring Skills
  {
    id: 'system-health-check',
    name: 'System Health Check',
    description: 'Monitor system health and report issues',
    domain: 'Monitoring',
    keywords: ['health', 'monitor', 'check', 'status', 'uptime', 'availability'],
    category: 'monitoring',
    skill: {
      name: 'System Health Check',
      description: 'Perform regular health checks on systems and services, alerting on issues',
      domain: 'Monitoring',
      acquired: 'built_in',
      triggers: [
        {
          type: 'schedule',
          description: 'Regular health check interval',
        },
        {
          type: 'manual',
          description: 'On-demand health check request',
        },
      ],
      tools: [
        {
          name: 'Health Endpoint API',
          purpose: 'Query service health endpoints',
          permissions: ['read'],
          required: true,
        },
        {
          name: 'Metrics Store',
          purpose: 'Store and compare metrics',
          permissions: ['read', 'write'],
          required: true,
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Enumerate services to check',
          'Query health endpoints',
          'Collect performance metrics',
          'Compare against baselines',
          'Identify anomalies',
          'Generate health report',
          'Alert on issues if needed',
        ],
      },
      acceptance: {
        successConditions: [
          'All services checked',
          'Health status recorded',
          'Alerts sent for critical issues',
        ],
      },
    },
  },
  {
    id: 'log-analysis',
    name: 'Log Analysis',
    description: 'Analyze logs for patterns, errors, and anomalies',
    domain: 'Monitoring',
    keywords: ['log', 'logs', 'analyze', 'error', 'debug', 'trace'],
    category: 'monitoring',
    skill: {
      name: 'Log Analysis',
      description: 'Analyze application and system logs to identify errors, patterns, and potential issues',
      domain: 'Monitoring',
      acquired: 'built_in',
      triggers: [
        {
          type: 'condition',
          description: 'Error rate exceeds threshold',
        },
        {
          type: 'manual',
          description: 'User requests log investigation',
        },
      ],
      tools: [
        {
          name: 'Log Aggregator',
          purpose: 'Query centralized logs',
          permissions: ['read'],
          required: true,
        },
      ],
      behavior: {
        model: 'sequential',
        steps: [
          'Define query parameters',
          'Retrieve relevant logs',
          'Parse and structure entries',
          'Identify patterns and anomalies',
          'Correlate related events',
          'Generate analysis summary',
        ],
      },
      reasoning: {
        strategy: 'hybrid',
        decisionPoints: [
          {
            name: 'Anomaly Detection',
            inputs: ['log_patterns', 'baseline_behavior'],
            approach: 'Compare against known patterns and thresholds',
            outcomes: ['normal', 'warning', 'critical'],
          },
        ],
      },
      acceptance: {
        successConditions: [
          'Logs analyzed within time window',
          'Patterns identified and documented',
          'Actionable insights provided',
        ],
      },
    },
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: SkillCategory): SkillTemplate[] {
  return SKILL_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all unique categories from templates
 */
export function getCategories(): SkillCategory[] {
  return [...new Set(SKILL_TEMPLATES.map((t) => t.category))];
}

/**
 * Find template by ID
 */
export function getTemplateById(id: string): SkillTemplate | undefined {
  return SKILL_TEMPLATES.find((t) => t.id === id);
}
