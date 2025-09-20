import { ProviderType, SupportedFeatures, IAIProvider } from '@/models/AIProvider';

// Unified request/response interfaces
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: any;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  functions?: any[];
  function_call?: any;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string | null;
    delta?: Partial<ChatMessage>;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  user?: string;
}

export interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ProviderHealth {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

// Base provider interface
export interface IProviderAdapter {
  readonly type: ProviderType;
  readonly supportedFeatures: SupportedFeatures[];

  // Core methods
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream?(request: ChatRequest): AsyncIterable<ChatResponse>;
  embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  // Health and configuration
  healthCheck(): Promise<ProviderHealth>;
  getAvailableModels(): Promise<string[]>;

  // Rate limiting
  getRateLimits(): { requestsPerMinute: number; tokensPerMinute: number };
}

// Provider factory interface
export interface IProviderFactory {
  createProvider(config: ProviderConfig, providerDoc: IAIProvider): IProviderAdapter;
  getSupportedTypes(): ProviderType[];
  validateConfig(type: ProviderType, config: Partial<ProviderConfig>): boolean;
}

// Error classes
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerType: ProviderType,
    public readonly statusCode?: number,
    public readonly retryable?: boolean
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(providerType: ProviderType, retryAfter?: number) {
    super(
      `Rate limit exceeded for ${providerType}`,
      providerType,
      429,
      true
    );
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends ProviderError {
  constructor(providerType: ProviderType) {
    super(
      `Authentication failed for ${providerType}`,
      providerType,
      401,
      false
    );
    this.name = 'AuthenticationError';
  }
}