import mongoose, { Document, Schema } from 'mongoose';

export interface IMediaContent extends Document {
  title: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  type: 'game' | 'vr_scene' | 'ar_object' | 'avatar' | 'virtual_space';
  contentId: mongoose.Types.ObjectId; // Reference to the specific content model
  contentType: 'Game' | 'VRScene' | 'ARObject' | 'Avatar' | 'VirtualSpace';
  status: 'draft' | 'published' | 'archived' | 'deleted';
  visibility: 'public' | 'private' | 'organization' | 'unlisted';
  tags: string[];
  category: string;
  metadata: {
    version: string;
    fileSize: number;
    thumbnailUrl: string;
    previewUrl?: string;
    duration?: number; // For time-based content
    dimensions?: {
      width: number;
      height: number;
      depth?: number;
    };
    compatibility: {
      platforms: string[];
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
  };
  permissions: {
    access: 'public' | 'invite_only' | 'password' | 'whitelist';
    password?: string;
    whitelist: mongoose.Types.ObjectId[];
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
  };
  analytics: {
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
  };
  monetization: {
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
  };
  collaboration: {
    contributors: Array<{
      userId: mongoose.Types.ObjectId;
      role: 'owner' | 'editor' | 'viewer' | 'reviewer';
      permissions: string[];
      joinedAt: Date;
    }>;
    versions: Array<{
      version: string;
      changes: string[];
      createdBy: mongoose.Types.ObjectId;
      createdAt: Date;
    }>;
    comments: Array<{
      userId: mongoose.Types.ObjectId;
      content: string;
      timestamp: Date;
      resolved: boolean;
      replies: Array<{
        userId: mongoose.Types.ObjectId;
        content: string;
        timestamp: Date;
      }>;
    }>;
  };
  publishing: {
    publishedAt?: Date;
    publishedBy?: mongoose.Types.ObjectId;
    featured: boolean;
    promoted: boolean;
    searchRank: number;
    trendingScore: number;
  };
  storage: {
    provider: 'local' | 'aws_s3' | 'google_cloud' | 'azure_blob' | 'cloudflare_r2';
    bucket: string;
    key: string;
    region: string;
    cdnUrl?: string;
    backupLocations: string[];
  };
  cache: {
    enabled: boolean;
    ttl: number;
    lastCached: Date;
    cacheHits: number;
    cacheMisses: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MediaContentSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['game', 'vr_scene', 'ar_object', 'avatar', 'virtual_space'],
    required: true,
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  contentType: {
    type: String,
    enum: ['Game', 'VRScene', 'ARObject', 'Avatar', 'VirtualSpace'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'deleted'],
    default: 'draft',
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'organization', 'unlisted'],
    default: 'private',
  },
  tags: [{ type: String }],
  category: { type: String },
  metadata: {
    version: { type: String, default: '1.0.0' },
    fileSize: { type: Number, default: 0 },
    thumbnailUrl: { type: String },
    previewUrl: { type: String },
    duration: { type: Number },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
      depth: { type: Number },
    },
    compatibility: {
      platforms: [{ type: String }],
      minVersion: { type: String },
      maxVersion: { type: String },
    },
    requirements: {
      hardware: [{ type: String }],
      software: [{ type: String }],
      network: { type: String },
    },
    createdFrom: {
      type: String,
      enum: ['template', 'upload', 'generated', 'imported'],
      default: 'template',
    },
    templateId: { type: String },
    generationParameters: { type: Schema.Types.Mixed, default: {} },
  },
  permissions: {
    access: {
      type: String,
      enum: ['public', 'invite_only', 'password', 'whitelist'],
      default: 'private',
    },
    password: { type: String },
    whitelist: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    roles: [{
      name: { type: String, required: true },
      permissions: [{ type: String }],
      maxUsers: { type: Number, default: 10 },
    }],
    licensing: {
      type: {
        type: String,
        enum: ['all_rights_reserved', 'creative_commons', 'public_domain', 'custom'],
        default: 'all_rights_reserved',
      },
      licenseUrl: { type: String },
      restrictions: [{ type: String }],
    },
  },
  analytics: {
    views: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    averageSessionTime: { type: Number, default: 0 },
    interactions: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      distribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },
    performance: {
      loadTime: { type: Number, default: 0 },
      frameRate: { type: Number, default: 0 },
      crashCount: { type: Number, default: 0 },
      errorCount: { type: Number, default: 0 },
    },
    engagement: {
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
    },
    demographics: {
      ageGroups: { type: Schema.Types.Mixed, default: {} },
      regions: { type: Schema.Types.Mixed, default: {} },
      devices: { type: Schema.Types.Mixed, default: {} },
    },
  },
  monetization: {
    enabled: { type: Boolean, default: false },
    pricing: {
      type: {
        type: String,
        enum: ['free', 'one_time', 'subscription', 'usage_based'],
        default: 'free',
      },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      period: {
        type: String,
        enum: ['monthly', 'yearly', 'daily'],
      },
    },
    revenue: {
      total: { type: Number, default: 0 },
      transactions: { type: Number, default: 0 },
      averageTransaction: { type: Number, default: 0 },
    },
    promotions: [{
      type: {
        type: String,
        enum: ['discount', 'bundle', 'featured'],
        required: true,
      },
      value: { type: Number, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      conditions: { type: Schema.Types.Mixed, default: {} },
    }],
  },
  collaboration: {
    contributors: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['owner', 'editor', 'viewer', 'reviewer'],
        default: 'viewer',
      },
      permissions: [{ type: String }],
      joinedAt: { type: Date, default: Date.now },
    }],
    versions: [{
      version: { type: String, required: true },
      changes: [{ type: String }],
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
    }],
    comments: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      resolved: { type: Boolean, default: false },
      replies: [{
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      }],
    }],
  },
  publishing: {
    publishedAt: { type: Date },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    featured: { type: Boolean, default: false },
    promoted: { type: Boolean, default: false },
    searchRank: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0 },
  },
  storage: {
    provider: {
      type: String,
      enum: ['local', 'aws_s3', 'google_cloud', 'azure_blob', 'cloudflare_r2'],
      default: 'local',
    },
    bucket: { type: String, required: true },
    key: { type: String, required: true },
    region: { type: String, default: 'us-east-1' },
    cdnUrl: { type: String },
    backupLocations: [{ type: String }],
  },
  cache: {
    enabled: { type: Boolean, default: true },
    ttl: { type: Number, default: 3600 },
    lastCached: { type: Date },
    cacheHits: { type: Number, default: 0 },
    cacheMisses: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
MediaContentSchema.index({ organizationId: 1 });
MediaContentSchema.index({ creatorId: 1 });
MediaContentSchema.index({ type: 1 });
MediaContentSchema.index({ status: 1 });
MediaContentSchema.index({ visibility: 1 });
MediaContentSchema.index({ title: 'text', description: 'text' });
MediaContentSchema.index({ tags: 1 });
MediaContentSchema.index({ category: 1 });
MediaContentSchema.index({ 'analytics.rating.average': -1 });
MediaContentSchema.index({ 'analytics.views': -1 });
MediaContentSchema.index({ 'publishing.featured': 1 });
MediaContentSchema.index({ 'publishing.trendingScore': -1 });
MediaContentSchema.index({ createdAt: -1 });

// Method to update analytics
MediaContentSchema.methods.updateAnalytics = function(
  sessionTime: number,
  rating?: number,
  demographics?: { age?: string; region?: string; device?: string }
): void {
  this.analytics.views += 1;
  this.analytics.averageSessionTime =
    (this.analytics.averageSessionTime * (this.analytics.views - 1) + sessionTime) / this.analytics.views;

  if (rating) {
    this.analytics.rating.count += 1;
    this.analytics.rating.average =
      (this.analytics.rating.average * (this.analytics.rating.count - 1) + rating) / this.analytics.rating.count;

    this.analytics.rating.distribution[Math.floor(rating) as keyof typeof this.analytics.rating.distribution] += 1;
  }

  if (demographics) {
    if (demographics.age) {
      this.analytics.demographics.ageGroups[demographics.age] =
        (this.analytics.demographics.ageGroups[demographics.age] || 0) + 1;
    }
    if (demographics.region) {
      this.analytics.demographics.regions[demographics.region] =
        (this.analytics.demographics.regions[demographics.region] || 0) + 1;
    }
    if (demographics.device) {
      this.analytics.demographics.devices[demographics.device] =
        (this.analytics.demographics.devices[demographics.device] || 0) + 1;
    }
  }
};

// Method to publish content
MediaContentSchema.methods.publish = function(userId: mongoose.Types.ObjectId): void {
  this.status = 'published';
  this.publishing.publishedAt = new Date();
  this.publishing.publishedBy = userId;
  this.visibility = 'public';
};

// Method to add collaborator
MediaContentSchema.methods.addCollaborator = function(
  userId: mongoose.Types.ObjectId,
  role: 'owner' | 'editor' | 'viewer' | 'reviewer',
  permissions: string[]
): void {
  const existing = this.collaboration.contributors.find((c: any) => c.userId.toString() === userId.toString());
  if (existing) {
    existing.role = role;
    existing.permissions = permissions;
  } else {
    this.collaboration.contributors.push({
      userId,
      role,
      permissions,
      joinedAt: new Date(),
    });
  }
};

// Method to create new version
MediaContentSchema.methods.createVersion = function(
  userId: mongoose.Types.ObjectId,
  changes: string[]
): void {
  const version = {
    version: this.metadata.version,
    changes,
    createdBy: userId,
    createdAt: new Date(),
  };

  this.collaboration.versions.push(version);

  // Increment version number
  const versionParts = this.metadata.version.split('.').map(Number);
  versionParts[versionParts.length - 1] += 1;
  this.metadata.version = versionParts.join('.');
};

// Method to get content summary
MediaContentSchema.methods.getSummary = function(): {
  id: string;
  title: string;
  type: string;
  status: string;
  rating: number;
  views: number;
  createdAt: Date;
  thumbnailUrl: string;
} {
  return {
    id: this._id.toString(),
    title: this.title,
    type: this.type,
    status: this.status,
    rating: this.analytics.rating.average,
    views: this.analytics.views,
    createdAt: this.createdAt,
    thumbnailUrl: this.metadata.thumbnailUrl,
  };
};

// Method to check permissions
MediaContentSchema.methods.hasPermission = function(
  userId: mongoose.Types.ObjectId,
  permission: string
): boolean {
  if (this.creatorId.toString() === userId.toString()) {
    return true;
  }

  const contributor = this.collaboration.contributors.find((c: any) => c.userId.toString() === userId.toString());
  if (contributor && contributor.permissions.includes(permission)) {
    return true;
  }

  return this.permissions.access === 'public' && this.status === 'published';
};

export default mongoose.models.MediaContent || mongoose.model<IMediaContent>('MediaContent', MediaContentSchema);