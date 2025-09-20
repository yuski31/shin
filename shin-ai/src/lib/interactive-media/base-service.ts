import { Model } from 'mongoose';
import MediaContentModel from '../../models/interactive-media/MediaContent';
import {
  IMediaBase,
  IContentMetadata,
  IPermission,
  IAnalytics,
  IStorageConfig,
  ICacheConfig,
  ICollaboration,
  IPublishing,
  IMonetization,
  IContentCreationRequest,
  IContentUpdateRequest,
  IContentSearchFilter,
  IContentResponse,
  IMediaEvent,
  IMediaNotification,
  IPerformanceMetrics,
  IMediaError,
  IValidationResult,
  MediaType,
  MediaStatus,
  MediaVisibility,
  AccessLevel,
  StorageProvider,
  QualityLevel,
} from './types';

// Base service configuration
export interface IServiceConfig {
  maxFileSize: number;
  allowedFormats: string[];
  defaultQuality: QualityLevel;
  cacheEnabled: boolean;
  cacheTTL: number;
  storageProvider: StorageProvider;
  enableAnalytics: boolean;
  enableNotifications: boolean;
  maxConcurrentOperations: number;
}

// Base media service class
export abstract class BaseMediaService<T> {
  protected model: Model<T>;
  protected mediaContentModel = MediaContentModel;
  protected config: IServiceConfig;
  protected eventQueue: IMediaEvent[] = [];
  protected notificationQueue: IMediaNotification[] = [];

  constructor(model: Model<T>, config: IServiceConfig) {
    this.model = model;
    this.config = config;
  }

  // Abstract methods that must be implemented by subclasses
  abstract create(data: IContentCreationRequest): Promise<IContentResponse<T>>;
  abstract update(id: string, data: IContentUpdateRequest): Promise<IContentResponse<T>>;
  abstract delete(id: string): Promise<IContentResponse<boolean>>;
  abstract getById(id: string): Promise<IContentResponse<T>>;
  abstract search(filters: IContentSearchFilter): Promise<IContentResponse<T[]>>;
  abstract validate(data: any): Promise<IValidationResult>;

  // Common service methods
  public async validateAccess(
    contentId: string,
    userId: string,
    requiredPermission: string
  ): Promise<boolean> {
    try {
      const content = await this.mediaContentModel.findById(contentId);
      if (!content) return false;

      // Owner has full access
      if (content.creatorId.toString() === userId) return true;

      // Check contributor permissions
      const contributor = content.collaboration.contributors.find(
        (c: any) => c.userId.toString() === userId
      );
      if (contributor && contributor.permissions.includes(requiredPermission)) {
        return true;
      }

      // Check public access
      return content.permissions.access === 'public' && content.status === 'published';
    } catch (error) {
      this.logError('validateAccess', error as Error, { contentId, userId });
      return false;
    }
  }

  public async updateAnalytics(
    contentId: string,
    analyticsData: Partial<IAnalytics>
  ): Promise<void> {
    try {
      if (!this.config.enableAnalytics) return;

      await this.mediaContentModel.findByIdAndUpdate(contentId, {
        $inc: {
          'analytics.views': analyticsData.views || 0,
          'analytics.uniqueUsers': analyticsData.uniqueUsers || 0,
          'analytics.interactions': analyticsData.interactions || 0,
          'analytics.engagement.likes': analyticsData.engagement?.likes || 0,
          'analytics.engagement.shares': analyticsData.engagement?.shares || 0,
          'analytics.engagement.comments': analyticsData.engagement?.comments || 0,
          'analytics.engagement.bookmarks': analyticsData.engagement?.bookmarks || 0,
        },
        $set: {
          'analytics.averageSessionTime': analyticsData.averageSessionTime,
          'analytics.rating': analyticsData.rating,
          'analytics.performance': analyticsData.performance,
          'analytics.demographics': analyticsData.demographics,
        },
      });
    } catch (error) {
      this.logError('updateAnalytics', error as Error, { contentId });
    }
  }

  protected async recordEvent(
    type: IMediaEvent['type'],
    contentId: string,
    contentType: MediaType,
    userId: string,
    organizationId: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      const event: IMediaEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        contentId,
        contentType,
        userId,
        organizationId,
        timestamp: new Date(),
        data,
      };

      this.eventQueue.push(event);

      // Process event queue if it gets too large
      if (this.eventQueue.length > 100) {
        await this.processEventQueue();
      }
    } catch (error) {
      this.logError('recordEvent', error as Error, { type, contentId });
    }
  }

  protected async sendNotification(
    userId: string,
    type: IMediaNotification['type'],
    title: string,
    message: string,
    contentId?: string,
    contentType?: MediaType,
    actionUrl?: string
  ): Promise<void> {
    try {
      if (!this.config.enableNotifications) return;

      const notification: IMediaNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        title,
        message,
        contentId,
        contentType,
        actionUrl,
        read: false,
        createdAt: new Date(),
      };

      this.notificationQueue.push(notification);

      // Process notification queue if it gets too large
      if (this.notificationQueue.length > 50) {
        await this.processNotificationQueue();
      }
    } catch (error) {
      this.logError('sendNotification', error as Error, { userId, type });
    }
  }

  protected async recordPerformanceMetrics(
    metrics: IPerformanceMetrics
  ): Promise<void> {
    try {
      // Store performance metrics for analysis
      const performanceData = {
        contentId: metrics.contentId,
        contentType: metrics.contentType,
        timestamp: metrics.timestamp,
        metrics: metrics.metrics,
        userAgent: metrics.userAgent,
        deviceInfo: metrics.deviceInfo,
      };

      // In a real implementation, this would be stored in a time-series database
      console.log('Performance metrics recorded:', performanceData);
    } catch (error) {
      this.logError('recordPerformanceMetrics', error as Error, { contentId: metrics.contentId });
    }
  }

  protected async logError(
    operation: string,
    error: Error,
    context: Record<string, any> = {}
  ): Promise<void> {
    const errorLog: IMediaError = {
      code: `MEDIA_${operation.toUpperCase()}_ERROR`,
      message: error.message,
      details: context,
      stack: error.stack,
      timestamp: new Date(),
      severity: this.determineErrorSeverity(error),
    };

    // In a real implementation, this would be sent to a logging service
    console.error('Media service error:', errorLog);
  }

  private determineErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'ValidationError') return 'low';
    if (error.name === 'CastError') return 'medium';
    if (error.message.includes('permission') || error.message.includes('access')) return 'high';
    return 'medium';
  }

  protected async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      // In a real implementation, events would be sent to a message queue
      console.log(`Processing ${this.eventQueue.length} events`);

      // Clear the queue
      this.eventQueue = [];
    } catch (error) {
      this.logError('processEventQueue', error as Error);
    }
  }

  protected async processNotificationQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) return;

    try {
      // In a real implementation, notifications would be sent via push notifications, email, etc.
      console.log(`Processing ${this.notificationQueue.length} notifications`);

      // Clear the queue
      this.notificationQueue = [];
    } catch (error) {
      this.logError('processNotificationQueue', error as Error);
    }
  }

  protected async validateFileUpload(
    file: { size: number; mimetype: string; originalname: string }
  ): Promise<IValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push({
        field: 'file',
        message: `File size ${file.size} exceeds maximum allowed size ${this.config.maxFileSize}`,
        code: 'FILE_TOO_LARGE',
      });
    }

    // Check file format
    if (!this.config.allowedFormats.includes(file.mimetype)) {
      errors.push({
        field: 'file',
        message: `File format ${file.mimetype} is not allowed`,
        code: 'INVALID_FILE_FORMAT',
      });
    }

    // Check filename
    if (file.originalname.length > 255) {
      warnings.push({
        field: 'filename',
        message: 'Filename is very long and may cause issues',
        code: 'FILENAME_TOO_LONG',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  protected async generateContentId(): Promise<string> {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected async generateVersionNumber(currentVersion?: string): Promise<string> {
    if (!currentVersion) return '1.0.0';

    const parts = currentVersion.split('.').map(Number);
    parts[parts.length - 1] += 1;

    return parts.join('.');
  }

  protected async calculateFileHash(file: Buffer): Promise<string> {
    // In a real implementation, this would calculate a proper hash
    return `hash_${Date.now()}`;
  }

  protected async optimizeContent(
    content: any,
    quality: QualityLevel = this.config.defaultQuality
  ): Promise<any> {
    // In a real implementation, this would optimize content based on quality settings
    return content;
  }

  protected async compressContent(content: any): Promise<Buffer> {
    // In a real implementation, this would compress the content
    return Buffer.from(JSON.stringify(content));
  }

  protected async validateContentStructure(content: any): Promise<IValidationResult> {
    // In a real implementation, this would validate the content structure
    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  // Utility methods for common operations
  async getContentSummary(id: string): Promise<IContentResponse<any>> {
    try {
      const content = await this.mediaContentModel.findById(id);
      if (!content) {
        return {
          success: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Content not found',
          },
        };
      }

      return {
        success: true,
        data: content.getSummary(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SUMMARY_ERROR',
          message: 'Failed to get content summary',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async publishContent(id: string, userId: string): Promise<IContentResponse<boolean>> {
    try {
      const hasAccess = await this.validateAccess(id, userId, 'publish');
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have permission to publish this content',
          },
        };
      }

      await this.mediaContentModel.findByIdAndUpdate(id, {
        status: 'published',
        'publishing.publishedAt': new Date(),
        'publishing.publishedBy': userId,
        visibility: 'public',
      });

      await this.recordEvent('published', id, 'media' as MediaType, userId, '', {});

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: 'Failed to publish content',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async archiveContent(id: string, userId: string): Promise<IContentResponse<boolean>> {
    try {
      const hasAccess = await this.validateAccess(id, userId, 'delete');
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have permission to archive this content',
          },
        };
      }

      await this.mediaContentModel.findByIdAndUpdate(id, {
        status: 'archived',
      });

      await this.recordEvent('archived', id, 'media' as MediaType, userId, '', {});

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ARCHIVE_ERROR',
          message: 'Failed to archive content',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async getContentAnalytics(id: string): Promise<IContentResponse<IAnalytics>> {
    try {
      const content = await this.mediaContentModel.findById(id);
      if (!content) {
        return {
          success: false,
          error: {
            code: 'CONTENT_NOT_FOUND',
            message: 'Content not found',
          },
        };
      }

      return {
        success: true,
        data: content.analytics,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to get content analytics',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  // Cleanup method to process queues
  async cleanup(): Promise<void> {
    await this.processEventQueue();
    await this.processNotificationQueue();
  }
}