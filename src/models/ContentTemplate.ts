import mongoose, { Document, Schema } from 'mongoose';

// Template categories
export type TemplateCategory = 'text' | 'image' | 'video' | 'audio' | 'code' | 'multimodal';

// Template visibility
export type TemplateVisibility = 'private' | 'organization' | 'public' | 'premium';

export interface IContentTemplate extends Document {
  // Basic information
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;

  // Template identification
  name: string;
  description: string;
  category: TemplateCategory;
  subcategory?: string;

  // Template content
  promptTemplate: string;
  systemMessage?: string;
  examples?: Array<{
    input: string;
    output: string;
    description?: string;
  }>;

  // Generation parameters
  defaultParameters: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    customParameters?: Record<string, any>;
  };

  // Metadata
  tags: string[];
  useCount: number;
  rating: number;
  reviewCount: number;

  // Configuration
  visibility: TemplateVisibility;
  isActive: boolean;
  isDefault: boolean;

  // Versioning
  version: number;
  parentId?: mongoose.Types.ObjectId;

  // Analytics
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

const ContentTemplateSchema: Schema = new Schema({
  // Basic information
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },

  // Template identification
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  category: {
    type: String,
    required: true,
    enum: ['text', 'image', 'video', 'audio', 'code', 'multimodal'],
  },
  subcategory: {
    type: String,
    trim: true,
  },

  // Template content
  promptTemplate: {
    type: String,
    required: true,
  },
  systemMessage: {
    type: String,
    trim: true,
  },
  examples: [{
    input: String,
    output: String,
    description: String,
  }],

  // Generation parameters
  defaultParameters: {
    model: String,
    temperature: Number,
    maxTokens: Number,
    topP: Number,
    frequencyPenalty: Number,
    presencePenalty: Number,
    customParameters: Schema.Types.Mixed,
  },

  // Metadata
  tags: [{
    type: String,
    trim: true,
  }],
  useCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },

  // Configuration
  visibility: {
    type: String,
    enum: ['private', 'organization', 'public', 'premium'],
    default: 'private',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },

  // Versioning
  version: {
    type: Number,
    default: 1,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'ContentTemplate',
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
ContentTemplateSchema.index({ userId: 1 });
ContentTemplateSchema.index({ organization: 1 });
ContentTemplateSchema.index({ category: 1 });
ContentTemplateSchema.index({ visibility: 1 });
ContentTemplateSchema.index({ isActive: 1 });
ContentTemplateSchema.index({ tags: 1 });
ContentTemplateSchema.index({ useCount: -1 });
ContentTemplateSchema.index({ rating: -1 });
ContentTemplateSchema.index({ name: 'text', description: 'text' });

// Instance methods
ContentTemplateSchema.methods.incrementUseCount = function() {
  this.useCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

ContentTemplateSchema.methods.updateRating = function(newRating: number) {
  const totalRating = this.rating * this.reviewCount;
  this.reviewCount += 1;
  this.rating = (totalRating + newRating) / this.reviewCount;
  return this.save();
};

// Static methods
ContentTemplateSchema.statics.findByCategory = function(category: TemplateCategory, options?: any) {
  return this.find({ category, isActive: true, ...options }).sort({ useCount: -1 });
};

ContentTemplateSchema.statics.findByOrganization = function(organizationId: string, options?: any) {
  return this.find({ organization: organizationId, isActive: true, ...options }).sort({ createdAt: -1 });
};

ContentTemplateSchema.statics.findPublicTemplates = function(category?: TemplateCategory) {
  const query: any = {
    visibility: 'public',
    isActive: true
  };
  if (category) {
    query.category = category;
  }
  return this.find(query).sort({ useCount: -1 });
};

ContentTemplateSchema.statics.getPopularTemplates = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ useCount: -1, rating: -1 })
    .limit(limit);
};

export default mongoose.models.ContentTemplate || mongoose.model<IContentTemplate>('ContentTemplate', ContentTemplateSchema);