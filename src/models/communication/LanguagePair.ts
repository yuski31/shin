import mongoose, { Document, Schema } from 'mongoose';

export interface ILanguagePair extends Document {
  sourceLanguage: string;
  targetLanguage: string;
  languageFamily: string;
  script: string;
  direction: 'unidirectional' | 'bidirectional';
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  isActive: boolean;
  supportLevel: 'basic' | 'standard' | 'advanced' | 'expert';
  translationEngine: 'neural' | 'statistical' | 'rule-based' | 'hybrid';
  domainSpecializations: string[];
  qualityMetrics: {
    averageAccuracy: number;
    averageLatency: number; // milliseconds
    totalTranslations: number;
    successfulTranslations: number;
    userSatisfaction: number; // 0-1
  };
  configuration: {
    formality: 'auto' | 'formal' | 'informal' | 'casual';
    culturalAdaptation: boolean;
    contextAwareness: boolean;
    realTimeCapable: boolean;
    batchCapable: boolean;
  };
  endangeredStatus?: {
    isEndangered: boolean;
    endangermentLevel?: 'vulnerable' | 'definitely_endangered' | 'severely_endangered' | 'critically_endangered' | 'extinct';
    speakerCount?: number;
    lastActiveDate?: Date;
    preservationEfforts?: string[];
  };
  createdBy: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LanguagePairSchema: Schema = new Schema({
  sourceLanguage: {
    type: String,
    required: true,
    index: true,
  },
  targetLanguage: {
    type: String,
    required: true,
    index: true,
  },
  languageFamily: {
    type: String,
    required: true,
    enum: [
      'Indo-European', 'Sino-Tibetan', 'Niger-Congo', 'Afro-Asiatic',
      'Austronesian', 'Dravidian', 'Altaic', 'Japonic', 'Koreanic',
      'Uralic', 'Eskimo-Aleut', 'Indigenous', 'Constructed', 'Extinct',
      'Mathematical', 'Animal', 'Symbolic'
    ],
  },
  script: {
    type: String,
    required: true,
    enum: [
      'Latin', 'Cyrillic', 'Arabic', 'Devanagari', 'Chinese', 'Japanese',
      'Korean', 'Hebrew', 'Greek', 'Thai', 'Tamil', 'Telugu', 'Kannada',
      'Malayalam', 'Sinhala', 'Burmese', 'Tibetan', 'Mathematical',
      'Symbolic', 'Bio-acoustic', 'Extinct', 'Constructed'
    ],
  },
  direction: {
    type: String,
    enum: ['unidirectional', 'bidirectional'],
    default: 'bidirectional',
  },
  complexity: {
    type: String,
    enum: ['low', 'medium', 'high', 'extreme'],
    default: 'medium',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  supportLevel: {
    type: String,
    enum: ['basic', 'standard', 'advanced', 'expert'],
    default: 'standard',
  },
  translationEngine: {
    type: String,
    enum: ['neural', 'statistical', 'rule-based', 'hybrid'],
    default: 'neural',
  },
  domainSpecializations: [{
    type: String,
    enum: [
      'general', 'technical', 'medical', 'legal', 'business', 'education',
      'literature', 'science', 'mathematics', 'philosophy', 'art',
      'music', 'religion', 'politics', 'history', 'archaeology',
      'linguistics', 'anthropology', 'psychology', 'sociology'
    ],
  }],
  qualityMetrics: {
    averageAccuracy: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    averageLatency: {
      type: Number,
      default: 0,
    },
    totalTranslations: {
      type: Number,
      default: 0,
    },
    successfulTranslations: {
      type: Number,
      default: 0,
    },
    userSatisfaction: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
  },
  configuration: {
    formality: {
      type: String,
      enum: ['auto', 'formal', 'informal', 'casual'],
      default: 'auto',
    },
    culturalAdaptation: {
      type: Boolean,
      default: true,
    },
    contextAwareness: {
      type: Boolean,
      default: true,
    },
    realTimeCapable: {
      type: Boolean,
      default: true,
    },
    batchCapable: {
      type: Boolean,
      default: true,
    },
  },
  endangeredStatus: {
    isEndangered: {
      type: Boolean,
      default: false,
    },
    endangermentLevel: {
      type: String,
      enum: ['vulnerable', 'definitely_endangered', 'severely_endangered', 'critically_endangered', 'extinct'],
    },
    speakerCount: Number,
    lastActiveDate: Date,
    preservationEfforts: [String],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
LanguagePairSchema.index({ sourceLanguage: 1, targetLanguage: 1 });
LanguagePairSchema.index({ languageFamily: 1 });
LanguagePairSchema.index({ isActive: 1 });
LanguagePairSchema.index({ 'qualityMetrics.averageAccuracy': -1 });
LanguagePairSchema.index({ 'endangeredStatus.isEndangered': 1 });
LanguagePairSchema.index({ complexity: 1 });
LanguagePairSchema.index({ script: 1 });

export default mongoose.models.LanguagePair || mongoose.model<ILanguagePair>('LanguagePair', LanguagePairSchema);