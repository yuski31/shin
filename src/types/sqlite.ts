// SQLite Database Types
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// Auth table - User authentication credentials
export interface Auth extends BaseEntity {
  user_id: number;
  provider: string;
  provider_id: string;
  password_hash?: string;
  refresh_token?: string;
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
}

// Chat table - Chat sessions and metadata
export interface Chat extends BaseEntity {
  user_id: number;
  title: string;
  model?: string;
  system_prompt?: string;
  settings?: string;
  status: 'active' | 'archived' | 'deleted';
}

// Message table - Individual chat messages
export interface Message extends BaseEntity {
  chat_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokens?: number;
  metadata?: string;
}

// File table - Uploaded files and metadata
export interface File extends BaseEntity {
  user_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  metadata?: string;
}

// Document table - Documents for knowledge management
export interface Document extends BaseEntity {
  user_id: number;
  title: string;
  content?: string;
  type?: string;
  metadata?: string;
}

// Knowledge table - Knowledge base entries
export interface Knowledge extends BaseEntity {
  user_id: number;
  title: string;
  content: string;
  category?: string;
  tags?: string;
  metadata?: string;
}

// Model table - AI model configurations
export interface Model extends BaseEntity {
  name: string;
  provider: string;
  model_id: string;
  config?: string;
  is_active: boolean;
}

// Prompt table - AI prompt templates
export interface Prompt extends BaseEntity {
  user_id?: number;
  name: string;
  content: string;
  category?: string;
  tags?: string;
  is_public: boolean;
  usage_count: number;
}

// Function table - Custom functions and configurations
export interface Function extends BaseEntity {
  user_id?: number;
  name: string;
  description?: string;
  code: string;
  language: string;
  is_active: boolean;
}

// Tool table - System tools and integrations
export interface Tool extends BaseEntity {
  name: string;
  description?: string;
  type: string;
  config?: string;
  is_active: boolean;
}

// Group table - User groups and permissions
export interface Group extends BaseEntity {
  name: string;
  description?: string;
  permissions?: string;
}

// Group members table
export interface GroupMember extends BaseEntity {
  group_id: number;
  user_id: number;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

// Folder table - File/content organization
export interface Folder extends BaseEntity {
  user_id?: number;
  name: string;
  parent_id?: number;
}

// Channel table - Chat channels
export interface Channel extends BaseEntity {
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  created_by?: number;
}

// Channel members table
export interface ChannelMember extends BaseEntity {
  channel_id: number;
  user_id: number;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

// Config table - System-wide configuration
export interface Config extends BaseEntity {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category?: string;
}

// Feedback table - User feedback and ratings
export interface Feedback extends BaseEntity {
  user_id?: number;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  subject: string;
  message: string;
  rating?: number;
  metadata?: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

// Memory table - Chat history and context
export interface Memory extends BaseEntity {
  user_id: number;
  chat_id?: number;
  type: 'conversation' | 'preference' | 'fact' | 'reminder';
  content: string;
  importance: number;
  metadata?: string;
}

// Tag table - Content categorization
export interface Tag extends BaseEntity {
  name: string;
  color?: string;
  description?: string;
}

// Content tags junction table
export interface ContentTag extends BaseEntity {
  content_type: 'chat' | 'document' | 'knowledge' | 'file';
  content_id: number;
  tag_id: number;
}

// API keys table
export interface ApiKey extends BaseEntity {
  user_id: number;
  name: string;
  key_hash: string;
  permissions?: string;
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
  is_active: boolean;
}

// Usage events table
export interface UsageEvent extends BaseEntity {
  user_id?: number;
  api_key_id?: number;
  event_type: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  response_time?: number;
  tokens_used?: number;
  cost?: number;
  metadata?: string;
}

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  lastInsertRowid?: number;
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

// Collection names (for compatibility with existing code)
export const COLLECTIONS = {
  AUTH: 'auth',
  USER: 'user',
  CHAT: 'chat',
  MESSAGE: 'message',
  FILE: 'file',
  DOCUMENT: 'document',
  KNOWLEDGE: 'knowledge',
  MODEL: 'model',
  PROMPT: 'prompt',
  FUNCTION: 'function',
  TOOL: 'tool',
  GROUP: 'group',
  GROUP_MEMBER: 'group_member',
  FOLDER: 'folder',
  CHANNEL: 'channel',
  CHANNEL_MEMBER: 'channel_member',
  CONFIG: 'config',
  FEEDBACK: 'feedback',
  MEMORY: 'memory',
  TAG: 'tag',
  CONTENT_TAG: 'content_tag',
  API_KEY: 'api_key',
  USAGE_EVENT: 'usage_event',
} as const;

// All types are already exported as interfaces above