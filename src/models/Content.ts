import mongoose, { Document, Schema } from 'mongoose';

// Content types for multimodal generation
export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'code' | 'document';

// Generation status enum
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Content quality enum
export type ContentQuality = 'draft' | 'standard' | 'premium' | 'enterprise';

// Privacy levels
export type PrivacyLevel = 'private' | 'organization' | 'public';

// Text generation specific metadata
export interface ITextMetadata {
  style?: string;
  tone?: string;
  language?: string;
  wordCount?: number;
  readingTime?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords?: string[];
  seoScore?: number;
  plagiarismScore?: number;
  factCheckStatus?: 'verified' | 'questionable' | 'unverified';
}

// Image generation specific metadata
export interface IImageMetadata {
  resolution?: string;
  aspectRatio?: string;
  style?: string;
  prompt?: string;
  negativePrompt?: string;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  model?: string;
  hasObjects?: string[];
  backgroundRemoved?: boolean;
  upscaled?: boolean;
}

// Video generation specific metadata
export interface IVideoMetadata {
  duration?: number;
  fps?: number;
  resolution?: string;
  storyboard?: string[];
  scenes?: number;
  transitions?: string[];
  voiceover?: boolean;
  subtitles?: boolean;
  deepfakeDetection?: boolean;
  lipSyncScore?: number;
}

// Audio generation specific metadata
export interface IAudioMetadata {
  duration?: number;
  sampleRate?: number;
  channels?: number;
  voice?: string;
  emotion?: string;
  language?: string;
  accent?: string;
  pitch?: number;
  speed?: number;
  volume?: number;
  musicGenre?: string;
  instruments?: string[];
  effects?: string[];
}

// Code generation specific metadata
export interface ICodeMetadata {
  language?: string;
  framework?: string;
  pattern?: string;
  complexity?: 'simple' | 'intermediate' | 'advanced';
  linesOfCode?: number;
  testCoverage?: number;
  documentationScore?: number;
  securityScore?: number;
  performanceScore?: number;
  dependencies?: string[];
}

// Generation parameters interface
export interface IGenerationParameters {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
  customParameters?: Record<string, any>;
}

// Content storage interface
export interface IContentStorage {
  provider?: string; // S3, Cloudinary, local, etc.
  bucket?: string;
  key?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  checksum?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
}

// Usage tracking interface
export interface IContentUsage {
  tokensUsed?: number;
  cost?: number;
  processingTime?: number;
  providerUsed?: string;
  modelUsed?: string;
  apiCalls?: number;
}

// Content interface
export interface IContent extends Document {
  // Basic information
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;

  // Content identification
  title: string;
  description?: string;
  type: ContentType;
  subtype?: string; // e.g., 'blog-post', 'social-media', 'product-description'

  // Content data
  content: string; // Main content (text, base64 for images, etc.)
  storage?: IContentStorage;

  // Metadata based on content type
  textMetadata?: ITextMetadata;
  imageMetadata?: IImageMetadata;
  videoMetadata?: IVideoMetadata;
  audioMetadata?: IAudioMetadata;
  codeMetadata?: ICodeMetadata;

  // Generation information
  generationParameters?: IGenerationParameters;
  status: GenerationStatus;
  quality: ContentQuality;
  privacy: PrivacyLevel;

  // Versioning
  version: number;
  parentId?: mongoose.Types.ObjectId; // For variations/remixes
  isVariation: boolean;

  // Usage tracking
  usage: IContentUsage;

  // Tags and categorization
  tags: string[];
  categories: string[];

  // Template/Preset information
  templateId?: mongoose.Types.ObjectId;
  presetId?: mongoose.Types.ObjectId;

  // Error handling
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  generatedAt?: Date;
  publishedAt?: Date;

  // Analytics
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  rating?: number;
  feedback?: string[];
}

// Content Schema
const ContentSchema: Schema = new Schema({
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
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },

  // Content identification
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'video', 'audio', 'code', 'document'],
  },
  subtype: {
    type: String,
    trim: true,
  },

  // Content data
  content: {
    type: String,
    required: true,
  },
  storage: {
    provider: String,
    bucket: String,
    key: String,
    url: String,
    size: Number,
    mimeType: String,
    checksum: String,
    thumbnailUrl: String,
    previewUrl: String,
  },

  // Metadata based on content type
  textMetadata: {
    style: String,
    tone: String,
    language: String,
    wordCount: Number,
    readingTime: Number,
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
    },
    keywords: [String],
    seoScore: Number,
    plagiarismScore: Number,
    factCheckStatus: {
      type: String,
      enum: ['verified', 'questionable', 'unverified'],
    },
  },
  imageMetadata: {
    resolution: String,
    aspectRatio: String,
    style: String,
    prompt: String,
    negativePrompt: String,
    steps: Number,
    guidanceScale: Number,
    seed: Number,
    model: String,
    hasObjects: [String],
    backgroundRemoved: Boolean,
    upscaled: Boolean,
  },
  videoMetadata: {
    duration: Number,
    fps: Number,
    resolution: String,
    storyboard: [String],
    scenes: Number,
    transitions: [String],
    voiceover: Boolean,
    subtitles: Boolean,
    deepfakeDetection: Boolean,
    lipSyncScore: Number,
  },
  audioMetadata: {
    duration: Number,
    sampleRate: Number,
    channels: Number,
    voice: String,
    emotion: String,
    language: String,
    accent: String,
    pitch: Number,
    speed: Number,
    volume: Number,
    musicGenre: String,
    instruments: [String],
    effects: [String],
  },
  codeMetadata: {
    language: String,
    framework: String,
    pattern: String,
    complexity: {
      type: String,
      enum: ['simple', 'intermediate', 'advanced'],
    },
    linesOfCode: Number,
    testCoverage: Number,
    documentationScore: Number,
    securityScore: Number,
    performanceScore: Number,
    dependencies: [String],
  },

  // Generation information
  generationParameters: {
    model: String,
    temperature: Number,
    maxTokens: Number,
    topP: Number,
    frequencyPenalty: Number,
    presencePenalty: Number,
    seed: Number,
    customParameters: Schema.Types.Mixed,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  quality: {
    type: String,
    enum: ['draft', 'standard', 'premium', 'enterprise'],
    default: 'standard',
  },
  privacy: {
    type: String,
    enum: ['private', 'organization', 'public'],
    default: 'private',
  },

  // Versioning
  version: {
    type: Number,
    default: 1,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    default: null,
  },
  isVariation: {
    type: Boolean,
    default: false,
  },

  // Usage tracking
  usage: {
    tokensUsed: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    processingTime: { type: Number, default: 0 },
    providerUsed: String,
    modelUsed: String,
    apiCalls: { type: Number, default: 0 },
  },

  // Tags and categorization
  tags: [{
    type: String,
    trim: true,
  }],
  categories: [{
    type: String,
    trim: true,
  }],

  // Template/Preset information
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'ContentTemplate',
    default: null,
  },
  presetId: {
    type: Schema.Types.ObjectId,
    ref: 'GenerationPreset',
    default: null,
  },

  // Error handling
  errorMessage: {
    type: String,
    default: null,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },

  // Analytics
  viewCount: {
    type: Number,
    default: 0,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  feedback: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Indexes for better query performance
ContentSchema.index({ userId: 1 });
ContentSchema.index({ organization: 1 });
ContentSchema.index({ type: 1 });
ContentSchema.index({ status: 1 });
ContentSchema.index({ createdAt: -1 });
ContentSchema.index({ userId: 1, type: 1 });
ContentSchema.index({ organization: 1, type: 1 });
ContentSchema.index({ userId: 1, status: 1 });
ContentSchema.index({ tags: 1 });
ContentSchema.index({ categories: 1 });
ContentSchema.index({ 'usage.cost': -1 });
ContentSchema.index({ 'usage.tokensUsed': -1 });
ContentSchema.index({ title: 'text', description: 'text' });
ContentSchema.index({ userId: 1, createdAt: -1 });
ContentSchema.index({ organization: 1, createdAt: -1 });

// Instance methods
ContentSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

ContentSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

ContentSchema.methods.addRating = function(rating: number) {
  this.rating = rating;
  return this.save();
};

ContentSchema.methods.addFeedback = function(feedback: string) {
  this.feedback.push(feedback);
  return this.save();
};

ContentSchema.methods.updateUsage = function(usage: Partial<IContentUsage>) {
  Object.assign(this.usage, usage);
  return this.save();
};

ContentSchema.methods.retry = function() {
  if (this.retryCount < this.maxRetries) {
    this.retryCount += 1;
    this.status = 'pending';
    this.errorMessage = null;
    return this.save();
  }
  return this;
};

// Static methods
ContentSchema.statics.findByUser = function(userId: string, options?: any) {
  return this.find({ userId, ...options }).sort({ createdAt: -1 });
};

ContentSchema.statics.findByOrganization = function(organizationId: string, options?: any) {
  return this.find({ organization: organizationId, ...options }).sort({ createdAt: -1 });
};

ContentSchema.statics.findByType = function(type: ContentType, options?: any) {
  return this.find({ type, ...options }).sort({ createdAt: -1 });
};

ContentSchema.statics.findByStatus = function(status: GenerationStatus, options?: any) {
  return this.find({ status, ...options }).sort({ createdAt: -1 });
};

ContentSchema.statics.getAnalytics = function(userId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 },
        totalTokens: { $sum: '$usage.tokensUsed' },
        totalCost: { $sum: '$usage.cost' }
      }
    }
  ]);
};

export default mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);