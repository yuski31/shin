import { Model } from 'mongoose';
import GameModel, { IGame } from '../../models/interactive-media/Game';
import VRSceneModel, { IVRScene } from '../../models/interactive-media/VRScene';
import ARObjectModel, { IARObject } from '../../models/interactive-media/ARObject';
import AvatarModel, { IAvatar } from '../../models/interactive-media/Avatar';
import VirtualSpaceModel, { IVirtualSpace } from '../../models/interactive-media/VirtualSpace';
import MediaContentModel, { IMediaContent } from '../../models/interactive-media/MediaContent';
import {
  MediaType,
  IContentCreationRequest,
  IContentUpdateRequest,
  IContentResponse,
  IValidationResult,
  IGameConfig,
  IVRConfig,
  IARConfig,
  IAvatarConfig,
  IVirtualSpaceConfig,
} from './types';
import { BaseMediaService } from './base-service';

// Content factory configuration
export interface IContentFactoryConfig {
  defaultStorageProvider: 'local' | 'aws_s3' | 'google_cloud' | 'azure_blob' | 'cloudflare_r2';
  maxFileSize: number;
  allowedFormats: Record<MediaType, string[]>;
  enableValidation: boolean;
  enableCompression: boolean;
  enableBackup: boolean;
}

// Content factory class
export class ContentFactory {
  private config: IContentFactoryConfig;
  private models: Map<MediaType, Model<any>>;
  private services: Map<MediaType, BaseMediaService<any>>;

  constructor(config: IContentFactoryConfig) {
    this.config = config;
    this.models = new Map();
    this.services = new Map();

    this.initializeModels();
    this.initializeServices();
  }

  // Initialize models for each media type
  private initializeModels(): void {
    this.models.set('game', GameModel);
    this.models.set('vr_scene', VRSceneModel);
    this.models.set('ar_object', ARObjectModel);
    this.models.set('avatar', AvatarModel);
    this.models.set('virtual_space', VirtualSpaceModel);
  }

  // Initialize services for each media type
  private initializeServices(): void {
    const baseConfig = {
      maxFileSize: this.config.maxFileSize,
      allowedFormats: this.config.allowedFormats,
      defaultQuality: 'high' as const,
      cacheEnabled: true,
      cacheTTL: 3600,
      storageProvider: this.config.defaultStorageProvider,
      enableAnalytics: true,
      enableNotifications: true,
      maxConcurrentOperations: 10,
    };

    // Initialize services for each media type
    this.models.forEach((model, type) => {
      const service = this.createService(type, model, baseConfig);
      this.services.set(type, service);
    });
  }

  // Create service instance for specific media type
  private createService(
    type: MediaType,
    model: Model<any>,
    config: any
  ): BaseMediaService<any> {
    switch (type) {
      case 'game':
        return new GameService(model, config);
      case 'vr_scene':
        return new VRSceneService(model, config);
      case 'ar_object':
        return new ARObjectService(model, config);
      case 'avatar':
        return new AvatarService(model, config);
      case 'virtual_space':
        return new VirtualSpaceService(model, config);
      default:
        throw new Error(`Unsupported media type: ${type}`);
    }
  }

  // Get model for specific media type
  getModel(type: MediaType): Model<any> {
    const model = this.models.get(type);
    if (!model) {
      throw new Error(`No model found for media type: ${type}`);
    }
    return model;
  }

  // Get service for specific media type
  getService(type: MediaType): BaseMediaService<any> {
    const service = this.services.get(type);
    if (!service) {
      throw new Error(`No service found for media type: ${type}`);
    }
    return service;
  }

  // Create content of specific type
  async createContent(
    type: MediaType,
    request: IContentCreationRequest
  ): Promise<IContentResponse<any>> {
    try {
      const service = this.getService(type);

      // Validate request
      if (this.config.enableValidation) {
        const validation = await service.validate(request);
        if (!validation.valid) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Content validation failed',
              details: { errors: validation.errors, warnings: validation.warnings },
            },
          };
        }
      }

      // Create content using service
      const result = await service.create(request);

      if (result.success && result.data) {
        // Create media content record
        await this.createMediaContentRecord(type, request, result.data);

        // Log creation event
        await this.logContentEvent('created', type, result.data.id, request.creatorId, request.organizationId);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create content',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  // Update content of specific type
  async updateContent(
    type: MediaType,
    id: string,
    request: IContentUpdateRequest,
    userId: string
  ): Promise<IContentResponse<any>> {
    try {
      const service = this.getService(type);

      // Check permissions
      const hasAccess = await service.validateAccess(id, userId, 'update');
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have permission to update this content',
          },
        };
      }

      // Validate request
      if (this.config.enableValidation) {
        const validation = await service.validate(request);
        if (!validation.valid) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Content validation failed',
              details: { errors: validation.errors, warnings: validation.warnings },
            },
          };
        }
      }

      // Update content using service
      const result = await service.update(id, request);

      if (result.success && result.data) {
        // Update media content record
        await this.updateMediaContentRecord(type, id, request);

        // Log update event
        await this.logContentEvent('updated', type, id, userId, '');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update content',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  // Delete content of specific type
  async deleteContent(
    type: MediaType,
    id: string,
    userId: string
  ): Promise<IContentResponse<boolean>> {
    try {
      const service = this.getService(type);

      // Check permissions
      const hasAccess = await service.validateAccess(id, userId, 'delete');
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have permission to delete this content',
          },
        };
      }

      // Delete content using service
      const result = await service.delete(id);

      if (result.success) {
        // Update media content record status
        await this.updateMediaContentStatus(id, 'deleted');

        // Log deletion event
        await this.logContentEvent('deleted', type, id, userId, '');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete content',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  // Get content by ID
  async getContent(
    type: MediaType,
    id: string,
    userId?: string
  ): Promise<IContentResponse<any>> {
    try {
      const service = this.getService(type);

      // Check permissions if user is specified
      if (userId) {
        const hasAccess = await service.validateAccess(id, userId, 'read');
        if (!hasAccess) {
          return {
            success: false,
            error: {
              code: 'ACCESS_DENIED',
              message: 'You do not have permission to access this content',
            },
          };
        }
      }

      // Get content using service
      const result = await service.getById(id);

      if (result.success && result.data) {
        // Update view analytics
        await service.updateAnalytics(id, { views: 1 });

        // Log view event
        if (userId) {
          await this.logContentEvent('viewed', type, id, userId, '');
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_ERROR',
          message: 'Failed to get content',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  // Search content across all types
  async searchContent(
    filters: {
      type?: MediaType;
      query?: string;
      tags?: string[];
      category?: string;
      organizationId?: string;
      creatorId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<IContentResponse<any[]>> {
    try {
      const results: any[] = [];

      if (filters.type) {
        // Search specific type
        const service = this.getService(filters.type);
        const result = await service.search(filters as any);
        if (result.success && result.data) {
          results.push(...result.data);
        }
      } else {
        // Search all types
        for (const [type, service] of this.services) {
          const result = await service.search(filters as any);
          if (result.success && result.data) {
            results.push(...result.data.map((item: any) => ({ ...item, type })));
          }
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Failed to search content',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  // Create media content record
  private async createMediaContentRecord(
    type: MediaType,
    request: IContentCreationRequest,
    contentData: any
  ): Promise<void> {
    const mediaContent = new MediaContentModel({
      title: request.title,
      description: request.description,
      organizationId: request.organizationId,
      creatorId: request.creatorId,
      type,
      contentId: contentData._id,
      contentType: this.getContentTypeName(type),
      status: 'draft',
      visibility: 'private',
      tags: request.metadata?.tags || [],
      category: request.metadata?.category || '',
      metadata: {
        version: '1.0.0',
        fileSize: 0,
        thumbnailUrl: '',
        createdFrom: request.metadata?.createdFrom || 'generated',
        generationParameters: request.metadata?.generationParameters || {},
      },
      permissions: {
        access: 'private',
        roles: [],
        licensing: {
          type: 'all_rights_reserved',
        },
      },
      analytics: {
        views: 0,
        uniqueUsers: 0,
        averageSessionTime: 0,
        interactions: 0,
        rating: {
          average: 0,
          count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        performance: {
          loadTime: 0,
          frameRate: 0,
          crashCount: 0,
          errorCount: 0,
        },
        engagement: {
          likes: 0,
          shares: 0,
          comments: 0,
          bookmarks: 0,
        },
        demographics: {
          ageGroups: {},
          regions: {},
          devices: {},
        },
      },
      monetization: {
        enabled: false,
        pricing: {
          type: 'free',
          amount: 0,
          currency: 'USD',
        },
        revenue: {
          total: 0,
          transactions: 0,
          averageTransaction: 0,
        },
        promotions: [],
      },
      collaboration: {
        contributors: [{
          userId: request.creatorId,
          role: 'owner',
          permissions: ['read', 'write', 'delete', 'publish'],
          joinedAt: new Date(),
        }],
        versions: [],
        comments: [],
      },
      publishing: {
        featured: false,
        promoted: false,
        searchRank: 0,
        trendingScore: 0,
      },
      storage: {
        provider: this.config.defaultStorageProvider,
        bucket: 'media-content',
        key: `content_${Date.now()}`,
        region: 'us-east-1',
        backupLocations: [],
      },
      cache: {
        enabled: true,
        ttl: 3600,
        cacheHits: 0,
        cacheMisses: 0,
      },
    });

    await mediaContent.save();
  }

  // Update media content record
  private async updateMediaContentRecord(
    type: MediaType,
    contentId: string,
    request: IContentUpdateRequest
  ): Promise<void> {
    const updateData: any = {};

    if (request.title) updateData.title = request.title;
    if (request.description) updateData.description = request.description;
    if (request.status) updateData.status = request.status;
    if (request.visibility) updateData.visibility = request.visibility;
    if (request.tags) updateData.tags = request.tags;
    if (request.category) updateData.category = request.category;

    if (Object.keys(updateData).length > 0) {
      await MediaContentModel.findOneAndUpdate(
        { contentId: contentId, type },
        { $set: updateData },
        { new: true }
      );
    }
  }

  // Update media content status
  private async updateMediaContentStatus(
    contentId: string,
    status: 'draft' | 'published' | 'archived' | 'deleted'
  ): Promise<void> {
    await MediaContentModel.findOneAndUpdate(
      { contentId },
      { $set: { status } },
      { new: true }
    );
  }

  // Log content event
  private async logContentEvent(
    eventType: 'created' | 'updated' | 'deleted' | 'published' | 'viewed',
    type: MediaType,
    contentId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    // In a real implementation, this would log to a dedicated event store
    console.log(`Content event: ${eventType} - ${type} - ${contentId} by ${userId}`);
  }

  // Get content type name for model reference
  private getContentTypeName(type: MediaType): 'Game' | 'VRScene' | 'ARObject' | 'Avatar' | 'VirtualSpace' {
    switch (type) {
      case 'game': return 'Game';
      case 'vr_scene': return 'VRScene';
      case 'ar_object': return 'ARObject';
      case 'avatar': return 'Avatar';
      case 'virtual_space': return 'VirtualSpace';
      default: throw new Error(`Invalid media type: ${type}`);
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    for (const service of this.services.values()) {
      await service.cleanup();
    }
  }
}

// Service implementations for each media type
class GameService extends BaseMediaService<IGame> {
  async create(data: IContentCreationRequest): Promise<IContentResponse<IGame>> {
    // Implementation for game creation
    return { success: true, data: {} as IGame };
  }

  async update(id: string, data: IContentUpdateRequest): Promise<IContentResponse<IGame>> {
    // Implementation for game update
    return { success: true, data: {} as IGame };
  }

  async delete(id: string): Promise<IContentResponse<boolean>> {
    // Implementation for game deletion
    return { success: true, data: true };
  }

  async getById(id: string): Promise<IContentResponse<IGame>> {
    // Implementation for game retrieval
    return { success: true, data: {} as IGame };
  }

  async search(filters: any): Promise<IContentResponse<IGame[]>> {
    // Implementation for game search
    return { success: true, data: [] };
  }

  async validate(data: any): Promise<IValidationResult> {
    // Implementation for game validation
    return { valid: true, errors: [], warnings: [] };
  }
}

class VRSceneService extends BaseMediaService<IVRScene> {
  async create(data: IContentCreationRequest): Promise<IContentResponse<IVRScene>> {
    // Implementation for VR scene creation
    return { success: true, data: {} as IVRScene };
  }

  async update(id: string, data: IContentUpdateRequest): Promise<IContentResponse<IVRScene>> {
    // Implementation for VR scene update
    return { success: true, data: {} as IVRScene };
  }

  async delete(id: string): Promise<IContentResponse<boolean>> {
    // Implementation for VR scene deletion
    return { success: true, data: true };
  }

  async getById(id: string): Promise<IContentResponse<IVRScene>> {
    // Implementation for VR scene retrieval
    return { success: true, data: {} as IVRScene };
  }

  async search(filters: any): Promise<IContentResponse<IVRScene[]>> {
    // Implementation for VR scene search
    return { success: true, data: [] };
  }

  async validate(data: any): Promise<IValidationResult> {
    // Implementation for VR scene validation
    return { valid: true, errors: [], warnings: [] };
  }
}

class ARObjectService extends BaseMediaService<IARObject> {
  async create(data: IContentCreationRequest): Promise<IContentResponse<IARObject>> {
    // Implementation for AR object creation
    return { success: true, data: {} as IARObject };
  }

  async update(id: string, data: IContentUpdateRequest): Promise<IContentResponse<IARObject>> {
    // Implementation for AR object update
    return { success: true, data: {} as IARObject };
  }

  async delete(id: string): Promise<IContentResponse<boolean>> {
    // Implementation for AR object deletion
    return { success: true, data: true };
  }

  async getById(id: string): Promise<IContentResponse<IARObject>> {
    // Implementation for AR object retrieval
    return { success: true, data: {} as IARObject };
  }

  async search(filters: any): Promise<IContentResponse<IARObject[]>> {
    // Implementation for AR object search
    return { success: true, data: [] };
  }

  async validate(data: any): Promise<IValidationResult> {
    // Implementation for AR object validation
    return { valid: true, errors: [], warnings: [] };
  }
}

class AvatarService extends BaseMediaService<IAvatar> {
  async create(data: IContentCreationRequest): Promise<IContentResponse<IAvatar>> {
    // Implementation for avatar creation
    return { success: true, data: {} as IAvatar };
  }

  async update(id: string, data: IContentUpdateRequest): Promise<IContentResponse<IAvatar>> {
    // Implementation for avatar update
    return { success: true, data: {} as IAvatar };
  }

  async delete(id: string): Promise<IContentResponse<boolean>> {
    // Implementation for avatar deletion
    return { success: true, data: true };
  }

  async getById(id: string): Promise<IContentResponse<IAvatar>> {
    // Implementation for avatar retrieval
    return { success: true, data: {} as IAvatar };
  }

  async search(filters: any): Promise<IContentResponse<IAvatar[]>> {
    // Implementation for avatar search
    return { success: true, data: [] };
  }

  async validate(data: any): Promise<IValidationResult> {
    // Implementation for avatar validation
    return { valid: true, errors: [], warnings: [] };
  }
}

class VirtualSpaceService extends BaseMediaService<IVirtualSpace> {
  async create(data: IContentCreationRequest): Promise<IContentResponse<IVirtualSpace>> {
    // Implementation for virtual space creation
    return { success: true, data: {} as IVirtualSpace };
  }

  async update(id: string, data: IContentUpdateRequest): Promise<IContentResponse<IVirtualSpace>> {
    // Implementation for virtual space update
    return { success: true, data: {} as IVirtualSpace };
  }

  async delete(id: string): Promise<IContentResponse<boolean>> {
    // Implementation for virtual space deletion
    return { success: true, data: true };
  }

  async getById(id: string): Promise<IContentResponse<IVirtualSpace>> {
    // Implementation for virtual space retrieval
    return { success: true, data: {} as IVirtualSpace };
  }

  async search(filters: any): Promise<IContentResponse<IVirtualSpace[]>> {
    // Implementation for virtual space search
    return { success: true, data: [] };
  }

  async validate(data: any): Promise<IValidationResult> {
    // Implementation for virtual space validation
    return { valid: true, errors: [], warnings: [] };
  }
}