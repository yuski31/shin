import mongoose, { Document, Schema } from 'mongoose';

export type TemplateCategory = 'ui-component' | 'wireframe' | 'brand-kit' | 'floor-plan' | 'pattern-block' | 'presentation' | 'social-media' | 'email' | 'dashboard' | 'landing-page';

export type TemplateCompatibility = 'figma' | 'sketch' | 'adobe-xd' | 'photoshop' | 'illustrator' | 'autocad' | 'revit' | 'clo3d' | 'browser' | 'universal';

export interface IDesignTemplate extends Document {
  name: string;
  description: string;
  category: TemplateCategory;
  type: 'static' | 'dynamic' | 'interactive';
  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  thumbnailUrl: string;
  previewUrl?: string;
  downloadUrl: string;
  compatibility: TemplateCompatibility[];
  configuration: {
    variables: Array<{
      name: string;
      type: 'text' | 'number' | 'color' | 'image' | 'boolean' | 'select';
      default: any;
      options?: string[];
      required: boolean;
      description?: string;
    }>;
    styles: Record<string, any>;
    components: string[];
    dependencies: string[];
  };
  content: {
    data?: Buffer;
    text?: string;
    html?: string;
    css?: string;
    js?: string;
    json?: Record<string, any>;
  };
  metadata: {
    version: string;
    author: string;
    license: 'free' | 'premium' | 'enterprise';
    price?: number;
    tags: string[];
    industry: string[];
    useCase: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    timeEstimate: number; // in minutes
    popularity: number;
    rating: number;
    reviews: number;
  };
  aiMetadata: {
    generated: boolean;
    prompt?: string;
    model?: string;
    parameters?: Record<string, any>;
    confidence?: number;
  };
  usage: {
    downloads: number;
    views: number;
    forks: number;
    favorites: number;
  };
  permissions: {
    isPublic: boolean;
    allowedUsers: mongoose.Types.ObjectId[];
    allowedOrganizations: mongoose.Types.ObjectId[];
  };
  versions: mongoose.Types.ObjectId[];
  currentVersion: mongoose.Types.ObjectId;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DesignTemplateSchema: Schema = new Schema({
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
  category: {
    type: String,
    enum: ['ui-component', 'wireframe', 'brand-kit', 'floor-plan', 'pattern-block', 'presentation', 'social-media', 'email', 'dashboard', 'landing-page'],
    required: true,
  },
  type: {
    type: String,
    enum: ['static', 'dynamic', 'interactive'],
    default: 'static',
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
  thumbnailUrl: {
    type: String,
    required: true,
  },
  previewUrl: String,
  downloadUrl: {
    type: String,
    required: true,
  },
  compatibility: [{
    type: String,
    enum: ['figma', 'sketch', 'adobe-xd', 'photoshop', 'illustrator', 'autocad', 'revit', 'clo3d', 'browser', 'universal'],
  }],
  configuration: {
    variables: [{
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['text', 'number', 'color', 'image', 'boolean', 'select'],
        required: true,
      },
      default: Schema.Types.Mixed,
      options: [String],
      required: {
        type: Boolean,
        default: false,
      },
      description: String,
    }],
    styles: Schema.Types.Mixed,
    components: [String],
    dependencies: [String],
  },
  content: {
    data: Buffer,
    text: String,
    html: String,
    css: String,
    js: String,
    json: Schema.Types.Mixed,
  },
  metadata: {
    version: {
      type: String,
      default: '1.0.0',
    },
    author: String,
    license: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      default: 'free',
    },
    price: Number,
    tags: [String],
    industry: [String],
    useCase: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    timeEstimate: Number,
    popularity: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
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
  usage: {
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    favorites: {
      type: Number,
      default: 0,
    },
  },
  permissions: {
    isPublic: {
      type: Boolean,
      default: true,
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
  versions: [{
    type: Schema.Types.ObjectId,
    ref: 'DesignVersion',
  }],
  currentVersion: {
    type: Schema.Types.ObjectId,
    ref: 'DesignVersion',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: Date,
}, {
  timestamps: true,
});

// Indexes for better query performance
DesignTemplateSchema.index({ organization: 1 });
DesignTemplateSchema.index({ createdBy: 1 });
DesignTemplateSchema.index({ category: 1 });
DesignTemplateSchema.index({ 'metadata.license': 1 });
DesignTemplateSchema.index({ 'metadata.tags': 1 });
DesignTemplateSchema.index({ 'metadata.industry': 1 });
DesignTemplateSchema.index({ 'metadata.difficulty': 1 });
DesignTemplateSchema.index({ 'metadata.popularity': -1 });
DesignTemplateSchema.index({ 'metadata.rating': -1 });
DesignTemplateSchema.index({ isPublished: 1 });
DesignTemplateSchema.index({ organization: 1, isPublished: 1 });

// Virtual for isFree
DesignTemplateSchema.virtual('isFree').get(function(this: IDesignTemplate) {
  return this.metadata.license === 'free';
});

// Virtual for isPremium
DesignTemplateSchema.virtual('isPremium').get(function(this: IDesignTemplate) {
  return this.metadata.license === 'premium';
});

// Virtual for isEnterprise
DesignTemplateSchema.virtual('isEnterprise').get(function(this: IDesignTemplate) {
  return this.metadata.license === 'enterprise';
});

// Method to increment download count
DesignTemplateSchema.methods.incrementDownloads = function(): Promise<IDesignTemplate> {
  this.usage.downloads += 1;
  return this.save();
};

// Method to increment view count
DesignTemplateSchema.methods.incrementViews = function(): Promise<IDesignTemplate> {
  this.usage.views += 1;
  return this.save();
};

// Method to fork template
DesignTemplateSchema.methods.fork = function(userId: mongoose.Types.ObjectId): Promise<IDesignTemplate> {
  this.usage.forks += 1;
  // Implementation would create a new template based on this one
  return this.save();
};

// Method to publish template
DesignTemplateSchema.methods.publish = function(): Promise<IDesignTemplate> {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

// Method to unpublish template
DesignTemplateSchema.methods.unpublish = function(): Promise<IDesignTemplate> {
  this.isPublished = false;
  this.publishedAt = undefined;
  return this.save();
};

export default mongoose.models.DesignTemplate || mongoose.model<IDesignTemplate>('DesignTemplate', DesignTemplateSchema);