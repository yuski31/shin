import { ICommunicationConfig } from './config';
import { IAIProvider } from '@/models/AIProvider';
import { IProviderAdapter } from '@/lib/providers/base-provider';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { CommunicationAnalytics } from '@/models/communication';
import { IOrganization } from '@/models/Organization';
import mongoose from 'mongoose';

export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date;
  errorRate: number;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: Date;
  issues: string[];
  responseTime: number;
}

export interface ServiceContext {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  requestId: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseCommunicationService {
  protected config: ICommunicationConfig;
  protected providerFactory: ProviderFactory;
  protected metrics: ServiceMetrics;
  protected health: ServiceHealth;
  protected context?: ServiceContext;

  constructor(config: ICommunicationConfig, providerFactory: ProviderFactory) {
    this.config = config;
    this.providerFactory = providerFactory;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: new Date(),
      errorRate: 0,
    };
    this.health = {
      status: 'healthy',
      lastHealthCheck: new Date(),
      issues: [],
      responseTime: 0,
    };
  }

  // Abstract methods that must be implemented by subclasses
  abstract getServiceType(): 'meeting' | 'translation' | 'customer_service' | 'internal_comm';
  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;

  // Common service methods
  protected async executeWithMetrics<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;

      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(responseTime);
      this.metrics.lastRequestTime = new Date();

      await this.logMetrics(operationName, 'success', responseTime);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.metrics.failedRequests++;
      this.updateErrorRate();
      this.metrics.lastRequestTime = new Date();

      await this.logMetrics(operationName, 'error', responseTime, error as Error);

      throw error;
    }
  }

  protected updateAverageResponseTime(newResponseTime: number): void {
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    if (totalRequests === 1) {
      this.metrics.averageResponseTime = newResponseTime;
    } else {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (totalRequests - 1) + newResponseTime) / totalRequests;
    }
  }

  protected updateErrorRate(): void {
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.errorRate = this.metrics.failedRequests / totalRequests;
  }

  protected async logMetrics(
    operation: string,
    status: 'success' | 'error',
    responseTime: number,
    error?: Error
  ): Promise<void> {
    try {
      if (!this.context) return;

      const analytics = new CommunicationAnalytics({
        id: `${this.context.requestId}-${Date.now()}`,
        organizationId: this.context.organizationId,
        service: this.getServiceType(),
        period: {
          start: new Date(),
          end: new Date(),
          type: 'hourly',
          timezone: 'UTC',
        },
        metrics: {
          totalRequests: 1,
          successfulRequests: status === 'success' ? 1 : 0,
          failedRequests: status === 'error' ? 1 : 0,
          averageResponseTime: responseTime,
          medianResponseTime: responseTime,
          p95ResponseTime: responseTime,
          p99ResponseTime: responseTime,
          qualityScores: {
            accuracy: status === 'success' ? 1 : 0,
            reliability: status === 'success' ? 1 : 0,
            performance: Math.max(0, 1 - (responseTime / 10000)), // Performance degrades after 10s
            userSatisfaction: status === 'success' ? 1 : 0,
            overallScore: status === 'success' ? 1 : 0,
          },
          errorMetrics: {
            totalErrors: status === 'error' ? 1 : 0,
            errorRate: status === 'error' ? 1 : 0,
            topErrors: error ? [{
              errorCode: error.name,
              count: 1,
              percentage: 100,
            }] : [],
            averageErrorRecoveryTime: 0,
          },
        },
        metadata: {
          dataCompleteness: 1,
          lastUpdated: new Date(),
          generatedBy: 'BaseCommunicationService',
          version: '1.0.0',
          schemaVersion: '1.0.0',
        },
      });

      await analytics.save();
    } catch (logError) {
      console.error('Failed to log metrics:', logError);
    }
  }

  protected async checkRateLimit(): Promise<boolean> {
    if (!this.config.global.rateLimiting.enabled) {
      return true;
    }

    // Simple in-memory rate limiting (in production, use Redis)
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // This is a simplified implementation
    // In production, you'd want to use Redis or a similar store
    return true;
  }

  protected async getProvider(providerType: string): Promise<IProviderAdapter> {
    // This would typically fetch the provider configuration from the database
    // For now, we'll create a mock provider with minimal required fields
    const mockProvider: Partial<IAIProvider> = {
      name: 'Mock AI Provider',
      type: providerType as any,
      baseUrl: 'https://api.mock.com',
      apiKey: 'mock-key',
      models: ['gpt-3.5-turbo', 'gpt-4'],
      supportedFeatures: ['chat', 'embeddings'],
      isActive: true,
      userId: this.context?.userId || new mongoose.Types.ObjectId(),
      organization: this.context?.organizationId || new mongoose.Types.ObjectId(),
      healthStatus: {
        lastHealthCheck: new Date(),
        isHealthy: true,
        responseTime: 100,
        errorRate: 0,
        consecutiveFailures: 0,
      },
      loadBalancing: {
        strategy: 'round-robin',
        failoverEnabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        circuitBreakerThreshold: 5,
        healthCheckInterval: 30000,
      },
    } as IAIProvider;

    return this.providerFactory.createProvider(
      {
        baseUrl: mockProvider.baseUrl || 'https://api.mock.com',
        apiKey: mockProvider.apiKey || 'mock-key',
      },
      mockProvider
    );
  }

  protected validateInput(input: any, schema: any): boolean {
    try {
      schema.parse(input);
      return true;
    } catch (error) {
      return false;
    }
  }

  protected sanitizeInput(input: any): any {
    // Basic sanitization - remove potentially harmful content
    if (typeof input === 'string') {
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }

  protected generateRequestId(): string {
    return `${this.getServiceType()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check methods
  async healthCheck(): Promise<ServiceHealth> {
    const startTime = Date.now();

    const issues: string[] = [];

    // Check configuration
    if (!this.config.global.enabled) {
      issues.push('Service is disabled in configuration');
    }

    // Check error rate
    if (this.metrics.errorRate > 0.1) {
      issues.push('High error rate detected');
    }

    // Check response time
    if (this.metrics.averageResponseTime > 5000) {
      issues.push('High average response time');
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 2) {
      status = 'unhealthy';
    } else if (issues.length > 0) {
      status = 'degraded';
    }

    this.health = {
      status,
      lastHealthCheck: new Date(),
      issues,
      responseTime: Date.now() - startTime,
    };

    return this.health;
  }

  // Get service metrics
  getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  // Get service health
  getHealth(): ServiceHealth {
    return { ...this.health };
  }

  // Set service context
  setContext(context: ServiceContext): void {
    this.context = context;
  }

  // Get service context
  getContext(): ServiceContext | undefined {
    return this.context;
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: new Date(),
      errorRate: 0,
    };
  }

  // Utility method to create standardized response
  protected createResponse<T>(
    success: boolean,
    data?: T,
    error?: string,
    metadata?: Record<string, any>
  ): {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, any>;
    requestId: string;
    timestamp: Date;
  } {
    return {
      success,
      data,
      error,
      metadata,
      requestId: this.context?.requestId || this.generateRequestId(),
      timestamp: new Date(),
    };
  }
}