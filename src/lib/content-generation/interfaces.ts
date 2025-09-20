// Base interfaces for content generation system

import { ContentGenerationRequest, ContentGenerationResponse } from './content-factory';

// Base engine interface
export interface IGenerationEngine {
  readonly type: string;
  readonly supportedFormats: string[];

  generate(request: ContentGenerationRequest): Promise<ContentGenerationResponse>;
  validateRequest(request: ContentGenerationRequest): Promise<{ valid: boolean; error?: string }>;
  estimateCost(request: ContentGenerationRequest): Promise<{ cost: number; tokens: number }>;
  healthCheck(): Promise<{ status: string; details?: any }>;
}

// Base service interface
export interface IGenerationService {
  readonly name: string;

  initialize(): Promise<void>;
  healthCheck(): Promise<{ status: string; details?: any }>;
}

// Storage service interface
export interface IContentStorageService extends IGenerationService {
  store(contentId: string, request: ContentGenerationRequest): Promise<void>;
  retrieve(contentId: string): Promise<any>;
  delete(contentId: string): Promise<boolean>;
  getStorageInfo(contentId: string): Promise<any>;
}

// Usage tracking service interface
export interface IUsageTrackingService extends IGenerationService {
  track(request: ContentGenerationRequest, response: ContentGenerationResponse): Promise<void>;
  getUsage(userId: string, startDate: Date, endDate: Date): Promise<any>;
  getCost(userId: string, startDate: Date, endDate: Date): Promise<number>;
}

// Quality control service interface
export interface IQualityControlService extends IGenerationService {
  validateContent(content: any, type: string): Promise<{ valid: boolean; score: number; issues?: string[] }>;
  enhanceContent(content: any, type: string): Promise<any>;
  checkPlagiarism(content: string): Promise<{ score: number; matches?: any[] }>;
  factCheck(content: string): Promise<{ verified: boolean; issues?: string[] }>;
}

// Error handling service interface
export interface IErrorHandlingService extends IGenerationService {
  handleError(error: any, context: any): Promise<void>;
  categorizeError(error: any): Promise<{ category: string; severity: string; retryable: boolean }>;
  getErrorStats(startDate: Date, endDate: Date): Promise<any>;
}

// Monitoring service interface
export interface IMonitoringService extends IGenerationService {
  recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
  recordEvent(name: string, data: any, tags?: Record<string, string>): Promise<void>;
  getMetrics(startDate: Date, endDate: Date): Promise<any>;
  getEvents(startDate: Date, endDate: Date, eventName?: string): Promise<any>;
}

// Configuration interfaces
export interface IEngineConfig {
  timeout: number;
  maxRetries: number;
  enableCaching: boolean;
  cacheTTL: number;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface IServiceConfig {
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

// Provider integration interfaces
export interface IProviderIntegration {
  readonly providerName: string;
  readonly supportedModels: string[];

  initialize(config: any): Promise<void>;
  generate(request: any): Promise<any>;
  validateModel(model: string): boolean;
  getModelInfo(model: string): any;
}

// Queue interfaces for batch processing
export interface IJobQueue {
  enqueue(job: any): Promise<string>;
  dequeue(): Promise<any>;
  getJobStatus(jobId: string): Promise<any>;
  cancelJob(jobId: string): Promise<boolean>;
  getQueueLength(): Promise<number>;
}

// Cache interfaces
export interface ICacheService {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

// Rate limiting interfaces
export interface IRateLimiter {
  checkLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; resetTime: Date }>;
  increment(key: string): Promise<void>;
  reset(key: string): Promise<void>;
}

// Analytics interfaces
export interface IAnalyticsService {
  trackGeneration(request: ContentGenerationRequest, response: ContentGenerationResponse): Promise<void>;
  getGenerationStats(userId: string, startDate: Date, endDate: Date): Promise<any>;
  getPopularTemplates(startDate: Date, endDate: Date, limit?: number): Promise<any>;
  getUsagePatterns(userId: string, startDate: Date, endDate: Date): Promise<any>;
}

// Notification interfaces
export interface INotificationService {
  sendNotification(userId: string, type: string, data: any): Promise<void>;
  sendWebhook(url: string, data: any, secret?: string): Promise<boolean>;
}

// Template and preset interfaces
export interface ITemplateService {
  getTemplate(templateId: string): Promise<any>;
  getTemplatesByCategory(category: string, userId?: string): Promise<any[]>;
  createTemplate(template: any): Promise<string>;
  updateTemplate(templateId: string, updates: any): Promise<void>;
  deleteTemplate(templateId: string): Promise<boolean>;
}

export interface IPresetService {
  getPreset(presetId: string): Promise<any>;
  getPresetsByCategory(category: string, quality?: string): Promise<any[]>;
  createPreset(preset: any): Promise<string>;
  updatePreset(presetId: string, updates: any): Promise<void>;
  deletePreset(presetId: string): Promise<boolean>;
}

// Validation interfaces
export interface IValidationService {
  validateTextGeneration(request: ContentGenerationRequest): Promise<{ valid: boolean; errors: string[] }>;
  validateImageGeneration(request: ContentGenerationRequest): Promise<{ valid: boolean; errors: string[] }>;
  validateVideoGeneration(request: ContentGenerationRequest): Promise<{ valid: boolean; errors: string[] }>;
  validateAudioGeneration(request: ContentGenerationRequest): Promise<{ valid: boolean; errors: string[] }>;
  validateCodeGeneration(request: ContentGenerationRequest): Promise<{ valid: boolean; errors: string[] }>;
}

// Security interfaces
export interface ISecurityService {
  sanitizeInput(input: string): string;
  validatePermissions(userId: string, action: string, resource: string): Promise<boolean>;
  encryptSensitiveData(data: string): string;
  decryptSensitiveData(encryptedData: string): string;
  detectMaliciousContent(content: string): Promise<{ malicious: boolean; threats: string[] }>;
}

// Performance interfaces
export interface IPerformanceService {
  measureExecutionTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }>;
  getPerformanceMetrics(): Promise<any>;
  optimizeParameters(parameters: any, target: string): Promise<any>;
}