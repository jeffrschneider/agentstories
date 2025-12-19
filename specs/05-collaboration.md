# Collaboration Features Specification

## Overview

Collaboration features enable teams to work together on Agent Stories. Phase 1 includes basic sharing and commenting; Phase 2 adds real-time collaborative editing.

---

## Phase 1: Basic Collaboration

### Features
- Story sharing with role-based access
- Threaded comments anchored to story elements
- Change history and audit log
- Notification system (email + in-app)

### Deferred to Phase 2
- Real-time presence indicators
- Simultaneous editing with operational transforms
- Live cursor positions
- Conflict resolution UI

---

## Access Control

### Permission Model

| Role | View | Comment | Edit | Delete | Share | Admin |
|------|------|---------|------|--------|-------|-------|
| Viewer | ✓ | - | - | - | - | - |
| Commenter | ✓ | ✓ | - | - | - | - |
| Editor | ✓ | ✓ | ✓ | - | - | - |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Sharing Schema

```typescript
// /lib/schemas/sharing.ts

export const SharePermissionEnum = z.enum([
  'viewer',
  'commenter',
  'editor',
  'admin'
]);

export const ShareTargetTypeEnum = z.enum([
  'user',
  'team',
  'organization',
  'public_link'
]);

export const StoryShareSchema = z.object({
  id: z.string().uuid(),
  storyId: z.string().uuid(),
  targetType: ShareTargetTypeEnum,
  targetId: z.string().optional(), // null for public_link
  permission: SharePermissionEnum,
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),

  // For public links
  linkToken: z.string().optional(),
  linkPassword: z.string().optional(), // hashed
  accessCount: z.number().int().default(0),
  maxAccesses: z.number().int().optional()
});

export type StoryShare = z.infer<typeof StoryShareSchema>;
```

### Sharing UI

```
┌─────────────────────────────────────────────────────────────────────┐
│ Share "Support Triage Agent"                             [× Close]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PEOPLE WITH ACCESS                                                  │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 👤 Sarah Chen (you)                           Owner      [—]    │ │
│ │ 👤 Marcus Johnson                             Editor     [▼]    │ │
│ │ 👥 Engineering Team                           Viewer     [▼]    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ADD PEOPLE OR TEAMS                                                 │
│ [🔍 Search by name or email...              ] [Viewer ▼] [Add]     │
│                                                                     │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                     │
│ LINK SHARING                                                        │
│ ○ Restricted - Only people added above can access                   │
│ ● Anyone with the link can view                                     │
│                                                                     │
│ 🔗 https://app.agentstory.build/s/abc123xyz    [Copy Link]         │
│                                                                     │
│ ☐ Require password                                                  │
│ ☐ Set expiration date                                               │
│                                                                     │
│                                                          [Done]     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Comments System

### Comment Schema

```typescript
// /lib/schemas/comments.ts

export const CommentAnchorSchema = z.object({
  // Which part of the story this comment refers to
  section: z.enum([
    'core',           // Core story (role, trigger, action, outcome)
    'autonomy',
    'behavior',
    'skills',
    'human_collab',
    'agent_collab',
    'memory',
    'quality'
  ]),

  // Specific field within section (optional)
  field: z.string().optional(),

  // For precise text selection (optional)
  textRange: z.object({
    start: z.number().int().min(0),
    end: z.number().int().min(0)
  }).optional()
});

export const CommentSchema = z.object({
  id: z.string().uuid(),
  storyId: z.string().uuid(),
  parentId: z.string().uuid().optional(), // For replies

  anchor: CommentAnchorSchema.optional(), // null for general comments
  content: z.string().min(1).max(5000),

  authorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),

  // Status
  resolved: z.boolean().default(false),
  resolvedBy: z.string().uuid().optional(),
  resolvedAt: z.string().datetime().optional(),

  // Reactions (emoji counts)
  reactions: z.record(z.number().int().min(0)).optional()
});

export type Comment = z.infer<typeof CommentSchema>;
export type CommentAnchor = z.infer<typeof CommentAnchorSchema>;
```

### Comment UI - Side Panel

```
┌─────────────────────────────────────────────┐
│ Comments (5)                    [+ Add] [×] │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📌 Trigger Configuration                │ │
│ │                                         │ │
│ │ 👤 Marcus Johnson • 2 hours ago         │ │
│ │ Should we consider adding a fallback    │ │
│ │ trigger for when the support-gateway    │ │
│ │ is unavailable?                         │ │
│ │                                         │ │
│ │ 👍 2  💬 Reply  ✓ Resolve               │ │
│ │                                         │ │
│ │   ┌───────────────────────────────────┐ │ │
│ │   │ 👤 Sarah Chen • 1 hour ago        │ │ │
│ │   │ Good point! I've added a manual   │ │ │
│ │   │ trigger as backup.                │ │ │
│ │   │                                   │ │ │
│ │   │ 👍 1                              │ │ │
│ │   └───────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📌 Autonomy Level                       │ │
│ │                                         │ │
│ │ 👤 David Kim • 1 day ago        ✓ Resolved │ │
│ │ For compliance, we need documented     │ │
│ │ justification for supervised vs        │ │
│ │ collaborative autonomy.                │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Show resolved comments]                    │
└─────────────────────────────────────────────┘
```

### Inline Comment Indicators

When viewing the Story Canvas, anchored comments show as indicators:

```
┌─────────────────────────────────────────────────────────────────┐
│ triggered by [MESSAGE ▼] from [support-gateway]        💬 2    │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ I [classify the incoming support request by topic and...]      │
│                                                                 │
│ so that [customers receive faster responses...]                 │
│                                                                 │
│ Autonomy: [○ Full ○ Supervised ● Collab ○ Directed]    💬 1 ✓  │
└─────────────────────────────────────────────────────────────────┘
```

- 💬 N = N unresolved comments
- 💬 N ✓ = N resolved comments (dimmed)
- Clicking opens the Comments panel filtered to that section

---

## Change History

### Activity Log Schema

```typescript
// /lib/schemas/activity.ts

export const ActivityTypeEnum = z.enum([
  'created',
  'updated',
  'deleted',
  'restored',
  'shared',
  'unshared',
  'commented',
  'resolved_comment',
  'exported',
  'upgraded_format',
  'downgraded_format'
]);

export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  storyId: z.string().uuid(),
  actorId: z.string().uuid(),
  type: ActivityTypeEnum,
  timestamp: z.string().datetime(),

  // Type-specific details
  details: z.object({
    // For 'updated': changed fields
    changedFields: z.array(z.string()).optional(),

    // For 'shared'/'unshared': target info
    shareTarget: z.string().optional(),
    sharePermission: SharePermissionEnum.optional(),

    // For 'commented': comment ID
    commentId: z.string().uuid().optional(),

    // For 'exported': format
    exportFormat: z.string().optional()
  }).optional(),

  // Snapshot for diffing (stored separately, reference only)
  snapshotId: z.string().uuid().optional()
});

export type ActivityLog = z.infer<typeof ActivityLogSchema>;
```

### History UI

```
┌─────────────────────────────────────────────────────────────────────┐
│ Activity History                                         [× Close]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Today                                                               │
│ ────────                                                            │
│ 👤 Sarah Chen edited this story              10:30 AM    [View diff]│
│    Changed: trigger, action                                         │
│                                                                     │
│ 👤 Marcus Johnson commented                  9:45 AM                │
│    "Should we consider adding a fallback..."                        │
│                                                                     │
│ Yesterday                                                           │
│ ─────────                                                           │
│ 👤 Sarah Chen shared with Engineering Team   4:15 PM                │
│    Permission: Viewer                                               │
│                                                                     │
│ 👤 Sarah Chen upgraded to Full format        2:00 PM                │
│                                                                     │
│ Dec 15, 2025                                                        │
│ ────────────                                                        │
│ 👤 Sarah Chen created this story             9:00 AM                │
│                                                                     │
│ [Load more...]                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Diff View

When clicking "View diff" on an update activity:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Changes by Sarah Chen • Dec 19, 2025 10:30 AM            [× Close]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ TRIGGER                                                             │
│ ─ Source Agents: [support-gateway]                                  │
│ + Source Agents: [support-gateway, backup-gateway]                  │
│                                                                     │
│ ACTION                                                              │
│ ─ classify the incoming support request by topic and urgency,       │
│   then route to the appropriate specialized support queue           │
│ + classify the incoming support request by topic, urgency, and      │
│   language, then route to the appropriate specialized support       │
│   queue or translation service                                      │
│                                                                     │
│                                    [Restore this version] [Close]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Notifications

### Notification Types

| Event | Recipients | Channel |
|-------|------------|---------|
| Comment added | Story editors/admins, @mentioned users | In-app, Email |
| Comment reply | Parent comment author | In-app, Email |
| Comment resolved | Comment author | In-app |
| Story shared with you | Share target | In-app, Email |
| Story updated | Watchers | In-app |
| Mention in comment | Mentioned user | In-app, Email |

### Notification Schema

```typescript
// /lib/schemas/notifications.ts

export const NotificationTypeEnum = z.enum([
  'comment_added',
  'comment_reply',
  'comment_resolved',
  'comment_mention',
  'story_shared',
  'story_updated',
  'access_revoked'
]);

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: NotificationTypeEnum,

  // Reference to source
  storyId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
  actorId: z.string().uuid(),

  // Display
  title: z.string(),
  body: z.string(),
  url: z.string().optional(),

  // State
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),

  // Email tracking
  emailSent: z.boolean().default(false),
  emailSentAt: z.string().datetime().optional()
});

export type Notification = z.infer<typeof NotificationSchema>;
```

### Notification Preferences

Users can configure notification preferences:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Notification Preferences                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                           In-App    Email           │
│ Comments                                                            │
│   New comments on my stories              [✓]       [✓]            │
│   Replies to my comments                  [✓]       [✓]            │
│   @mentions                               [✓]       [✓]            │
│   Comment resolved                        [✓]       [ ]            │
│                                                                     │
│ Sharing                                                             │
│   Story shared with me                    [✓]       [✓]            │
│   Access revoked                          [✓]       [ ]            │
│                                                                     │
│ Updates                                                             │
│   Changes to watched stories              [✓]       [ ]            │
│                                                                     │
│ Email Digest                                                        │
│   [○ Immediate  ● Daily digest  ○ Weekly digest  ○ Never]          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Watch/Follow Stories

Users can watch stories to receive update notifications:

```typescript
// /lib/schemas/watch.ts

export const StoryWatchSchema = z.object({
  userId: z.string().uuid(),
  storyId: z.string().uuid(),
  createdAt: z.string().datetime(),

  // Notification preferences for this watch
  notifyOnEdit: z.boolean().default(true),
  notifyOnComment: z.boolean().default(true)
});
```

UI: Toggle button in story header
- 👁 Watch / 👁 Watching ▼

---

## API Endpoints

### Sharing

```
# List shares for a story
GET /api/stories/:id/shares
Response: StoryShare[]

# Add share
POST /api/stories/:id/shares
Body: { targetType, targetId?, permission, expiresAt? }
Response: StoryShare

# Update share permission
PATCH /api/stories/:id/shares/:shareId
Body: { permission }
Response: StoryShare

# Remove share
DELETE /api/stories/:id/shares/:shareId
Response: 204

# Generate public link
POST /api/stories/:id/shares/public-link
Body: { permission, password?, expiresAt?, maxAccesses? }
Response: { url, token }

# Access public link
GET /api/s/:token
Headers: X-Link-Password (optional)
Response: AgentStory (based on permission)
```

### Comments

```
# List comments for a story
GET /api/stories/:id/comments
Query: resolved?, anchor.section?
Response: Comment[]

# Add comment
POST /api/stories/:id/comments
Body: { content, anchor?, parentId? }
Response: Comment

# Update comment
PATCH /api/comments/:id
Body: { content }
Response: Comment

# Delete comment
DELETE /api/comments/:id
Response: 204

# Resolve/unresolve comment
POST /api/comments/:id/resolve
Body: { resolved: boolean }
Response: Comment

# Add reaction
POST /api/comments/:id/reactions
Body: { emoji: string }
Response: { reactions: Record<string, number> }
```

### Activity

```
# Get activity log for a story
GET /api/stories/:id/activity
Query: limit?, before?, type?
Response: { activities: ActivityLog[], hasMore: boolean }

# Get story snapshot (for diffing)
GET /api/stories/:id/snapshots/:snapshotId
Response: AgentStory
```

### Notifications

```
# List notifications
GET /api/notifications
Query: read?, limit?, before?
Response: { notifications: Notification[], unreadCount: number }

# Mark as read
POST /api/notifications/:id/read
Response: Notification

# Mark all as read
POST /api/notifications/read-all
Response: { updatedCount: number }

# Update preferences
PUT /api/users/me/notification-preferences
Body: NotificationPreferences
Response: NotificationPreferences
```

### Watch

```
# Watch a story
POST /api/stories/:id/watch
Body: { notifyOnEdit?, notifyOnComment? }
Response: StoryWatch

# Unwatch
DELETE /api/stories/:id/watch
Response: 204

# Get watch status
GET /api/stories/:id/watch
Response: StoryWatch | null
```

---

## Phase 2: Real-Time Collaboration

### Presence System

Show who's currently viewing/editing:

```
┌─────────────────────────────────────────────────────────────────┐
│ Support Triage Agent                    👤SC 👤MJ    [Share ▼]  │
│                                         ↑ Sarah  ↑ Marcus       │
└─────────────────────────────────────────────────────────────────┘
```

### Collaborative Editing

- WebSocket-based real-time sync
- Operational Transformation (OT) for conflict resolution
- Cursor position sharing
- Selection highlighting per user

### Conflict Resolution

When two users edit the same field:

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚠️ Edit Conflict                                         [× Close]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Marcus Johnson edited this field while you were editing.            │
│                                                                     │
│ YOUR VERSION                                                        │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ classify by topic, urgency, and language                        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ MARCUS'S VERSION                                                    │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ classify by topic, urgency, and priority                        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│           [Keep Mine] [Use Marcus's] [Edit Merged Version]          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Additions

```sql
-- Story shares
CREATE TABLE story_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES agent_stories(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID, -- null for public links
  permission VARCHAR(20) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  link_token VARCHAR(32) UNIQUE,
  link_password_hash VARCHAR(255),
  access_count INTEGER DEFAULT 0,
  max_accesses INTEGER,
  UNIQUE(story_id, target_type, target_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES agent_stories(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  anchor_section VARCHAR(50),
  anchor_field VARCHAR(100),
  anchor_text_start INTEGER,
  anchor_text_end INTEGER,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  reactions JSONB DEFAULT '{}'
);

-- Activity log
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES agent_stories(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  snapshot_id UUID
);

-- Story snapshots (for version history)
CREATE TABLE story_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES agent_stories(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  story_id UUID REFERENCES agent_stories(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  url VARCHAR(500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ
);

-- Story watches
CREATE TABLE story_watches (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES agent_stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notify_on_edit BOOLEAN DEFAULT TRUE,
  notify_on_comment BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, story_id)
);

-- Indexes
CREATE INDEX idx_shares_story ON story_shares(story_id);
CREATE INDEX idx_shares_target ON story_shares(target_type, target_id);
CREATE INDEX idx_shares_token ON story_shares(link_token) WHERE link_token IS NOT NULL;
CREATE INDEX idx_comments_story ON comments(story_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_activity_story ON activity_logs(story_id);
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;
```
