// PostgreSQL Database Types
export interface BaseEntity {
  id: string; // UUID in PostgreSQL
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// User table - User profiles and account information
export interface User extends BaseEntity {
  email: string;
  username: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  metadata: Record<string, any>;
  settings: Record<string, any>;
}

// Auth table - User authentication credentials
export interface Auth extends BaseEntity {
  user_id: string;
  provider: string;
  provider_id: string;
  password_hash?: string;
  refresh_token?: string;
  metadata: Record<string, any>;
}

// Chat sessions with vector support for embeddings
export interface ChatSession extends BaseEntity {
  user_id: string;
  title: string;
  model?: string;
  system_prompt?: string;
  settings: Record<string, any>;
  status: 'active' | 'archived' | 'deleted';
  embedding?: number[]; // Vector for similarity search
  metadata: Record<string, any>;
}

// Messages with full-text search
export interface Message extends BaseEntity {
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokens?: number;
  metadata: Record<string, any>;
  embedding?: number[]; // Vector for similarity search
}

// Files with metadata storage
export interface File extends BaseEntity {
  user_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  metadata: Record<string, any>;
  embedding?: number[]; // Vector for similarity search
}

// Documents with full-text search
export interface Document extends BaseEntity {
  user_id: string;
  title: string;
  content?: string;
  type?: string;
  metadata: Record<string, any>;
  embedding?: number[]; // Vector for similarity search
}

// Knowledge base with vector search
export interface Knowledge extends BaseEntity {
  user_id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  metadata: Record<string, any>;
  embedding?: number[]; // Vector for similarity search
}

// AI models configuration
export interface Model extends BaseEntity {
  name: string;
  provider: string;
  model_id: string;
  config: Record<string, any>;
  is_active: boolean;
}

// Prompt templates
export interface Prompt extends BaseEntity {
  user_id?: string;
  name: string;
  content: string;
  category?: string;
  tags: string[];
  is_public: boolean;
  usage_count: number;
  metadata: Record<string, any>;
}

// Custom functions
export interface Function extends BaseEntity {
  user_id?: string;
  name: string;
  description?: string;
  code: string;
  language: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

// System tools
export interface Tool extends BaseEntity {
  name: string;
  description?: string;
  type: string;
  config: Record<string, any>;
  is_active: boolean;
}

// User groups
export interface Group extends BaseEntity {
  name: string;
  description?: string;
  permissions: Record<string, any>;
  metadata: Record<string, any>;
}

// Group memberships
export interface GroupMember extends BaseEntity {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

// File organization
export interface Folder extends BaseEntity {
  user_id?: string;
  name: string;
  parent_id?: string;
  metadata: Record<string, any>;
}

// Chat channels
export interface Channel extends BaseEntity {
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by?: string;
  metadata: Record<string, any>;
}

// Channel memberships
export interface ChannelMember extends BaseEntity {
  channel_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

// System configuration
export interface Config extends BaseEntity {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category?: string;
  metadata: Record<string, any>;
}

// User feedback
export interface Feedback extends BaseEntity {
  user_id?: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  subject: string;
  message: string;
  rating?: number;
  metadata: Record<string, any>;
  status: 'pending' | 'reviewed' | 'resolved';
}

// Chat memory and context
export interface Memory extends BaseEntity {
  user_id: string;
  chat_id?: string;
  type: 'conversation' | 'preference' | 'fact' | 'reminder';
  content: string;
  importance: number;
  metadata: Record<string, any>;
  embedding?: number[]; // Vector for similarity search
}

// Content tags
export interface Tag extends BaseEntity {
  name: string;
  color?: string;
  description?: string;
}

// Content tagging relationships
export interface ContentTag extends BaseEntity {
  content_type: 'chat' | 'document' | 'knowledge' | 'file';
  content_id: string;
  tag_id: string;
}

// API keys management
export interface ApiKey extends BaseEntity {
  user_id: string;
  name: string;
  key_hash: string;
  permissions: Record<string, any>;
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
  is_active: boolean;
  metadata: Record<string, any>;
}

// Usage tracking
export interface UsageEvent extends BaseEntity {
  user_id?: string;
  api_key_id?: string;
  event_type: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  response_time?: number;
  tokens_used?: number;
  cost?: number;
  metadata: Record<string, any>;
}

// Organization management
export interface Organization extends BaseEntity {
  name: string;
  description?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  quotas: {
    requestsPerDay: number;
    tokensPerDay: number;
    requestsPerMonth: number;
    tokensPerMonth: number;
  };
  members: Array<{
    userId: string;
    role: 'admin' | 'member' | 'viewer';
    joinedAt: string;
  }>;
  settings: Record<string, any>;
  metadata: Record<string, any>;
}

// Database operation result types
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rowsAffected?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Query options for database operations
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

// Filter conditions for queries
export interface QueryFilters {
  [key: string]: any;
}

// Update data for database operations
export interface UpdateData {
  [key: string]: any;
}

// Vector search options
export interface VectorSearchOptions {
  vector: number[];
  limit?: number;
  threshold?: number;
  filter?: QueryFilters;
}

// Full-text search options
export interface FullTextSearchOptions {
  query: string;
  limit?: number;
  filter?: QueryFilters;
  highlight?: boolean;
}

// Collection names (for compatibility with existing code)
export const COLLECTIONS = {
  USERS: 'users',
  AUTH: 'auth',
  CHAT_SESSIONS: 'chat_sessions',
  MESSAGES: 'messages',
  FILES: 'files',
  DOCUMENTS: 'documents',
  KNOWLEDGE: 'knowledge',
  MODELS: 'models',
  PROMPTS: 'prompts',
  FUNCTIONS: 'functions',
  TOOLS: 'tools',
  GROUPS: 'groups',
  GROUP_MEMBERS: 'group_members',
  FOLDERS: 'folders',
  CHANNELS: 'channels',
  CHANNEL_MEMBERS: 'channel_members',
  CONFIG: 'config',
  FEEDBACK: 'feedback',
  MEMORIES: 'memories',
  TAGS: 'tags',
  CONTENT_TAGS: 'content_tags',
  API_KEYS: 'api_keys',
  USAGE_EVENTS: 'usage_events',
  ORGANIZATIONS: 'organizations',
} as const;

// All types are already exported as interfaces above