import { IMediaError } from './types';

// Error types for different media operations
export class MediaError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly contentId?: string;
  public readonly contentType?: string;
  public readonly userId?: string;

  constructor(
    code: string,
    message: string,
    options: {
      details?: Record<string, any>;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      contentId?: string;
      contentType?: string;
      userId?: string;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'MediaError';
    this.code = code;
    this.details = options.details;
    this.timestamp = new Date();
    this.severity = options.severity || 'medium';
    this.contentId = options.contentId;
    this.contentType = options.contentType;
    this.userId = options.userId;

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MediaError);
    }
  }

  toJSON(): IMediaError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
      timestamp: this.timestamp,
      severity: this.severity,
      contentId: this.contentId,
      contentType: this.contentType as any,
      userId: this.userId,
    };
  }
}

// Specific error classes for different scenarios
export class ValidationError extends MediaError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, {
      details,
      severity: 'low',
    });
    this.name = 'ValidationError';
  }
}

export class AccessDeniedError extends MediaError {
  constructor(message: string, userId?: string, contentId?: string) {
    super('ACCESS_DENIED', message, {
      details: { userId, contentId },
      severity: 'high',
      userId,
      contentId,
    });
    this.name = 'AccessDeniedError';
  }
}

export class ContentNotFoundError extends MediaError {
  constructor(contentId: string, contentType?: string) {
    super('CONTENT_NOT_FOUND', `Content not found: ${contentId}`, {
      details: { contentId, contentType },
      severity: 'medium',
      contentId,
      contentType,
    });
    this.name = 'ContentNotFoundError';
  }
}

export class StorageError extends MediaError {
  constructor(message: string, details?: Record<string, any>) {
    super('STORAGE_ERROR', message, {
      details,
      severity: 'high',
    });
    this.name = 'StorageError';
  }
}

export class ProcessingError extends MediaError {
  constructor(message: string, details?: Record<string, any>) {
    super('PROCESSING_ERROR', message, {
      details,
      severity: 'medium',
    });
    this.name = 'ProcessingError';
  }
}

export class QuotaExceededError extends MediaError {
  constructor(message: string, userId?: string, organizationId?: string) {
    super('QUOTA_EXCEEDED', message, {
      details: { userId, organizationId },
      severity: 'medium',
      userId,
    });
    this.name = 'QuotaExceededError';
  }
}

export class RateLimitError extends MediaError {
  constructor(message: string, userId?: string) {
    super('RATE_LIMIT_EXCEEDED', message, {
      details: { userId },
      severity: 'medium',
      userId,
    });
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends MediaError {
  constructor(message: string, details?: Record<string, any>) {
    super('NETWORK_ERROR', message, {
      details,
      severity: 'medium',
    });
    this.name = 'NetworkError';
  }
}

export class ConfigurationError extends MediaError {
  constructor(message: string, details?: Record<string, any>) {
    super('CONFIGURATION_ERROR', message, {
      details,
      severity: 'critical',
    });
    this.name = 'ConfigurationError';
  }
}

// Error handler class
export class MediaErrorHandler {
  private static instance: MediaErrorHandler;
  private errorQueue: IMediaError[] = [];
  private maxQueueSize = 1000;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorCleanup = Date.now();

  private constructor() {}

  static getInstance(): MediaErrorHandler {
    if (!MediaErrorHandler.instance) {
      MediaErrorHandler.instance = new MediaErrorHandler();
    }
    return MediaErrorHandler.instance;
  }

  // Handle and log an error
  async handleError(error: MediaError | Error, context?: Record<string, any>): Promise<void> {
    const mediaError = error instanceof MediaError
      ? error
      : new MediaError('UNKNOWN_ERROR', error.message, {
          details: context,
          severity: 'medium',
          cause: error,
        });

    // Add to queue
    this.errorQueue.push(mediaError.toJSON());

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Track error counts
    this.trackError(mediaError);

    // Log error based on severity
    await this.logError(mediaError);

    // Send alerts for critical errors
    if (mediaError.severity === 'critical') {
      await this.sendCriticalAlert(mediaError);
    }

    // Cleanup old errors periodically
    await this.cleanupOldErrors();
  }

  // Track error patterns
  private trackError(error: MediaError): void {
    const key = `${error.code}_${error.severity}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
  }

  // Log error to appropriate destination
  private async logError(error: MediaError): Promise<void> {
    const logData = {
      timestamp: error.timestamp,
      level: this.getLogLevel(error.severity),
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack,
      contentId: error.contentId,
      contentType: error.contentType,
      userId: error.userId,
    };

    // In a real implementation, this would log to various destinations
    switch (error.severity) {
      case 'critical':
        console.error('CRITICAL MEDIA ERROR:', logData);
        break;
      case 'high':
        console.error('HIGH MEDIA ERROR:', logData);
        break;
      case 'medium':
        console.warn('MEDIUM MEDIA ERROR:', logData);
        break;
      case 'low':
        console.info('LOW MEDIA ERROR:', logData);
        break;
    }

    // Here you could integrate with logging services like:
    // - Winston for file logging
    // - Sentry for error tracking
    // - Elasticsearch for search and analytics
    // - CloudWatch for AWS monitoring
  }

  private getLogLevel(severity: string): string {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warn';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  // Send critical error alerts
  private async sendCriticalAlert(error: MediaError): Promise<void> {
    // In a real implementation, this would send alerts via:
    // - Email notifications
    // - Slack/Discord webhooks
    // - SMS alerts
    // - PagerDuty integration

    console.error('🚨 CRITICAL MEDIA ERROR ALERT:', {
      code: error.code,
      message: error.message,
      contentId: error.contentId,
      userId: error.userId,
      timestamp: error.timestamp,
    });
  }

  // Cleanup old errors and error counts
  private async cleanupOldErrors(): Promise<void> {
    const now = Date.now();
    const cleanupInterval = 60 * 60 * 1000; // 1 hour

    if (now - this.lastErrorCleanup < cleanupInterval) {
      return;
    }

    // Remove errors older than 24 hours
    const cutoff = new Date(now - 24 * 60 * 60 * 1000);
    this.errorQueue = this.errorQueue.filter(error => error.timestamp >= cutoff);

    // Reset error counts periodically
    this.errorCounts.clear();

    this.lastErrorCleanup = now;
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: IMediaError[];
  } {
    const errorsByCode: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    this.errorQueue.forEach(error => {
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
      errorsBySeverity[error.severity]++;
    });

    return {
      totalErrors: this.errorQueue.length,
      errorsByCode,
      errorsBySeverity,
      recentErrors: this.errorQueue.slice(-10), // Last 10 errors
    };
  }

  // Get errors for specific content
  getContentErrors(contentId: string): IMediaError[] {
    return this.errorQueue.filter(error => error.contentId === contentId);
  }

  // Get errors for specific user
  getUserErrors(userId: string): IMediaError[] {
    return this.errorQueue.filter(error => error.userId === userId);
  }

  // Check if error rate is too high
  isErrorRateHigh(errorCode: string, threshold: number = 10): boolean {
    const key = `${errorCode}_medium`;
    const count = this.errorCounts.get(key) || 0;
    return count > threshold;
  }

  // Clear error queue (for testing or maintenance)
  clearErrors(): void {
    this.errorQueue = [];
    this.errorCounts.clear();
  }
}

// Global error handler instance
export const mediaErrorHandler = MediaErrorHandler.getInstance();

// Utility function to wrap async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    await mediaErrorHandler.handleError(error as Error, context);
    throw error;
  }
}

// Utility function to create standardized error responses
export function createErrorResponse(
  error: MediaError | Error,
  statusCode: number = 500
): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
  };
  statusCode: number;
} {
  const mediaError = error instanceof MediaError
    ? error
    : new MediaError('INTERNAL_ERROR', error.message, { cause: error });

  return {
    success: false,
    error: {
      code: mediaError.code,
      message: mediaError.message,
      details: mediaError.details,
      timestamp: mediaError.timestamp,
    },
    statusCode,
  };
}

// Utility function to determine appropriate HTTP status code
export function getHttpStatusCode(error: MediaError): number {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'ACCESS_DENIED':
      return 403;
    case 'CONTENT_NOT_FOUND':
      return 404;
    case 'QUOTA_EXCEEDED':
      return 429;
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    case 'STORAGE_ERROR':
      return 500;
    case 'PROCESSING_ERROR':
      return 500;
    case 'NETWORK_ERROR':
      return 503;
    case 'CONFIGURATION_ERROR':
      return 500;
    default:
      return 500;
  }
}

// Middleware function for Express-style error handling
export function errorMiddleware(error: Error, req: any, res: any, next: any): void {
  const errorResponse = createErrorResponse(error, getHttpStatusCode(error as MediaError));

  res.status(errorResponse.statusCode).json(errorResponse);
}

// Validation helper functions
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEnum<T>(
  value: T,
  allowedValues: T[],
  fieldName: string
): void {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
}

export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): void {
  if (value.length < minLength || value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be between ${minLength} and ${maxLength} characters`
    );
  }
}

export function validateFileSize(
  size: number,
  maxSize: number,
  fieldName: string = 'file'
): void {
  if (size > maxSize) {
    throw new ValidationError(
      `${fieldName} size (${size} bytes) exceeds maximum allowed size (${maxSize} bytes)`
    );
  }
}

export function validateUrl(url: string, fieldName: string): void {
  try {
    new URL(url);
  } catch {
    throw new ValidationError(`${fieldName} must be a valid URL`);
  }
}