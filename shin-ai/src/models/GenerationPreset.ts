import mongoose, { Document, Schema } from 'mongoose';

// Preset categories
export type PresetCategory = 'text' | 'image' | 'video' | 'audio' | 'code' | 'multimodal';

// Preset quality levels
export type PresetQuality = 'fast' | 'standard' | 'quality' | 'premium';

// Preset complexity
export type PresetComplexity = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface IGenerationPreset extends Document {
  // Basic information
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;

  // Preset identification
  name: string;
  description: string;
  category: PresetCategory;
  quality: PresetQuality;
  complexity: PresetComplexity;

  // Generation configuration
  configuration: {
    // Text generation
    text?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      style?: string;
      tone?: string;
      language?: string;
    };

    // Image generation
    image?: {
      model?: string;
      steps?: number;
      guidanceScale?: number;
      width?: number;
      height?: number;
      style?: string;
      negativePrompt?: string;
      enableUpscaling?: boolean;
      enableBackgroundRemoval?: boolean;
    };

    // Video generation
    video?: {
      model?: string;
      duration?: number;
      fps?: number;
      resolution?: string;
      enableVoiceover?: boolean;
      enableSubtitles?: boolean;
      enableDeepfakeDetection?: boolean;
    };

    // Audio generation
    audio?: {
      model?: string;
      voice?: string;
      emotion?: string;
      speed?: number;
      pitch?: number;
      enableMusic?: boolean;
      musicGenre?: string;
      enableEffects?: boolean;
    };

    // Code generation
    code?: {
      language?: string;
      framework?: string;
      pattern?: string;
      complexity?: string;
      enableTests?: boolean;
      enableDocumentation?: boolean;
      enableSecurityScan?: boolean;
    };

    // Common settings
    common?: {
      seed?: number;
      customParameters?: Record<string, any>;
      enableFactChecking?: boolean;
      enablePlagiarismCheck?: boolean;
      enableSEOOptimization?: boolean;
    };
  };

  // Cost and performance
  estimatedCost: number;
  estimatedTime: number; // in seconds
  tokenEstimate: number;

  // Usage tracking
  useCount: number;
  successRate: number;
  averageRating: number;
  reviewCount: number;

  // Configuration
  isActive: boolean;
  isDefault: boolean;
  visibility: 'private' | 'organization' | 'public' | 'premium';

  // Versioning
  version: number;
  parentId?: mongoose.Types.ObjectId;

  // Metadata
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

const GenerationPresetSchema: Schema = new Schema({
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

  // Preset identification
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
  quality: {
    type: String,
    required: true,
    enum: ['fast', 'standard', 'quality', 'premium'],
    default: 'standard',
  },
  complexity: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate',
  },

  // Generation configuration
  configuration: {
    text: {
      model: String,
      temperature: Number,
      maxTokens: Number,
      topP: Number,
      frequencyPenalty: Number,
      presencePenalty: Number,
      style: String,
      tone: String,
      language: String,
    },
    image: {
      model: String,
      steps: Number,
      guidanceScale: Number,
      width: Number,
      height: Number,
      style: String,
      negativePrompt: String,
      enableUpscaling: Boolean,
      enableBackgroundRemoval: Boolean,
    },
    video: {
      model: String,
      duration: Number,
      fps: Number,
      resolution: String,
      enableVoiceover: Boolean,
      enableSubtitles: Boolean,
      enableDeepfakeDetection: Boolean,
    },
    audio: {
      model: String,
      voice: String,
      emotion: String,
      speed: Number,
      pitch: Number,
      enableMusic: Boolean,
      musicGenre: String,
      enableEffects: Boolean,
    },
    code: {
      language: String,
      framework: String,
      pattern: String,
      complexity: String,
      enableTests: Boolean,
      enableDocumentation: Boolean,
      enableSecurityScan: Boolean,
    },
    common: {
      seed: Number,
      customParameters: Schema.Types.Mixed,
      enableFactChecking: Boolean,
      enablePlagiarismCheck: Boolean,
      enableSEOOptimization: Boolean,
    },
  },

  // Cost and performance
  estimatedCost: {
    type: Number,
    default: 0,
  },
  estimatedTime: {
    type: Number,
    default: 30,
  },
  tokenEstimate: {
    type: Number,
    default: 1000,
  },

  // Usage tracking
  useCount: {
    type: Number,
    default: 0,
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  averageRating: {
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
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  visibility: {
    type: String,
    enum: ['private', 'organization', 'public', 'premium'],
    default: 'private',
  },

  // Versioning
  version: {
    type: Number,
    default: 1,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'GenerationPreset',
    default: null,
  },

  // Metadata
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Indexes
GenerationPresetSchema.index({ userId: 1 });
GenerationPresetSchema.index({ organization: 1 });
GenerationPresetSchema.index({ category: 1 });
GenerationPresetSchema.index({ quality: 1 });
GenerationPresetSchema.index({ complexity: 1 });
GenerationPresetSchema.index({ visibility: 1 });
GenerationPresetSchema.index({ isActive: 1 });
GenerationPresetSchema.index({ tags: 1 });
GenerationPresetSchema.index({ useCount: -1 });
GenerationPresetSchema.index({ successRate: -1 });
GenerationPresetSchema.index({ estimatedCost: 1 });
GenerationPresetSchema.index({ estimatedTime: 1 });

// Instance methods
GenerationPresetSchema.methods.incrementUseCount = function() {
  this.useCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

GenerationPresetSchema.methods.updateSuccessRate = function(success: boolean) {
  const totalUses = this.useCount;
  const currentSuccesses = (this.successRate / 100) * totalUses;
  const newSuccesses = success ? currentSuccesses + 1 : currentSuccesses;
  this.successRate = totalUses > 0 ? (newSuccesses / totalUses) * 100 : 100;
  return this.save();
};

GenerationPresetSchema.methods.updateRating = function(rating: number) {
  const totalRating = this.averageRating * this.reviewCount;
  this.reviewCount += 1;
  this.averageRating = (totalRating + rating) / this.reviewCount;
  return this.save();
};

// Static methods
GenerationPresetSchema.statics.findByCategory = function(category: PresetCategory, options?: any) {
  return this.find({ category, isActive: true, ...options }).sort({ useCount: -1 });
};

GenerationPresetSchema.statics.findByQuality = function(quality: PresetQuality, options?: any) {
  return this.find({ quality, isActive: true, ...options }).sort({ estimatedCost: 1 });
};

GenerationPresetSchema.statics.findByComplexity = function(complexity: PresetComplexity, options?: any) {
  return this.find({ complexity, isActive: true, ...options }).sort({ useCount: -1 });
};

GenerationPresetSchema.statics.findByOrganization = function(organizationId: string, options?: any) {
  return this.find({ organization: organizationId, isActive: true, ...options }).sort({ createdAt: -1 });
};

GenerationPresetSchema.statics.getRecommendedPresets = function(category: PresetCategory, quality: PresetQuality, complexity: PresetComplexity) {
  return this.find({
    category,
    quality,
    complexity,
    isActive: true,
    visibility: { $in: ['public', 'organization'] }
  }).sort({ successRate: -1, useCount: -1 }).limit(5);
};

GenerationPresetSchema.statics.getCostOptimizedPresets = function(category: PresetCategory, maxCost: number) {
  return this.find({
    category,
    isActive: true,
    estimatedCost: { $lte: maxCost }
  }).sort({ estimatedCost: 1, successRate: -1 });
};

export default mongoose.models.GenerationPreset || mongoose.model<IGenerationPreset>('GenerationPreset', GenerationPresetSchema);