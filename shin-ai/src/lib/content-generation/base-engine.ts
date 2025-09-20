import { IGenerationEngine, IEngineConfig } from './interfaces';
import { ContentGenerationRequest, ContentGenerationResponse } from './content-factory';
import { providerFactory } from '../providers/provider-factory';
import { ProviderConfig } from '../providers/base-provider';

// Base engine configuration
export interface BaseEngineConfig extends IEngineConfig {
  defaultModel: string;
  supportedModels: string[];
  providerType: string;
  customParameters?: Record<string, any>;
  enableRateLimiting?: boolean;
}

// Abstract base engine class
export abstract class BaseGenerationEngine implements IGenerationEngine {
  protected config: BaseEngineConfig;
  protected providerAdapter: any;

  constructor(type: string, config: BaseEngineConfig) {
    this.config = config;
    this.initializeProvider();
  }

  abstract readonly type: string;
  abstract readonly supportedFormats: string[];

  // Abstract methods that must be implemented by subclasses
  abstract generate(request: ContentGenerationRequest): Promise<ContentGenerationResponse>;
  abstract validateRequest(request: ContentGenerationRequest): Promise<{ valid: boolean; error?: string }>;
  abstract estimateCost(request: ContentGenerationRequest): Promise<{ cost: number; tokens: number }>;

  // Common functionality
  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      if (this.providerAdapter) {
        const health = await this.providerAdapter.healthCheck();
        return {
          status: health.isHealthy ? 'OK' : 'ERROR',
          details: health
        };
      }
      return { status: 'OK' };
    } catch (error) {
      return {
        status: 'ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Provider initialization
  protected initializeProvider(): void {
    try {
      // This would typically load provider configuration from database
      // For now, using a basic configuration
      const providerConfig: ProviderConfig = {
        baseUrl: this.getProviderBaseUrl(),
        apiKey: this.getProviderApiKey(),
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries
      };

      // Get provider adapter from factory
      this.providerAdapter = providerFactory.createProvider(
        providerConfig,
        {
          type: this.config.providerType as any,
          name: `${this.type}-provider`,
          baseUrl: providerConfig.baseUrl,
          apiKey: providerConfig.apiKey,
          models: this.config.supportedModels,
          isActive: true,
          supportedFeatures: this.getSupportedFeatures(),
          healthStatus: {
            lastHealthCheck: new Date(),
            isHealthy: true,
            responseTime: 0,
            errorRate: 0,
            consecutiveFailures: 0
          },
          loadBalancing: {
            strategy: 'round-robin',
            failoverEnabled: true,
            maxRetries: 3,
            retryDelay: 1000,
            circuitBreakerThreshold: 5,
            healthCheckInterval: 30000
          }
        } as any
      );
    } catch (error) {
      console.error(`Failed to initialize provider for ${this.type} engine:`, error);
      throw error;
    }
  }

  // Helper methods for provider configuration
  protected getProviderBaseUrl(): string {
    // Implementation would get from environment or database
    const baseUrls: Record<string, string> = {
      'openai': 'https://api.openai.com/v1',
      'anthropic': 'https://api.anthropic.com',
      'google': 'https://generativelanguage.googleapis.com/v1',
      'cohere': 'https://api.cohere.ai/v1',
      'huggingface': 'https://api-inference.huggingface.co',
      'replicate': 'https://api.replicate.com/v1',
      'together': 'https://api.together.xyz/v1'
    };

    return baseUrls[this.config.providerType] || 'https://api.example.com/v1';
  }

  protected getProviderApiKey(): string {
    // Implementation would get from environment or database
    const apiKeys: Record<string, string> = {
      'openai': process.env.OPENAI_API_KEY || '',
      'anthropic': process.env.ANTHROPIC_API_KEY || '',
      'google': process.env.GOOGLE_API_KEY || '',
      'cohere': process.env.COHERE_API_KEY || '',
      'huggingface': process.env.HUGGINGFACE_API_KEY || '',
      'replicate': process.env.REPLICATE_API_KEY || '',
      'together': process.env.TOGETHER_API_KEY || ''
    };

    return apiKeys[this.config.providerType] || '';
  }

  protected getSupportedFeatures(): string[] {
    // Default features - can be overridden by subclasses
    return ['chat', 'streaming'];
  }

  // Common validation logic
  protected validateBasicRequest(request: ContentGenerationRequest): { valid: boolean; error?: string } {
    if (!request.userId || !request.organizationId) {
      return { valid: false, error: 'User ID and Organization ID are required' };
    }
    if (!request.type || !request.title || !request.prompt) {
      return { valid: false, error: 'Type, title, and prompt are required' };
    }
    if (request.prompt.length > 10000) {
      return { valid: false, error: 'Prompt is too long (max 10,000 characters)' };
    }
    return { valid: true };
  }

  // Common cost estimation logic
  protected estimateBasicCost(request: ContentGenerationRequest): { cost: number; tokens: number } {
    // Basic estimation - can be overridden by subclasses
    const estimatedTokens = Math.ceil(request.prompt.length / 4); // Rough token estimation
    const costPerToken = 0.002 / 1000; // $0.002 per 1K tokens

    return {
      cost: estimatedTokens * costPerToken,
      tokens: estimatedTokens
    };
  }

  // Common error handling
  protected handleError(error: any): ContentGenerationResponse {
    console.error(`Error in ${this.type} generation:`, error);

    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }

  // Rate limiting check
  protected async checkRateLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
    if (!this.config.enableRateLimiting) {
      return { allowed: true };
    }

    // Implementation would check user's rate limits
    // This is a placeholder
    return { allowed: true };
  }

  // Caching logic
  protected async getCachedResult(cacheKey: string): Promise<any> {
    if (!this.config.enableCaching) {
      return null;
    }

    // Implementation would check cache
    // This is a placeholder
    return null;
  }

  protected async setCachedResult(cacheKey: string, result: any): Promise<void> {
    if (!this.config.enableCaching) {
      return;
    }

    // Implementation would store in cache
    // This is a placeholder
  }

  // Retry logic
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Metrics recording
  protected async recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    // Implementation would record metrics
    // This is a placeholder
    console.log(`Metric: ${name} = ${value}`, tags);
  }

  // Event recording
  protected async recordEvent(name: string, data: any, tags?: Record<string, string>): Promise<void> {
    // Implementation would record events
    // This is a placeholder
    console.log(`Event: ${name}`, data, tags);
  }
}