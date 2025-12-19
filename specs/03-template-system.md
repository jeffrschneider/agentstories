# Template System Specification

## Overview

The template system provides pre-built Agent Story starting points organized by use case, autonomy level, and complexity. Templates accelerate story creation and promote best practices.

---

## Template Categories

| Category | Description | Typical Autonomy |
|----------|-------------|------------------|
| `background_processing` | Long-running async tasks | Full/Supervised |
| `monitoring_alerting` | System health and event monitoring | Full/Supervised |
| `data_pipeline` | ETL and data transformation | Supervised |
| `scheduled_tasks` | Time-based recurring operations | Full/Supervised |
| `event_driven` | Reactive event processing | Varies |
| `multi_agent` | Coordinator/worker patterns | Supervised/Collaborative |
| `customer_service` | Customer-facing interactions | Collaborative/Directed |
| `content_generation` | Content creation workflows | Collaborative |
| `analysis_reporting` | Data analysis and insights | Supervised |
| `custom` | User-created templates | Varies |

---

## Built-in Templates (Phase 1)

### Template: Support Triage Agent

```yaml
id: builtin-support-triage
name: Support Triage Agent
description: Categorizes and routes incoming support requests to appropriate queues
category: customer_service
tags: [support, triage, routing, classification]
format: light
whenToUse: |
  Use this template when building an agent that receives customer inquiries
  and must classify them by topic, urgency, or required expertise before
  routing to specialized handlers.
exampleScenarios:
  - Customer support ticket classification
  - IT helpdesk request routing
  - Sales inquiry prioritization

storyTemplate:
  role: Support Triage Agent
  trigger:
    type: message
    sourceAgents: [support-gateway]
    protocol: a2a
  action: classify the incoming support request by topic and urgency, then route to the appropriate specialized support queue
  outcome: customers receive faster responses by being connected to the right team immediately
  autonomyLevel: supervised
```

### Template: System Health Monitor

```yaml
id: builtin-health-monitor
name: System Health Monitor
description: Monitors system metrics and triggers alerts on anomalies
category: monitoring_alerting
tags: [monitoring, alerting, observability, health]
format: light
whenToUse: |
  Use this template for agents that continuously monitor infrastructure,
  application, or business metrics and need to alert humans when
  thresholds are breached.
exampleScenarios:
  - Server CPU/memory monitoring
  - API latency tracking
  - Error rate threshold alerts

storyTemplate:
  role: System Health Monitor
  trigger:
    type: schedule
    cronExpression: "*/5 * * * *"
    timezone: UTC
  action: collect system metrics, compare against defined thresholds, and generate alerts for any anomalies
  outcome: operations teams are notified of potential issues before they impact users
  autonomyLevel: full
```

### Template: Data Pipeline Orchestrator

```yaml
id: builtin-data-pipeline
name: Data Pipeline Orchestrator
description: Coordinates multi-stage data transformation and loading
category: data_pipeline
tags: [etl, data, pipeline, orchestration]
format: full
whenToUse: |
  Use this template for agents that orchestrate complex data transformations
  across multiple stages with dependencies, validation checkpoints,
  and error recovery.
exampleScenarios:
  - Daily ETL from source systems
  - Data warehouse refresh
  - ML feature pipeline

storyTemplate:
  role: Data Pipeline Orchestrator
  trigger:
    type: schedule
    cronExpression: "0 2 * * *"
    timezone: America/New_York
  action: execute the data pipeline stages in sequence, validating data quality at each checkpoint and handling failures gracefully
  outcome: data consumers have fresh, validated data available each morning for analysis and reporting
  autonomyLevel: supervised
  behaviorConfig:
    type: workflow
    stages:
      - id: extract
        name: Data Extraction
        description: Pull data from source systems
      - id: transform
        name: Data Transformation
        description: Apply business logic and transformations
      - id: validate
        name: Data Validation
        description: Verify data quality and completeness
      - id: load
        name: Data Loading
        description: Load validated data to destination
    initialStageId: extract
    terminalStageIds: [load]
```

### Template: Order Processing Agent

```yaml
id: builtin-order-processor
name: Order Processing Agent
description: Handles order lifecycle from receipt to fulfillment
category: event_driven
tags: [orders, ecommerce, fulfillment, workflow]
format: full
whenToUse: |
  Use this template for agents managing order workflows including
  validation, inventory checks, payment processing, and fulfillment
  coordination.
exampleScenarios:
  - E-commerce order processing
  - B2B order fulfillment
  - Subscription order management

storyTemplate:
  role: Order Processing Agent
  trigger:
    type: message
    sourceAgents: [order-gateway]
    protocol: queue
  action: validate the order, verify inventory availability, process payment, and coordinate fulfillment
  outcome: orders are processed accurately and customers receive timely updates on their order status
  autonomyLevel: supervised
  behaviorConfig:
    type: workflow
    stages:
      - id: validate
        name: Order Validation
      - id: inventory
        name: Inventory Check
      - id: payment
        name: Payment Processing
      - id: fulfill
        name: Fulfillment Coordination
      - id: complete
        name: Order Complete
    initialStageId: validate
    terminalStageIds: [complete]
  humanCollaboration:
    pattern: on_the_loop
    escalationTriggers:
      - id: payment-failure
        name: Payment Failure
        condition: payment.status === 'failed' && payment.retryCount >= 3
        priority: high
      - id: inventory-shortage
        name: Inventory Shortage
        condition: inventory.available < order.quantity
        priority: medium
```

### Template: Content Review Agent

```yaml
id: builtin-content-review
name: Content Review Agent
description: Reviews and moderates user-generated content
category: content_generation
tags: [content, moderation, review, safety]
format: full
whenToUse: |
  Use this template for agents that review content against guidelines,
  flag policy violations, and either auto-approve or escalate for
  human review.
exampleScenarios:
  - Comment moderation
  - User profile review
  - Submitted content approval

storyTemplate:
  role: Content Review Agent
  trigger:
    type: message
    sourceAgents: [content-gateway]
    protocol: a2a
  action: analyze submitted content against community guidelines and safety policies, approving safe content and flagging violations
  outcome: users see only appropriate content while creators receive timely feedback on their submissions
  autonomyLevel: collaborative
  humanCollaboration:
    pattern: on_the_loop
    escalationTriggers:
      - id: uncertain-violation
        name: Uncertain Violation
        condition: confidence < 0.8 && potentialViolation === true
        priority: medium
      - id: severe-violation
        name: Severe Violation
        condition: severity === 'critical'
        priority: critical
    approvalWorkflows:
      - id: appeal-review
        name: Appeal Review
        requiredApprovers: 1
        approverRoles: [content-moderator]
        timeoutMinutes: 60
        timeoutAction: escalate
```

### Template: Multi-Agent Supervisor

```yaml
id: builtin-supervisor
name: Multi-Agent Supervisor
description: Coordinates and orchestrates multiple worker agents
category: multi_agent
tags: [supervisor, orchestration, multi-agent, coordination]
format: full
whenToUse: |
  Use this template for supervisor agents that distribute work,
  monitor worker progress, handle failures, and aggregate results
  across multiple specialized agents.
exampleScenarios:
  - Research task distribution
  - Parallel document processing
  - Multi-step analysis coordination

storyTemplate:
  role: Agent Supervisor
  trigger:
    type: message
    sourceAgents: [request-gateway]
    protocol: a2a
  action: decompose the incoming task into subtasks, assign to appropriate worker agents, monitor progress, and aggregate results
  outcome: complex tasks are completed efficiently through coordinated parallel processing
  autonomyLevel: supervised
  agentCollaboration:
    role: supervisor
    managedAgentIds: []  # To be configured
    communicationPatterns:
      - targetAgentId: worker-template
        messageTypes: [task_assignment, status_request, termination]
        protocol: async
        retryPolicy:
          maxRetries: 3
          backoffMs: 2000
```

### Template: Scheduled Report Generator

```yaml
id: builtin-report-generator
name: Scheduled Report Generator
description: Generates and distributes periodic reports
category: scheduled_tasks
tags: [reporting, analytics, scheduled, distribution]
format: light
whenToUse: |
  Use this template for agents that generate periodic reports
  from data sources and distribute them to stakeholders via
  email or other channels.
exampleScenarios:
  - Daily sales summary
  - Weekly performance metrics
  - Monthly executive dashboard

storyTemplate:
  role: Report Generation Agent
  trigger:
    type: schedule
    cronExpression: "0 8 * * 1"
    timezone: America/New_York
  action: aggregate data from configured sources, generate the weekly performance report, and distribute to the stakeholder mailing list
  outcome: stakeholders receive consistent, timely reports without manual effort
  autonomyLevel: full
```

---

## Template Browser UI

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Template Browser                                     [× Close]      │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search templates...]                                            │
│                                                                     │
│ Categories:                                                         │
│ [All] [Background] [Monitoring] [Data] [Scheduled] [Events] [...]   │
│                                                                     │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│ │ 📋               │ │ 📊               │ │ 🔄               │     │
│ │ Support Triage   │ │ Health Monitor   │ │ Data Pipeline    │     │
│ │                  │ │                  │ │                  │     │
│ │ Categorizes and  │ │ Monitors system  │ │ Coordinates      │     │
│ │ routes support   │ │ metrics and      │ │ multi-stage data │     │
│ │ requests         │ │ alerts on...     │ │ transformation   │     │
│ │                  │ │                  │ │                  │     │
│ │ 🏷 Light         │ │ 🏷 Light         │ │ 🏷 Full          │     │
│ │ [Use Template]   │ │ [Use Template]   │ │ [Use Template]   │     │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘     │
│                                                                     │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│ │ ...              │ │ ...              │ │ ...              │     │
└─────────────────────────────────────────────────────────────────────┘
```

### Template Preview Modal

When user clicks template card:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Support Triage Agent                           [Light] [× Close]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ DESCRIPTION                                                         │
│ Categorizes and routes incoming support requests to appropriate     │
│ queues based on topic, urgency, and required expertise.             │
│                                                                     │
│ WHEN TO USE                                                         │
│ Use this template when building an agent that receives customer     │
│ inquiries and must classify them by topic, urgency, or required     │
│ expertise before routing to specialized handlers.                   │
│                                                                     │
│ EXAMPLE SCENARIOS                                                   │
│ • Customer support ticket classification                            │
│ • IT helpdesk request routing                                       │
│ • Sales inquiry prioritization                                      │
│                                                                     │
│ PREVIEW                                                             │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ As a Support Triage Agent                                       │ │
│ │ triggered by message from [support-gateway]                     │ │
│ │ I classify the incoming support request by topic and urgency,   │ │
│ │   then route to the appropriate specialized support queue       │ │
│ │ so that customers receive faster responses by being connected   │ │
│ │   to the right team immediately                                 │ │
│ │ Autonomy: Supervised                                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                              [Cancel] [Use This Template]           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## User Flows

### UF-T001: Create Story from Template

**Flow:**
1. User opens Template Browser (from New Story modal or dedicated page)
2. User browses/searches templates
3. User clicks template card to preview
4. User clicks "Use This Template"
5. System creates new story with:
   - New UUID
   - Template content applied
   - Format from template
   - Empty identifier (user must provide)
   - createdAt/updatedAt: now
6. System navigates to Story Canvas
7. Required fields (identifier, name) highlighted for completion
8. Template usage count incremented

### UF-T002: Save Story as Template

**Flow:**
1. User opens story Actions menu
2. User clicks "Save as Template"
3. System shows template creation modal:
   - Name (pre-filled from story name)
   - Description (required)
   - Category (dropdown)
   - Tags (multi-select with autocomplete)
   - When to Use (optional textarea)
4. User fills form and clicks "Create Template"
5. System creates template in organization's custom templates
6. Toast: "Template created successfully"

### UF-T003: Manage Organization Templates

**Entry:** Settings → Templates

**Features:**
- View all organization templates
- Edit template metadata
- Delete templates
- View usage statistics
- Duplicate templates

---

## Template Schema

See `01-data-models.md` for the full `TemplateSchema`. Key fields:

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  storyTemplate: Partial<AgentStory>;
  isBuiltIn: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt: string;
  usageCount: number;
  whenToUse?: string;
  exampleScenarios?: string[];
}
```

---

## API Endpoints

### List Templates

```
GET /api/templates
Query params:
  - category?: TemplateCategory
  - search?: string
  - includeBuiltIn?: boolean (default: true)

Response: Template[]
```

### Get Template

```
GET /api/templates/:id
Response: Template
```

### Create Template (Organization)

```
POST /api/templates
Body: {
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  storyTemplate: Partial<AgentStory>;
  whenToUse?: string;
  exampleScenarios?: string[];
}
Response: Template
```

### Update Template

```
PUT /api/templates/:id
Body: Partial<Template>
Response: Template
```

### Delete Template

```
DELETE /api/templates/:id
Response: 204 No Content
```

### Increment Usage

```
POST /api/templates/:id/use
Response: { usageCount: number }
```

---

## Template Validation

Templates must pass the following validation:

1. **Required fields**: name, description, category, storyTemplate
2. **Story template format**: Must specify format ('light' or 'full')
3. **Partial validation**: storyTemplate fields present must be valid per schema
4. **No identifier**: storyTemplate should not include identifier (user provides)
5. **No timestamps**: storyTemplate should not include createdAt/updatedAt

---

## Phase 2+ Features

### Template Versioning
- Track template versions
- Stories link to template version used
- Update stories when template changes (opt-in)

### Template Marketplace
- Public template sharing
- Rating and reviews
- Verified publisher badges
- Import from marketplace

### AI-Assisted Template Generation
- Describe agent in natural language
- System generates template suggestions
- Refine and customize generated templates
