import { z } from 'zod';

// Persistent store types
export const PersistentStoreTypeEnum = z.enum([
  'kb',           // Knowledge base
  'vector',       // Vector database for embeddings
  'relational',   // Relational database
  'kv'            // Key-value store
]);

export type PersistentStoreType = z.infer<typeof PersistentStoreTypeEnum>;

// Update modes for persistent stores
export const StoreUpdateModeEnum = z.enum([
  'read_only',    // Agent can only read
  'append',       // Agent can add but not modify
  'full_crud'     // Full create, read, update, delete
]);

export type StoreUpdateMode = z.infer<typeof StoreUpdateModeEnum>;

// Persistent store schema
export const PersistentStoreSchema = z.object({
  name: z.string().min(1).describe('Memory Store Name'),
  type: PersistentStoreTypeEnum,
  purpose: z.string().min(1).describe('Why this memory exists'),
  updates: StoreUpdateModeEnum.default('read_only')
});

export type PersistentStore = z.infer<typeof PersistentStoreSchema>;

// Learning signal types
export const LearningTypeEnum = z.enum([
  'feedback_loop',    // Iterative improvement from feedback
  'reinforcement',    // Reward-based learning
  'fine_tuning'       // Model fine-tuning
]);

export type LearningType = z.infer<typeof LearningTypeEnum>;

// Learning configuration
export const LearningConfigSchema = z.object({
  type: LearningTypeEnum,
  signal: z.string().min(1).describe('What triggers learning')
});

export type LearningConfig = z.infer<typeof LearningConfigSchema>;

// Complete memory schema
export const MemorySchema = z.object({
  working: z.array(z.string()).optional().describe('Ephemeral context maintained during execution'),
  persistent: z.array(PersistentStoreSchema).optional(),
  learning: z.array(LearningConfigSchema).optional()
});

export type Memory = z.infer<typeof MemorySchema>;

// Memory metadata for UI
export const PERSISTENT_STORE_TYPE_METADATA = {
  kb: {
    label: 'Knowledge Base',
    description: 'Structured information storage'
  },
  vector: {
    label: 'Vector Database',
    description: 'Embeddings and semantic search'
  },
  relational: {
    label: 'Relational Database',
    description: 'Structured queries with SQL'
  },
  kv: {
    label: 'Key-Value Store',
    description: 'Fast lookups by key'
  }
} as const;

export const STORE_UPDATE_MODE_METADATA = {
  read_only: {
    label: 'Read Only',
    description: 'Agent can only read'
  },
  append: {
    label: 'Append',
    description: 'Agent can add but not modify'
  },
  full_crud: {
    label: 'Full CRUD',
    description: 'Full create, read, update, delete'
  }
} as const;

export const LEARNING_TYPE_METADATA = {
  feedback_loop: {
    label: 'Feedback Loop',
    description: 'Iterative improvement from feedback'
  },
  reinforcement: {
    label: 'Reinforcement',
    description: 'Reward-based learning'
  },
  fine_tuning: {
    label: 'Fine-tuning',
    description: 'Model fine-tuning'
  }
} as const;
