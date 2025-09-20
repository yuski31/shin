import {
  IProviderAdapter,
  ProviderConfig,
  ProviderHealth,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderError,
  RateLimitError,
  AuthenticationError
} from './base-provider';
import { ProviderType, SupportedFeatures } from '@/models/AIProvider';

export abstract class AbstractProviderAdapter implements IProviderAdapter {
  protected config: ProviderConfig;
  protected requestCount = 0;
  protected tokenCount = 0;
  protected lastRequestTime = 0;

  constructor(config: ProviderConfig) {
    this.config = { ...config, timeout: config.timeout || 30000, maxRetries: config.maxRetries || 3 };
  }

  abstract readonly type: ProviderType;
  abstract readonly supportedFeatures: SupportedFeatures[];

  // Abstract methods that must be implemented by concrete adapters
  abstract chat(request: ChatRequest): Promise<ChatResponse>;
  abstract embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  abstract healthCheck(): Promise<ProviderHealth>;
  abstract getAvailableModels(): Promise<string[]>;

  // Optional streaming support
  chatStream?(request: ChatRequest): AsyncIterable<ChatResponse>;

  // Common utility methods
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Check rate limits
      if (!this.checkRateLimits()) {
        throw new RateLimitError(this.type);
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      const responseTime = Date.now() - startTime;
      this.updateRateLimitTracking(responseTime);

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(
          `HTTP ${response.status}: ${errorText}`,
          this.type,
          response.status,
          this.isRetryableStatus(response.status)
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      // Handle network errors
      if (retryCount < this.config.maxRetries! && this.isRetryableError(error)) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      throw new ProviderError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.type,
        undefined,
        true
      );
    }
  }

  protected checkRateLimits(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Simple rate limiting - in production, you'd want more sophisticated tracking
    if (timeSinceLastRequest < 1000) { // 1 request per second max
      return false;
    }

    this.lastRequestTime = now;
    return true;
  }

  protected updateRateLimitTracking(responseTime: number): void {
    this.requestCount++;
    // Token counting would be more complex and provider-specific
  }

  protected isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  protected isRetryableError(error: any): boolean {
    return error instanceof TypeError || error.name === 'AbortError';
  }

  getRateLimits(): { requestsPerMinute: number; tokensPerMinute: number } {
    // This would be provider-specific in a real implementation
    return {
      requestsPerMinute: 60,
      tokensPerMinute: 100000,
    };
  }

  // Transform messages to provider-specific format
  protected abstract transformMessages(messages: ChatRequest['messages']): any[];

  // Transform response to unified format
  protected abstract transformChatResponse(response: any): ChatResponse;

  // Transform embeddings response to unified format
  protected abstract transformEmbeddingResponse(response: any): EmbeddingResponse;
}