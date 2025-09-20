import mongoose, { Document, Schema } from 'mongoose';

export type AssetType = 'wireframe' | 'mockup' | 'logo' | 'color-palette' | 'typography' | 'floor-plan' | '3d-model' | 'pattern' | 'texture' | 'template';

export type AssetFormat = 'svg' | 'png' | 'jpg' | 'pdf' | 'ai' | 'psd' | 'fig' | 'sketch' | 'dwg' | 'json' | 'html' | 'css' | 'js';

export interface IDesignAsset extends Document {
  name: string;
  description: string;
  type: AssetType;
  format: AssetFormat;
  project: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  fileUrl: string;
  thumbnailUrl?: string;
  metadata: {
    width?: number;
    height?: number;
    fileSize: number;
    colors?: string[];
    fonts?: string[];
    layers?: number;
    version: string;
    tags: string[];
    category: string;
    isTemplate: boolean;
    templateCategory?: string;
  };
  content: {
    data?: Buffer;
    text?: string;
    html?: string;
    css?: string;
    js?: string;
    svg?: string;
    json?: Record<string, any>;
  };
  aiMetadata: {
    generated: boolean;
    prompt?: string;
    model?: string;
    parameters?: Record<string, any>;
    confidence?: number;
  };
  permissions: {
    isPublic: boolean;
    allowedUsers: mongoose.Types.ObjectId[];
    allowedOrganizations: mongoose.Types.ObjectId[];
  };
  usage: {
    downloads: number;
    views: number;
    likes: number;
    shares: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DesignAssetSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['wireframe', 'mockup', 'logo', 'color-palette', 'typography', 'floor-plan', '3d-model', 'pattern', 'texture', 'template'],
    required: true,
  },
  format: {
    type: String,
    enum: ['svg', 'png', 'jpg', 'pdf', 'ai', 'psd', 'fig', 'sketch', 'dwg', 'json', 'html', 'css', 'js'],
    required: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'DesignProject',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
  },
  metadata: {
    width: Number,
    height: Number,
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    colors: [String],
    fonts: [String],
    layers: Number,
    version: {
      type: String,
      default: '1.0.0',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    templateCategory: {
      type: String,
      trim: true,
    },
  },
  content: {
    data: Buffer,
    text: String,
    html: String,
    css: String,
    js: String,
    svg: String,
    json: Schema.Types.Mixed,
  },
  aiMetadata: {
    generated: {
      type: Boolean,
      default: false,
    },
    prompt: String,
    model: String,
    parameters: Schema.Types.Mixed,
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  permissions: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    allowedOrganizations: [{
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    }],
  },
  usage: {
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
DesignAssetSchema.index({ project: 1 });
DesignAssetSchema.index({ organization: 1 });
DesignAssetSchema.index({ createdBy: 1 });
DesignAssetSchema.index({ type: 1 });
DesignAssetSchema.index({ 'metadata.tags': 1 });
DesignAssetSchema.index({ 'metadata.category': 1 });
DesignAssetSchema.index({ 'metadata.isTemplate': 1 });
DesignAssetSchema.index({ 'aiMetadata.generated': 1 });
DesignAssetSchema.index({ project: 1, type: 1 });
DesignAssetSchema.index({ organization: 1, type: 1 });
DesignAssetSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for file extension
DesignAssetSchema.virtual('fileExtension').get(function(this: IDesignAsset) {
  return this.format;
});

// Virtual for isImage
DesignAssetSchema.virtual('isImage').get(function(this: IDesignAsset) {
  return ['png', 'jpg', 'svg'].includes(this.format);
});

// Virtual for isVector
DesignAssetSchema.virtual('isVector').get(function(this: IDesignAsset) {
  return ['svg', 'ai', 'pdf'].includes(this.format);
});

// Method to increment view count
DesignAssetSchema.methods.incrementViews = function(): Promise<IDesignAsset> {
  this.usage.views += 1;
  return this.save();
};

// Method to increment download count
DesignAssetSchema.methods.incrementDownloads = function(): Promise<IDesignAsset> {
  this.usage.downloads += 1;
  return this.save();
};

// Method to check if user can access asset
DesignAssetSchema.methods.canUserAccess = function(userId: mongoose.Types.ObjectId): boolean {
  if (this.permissions.isPublic) return true;

  return (
    this.createdBy.toString() === userId.toString() ||
    this.permissions.allowedUsers.some((allowedUserId: mongoose.Types.ObjectId) =>
      allowedUserId.toString() === userId.toString()
    )
  );
};

export default mongoose.models.DesignAsset || mongoose.model<IDesignAsset>('DesignAsset', DesignAssetSchema);