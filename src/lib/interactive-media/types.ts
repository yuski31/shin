// Base types and interfaces for Interactive Media Platform

export type MediaType = 'game' | 'vr_scene' | 'ar_object' | 'avatar' | 'virtual_space';

export type MediaStatus = 'draft' | 'published' | 'archived' | 'deleted';

export type MediaVisibility = 'public' | 'private' | 'organization' | 'unlisted';

export type AccessLevel = 'public' | 'invite_only' | 'password' | 'whitelist';

export type ContentFormat = 'json' | 'binary' | 'text' | 'mixed';

export type StorageProvider = 'local' | 'aws_s3' | 'google_cloud' | 'azure_blob' | 'cloudflare_r2';

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

export type PlatformType = 'web' | 'mobile' | 'desktop' | 'vr' | 'ar' | 'console';

// Base media interface
export interface IMediaBase {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  creatorId: string;
  type: MediaType;
  status: MediaStatus;
  visibility: MediaVisibility;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// Content metadata interface
export interface IContentMetadata {
  version: string;
  fileSize: number;
  thumbnailUrl: string;
  previewUrl?: string;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
    depth?: number;
  };
  compatibility: {
    platforms: PlatformType[];
    minVersion: string;
    maxVersion: string;
  };
  requirements: {
    hardware: string[];
    software: string[];
    network: string;
  };
  createdFrom: 'template' | 'upload' | 'generated' | 'imported';
  templateId?: string;
  generationParameters?: Record<string, any>;
  tags?: string[];
  category?: string;
}

// Permission and access control
export interface IPermission {
  access: AccessLevel;
  password?: string;
  whitelist: string[];
  roles: Array<{
    name: string;
    permissions: string[];
    maxUsers: number;
  }>;
  licensing: {
    type: 'all_rights_reserved' | 'creative_commons' | 'public_domain' | 'custom';
    licenseUrl?: string;
    restrictions: string[];
  };
}

// Analytics and metrics
export interface IAnalytics {
  views: number;
  uniqueUsers: number;
  averageSessionTime: number;
  interactions: number;
  rating: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  performance: {
    loadTime: number;
    frameRate: number;
    crashCount: number;
    errorCount: number;
  };
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    bookmarks: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    regions: Record<string, number>;
    devices: Record<string, number>;
  };
}

// Storage configuration
export interface IStorageConfig {
  provider: StorageProvider;
  bucket: string;
  key: string;
  region: string;
  cdnUrl?: string;
  backupLocations: string[];
}

// Cache configuration
export interface ICacheConfig {
  enabled: boolean;
  ttl: number;
  lastCached?: Date;
  cacheHits: number;
  cacheMisses: number;
}

// Collaboration features
export interface ICollaboration {
  contributors: Array<{
    userId: string;
    role: 'owner' | 'editor' | 'viewer' | 'reviewer';
    permissions: string[];
    joinedAt: Date;
  }>;
  versions: Array<{
    version: string;
    changes: string[];
    createdBy: string;
    createdAt: Date;
  }>;
  comments: Array<{
    userId: string;
    content: string;
    timestamp: Date;
    resolved: boolean;
    replies: Array<{
      userId: string;
      content: string;
      timestamp: Date;
    }>;
  }>;
}

// Publishing information
export interface IPublishing {
  publishedAt?: Date;
  publishedBy?: string;
  featured: boolean;
  promoted: boolean;
  searchRank: number;
  trendingScore: number;
}

// Monetization settings
export interface IMonetization {
  enabled: boolean;
  pricing: {
    type: 'free' | 'one_time' | 'subscription' | 'usage_based';
    amount: number;
    currency: string;
    period?: 'monthly' | 'yearly' | 'daily';
  };
  revenue: {
    total: number;
    transactions: number;
    averageTransaction: number;
  };
  promotions: Array<{
    type: 'discount' | 'bundle' | 'featured';
    value: number;
    startDate: Date;
    endDate: Date;
    conditions: Record<string, any>;
  }>;
}

// Game-specific interfaces
export interface IGameConfig {
  world: {
    seed: number;
    dimensions: {
      width: number;
      height: number;
      depth?: number;
    };
    terrain: {
      type: 'procedural' | 'predefined';
      noiseScale: number;
      octaves: number;
      persistence: number;
      lacunarity: number;
    };
  };
  difficulty: {
    level: 'easy' | 'medium' | 'hard' | 'expert' | 'adaptive';
    scaling: {
      enemyHealth: number;
      enemyDamage: number;
      resourceSpawnRate: number;
      questComplexity: number;
    };
  };
  settings: {
    maxPlayers: number;
    isPublic: boolean;
    allowMods: boolean;
    pvpEnabled: boolean;
  };
}

// VR-specific interfaces
export interface IVRConfig {
  environment: {
    type: '360_photo' | '360_video' | '3d_model' | 'procedural';
    quality: QualityLevel;
    targetFrameRate: number;
  };
  interactions: {
    gazeTracking: boolean;
    gestureRecognition: boolean;
    hapticFeedback: boolean;
    spatialComputing: boolean;
  };
  settings: {
    maxUsers: number;
    isPublic: boolean;
    allowRecording: boolean;
  };
}

// AR-specific interfaces
export interface IARConfig {
  placement: {
    method: 'plane_detection' | 'marker_based' | 'manual' | 'gps';
    constraints: {
      planes: any[];
      markers: any[];
      manualPosition?: { x: number; y: number; z: number };
      gpsCoordinates?: { latitude: number; longitude: number; altitude: number };
    };
  };
  computerVision: {
    occlusion: boolean;
    lighting: boolean;
    tracking: {
      type: 'continuous' | 'discrete';
      stability: number;
      quality: number;
    };
  };
  settings: {
    isPersistent: boolean;
    isShared: boolean;
    maxDistance: number;
    renderQuality: QualityLevel;
  };
}

// Avatar-specific interfaces
export interface IAvatarConfig {
  appearance: {
    body: {
      height: number;
      build: 'slim' | 'average' | 'athletic' | 'heavy';
      skinTone: string;
      age: number;
    };
    face: {
      shape: 'round' | 'oval' | 'square' | 'heart' | 'diamond';
      eyeColor: string;
      hairStyle: string;
      hairColor: string;
    };
  };
  personality: {
    traits: Record<string, number>;
    voice: {
      pitch: number;
      speed: number;
      tone: 'friendly' | 'professional' | 'casual' | 'authoritative';
    };
  };
  capabilities: {
    movement: {
      walkSpeed: number;
      runSpeed: number;
      jumpHeight: number;
      canFly: boolean;
      canSwim: boolean;
    };
    interaction: {
      canChat: boolean;
      canGesture: boolean;
      languages: string[];
    };
  };
}

// Virtual Space-specific interfaces
export interface IVirtualSpaceConfig {
  environment: {
    type: 'indoor' | 'outdoor' | 'underwater' | 'space' | 'fantasy' | 'custom';
    capacity: {
      maxUsers: number;
      maxObjects: number;
    };
    physics: {
      gravity: { x: number; y: number; z: number };
      enableCollisions: boolean;
    };
  };
  economy: {
    currency: string;
    tradingEnabled: boolean;
    marketplace: {
      enabled: boolean;
      taxRate: number;
    };
  };
  social: {
    allowVoiceChat: boolean;
    allowTextChat: boolean;
    moderation: {
      enabled: boolean;
      autoModeration: boolean;
    };
  };
}

// Content creation request interface
export interface IContentCreationRequest {
  type: MediaType;
  title: string;
  description: string;
  organizationId: string;
  creatorId: string;
  config: IGameConfig | IVRConfig | IARConfig | IAvatarConfig | IVirtualSpaceConfig;
  assets: Array<{
    type: 'model' | 'texture' | 'sound' | 'script' | 'image' | 'video';
    url: string;
    name: string;
    size: number;
  }>;
  metadata?: Partial<IContentMetadata>;
  permissions?: Partial<IPermission>;
}

// Content update request interface
export interface IContentUpdateRequest {
  title?: string;
  description?: string;
  status?: MediaType;
  visibility?: MediaVisibility;
  tags?: string[];
  category?: string;
  config?: Partial<IGameConfig | IVRConfig | IARConfig | IAvatarConfig | IVirtualSpaceConfig>;
  metadata?: Partial<IContentMetadata>;
  permissions?: Partial<IPermission>;
}

// Content search and filter interface
export interface IContentSearchFilter {
  type?: MediaType;
  status?: MediaStatus;
  visibility?: MediaVisibility;
  tags?: string[];
  category?: string;
  organizationId?: string;
  creatorId?: string;
  rating?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'rating' | 'views' | 'trending';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Content response interface
export interface IContentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}

// Batch operation interface
export interface IBatchOperation {
  operation: 'create' | 'update' | 'delete' | 'publish' | 'archive';
  items: Array<{
    id: string;
    data?: Record<string, any>;
  }>;
  options?: {
    continueOnError: boolean;
    rollbackOnFailure: boolean;
  };
}

// Event interfaces
export interface IMediaEvent {
  id: string;
  type: 'created' | 'updated' | 'published' | 'archived' | 'deleted' | 'viewed' | 'interacted';
  contentId: string;
  contentType: MediaType;
  userId: string;
  organizationId: string;
  timestamp: Date;
  data: Record<string, any>;
}

// Notification interfaces
export interface IMediaNotification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  contentId?: string;
  contentType?: MediaType;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

// Export configuration interface
export interface IExportConfig {
  format: 'json' | 'gltf' | 'fbx' | 'obj' | 'zip' | 'tar';
  includeAssets: boolean;
  includeMetadata: boolean;
  includeAnalytics: boolean;
  quality: QualityLevel;
  compression: 'none' | 'low' | 'medium' | 'high';
}

// Import configuration interface
export interface IImportConfig {
  source: 'file' | 'url' | 'template';
  format: 'json' | 'gltf' | 'fbx' | 'obj' | 'zip' | 'tar';
  createNew: boolean;
  updateExisting: boolean;
  preserveIds: boolean;
  importAssets: boolean;
}

// Performance monitoring interface
export interface IPerformanceMetrics {
  contentId: string;
  contentType: MediaType;
  metrics: {
    loadTime: number;
    frameRate: number;
    memoryUsage: number;
    networkLatency: number;
    errorRate: number;
  };
  timestamp: Date;
  userAgent: string;
  deviceInfo: {
    type: string;
    os: string;
    browser?: string;
  };
}

// Error handling interfaces
export interface IMediaError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  timestamp: Date;
  contentId?: string;
  contentType?: MediaType;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Validation interfaces
export interface IValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

// Utility type for content creation
export type ContentCreationData<T extends MediaType> = T extends 'game'
  ? IGameConfig
  : T extends 'vr_scene'
  ? IVRConfig
  : T extends 'ar_object'
  ? IARConfig
  : T extends 'avatar'
  ? IAvatarConfig
  : T extends 'virtual_space'
  ? IVirtualSpaceConfig
  : never;

// Utility type for content updates
export type ContentUpdateData<T extends MediaType> = Partial<ContentCreationData<T>>;

// Utility type for content responses
export type ContentResponseData<T extends MediaType> = T extends 'game'
  ? { game: any; config: IGameConfig }
  : T extends 'vr_scene'
  ? { scene: any; config: IVRConfig }
  : T extends 'ar_object'
  ? { object: any; config: IARConfig }
  : T extends 'avatar'
  ? { avatar: any; config: IAvatarConfig }
  : T extends 'virtual_space'
  ? { space: any; config: IVirtualSpaceConfig }
  : never;