// API Key Management Types
export interface CreateApiKeyRequest {
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: string;
  organizationId?: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string; // Only returned on creation
  scopes: ApiKeyScope[];
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface ApiKeyListResponse {
  id: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  scopes: ApiKeyScope[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  usageCount: number;
}

export interface RotateApiKeyResponse {
  id: string;
  name: string;
  key: string; // Only returned on rotation
  scopes: ApiKeyScope[];
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  message: string;
}

// Usage and Analytics Types
export interface UsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  totalEvents: number;
  uniqueProviders: string[];
  uniqueModels: string[];
}

export interface DailyUsage {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  date: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  eventCount: number;
}

export interface ProviderUsage {
  _id: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  requestCount: number;
  models: string[];
}

export interface UsageResponse {
  organization: {
    id: string;
    name: string;
    plan: OrganizationPlan;
  };
  period: {
    start: string;
    end: string;
  };
  summary: UsageStats;
  quotaUsage: {
    requests: QuotaUsage;
    tokens: QuotaUsage;
  };
  dailyUsage: DailyUsage[];
  providerUsage: ProviderUsage[];
}

export interface QuotaUsage {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

export interface QuotasResponse {
  organization: {
    id: string;
    name: string;
    plan: OrganizationPlan;
  };
  daily: {
    requests: QuotaUsage;
    tokens: QuotaUsage;
  };
  monthly: {
    requests: QuotaUsage;
    tokens: QuotaUsage;
  };
  resetTime: {
    daily: string;
    monthly: string;
  };
}

// Organization Types
export type OrganizationPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrganizationMember {
  userId: string;
  role: OrganizationRole;
  joinedAt: string;
}

export interface OrganizationQuotas {
  requestsPerDay: number;
  tokensPerDay: number;
  requestsPerMonth: number;
  tokensPerMonth: number;
}

export interface OrganizationSettings {
  allowApiKeys: boolean;
  allowIpWhitelisting: boolean;
  allowRateLimiting: boolean;
  maxApiKeys: number;
  autoRotateKeys: boolean;
  keyRotationDays: number;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  owner: string;
  members: OrganizationMember[];
  plan: OrganizationPlan;
  quotas: OrganizationQuotas;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Key Scope Types
export const API_KEY_SCOPES = [
  'chat:read',
  'chat:write',
  'providers:read',
  'providers:write',
  'usage:read',
  'admin'
] as const;

export type ApiKeyScope = typeof API_KEY_SCOPES[number];

// Error Response Types
export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

// Request/Response Types for Chat API
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: TokenUsage;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Provider Types
export interface ProviderRequest {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  organizationId?: string;
}

export interface ProviderResponse {
  id: string;
  userId: string;
  organization: string;
  name: string;
  baseUrl: string;
  models: string[];
  isActive: boolean;
  lastTested?: string;
  testStatus?: 'success' | 'failed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

// Project Types
export interface ProjectRequest {
  name: string;
  description: string;
  template?: string;
  settings?: {
    framework: string;
    database: string;
    features: string[];
  };
  organizationId?: string;
}

export interface ProjectResponse {
  id: string;
  userId: string;
  organization: string;
  name: string;
  description: string;
  template: string;
  generatedCode: {
    frontend: string;
    backend: string;
    database: string;
    config: string;
  };
  status: 'generating' | 'ready' | 'deployed' | 'failed';
  deploymentUrl?: string;
  settings: {
    framework: string;
    database: string;
    features: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter Types
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
  period?: '1d' | '7d' | '30d' | '90d';
}

export interface UsageFilter extends DateRangeFilter {
  provider?: string;
  model?: string;
  organizationId?: string;
}

// Rate Limiting Types
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
}

export interface RateLimitStatus {
  remaining: number;
  resetTime: number;
  limit: number;
}