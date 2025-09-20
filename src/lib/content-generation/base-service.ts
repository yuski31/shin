import { IGenerationService, IServiceConfig } from './interfaces';

// Base service configuration
export interface BaseServiceConfig extends IServiceConfig {
  name: string;
  version: string;
  enabled: boolean;
  customConfig?: Record<string, any>;
}

// Abstract base service class
export abstract class BaseGenerationService implements IGenerationService {
  protected config: BaseServiceConfig;
  protected initialized: boolean = false;

  constructor(config: BaseServiceConfig) {
    this.config = config;
  }

  abstract readonly name: string;

  // Abstract methods that must be implemented by subclasses
  abstract initialize(): Promise<void>;
  abstract healthCheck(): Promise<{ status: string; details?: any }>;

  // Common functionality
  async isInitialized(): Promise<boolean> {
    return this.initialized;
  }

  async getConfig(): Promise<BaseServiceConfig> {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<BaseServiceConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
  }

  // Common error handling
  protected handleError(error: any, context?: string): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const contextInfo = context ? ` in ${context}` : '';

    console.error(`Error in ${this.name} service${contextInfo}:`, errorMessage, error);
  }

  // Common retry logic
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retryPolicy.maxRetries,
    initialDelay: number = this.config.retryPolicy.initialDelay
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(this.config.retryPolicy.backoffMultiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Common timeout logic
  protected async withTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = this.config.timeout
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }

  // Common validation logic
  protected validateRequired(value: any, name: string): void {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${name} is required`);
    }
  }

  protected validateString(value: any, name: string, minLength?: number, maxLength?: number): void {
    this.validateRequired(value, name);

    if (typeof value !== 'string') {
      throw new Error(`${name} must be a string`);
    }

    if (minLength && value.length < minLength) {
      throw new Error(`${name} must be at least ${minLength} characters long`);
    }

    if (maxLength && value.length > maxLength) {
      throw new Error(`${name} must be at most ${maxLength} characters long`);
    }
  }

  protected validateNumber(value: any, name: string, min?: number, max?: number): void {
    this.validateRequired(value, name);

    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`${name} must be a valid number`);
    }

    if (min !== undefined && value < min) {
      throw new Error(`${name} must be at least ${min}`);
    }

    if (max !== undefined && value > max) {
      throw new Error(`${name} must be at most ${max}`);
    }
  }

  protected validateArray(value: any, name: string, minLength?: number): void {
    this.validateRequired(value, name);

    if (!Array.isArray(value)) {
      throw new Error(`${name} must be an array`);
    }

    if (minLength && value.length < minLength) {
      throw new Error(`${name} must contain at least ${minLength} items`);
    }
  }

  protected validateObject(value: any, name: string): void {
    this.validateRequired(value, name);

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${name} must be an object`);
    }
  }

  protected validateEnum<T extends Record<string, string | number>>(
    value: any,
    name: string,
    enumObject: T
  ): void {
    this.validateRequired(value, name);

    const validValues = Object.values(enumObject);
    if (!validValues.includes(value)) {
      throw new Error(`${name} must be one of: ${validValues.join(', ')}`);
    }
  }

  // Common sanitization logic
  protected sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .substring(0, 10000); // Limit length
  }

  protected sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Common metrics recording
  protected async recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    // Implementation would record metrics
    // This is a placeholder
    console.log(`Service Metric [${this.name}]: ${name} = ${value}`, tags);
  }

  protected async recordEvent(name: string, data: any, tags?: Record<string, string>): Promise<void> {
    // Implementation would record events
    // This is a placeholder
    console.log(`Service Event [${this.name}]: ${name}`, data, tags);
  }

  // Common health check logic
  protected async performHealthCheck(): Promise<{ status: string; details?: any }> {
    try {
      if (!this.initialized) {
        return {
          status: 'ERROR',
          details: { error: 'Service not initialized' }
        };
      }

      // Perform service-specific health checks
      const serviceHealth = await this.checkServiceHealth();

      return {
        status: serviceHealth.healthy ? 'OK' : 'ERROR',
        details: serviceHealth
      };
    } catch (error) {
      return {
        status: 'ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Abstract method for service-specific health checks
  protected abstract checkServiceHealth(): Promise<{ healthy: boolean; details?: any }>;

  // Common initialization logic
  protected async performInitialization(): Promise<void> {
    try {
      // Validate configuration
      await this.validateConfiguration();

      // Perform service-specific initialization
      await this.initializeService();

      this.initialized = true;

      await this.recordEvent('service_initialized', {
        service: this.name,
        version: this.config.version,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.initialized = false;
      throw error;
    }
  }

  // Abstract methods for service-specific logic
  protected abstract validateConfiguration(): Promise<void>;
  protected abstract initializeService(): Promise<void>;
}