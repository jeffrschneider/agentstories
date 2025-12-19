# API Specification

## Overview

This specification defines the REST API for Agent Story Builder. All endpoints follow REST conventions with JSON request/response bodies.

---

## Base URL

```
Production: https://api.agentstorybuilder.com/v1
Development: http://localhost:3000/api
```

---

## Authentication

### Session-Based (Phase 1)

Next.js App Router with NextAuth.js session cookies.

```
Cookie: next-auth.session-token=...
```

### API Keys (Phase 3)

For programmatic access:

```
Authorization: Bearer asb_live_xxxxxxxxxxxx
```

API key scopes: `stories:read`, `stories:write`, `templates:read`, `templates:write`, `export`

---

## Common Response Formats

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-12-19T10:30:00Z"
  }
}
```

### List Response

```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "identifier",
        "message": "Must be lowercase alphanumeric with hyphens"
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-12-19T10:30:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate identifier) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Stories API

### List Stories

```
GET /api/stories
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | `light` \| `full` | Filter by story format |
| `autonomyLevel` | string | Filter by autonomy level |
| `tags` | string | Comma-separated tags (AND logic) |
| `search` | string | Full-text search in name, identifier, role |
| `sort` | string | Sort field: `name`, `updatedAt`, `createdAt` |
| `order` | `asc` \| `desc` | Sort order (default: `desc`) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `offset` | number | Pagination offset |

**Response:**

```typescript
interface ListStoriesResponse {
  data: AgentStory[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

**Example:**

```bash
curl -X GET "https://api.agentstorybuilder.com/v1/stories?format=full&sort=updatedAt&limit=10" \
  -H "Cookie: next-auth.session-token=..."
```

---

### Get Story

```
GET /api/stories/:id
```

**Response:**

```typescript
interface GetStoryResponse {
  data: AgentStory;
}
```

**Error Responses:**
- `404`: Story not found
- `403`: No access to this story

---

### Create Story

```
POST /api/stories
```

**Request Body:**

```typescript
interface CreateStoryRequest {
  format: 'light' | 'full';
  identifier: string;
  name: string;
  role: string;
  trigger: Trigger;
  action: string;
  outcome: string;
  autonomyLevel: AutonomyLevel;

  // Optional
  tags?: string[];
  notes?: string;

  // Full format only
  behaviorConfig?: BehaviorConfig;
  skillsInventory?: SkillsInventory;
  humanCollaboration?: HumanCollaboration;
  agentCollaboration?: AgentCollaboration;
  memoryArchitecture?: MemoryArchitecture;
  qualityRequirements?: QualityRequirements;
  constraints?: Constraints;
}
```

**Response:**

```typescript
interface CreateStoryResponse {
  data: AgentStory; // Includes generated id, createdAt, updatedAt
}
```

**Error Responses:**
- `400`: Validation error
- `409`: Identifier already exists in organization

---

### Update Story

```
PUT /api/stories/:id
```

**Request Body:** Same as Create, but all fields optional except `format`.

**Response:**

```typescript
interface UpdateStoryResponse {
  data: AgentStory;
}
```

**Error Responses:**
- `400`: Validation error
- `403`: No edit access
- `404`: Story not found
- `409`: Concurrent modification (include `If-Match` header for optimistic locking)

**Optimistic Locking:**

Include `If-Match` header with the story's `updatedAt` value:

```bash
curl -X PUT "https://api.agentstorybuilder.com/v1/stories/123" \
  -H "If-Match: 2025-12-19T10:00:00Z" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'
```

If the story was modified since, returns `409 Conflict` with:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Story was modified by another user",
    "details": {
      "serverVersion": "2025-12-19T10:15:00Z",
      "clientVersion": "2025-12-19T10:00:00Z"
    }
  }
}
```

---

### Delete Story

```
DELETE /api/stories/:id
```

**Response:** `204 No Content`

**Error Responses:**
- `403`: No delete access
- `404`: Story not found

---

### Duplicate Story

```
POST /api/stories/:id/duplicate
```

**Request Body (optional):**

```typescript
interface DuplicateStoryRequest {
  name?: string;      // Defaults to "{original} (copy)"
  identifier?: string; // Defaults to "{original}-copy" or next available
}
```

**Response:**

```typescript
interface DuplicateStoryResponse {
  data: AgentStory; // The new story
}
```

---

### Upgrade Story Format

```
POST /api/stories/:id/upgrade
```

Upgrades a Light format story to Full format.

**Response:**

```typescript
interface UpgradeStoryResponse {
  data: AgentStoryFull;
}
```

**Error Responses:**
- `400`: Story is already Full format

---

### Export Story

```
POST /api/stories/:id/export
```

**Request Body:**

```typescript
interface ExportStoryRequest {
  format: 'markdown' | 'json' | 'pdf';
  options?: MarkdownExportOptions | JsonExportOptions | PdfExportOptions;
}
```

**Response:**

Direct file download with appropriate Content-Type and Content-Disposition headers.

---

### Bulk Export

```
POST /api/stories/export
```

**Request Body:**

```typescript
interface BulkExportRequest {
  storyIds: string[];
  format: 'markdown' | 'json';
  options?: ExportOptions;
}
```

**Response:**

- Single story: Direct file
- Multiple stories: ZIP archive

---

## Templates API

### List Templates

```
GET /api/templates
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `search` | string | Search in name, description |
| `includeBuiltIn` | boolean | Include built-in templates (default: true) |
| `limit` | number | Items per page |
| `offset` | number | Pagination offset |

**Response:**

```typescript
interface ListTemplatesResponse {
  data: Template[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

---

### Get Template

```
GET /api/templates/:id
```

**Response:**

```typescript
interface GetTemplateResponse {
  data: Template;
}
```

---

### Create Template

```
POST /api/templates
```

**Request Body:**

```typescript
interface CreateTemplateRequest {
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  storyTemplate: Partial<AgentStory>;
  whenToUse?: string;
  exampleScenarios?: string[];
}
```

**Response:**

```typescript
interface CreateTemplateResponse {
  data: Template;
}
```

---

### Update Template

```
PUT /api/templates/:id
```

**Request Body:** Same as Create, all fields optional.

**Response:**

```typescript
interface UpdateTemplateResponse {
  data: Template;
}
```

**Error Responses:**
- `403`: Cannot modify built-in templates

---

### Delete Template

```
DELETE /api/templates/:id
```

**Response:** `204 No Content`

**Error Responses:**
- `403`: Cannot delete built-in templates

---

### Record Template Usage

```
POST /api/templates/:id/use
```

Records that a template was used to create a story.

**Response:**

```typescript
interface UseTemplateResponse {
  data: {
    usageCount: number;
  };
}
```

---

## Sharing API

### List Story Shares

```
GET /api/stories/:id/shares
```

**Response:**

```typescript
interface ListSharesResponse {
  data: StoryShare[];
}
```

---

### Create Share

```
POST /api/stories/:id/shares
```

**Request Body:**

```typescript
interface CreateShareRequest {
  targetType: 'user' | 'team' | 'organization';
  targetId: string;
  permission: 'viewer' | 'commenter' | 'editor' | 'admin';
  expiresAt?: string;
}
```

**Response:**

```typescript
interface CreateShareResponse {
  data: StoryShare;
}
```

---

### Create Public Link

```
POST /api/stories/:id/shares/public-link
```

**Request Body:**

```typescript
interface CreatePublicLinkRequest {
  permission: 'viewer' | 'commenter';
  password?: string;
  expiresAt?: string;
  maxAccesses?: number;
}
```

**Response:**

```typescript
interface CreatePublicLinkResponse {
  data: {
    url: string;
    token: string;
    expiresAt?: string;
  };
}
```

---

### Update Share

```
PATCH /api/stories/:id/shares/:shareId
```

**Request Body:**

```typescript
interface UpdateShareRequest {
  permission?: SharePermission;
  expiresAt?: string | null;
}
```

---

### Delete Share

```
DELETE /api/stories/:id/shares/:shareId
```

**Response:** `204 No Content`

---

### Access Public Link

```
GET /api/s/:token
```

**Headers:**
- `X-Link-Password`: Required if link has password

**Response:**

```typescript
interface PublicLinkResponse {
  data: AgentStory; // Fields limited by permission
  meta: {
    permission: SharePermission;
    expiresAt?: string;
  };
}
```

---

## Comments API

### List Comments

```
GET /api/stories/:id/comments
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resolved` | boolean | Filter by resolved status |
| `section` | string | Filter by anchor section |
| `includeReplies` | boolean | Include threaded replies (default: true) |

**Response:**

```typescript
interface ListCommentsResponse {
  data: Comment[];
}
```

---

### Create Comment

```
POST /api/stories/:id/comments
```

**Request Body:**

```typescript
interface CreateCommentRequest {
  content: string;
  anchor?: CommentAnchor;
  parentId?: string; // For replies
}
```

**Response:**

```typescript
interface CreateCommentResponse {
  data: Comment;
}
```

---

### Update Comment

```
PATCH /api/comments/:id
```

**Request Body:**

```typescript
interface UpdateCommentRequest {
  content: string;
}
```

---

### Delete Comment

```
DELETE /api/comments/:id
```

**Response:** `204 No Content`

---

### Resolve Comment

```
POST /api/comments/:id/resolve
```

**Request Body:**

```typescript
interface ResolveCommentRequest {
  resolved: boolean;
}
```

---

### Add Reaction

```
POST /api/comments/:id/reactions
```

**Request Body:**

```typescript
interface AddReactionRequest {
  emoji: string;
}
```

---

## Activity API

### Get Activity Log

```
GET /api/stories/:id/activity
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by activity type |
| `before` | string | Cursor for pagination (timestamp) |
| `limit` | number | Items to return |

**Response:**

```typescript
interface ActivityLogResponse {
  data: ActivityLog[];
  meta: {
    hasMore: boolean;
    nextCursor?: string;
  };
}
```

---

### Get Story Snapshot

```
GET /api/stories/:id/snapshots/:snapshotId
```

**Response:**

```typescript
interface SnapshotResponse {
  data: AgentStory;
  meta: {
    createdAt: string;
  };
}
```

---

## Notifications API

### List Notifications

```
GET /api/notifications
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `read` | boolean | Filter by read status |
| `before` | string | Cursor for pagination |
| `limit` | number | Items to return |

**Response:**

```typescript
interface NotificationsResponse {
  data: Notification[];
  meta: {
    unreadCount: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}
```

---

### Mark Notification Read

```
POST /api/notifications/:id/read
```

---

### Mark All Read

```
POST /api/notifications/read-all
```

**Response:**

```typescript
interface MarkAllReadResponse {
  data: {
    updatedCount: number;
  };
}
```

---

## Users API

### Get Current User

```
GET /api/users/me
```

**Response:**

```typescript
interface CurrentUserResponse {
  data: User & {
    organizations: Array<{
      organization: Organization;
      role: UserRole;
    }>;
  };
}
```

---

### Update Profile

```
PATCH /api/users/me
```

**Request Body:**

```typescript
interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
}
```

---

### Get Notification Preferences

```
GET /api/users/me/notification-preferences
```

---

### Update Notification Preferences

```
PUT /api/users/me/notification-preferences
```

**Request Body:**

```typescript
interface NotificationPreferences {
  comments: {
    newComments: { inApp: boolean; email: boolean };
    replies: { inApp: boolean; email: boolean };
    mentions: { inApp: boolean; email: boolean };
    resolved: { inApp: boolean; email: boolean };
  };
  sharing: {
    sharedWithMe: { inApp: boolean; email: boolean };
    accessRevoked: { inApp: boolean; email: boolean };
  };
  updates: {
    watchedStories: { inApp: boolean; email: boolean };
  };
  emailDigest: 'immediate' | 'daily' | 'weekly' | 'never';
}
```

---

## Organizations API (Phase 2)

### List Organizations

```
GET /api/organizations
```

---

### Get Organization

```
GET /api/organizations/:id
```

---

### Update Organization

```
PATCH /api/organizations/:id
```

---

### List Members

```
GET /api/organizations/:id/members
```

---

### Invite Member

```
POST /api/organizations/:id/invites
```

---

### Update Member Role

```
PATCH /api/organizations/:id/members/:userId
```

---

### Remove Member

```
DELETE /api/organizations/:id/members/:userId
```

---

## Rate Limiting

| Endpoint Category | Limit |
|-------------------|-------|
| Read operations | 100 req/min |
| Write operations | 30 req/min |
| Export operations | 10 req/min |
| Authentication | 10 req/min |

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703001600
```

---

## Webhooks (Phase 3)

### Webhook Events

| Event | Description |
|-------|-------------|
| `story.created` | New story created |
| `story.updated` | Story was modified |
| `story.deleted` | Story was deleted |
| `story.shared` | Story was shared |
| `comment.created` | New comment added |

### Webhook Payload

```typescript
interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: {
    story?: AgentStory;
    comment?: Comment;
    actor: {
      id: string;
      name: string;
    };
  };
}
```

### Webhook Signature

Webhooks include HMAC signature for verification:

```
X-Webhook-Signature: sha256=...
```

---

## OpenAPI Schema

Full OpenAPI 3.0 specification available at:

```
GET /api/openapi.json
GET /api/openapi.yaml
```

Interactive documentation:

```
GET /api/docs
```
