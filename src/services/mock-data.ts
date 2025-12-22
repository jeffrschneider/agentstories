import type { AgentStory, Template, TemplateCategory } from '@/lib/schemas';
import { loadFromStorage, saveToStorage } from './storage';

// Simulated delay for realistic async behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate UUID
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Well-known Agent Story IDs for HAP linking
export const AGENT_STORY_IDS = {
  customerSupport: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
  codeReview: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
  salesAssistant: 'c3d4e5f6-a7b8-4901-cdef-012345678901',
} as const;

// Mock stories data - skill-based architecture
const mockStories: AgentStory[] = [
  // Customer Support Agent
  {
    id: AGENT_STORY_IDS.customerSupport,
    version: '1.0',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
    identifier: 'customer-support-agent',
    name: 'Customer Support Agent',
    role: 'A customer support specialist that handles incoming support tickets, resolves common issues, and escalates complex cases to human agents',
    purpose: 'Provide fast, accurate customer support while maintaining high satisfaction scores and reducing response times',
    autonomyLevel: 'supervised',
    tags: ['customer-service', 'support', 'tickets', 'chat'],

    skills: [
      {
        id: uuid(),
        name: 'Ticket Triage',
        description: 'Analyze incoming tickets, extract key information, categorize by type and urgency, and route to appropriate queues',
        domain: 'Customer Service',
        acquired: 'built_in',
        triggers: [
          {
            type: 'message',
            description: 'New support ticket created in helpdesk system',
            conditions: ['Ticket status is NEW', 'No agent assigned'],
            examples: ['Customer submits form on help.company.com', 'Email received at support@company.com']
          }
        ],
        tools: [
          {
            name: 'Helpdesk API',
            purpose: 'Read ticket details and update status/assignments',
            permissions: ['read', 'write'],
            required: true
          },
          {
            name: 'Customer CRM',
            purpose: 'Look up customer history and account tier',
            permissions: ['read'],
            required: false
          },
          {
            name: 'Sentiment Analysis API',
            purpose: 'Detect customer sentiment and frustration level',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Parse ticket content and extract key entities (product, issue type, customer ID)',
            'Query CRM for customer history and account tier',
            'Run sentiment analysis to gauge urgency',
            'Apply categorization rules based on content and history',
            'Assign priority based on customer tier + sentiment + issue type',
            'Route to appropriate queue or trigger auto-response skill'
          ]
        },
        reasoning: {
          strategy: 'hybrid',
          decisionPoints: [
            {
              name: 'Priority Assignment',
              inputs: ['customer_tier', 'sentiment_score', 'issue_category'],
              approach: 'VIP customers or negative sentiment automatically get P1/P2',
              outcomes: ['P1-Critical', 'P2-High', 'P3-Medium', 'P4-Low']
            },
            {
              name: 'Auto-Response Eligibility',
              inputs: ['issue_category', 'confidence_score'],
              approach: 'Only auto-respond if category confidence > 0.9 and known solution exists',
              outcomes: ['auto_respond', 'queue_for_human']
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Ticket categorized with confidence > 0.7',
            'Priority assigned',
            'Routed to queue within 30 seconds',
            'Customer notified of receipt'
          ],
          qualityMetrics: [
            { name: 'categorization_accuracy', target: '>= 92%' },
            { name: 'triage_latency', target: '< 30s p95' }
          ],
          timeout: '60 seconds'
        },
        failureHandling: {
          modes: [
            {
              condition: 'CRM unavailable',
              recovery: 'Proceed with default customer tier',
              escalate: false
            },
            {
              condition: 'Categorization confidence < 0.5',
              recovery: 'Route to human triage queue',
              escalate: true
            }
          ],
          defaultFallback: 'Assign to general support queue with human review flag',
          notifyOnFailure: true
        },
        guardrails: [
          {
            name: 'PII Protection',
            constraint: 'Never log raw customer messages to analytics',
            enforcement: 'hard'
          }
        ]
      },
      {
        id: uuid(),
        name: 'Knowledge Base Search',
        description: 'Search internal knowledge base and documentation to find relevant solutions for customer issues',
        domain: 'Information Retrieval',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'Ticket categorized and ready for resolution attempt',
            conditions: ['Triage complete', 'Category has known solutions']
          }
        ],
        tools: [
          {
            name: 'Knowledge Base API',
            purpose: 'Search and retrieve help articles and solutions',
            permissions: ['read'],
            required: true
          },
          {
            name: 'Vector Search',
            purpose: 'Semantic similarity search on documentation',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'adaptive',
          capabilities: [
            'Keyword search against KB index',
            'Semantic search using embeddings',
            'Filter by product and category',
            'Rank results by relevance and recency',
            'Extract solution steps from articles'
          ]
        },
        acceptance: {
          successConditions: [
            'At least one relevant article found',
            'Relevance score > 0.75',
            'Solution steps extracted'
          ],
          qualityMetrics: [
            { name: 'search_relevance', target: '>= 85%' }
          ]
        }
      },
      {
        id: uuid(),
        name: 'Response Generation',
        description: 'Generate personalized, empathetic responses to customers based on their issue and available solutions',
        domain: 'Natural Language Generation',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'Solution found in knowledge base',
            conditions: ['KB search returned results', 'Confidence threshold met']
          },
          {
            type: 'manual',
            description: 'Human agent requests draft response'
          }
        ],
        tools: [
          {
            name: 'Response Template Engine',
            purpose: 'Apply brand voice and formatting to responses',
            permissions: ['read', 'execute'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Analyze customer tone and adjust response style',
            'Select appropriate greeting based on context',
            'Summarize solution in clear, step-by-step format',
            'Add relevant links and resources',
            'Include empathetic acknowledgment of frustration if detected',
            'Apply brand voice guidelines'
          ]
        },
        reasoning: {
          strategy: 'llm_guided',
          decisionPoints: [
            {
              name: 'Tone Selection',
              inputs: ['customer_sentiment', 'issue_severity', 'interaction_history'],
              approach: 'Match formality to customer style, increase empathy for frustrated users',
              outcomes: ['formal', 'friendly', 'empathetic', 'apologetic']
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Response addresses customer issue',
            'Tone appropriate for context',
            'No hallucinated information',
            'Grammar and spelling correct'
          ],
          qualityMetrics: [
            { name: 'csat_score', target: '>= 4.2/5' },
            { name: 'resolution_rate', target: '>= 70%' }
          ]
        },
        guardrails: [
          {
            name: 'No Promises',
            constraint: 'Never promise specific timelines or outcomes not in policy',
            enforcement: 'hard'
          },
          {
            name: 'Factual Only',
            constraint: 'Only cite information from verified knowledge base',
            enforcement: 'hard'
          }
        ]
      },
      {
        id: uuid(),
        name: 'Escalation Handler',
        description: 'Detect when issues need human intervention and smoothly escalate with full context',
        domain: 'Workflow Management',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'Auto-resolution failed or complex issue detected',
            conditions: ['Resolution confidence < 0.6', 'OR customer requests human', 'OR VIP account']
          },
          {
            type: 'message',
            description: 'Customer explicitly asks for human agent'
          }
        ],
        tools: [
          {
            name: 'Agent Availability API',
            purpose: 'Check human agent availability and queue status',
            permissions: ['read'],
            required: true
          },
          {
            name: 'Slack Notifier',
            purpose: 'Alert on-call team for urgent escalations',
            permissions: ['execute'],
            required: false,
            conditions: 'Only for P1 issues outside business hours'
          }
        ],
        behavior: {
          model: 'workflow',
          stages: [
            {
              name: 'Context Compilation',
              purpose: 'Gather all relevant context for handoff',
              transitions: [{ to: 'Agent Matching', when: 'Context complete' }]
            },
            {
              name: 'Agent Matching',
              purpose: 'Find best available human agent based on skills and load',
              transitions: [{ to: 'Handoff Execution', when: 'Agent selected' }]
            },
            {
              name: 'Handoff Execution',
              purpose: 'Transfer conversation with full context summary'
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Human agent assigned within SLA',
            'Full conversation context transferred',
            'Customer notified of handoff'
          ],
          qualityMetrics: [
            { name: 'handoff_time', target: '< 2 minutes' },
            { name: 'context_completeness', target: '>= 95%' }
          ]
        }
      }
    ],

    humanInteraction: {
      mode: 'on_the_loop',
      escalation: {
        conditions: 'Customer requests human, VIP account, or confidence below threshold',
        channel: 'Helpdesk queue with Slack alert for urgent'
      }
    },
    collaboration: {
      role: 'worker',
      reportsTo: 'support-orchestrator',
      peers: [
        { agent: 'knowledge-updater-agent', interaction: 'pub_sub' },
        { agent: 'feedback-analyzer-agent', interaction: 'request_response' }
      ]
    },
    memory: {
      working: ['Current ticket context', 'Customer sentiment trajectory', 'Solution attempts made'],
      persistent: [
        {
          name: 'Customer Interaction History',
          type: 'relational',
          purpose: 'Track past interactions to personalize future support',
          updates: 'append'
        },
        {
          name: 'Resolution Patterns',
          type: 'kv',
          purpose: 'Cache successful resolution patterns by issue type',
          updates: 'full_crud'
        }
      ],
      learning: [
        {
          type: 'feedback_loop',
          signal: 'CSAT scores and resolution confirmations'
        },
        {
          type: 'fine_tuning',
          signal: 'Edits made by human agents to generated responses'
        }
      ]
    },
    guardrails: [
      {
        name: 'No Refunds Without Approval',
        constraint: 'Cannot authorize refunds over $50 without human approval',
        rationale: 'Financial controls',
        enforcement: 'hard'
      },
      {
        name: 'Privacy Compliance',
        constraint: 'Never share customer data across accounts',
        rationale: 'GDPR and privacy compliance',
        enforcement: 'hard'
      }
    ]
  },

  // Code Review Assistant
  {
    id: AGENT_STORY_IDS.codeReview,
    version: '1.0',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
    identifier: 'code-review-assistant',
    name: 'Code Review Assistant',
    role: 'A code reviewer that analyzes pull requests for quality, security vulnerabilities, best practices, and provides actionable feedback',
    purpose: 'Improve code quality and catch issues early through automated review, reducing review burden on senior engineers',
    autonomyLevel: 'collaborative',
    tags: ['development', 'code-review', 'automation', 'security'],

    skills: [
      {
        id: uuid(),
        name: 'PR Analysis',
        description: 'Parse pull request content, identify changed files, and prepare context for detailed review',
        domain: 'Development',
        acquired: 'built_in',
        triggers: [
          {
            type: 'resource_change',
            description: 'Pull request opened or updated in monitored repository',
            conditions: ['PR not in draft state', 'PR has code changes (not just docs)'],
            examples: ['New PR opened on main branch', 'Commits pushed to existing PR']
          },
          {
            type: 'message',
            description: 'User mentions bot in PR comment requesting review'
          }
        ],
        tools: [
          {
            name: 'GitHub API',
            purpose: 'Fetch PR details, diffs, and file contents',
            permissions: ['read'],
            required: true
          },
          {
            name: 'Git CLI',
            purpose: 'Clone repo and analyze commit history',
            permissions: ['read', 'execute'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Fetch PR metadata (author, branch, description)',
            'Get list of changed files and diff stats',
            'Filter out generated/vendored files',
            'Identify file types and applicable review rules',
            'Load relevant repo configuration (.eslint, .prettierrc, etc.)',
            'Queue files for appropriate review skills'
          ]
        },
        acceptance: {
          successConditions: [
            'All changed files identified',
            'Review context prepared',
            'Appropriate review skills triggered'
          ],
          timeout: '2 minutes'
        }
      },
      {
        id: uuid(),
        name: 'Static Analysis',
        description: 'Run linters, type checkers, and static analysis tools to catch common issues',
        domain: 'Code Quality',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'PR analysis complete, files ready for review'
          }
        ],
        tools: [
          {
            name: 'ESLint Runner',
            purpose: 'Run JavaScript/TypeScript linting',
            permissions: ['execute'],
            required: false,
            conditions: 'Only for JS/TS files'
          },
          {
            name: 'TypeScript Compiler',
            purpose: 'Type checking for TypeScript projects',
            permissions: ['execute'],
            required: false,
            conditions: 'Only for TS projects'
          },
          {
            name: 'Semgrep',
            purpose: 'Pattern-based code analysis',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'adaptive',
          capabilities: [
            'Run ESLint with project configuration',
            'Execute TypeScript type checking',
            'Run Semgrep security rules',
            'Check for complexity metrics (cyclomatic complexity)',
            'Detect code duplication',
            'Aggregate and deduplicate findings'
          ]
        },
        reasoning: {
          strategy: 'rule_based',
          decisionPoints: [
            {
              name: 'Tool Selection',
              inputs: ['file_extension', 'project_config'],
              approach: 'Select appropriate linters based on file types and project setup',
              outcomes: ['eslint', 'tsc', 'pylint', 'golint', 'none']
            }
          ]
        },
        acceptance: {
          successConditions: [
            'All applicable tools executed',
            'Results parsed and categorized',
            'No tool crashes or timeouts'
          ],
          qualityMetrics: [
            { name: 'false_positive_rate', target: '< 15%' }
          ],
          timeout: '5 minutes'
        },
        failureHandling: {
          modes: [
            {
              condition: 'Linter timeout',
              recovery: 'Skip linter, note in review that static analysis was partial',
              escalate: false
            }
          ],
          defaultFallback: 'Continue with available results',
          notifyOnFailure: false
        }
      },
      {
        id: uuid(),
        name: 'Security Review',
        description: 'Scan for security vulnerabilities, secrets, and unsafe patterns',
        domain: 'Security',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'PR ready for security review'
          }
        ],
        tools: [
          {
            name: 'Secret Scanner',
            purpose: 'Detect accidentally committed secrets and credentials',
            permissions: ['read', 'execute'],
            required: true
          },
          {
            name: 'Dependency Checker',
            purpose: 'Check for vulnerable dependencies',
            permissions: ['read', 'execute'],
            required: true
          },
          {
            name: 'SAST Engine',
            purpose: 'Static application security testing',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Scan diff for hardcoded secrets (API keys, passwords)',
            'Check for new dependencies and their vulnerability status',
            'Analyze code for OWASP Top 10 vulnerabilities',
            'Check for SQL injection, XSS, command injection patterns',
            'Verify authentication/authorization patterns',
            'Generate security finding report'
          ]
        },
        reasoning: {
          strategy: 'hybrid',
          decisionPoints: [
            {
              name: 'Severity Classification',
              inputs: ['vulnerability_type', 'exploitability', 'file_location'],
              approach: 'Apply CVSS-like scoring, consider if code is in critical path',
              outcomes: ['critical', 'high', 'medium', 'low', 'info']
            }
          ]
        },
        acceptance: {
          successConditions: [
            'No critical/high severity issues (or flagged for blocking)',
            'All secrets patterns checked',
            'Dependency audit complete'
          ]
        },
        guardrails: [
          {
            name: 'Block on Secrets',
            constraint: 'Must flag any detected secrets as blocking issue',
            enforcement: 'hard'
          },
          {
            name: 'Block on Critical CVE',
            constraint: 'Must flag new dependencies with critical CVEs',
            enforcement: 'hard'
          }
        ]
      },
      {
        id: uuid(),
        name: 'Best Practices Review',
        description: 'Analyze code for design patterns, maintainability, and adherence to team conventions',
        domain: 'Code Quality',
        acquired: 'learned',
        triggers: [
          {
            type: 'cascade',
            description: 'Static analysis complete'
          }
        ],
        tools: [
          {
            name: 'LLM Code Analyzer',
            purpose: 'AI-powered code comprehension and feedback',
            permissions: ['execute'],
            required: true
          },
          {
            name: 'Team Guidelines DB',
            purpose: 'Retrieve team-specific coding conventions',
            permissions: ['read'],
            required: false
          }
        ],
        behavior: {
          model: 'adaptive',
          capabilities: [
            'Analyze function complexity and suggest refactoring',
            'Check naming conventions and consistency',
            'Evaluate test coverage for changed code',
            'Suggest documentation improvements',
            'Identify potential performance issues',
            'Check for proper error handling'
          ]
        },
        reasoning: {
          strategy: 'llm_guided',
          decisionPoints: [
            {
              name: 'Suggestion Priority',
              inputs: ['issue_type', 'code_location', 'change_size'],
              approach: 'Prioritize actionable feedback, avoid nitpicking small PRs',
              outcomes: ['must_fix', 'should_fix', 'consider', 'nit']
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Feedback generated for significant changes',
            'Suggestions are actionable and specific',
            'No more than 10 comments per PR (avoid overwhelming)'
          ],
          qualityMetrics: [
            { name: 'feedback_acceptance_rate', target: '>= 60%' }
          ]
        },
        guardrails: [
          {
            name: 'Constructive Only',
            constraint: 'All feedback must be constructive with suggested fix',
            enforcement: 'soft'
          },
          {
            name: 'Respect Author',
            constraint: 'Avoid condescending or harsh language',
            enforcement: 'hard'
          }
        ]
      },
      {
        id: uuid(),
        name: 'Review Summary',
        description: 'Compile all findings into a coherent review summary and post to PR',
        domain: 'Communication',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'All review skills complete'
          }
        ],
        tools: [
          {
            name: 'GitHub API',
            purpose: 'Post review comments and summary',
            permissions: ['write'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Aggregate findings from all review skills',
            'Deduplicate and prioritize issues',
            'Generate summary with issue counts by severity',
            'Format inline comments for specific line feedback',
            'Determine overall review verdict (approve, request changes, comment)',
            'Post review to GitHub'
          ]
        },
        acceptance: {
          successConditions: [
            'Review posted to PR',
            'All blocking issues clearly marked',
            'Summary provides actionable next steps'
          ]
        }
      }
    ],

    humanInteraction: {
      mode: 'in_the_loop',
      escalation: {
        conditions: 'Architectural changes, security critical code, or author disputes finding',
        channel: 'Request senior engineer review via GitHub review request'
      }
    },
    collaboration: {
      role: 'peer',
      peers: [
        { agent: 'ci-pipeline-agent', interaction: 'pub_sub' },
        { agent: 'deployment-agent', interaction: 'request_response' }
      ]
    },
    memory: {
      working: ['Current PR context', 'Review findings accumulated'],
      persistent: [
        {
          name: 'Review History',
          type: 'relational',
          purpose: 'Track past reviews for learning and consistency',
          updates: 'append'
        },
        {
          name: 'Team Preferences',
          type: 'kv',
          purpose: 'Store team-specific rules and preferences learned over time',
          updates: 'full_crud'
        }
      ],
      learning: [
        {
          type: 'feedback_loop',
          signal: 'Which suggestions were accepted vs dismissed'
        },
        {
          type: 'fine_tuning',
          signal: 'Manual reviews by senior engineers'
        }
      ]
    },
    guardrails: [
      {
        name: 'No Auto-Merge',
        constraint: 'Can approve but never auto-merge PRs',
        rationale: 'Human must make final merge decision',
        enforcement: 'hard'
      },
      {
        name: 'Security Blocking',
        constraint: 'Must request changes if security issues found',
        rationale: 'Security issues should block merge',
        enforcement: 'hard'
      }
    ]
  },

  // Support Request Router
  {
    id: uuid(),
    version: '1.0',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    identifier: 'support-request-router',
    name: 'Support Request Router',
    role: 'Customer Support Triage Agent',
    purpose: 'Ensure support requests reach the right team quickly with full context',
    autonomyLevel: 'supervised',
    tags: ['customer-support', 'triage', 'routing'],

    skills: [
      {
        id: uuid(),
        name: 'Request Classification',
        description: 'Categorize incoming requests by type, urgency, and sentiment',
        domain: 'Natural Language Understanding',
        acquired: 'built_in',
        triggers: [
          {
            type: 'message',
            description: 'New support request received',
            conditions: ['Source is customer support gateway', 'Request not previously classified'],
            examples: ['Customer submits ticket via web form', 'Email received at support@company.com']
          }
        ],
        tools: [
          {
            name: 'Customer Database',
            purpose: 'Lookup customer tier and history',
            permissions: ['read'],
            required: false
          },
          {
            name: 'Classification Model API',
            purpose: 'ML-based categorization',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Extract key phrases from message',
            'Lookup customer context if available',
            'Run classification model',
            'Apply confidence thresholds'
          ]
        },
        reasoning: {
          strategy: 'hybrid',
          decisionPoints: [
            {
              name: 'Confidence Check',
              inputs: ['model_confidence_score'],
              approach: 'Escalate if confidence < 0.8',
              outcomes: ['accept', 'escalate']
            }
          ],
          retry: {
            maxAttempts: 2,
            backoffStrategy: 'exponential',
            retryOn: ['Model timeout']
          }
        },
        acceptance: {
          successConditions: [
            'Category assigned',
            'Urgency determined',
            'Confidence recorded'
          ],
          qualityMetrics: [
            { name: 'accuracy', target: '>= 95%' },
            { name: 'latency', target: '< 500ms p95' }
          ]
        },
        failureHandling: {
          modes: [
            {
              condition: 'Model unavailable',
              recovery: 'Use rule-based fallback classifier',
              escalate: false
            },
            {
              condition: 'All attempts fail',
              recovery: 'Route to human classifier',
              escalate: true
            }
          ],
          defaultFallback: 'Flag for manual classification',
          notifyOnFailure: true
        },
        guardrails: [
          {
            name: 'No PII logging',
            constraint: 'Never log raw message content',
            enforcement: 'hard'
          }
        ]
      },
      {
        id: uuid(),
        name: 'Queue Routing',
        description: 'Route classified requests to appropriate support queues',
        domain: 'Workflow Management',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'Classification skill completed',
            conditions: ['Classification result available']
          }
        ],
        tools: [
          {
            name: 'Queue Manager API',
            purpose: 'Check queue capacity and route',
            permissions: ['read', 'execute'],
            required: true
          }
        ],
        behavior: {
          model: 'workflow',
          stages: [
            {
              name: 'Check VIP Status',
              purpose: 'Prioritize high-value customers',
              transitions: [{ to: 'Select Queue', when: 'VIP status checked' }]
            },
            {
              name: 'Select Queue',
              purpose: 'Match category to queue',
              transitions: [{ to: 'Confirm Route', when: 'Queue selected' }]
            },
            {
              name: 'Confirm Route',
              purpose: 'Finalize routing decision'
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Request assigned to queue',
            'Priority set correctly',
            'Routing logged'
          ]
        },
        guardrails: [
          {
            name: 'Compliance routing',
            constraint: 'Compliance issues never go to standard queues',
            enforcement: 'hard'
          }
        ]
      }
    ],

    humanInteraction: {
      mode: 'on_the_loop',
      escalation: {
        conditions: 'Critical issue or low confidence',
        channel: 'Slack #support-escalations'
      }
    },
    collaboration: {
      role: 'worker',
      reportsTo: 'support-orchestrator'
    },
    memory: {
      working: ['Current request context', 'Customer sentiment from recent interactions'],
      persistent: [
        {
          name: 'Routing History',
          type: 'relational',
          purpose: 'Track routing patterns and outcomes',
          updates: 'append'
        }
      ],
      learning: [
        {
          type: 'feedback_loop',
          signal: 'Human corrections to classifications'
        }
      ]
    },
    guardrails: [
      {
        name: 'Never auto-close',
        constraint: 'Never close tickets without customer confirmation',
        rationale: 'Prevent premature resolution',
        enforcement: 'hard'
      },
      {
        name: 'Audit trail',
        constraint: 'All routing decisions must be logged',
        rationale: 'Compliance and debugging',
        enforcement: 'hard'
      }
    ]
  },

  // Sales Assistant Agent
  {
    id: AGENT_STORY_IDS.salesAssistant,
    version: '1.0',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
    identifier: 'sales-assistant-agent',
    name: 'Sales Assistant Agent',
    role: 'A sales development assistant that helps qualify leads, personalize outreach, and manage CRM data',
    purpose: 'Accelerate the sales pipeline by automating lead qualification, outreach personalization, and administrative tasks',
    autonomyLevel: 'collaborative',
    tags: ['sales', 'leads', 'crm', 'outreach'],

    skills: [
      {
        id: uuid(),
        name: 'Lead Scoring',
        description: 'Analyze lead data to assign qualification scores based on fit, intent, and engagement signals',
        domain: 'Data Processing',
        acquired: 'built_in',
        triggers: [
          {
            type: 'resource_change',
            description: 'New lead created or updated in CRM',
            conditions: ['Lead has company and contact info', 'Lead not yet scored'],
            examples: ['Form submission on website', 'Lead imported from event']
          }
        ],
        tools: [
          {
            name: 'CRM API',
            purpose: 'Read lead data and update scores',
            permissions: ['read', 'write'],
            required: true
          },
          {
            name: 'Company Data Enrichment',
            purpose: 'Enrich lead with firmographic data',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Fetch lead data from CRM',
            'Enrich with company information (size, industry, tech stack)',
            'Calculate ICP fit score based on criteria',
            'Analyze engagement signals (email opens, page visits)',
            'Generate composite lead score',
            'Update CRM with score and reasoning'
          ]
        },
        acceptance: {
          successConditions: [
            'Lead score assigned (0-100)',
            'Score reasoning documented',
            'CRM record updated'
          ],
          qualityMetrics: [
            { name: 'score_accuracy', target: '>= 85%' }
          ]
        }
      },
      {
        id: uuid(),
        name: 'Outreach Personalization',
        description: 'Generate personalized email sequences based on lead profile and company research',
        domain: 'Natural Language Generation',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'Lead qualified and ready for outreach',
            conditions: ['Lead score >= 60', 'No active sequence']
          }
        ],
        tools: [
          {
            name: 'Company Research API',
            purpose: 'Gather recent news and insights about company',
            permissions: ['read'],
            required: true
          },
          {
            name: 'Email Template Engine',
            purpose: 'Generate personalized email content',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Research company recent news and initiatives',
            'Identify relevant pain points and use cases',
            'Select appropriate email template',
            'Personalize with company-specific references',
            'Generate subject line variants for A/B testing',
            'Queue email for rep review'
          ]
        },
        acceptance: {
          successConditions: [
            'Email draft generated',
            'Personalization elements included',
            'Subject line options provided'
          ]
        },
        guardrails: [
          {
            name: 'Accuracy Check',
            constraint: 'All company references must be verifiable',
            enforcement: 'hard'
          }
        ]
      },
      {
        id: uuid(),
        name: 'CRM Data Hygiene',
        description: 'Maintain accurate CRM records by detecting duplicates, updating stale data, and standardizing fields',
        domain: 'Data Processing',
        acquired: 'built_in',
        triggers: [
          {
            type: 'schedule',
            description: 'Daily CRM hygiene scan',
            conditions: ['After business hours']
          }
        ],
        tools: [
          {
            name: 'CRM API',
            purpose: 'Read and update CRM records',
            permissions: ['read', 'write'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Scan for duplicate leads/contacts',
            'Identify records with missing required fields',
            'Check for stale records (no activity > 90 days)',
            'Standardize company names and addresses',
            'Generate hygiene report for review'
          ]
        },
        acceptance: {
          successConditions: [
            'Duplicates identified and flagged',
            'Missing data report generated',
            'No unauthorized merges or deletes'
          ]
        },
        guardrails: [
          {
            name: 'No Auto-Delete',
            constraint: 'Never delete records without human approval',
            enforcement: 'hard'
          }
        ]
      },
      {
        id: uuid(),
        name: 'Meeting Scheduler',
        description: 'Coordinate scheduling between qualified leads and account executives',
        domain: 'Workflow Management',
        acquired: 'built_in',
        triggers: [
          {
            type: 'message',
            description: 'Lead responds positively to outreach',
            conditions: ['Sentiment is positive', 'Intent to meet detected']
          }
        ],
        tools: [
          {
            name: 'Calendar API',
            purpose: 'Check AE availability and book meetings',
            permissions: ['read', 'write'],
            required: true
          },
          {
            name: 'Email API',
            purpose: 'Send meeting invites and confirmations',
            permissions: ['execute'],
            required: true
          }
        ],
        behavior: {
          model: 'workflow',
          stages: [
            {
              name: 'Availability Check',
              purpose: 'Find available time slots for assigned AE',
              transitions: [{ to: 'Propose Times', when: 'Slots found' }]
            },
            {
              name: 'Propose Times',
              purpose: 'Send meeting time options to lead',
              transitions: [{ to: 'Confirm Booking', when: 'Time selected' }]
            },
            {
              name: 'Confirm Booking',
              purpose: 'Book meeting and send calendar invites'
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Meeting booked on calendar',
            'All parties notified',
            'CRM updated with meeting info'
          ]
        }
      }
    ],

    humanInteraction: {
      mode: 'in_the_loop',
      escalation: {
        conditions: 'High-value lead or complex objection handling',
        channel: 'Notify assigned SDR via Slack'
      }
    },
    collaboration: {
      role: 'worker',
      reportsTo: 'sales-orchestrator',
      peers: [
        { agent: 'marketing-automation-agent', interaction: 'pub_sub' }
      ]
    },
    memory: {
      working: ['Current lead context', 'Recent email thread'],
      persistent: [
        {
          name: 'Outreach History',
          type: 'relational',
          purpose: 'Track what has been sent to each lead',
          updates: 'append'
        },
        {
          name: 'Successful Patterns',
          type: 'kv',
          purpose: 'Store effective personalization approaches by industry',
          updates: 'full_crud'
        }
      ],
      learning: [
        {
          type: 'feedback_loop',
          signal: 'Email open/reply rates'
        }
      ]
    },
    guardrails: [
      {
        name: 'Send Limits',
        constraint: 'Maximum 50 emails per day per SDR',
        rationale: 'Prevent spam and maintain deliverability',
        enforcement: 'hard'
      },
      {
        name: 'Compliance',
        constraint: 'Always include unsubscribe option',
        rationale: 'CAN-SPAM compliance',
        enforcement: 'hard'
      }
    ]
  },

  // Data Pipeline Monitor
  {
    id: uuid(),
    version: '1.0',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    identifier: 'data-pipeline-monitor',
    name: 'Data Pipeline Monitor',
    role: 'Infrastructure Monitoring Agent',
    purpose: 'Detect pipeline issues early and notify relevant teams with context',
    autonomyLevel: 'full',
    tags: ['monitoring', 'data-pipeline', 'alerting'],

    skills: [
      {
        id: uuid(),
        name: 'Health Check',
        description: 'Monitor pipeline health metrics and detect anomalies',
        domain: 'Data Processing',
        acquired: 'built_in',
        triggers: [
          {
            type: 'schedule',
            description: 'Every 5 minutes',
            conditions: ['Pipeline is running']
          }
        ],
        tools: [
          {
            name: 'Pipeline Metrics API',
            purpose: 'Fetch current pipeline metrics and status',
            permissions: ['read'],
            required: true
          }
        ],
        behavior: {
          model: 'sequential',
          steps: [
            'Fetch current metrics',
            'Compare against thresholds',
            'Detect anomalies',
            'Return health status'
          ]
        },
        acceptance: {
          successConditions: [
            'All pipeline components checked',
            'Health status determined',
            'Metrics recorded'
          ],
          timeout: '30 seconds'
        }
      },
      {
        id: uuid(),
        name: 'Alert Routing',
        description: 'Send alerts to appropriate channels based on severity',
        domain: 'Workflow Management',
        acquired: 'built_in',
        triggers: [
          {
            type: 'cascade',
            description: 'Health check detected issue',
            conditions: ['Issue severity >= warning']
          }
        ],
        tools: [
          {
            name: 'Slack Notifier',
            purpose: 'Send notifications to Slack channels',
            permissions: ['execute'],
            required: true
          },
          {
            name: 'PagerDuty',
            purpose: 'Escalate critical issues',
            permissions: ['execute'],
            required: false,
            conditions: 'Only for critical severity'
          }
        ],
        reasoning: {
          strategy: 'rule_based',
          decisionPoints: [
            {
              name: 'Severity Assessment',
              inputs: ['error_rate', 'pipeline_delay', 'data_quality_score'],
              approach: 'Apply threshold rules to determine alert severity',
              outcomes: ['info', 'warning', 'critical']
            }
          ]
        },
        acceptance: {
          successConditions: [
            'Alert sent to correct channel',
            'No duplicate alerts within 15 minutes',
            'Alert includes context'
          ]
        },
        guardrails: [
          {
            name: 'Deduplication',
            constraint: 'Do not send duplicate alerts for same issue',
            enforcement: 'hard'
          }
        ]
      }
    ],

    humanInteraction: {
      mode: 'out_of_loop',
      escalation: {
        conditions: 'Critical failure or unknown error pattern',
        channel: 'PagerDuty to on-call engineer'
      }
    },
    memory: {
      persistent: [
        {
          name: 'Alert History',
          type: 'kv',
          purpose: 'Track recent alerts to prevent duplicates',
          updates: 'append'
        }
      ]
    }
  }
];

// Mock templates data
const mockTemplates: Template[] = [
  {
    id: uuid(),
    name: 'Customer Service Agent',
    description: 'Handle customer inquiries and support tickets',
    category: 'customer_service',
    tags: ['support', 'chat', 'tickets'],
    storyTemplate: {
      role: 'A customer service agent that handles customer inquiries',
      autonomyLevel: 'supervised',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 42,
    whenToUse: 'When you need an agent to handle customer support interactions',
    exampleScenarios: ['Chat support', 'Email support', 'Ticket triage'],
  },
  {
    id: uuid(),
    name: 'Scheduled Report Generator',
    description: 'Generate and distribute reports on a schedule',
    category: 'scheduled_tasks',
    tags: ['reports', 'automation', 'scheduled'],
    storyTemplate: {
      role: 'A reporting agent that generates and distributes scheduled reports',
      autonomyLevel: 'full',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 28,
    whenToUse: 'When you need automated report generation on a schedule',
    exampleScenarios: ['Daily sales reports', 'Weekly analytics', 'Monthly summaries'],
  },
  {
    id: uuid(),
    name: 'Event-Driven Processor',
    description: 'React to events and process data accordingly',
    category: 'event_driven',
    tags: ['events', 'processing', 'reactive'],
    storyTemplate: {
      role: 'An event processor that reacts to system events',
      autonomyLevel: 'full',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 35,
    whenToUse: 'When you need an agent that responds to system events',
    exampleScenarios: ['Webhook handlers', 'Queue processors', 'Stream processors'],
  },
  {
    id: uuid(),
    name: 'Data Pipeline Agent',
    description: 'Transform and move data between systems',
    category: 'data_pipeline',
    tags: ['etl', 'data', 'integration'],
    storyTemplate: {
      role: 'A data pipeline agent that transforms and moves data',
      autonomyLevel: 'supervised',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 19,
    whenToUse: 'When you need to build ETL or data integration workflows',
    exampleScenarios: ['Database sync', 'API data fetching', 'Data transformation'],
  },
  {
    id: uuid(),
    name: 'Monitoring & Alerting Agent',
    description: 'Monitor systems and send alerts on issues',
    category: 'monitoring_alerting',
    tags: ['monitoring', 'alerts', 'observability'],
    storyTemplate: {
      role: 'A monitoring agent that watches systems and alerts on issues',
      autonomyLevel: 'full',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 31,
    whenToUse: 'When you need proactive system monitoring',
    exampleScenarios: ['Health checks', 'Error monitoring', 'Performance alerts'],
  },
  {
    id: uuid(),
    name: 'Content Generator',
    description: 'Generate content based on templates and data',
    category: 'content_generation',
    tags: ['content', 'generation', 'writing'],
    storyTemplate: {
      role: 'A content generator that creates content from templates',
      autonomyLevel: 'collaborative',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 24,
    whenToUse: 'When you need automated content creation',
    exampleScenarios: ['Blog posts', 'Product descriptions', 'Email templates'],
  },
  {
    id: uuid(),
    name: 'Multi-Agent Coordinator',
    description: 'Coordinate multiple agents working together',
    category: 'multi_agent',
    tags: ['coordination', 'orchestration', 'multi-agent'],
    storyTemplate: {
      role: 'A coordinator agent that orchestrates multiple sub-agents',
      autonomyLevel: 'supervised',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 12,
    whenToUse: 'When you need multiple agents working together',
    exampleScenarios: ['Complex workflows', 'Parallel processing', 'Agent pipelines'],
  },
  {
    id: uuid(),
    name: 'Analysis & Reporting Agent',
    description: 'Analyze data and generate insights',
    category: 'analysis_reporting',
    tags: ['analysis', 'insights', 'data'],
    storyTemplate: {
      role: 'An analysis agent that processes data and generates insights',
      autonomyLevel: 'collaborative',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 18,
    whenToUse: 'When you need data analysis and insight generation',
    exampleScenarios: ['Trend analysis', 'Anomaly detection', 'Performance reports'],
  },
  {
    id: uuid(),
    name: 'Background Processor',
    description: 'Process tasks asynchronously in the background',
    category: 'background_processing',
    tags: ['async', 'background', 'processing'],
    storyTemplate: {
      role: 'A background processor that handles async tasks',
      autonomyLevel: 'full',
    },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    usageCount: 22,
    whenToUse: 'When you need async task processing',
    exampleScenarios: ['Image processing', 'Document parsing', 'Batch operations'],
  },
];

// In-memory storage with localStorage persistence
let stories: AgentStory[] = [];
let templates = [...mockTemplates];
let isInitialized = false;

// Initialize stories from localStorage or use defaults
function initializeStories(): void {
  if (isInitialized) return;

  const stored = loadFromStorage();
  if (stored && Array.isArray(stored) && stored.length > 0) {
    stories = stored as AgentStory[];
  } else {
    stories = [...mockStories];
    saveToStorage(stories);
  }
  isInitialized = true;
}

// Persist stories to localStorage
function persistStories(): void {
  saveToStorage(stories);
}

export const mockDataService = {
  // Stories
  stories: {
    list: async (params?: {
      search?: string;
      tags?: string[];
      autonomyLevel?: string;
    }): Promise<AgentStory[]> => {
      initializeStories();
      await delay(300);
      let result = [...stories];

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (s) =>
            s.name?.toLowerCase().includes(search) ||
            s.role?.toLowerCase().includes(search)
        );
      }

      if (params?.tags?.length) {
        result = result.filter((s) =>
          params.tags!.some((tag) => s.tags?.includes(tag))
        );
      }

      if (params?.autonomyLevel) {
        result = result.filter((s) => s.autonomyLevel === params.autonomyLevel);
      }

      return result;
    },

    get: async (id: string): Promise<AgentStory | null> => {
      initializeStories();
      await delay(200);
      return stories.find((s) => s.id === id) || null;
    },

    create: async (data: Omit<AgentStory, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentStory> => {
      initializeStories();
      await delay(400);
      const now = new Date().toISOString();
      const newStory = {
        ...data,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      } as AgentStory;
      stories.push(newStory);
      persistStories();
      return newStory;
    },

    update: async (id: string, data: Partial<AgentStory>): Promise<AgentStory | null> => {
      initializeStories();
      await delay(400);
      const index = stories.findIndex((s) => s.id === id);
      if (index === -1) return null;

      stories[index] = {
        ...stories[index],
        ...data,
        updatedAt: new Date().toISOString(),
      } as AgentStory;
      persistStories();
      return stories[index];
    },

    delete: async (id: string): Promise<boolean> => {
      initializeStories();
      await delay(300);
      const index = stories.findIndex((s) => s.id === id);
      if (index === -1) return false;
      stories.splice(index, 1);
      persistStories();
      return true;
    },

    duplicate: async (id: string): Promise<AgentStory | null> => {
      initializeStories();
      await delay(400);
      const story = stories.find((s) => s.id === id);
      if (!story) return null;

      const now = new Date().toISOString();
      const duplicate = {
        ...story,
        id: uuid(),
        name: `${story.name} (Copy)`,
        identifier: story.identifier ? `${story.identifier}-copy-${Date.now()}` : undefined,
        createdAt: now,
        updatedAt: now,
      } as AgentStory;
      stories.push(duplicate);
      persistStories();
      return duplicate;
    },
  },

  // Templates
  templates: {
    list: async (params?: {
      category?: TemplateCategory;
      search?: string;
    }): Promise<Template[]> => {
      await delay(300);
      let result = [...templates];

      if (params?.category) {
        result = result.filter((t) => t.category === params.category);
      }

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.name.toLowerCase().includes(search) ||
            t.description.toLowerCase().includes(search)
        );
      }

      return result;
    },

    get: async (id: string): Promise<Template | null> => {
      await delay(200);
      return templates.find((t) => t.id === id) || null;
    },

    useTemplate: async (templateId: string): Promise<AgentStory> => {
      initializeStories();
      await delay(400);
      const template = templates.find((t) => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Increment usage count
      template.usageCount++;

      const now = new Date().toISOString();
      const newStory: AgentStory = {
        ...template.storyTemplate,
        id: uuid(),
        version: '1.0',
        createdAt: now,
        updatedAt: now,
        createdBy: 'user-1',
        identifier: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: `New ${template.name}`,
        purpose: 'Define the purpose of this agent',
        skills: [
          {
            id: uuid(),
            name: 'Primary Capability',
            description: 'Define what this skill does',
            domain: 'General',
            acquired: 'built_in',
            triggers: [{ type: 'manual', description: 'Triggered manually' }],
            acceptance: { successConditions: ['Define success criteria'] }
          }
        ],
      };

      stories.push(newStory);
      persistStories();
      return newStory;
    },
  },

  // Stats
  stats: {
    get: async () => {
      initializeStories();
      await delay(200);
      return {
        totalStories: stories.length,
        totalTemplates: templates.length,
        storiesByAutonomy: {
          full: stories.filter((s) => s.autonomyLevel === 'full').length,
          supervised: stories.filter((s) => s.autonomyLevel === 'supervised').length,
          collaborative: stories.filter((s) => s.autonomyLevel === 'collaborative').length,
          directed: stories.filter((s) => s.autonomyLevel === 'directed').length,
        },
      };
    },
  },
};
