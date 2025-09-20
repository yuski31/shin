import mongoose, { Document, Schema } from 'mongoose';

export interface ITranslationSegment {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  timestamp: Date;
  processingTime: number; // milliseconds
  context?: {
    domain: string;
    formality: 'formal' | 'informal' | 'casual';
    culturalNotes?: string[];
    idioms?: {
      original: string;
      translation: string;
      explanation: string;
    }[];
  };
  alternatives?: {
    text: string;
    confidence: number;
  }[];
}

export interface ITranslationSession {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  domain: 'general' | 'technical' | 'medical' | 'legal' | 'business' | 'education';
  mode: 'real-time' | 'batch' | 'document';
  status: 'active' | 'completed' | 'paused' | 'error';
  startedAt: Date;
  completedAt?: Date;
  totalSegments: number;
  processedSegments: number;
  averageConfidence: number;
  totalProcessingTime: number;
  metadata: {
    audioQuality?: 'good' | 'fair' | 'poor';
    dialect?: string;
    speakerCount?: number;
    culturalAdaptations?: number;
    signLanguageEnabled?: boolean;
  };
}

export interface ISignLanguageTranslation {
  id: string;
  videoUrl: string;
  sourceLanguage: string;
  targetSignLanguage: string;
  duration: number; // seconds
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  gestures: {
    id: string;
    name: string;
    startTime: number;
    endTime: number;
    confidence: number;
    description: string;
  }[];
  facialExpressions: {
    id: string;
    emotion: string;
    startTime: number;
    endTime: number;
    intensity: number;
  }[];
  processedAt: Date;
  processingTime: number;
}

export interface ICulturalAdaptation {
  id: string;
  originalText: string;
  adaptedText: string;
  adaptationType: 'idiom' | 'cultural_reference' | 'formality' | 'context' | 'humor';
  sourceCulture: string;
  targetCulture: string;
  explanation: string;
  confidence: number;
  appliedAt: Date;
}

export interface ITranslation extends Document {
  title: string;
  description?: string;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  sourceLanguage: string;
  targetLanguage: string;
  translationType: 'text' | 'audio' | 'video' | 'document' | 'real-time';
  contentType: 'plain' | 'rich' | 'structured' | 'conversational';
  domain: 'general' | 'technical' | 'medical' | 'legal' | 'business' | 'education';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  segments: ITranslationSegment[];
  session?: ITranslationSession;
  signLanguageTranslation?: ISignLanguageTranslation;
  culturalAdaptations: ICulturalAdaptation[];
  metadata: {
    totalCharacters: number;
    totalWords: number;
    averageConfidence: number;
    processingTime: number;
    dialect?: string;
    formality: 'formal' | 'informal' | 'casual';
    culturalComplexity: 'low' | 'medium' | 'high';
    audioQuality?: 'good' | 'fair' | 'poor';
    speakerCount?: number;
    signLanguageEnabled: boolean;
  };
  qualityMetrics: {
    accuracy: number; // 0-1
    fluency: number; // 0-1
    culturalAppropriateness: number; // 0-1
    technicalCorrectness: number; // 0-1
    overallScore: number; // 0-1
  };
  feedback?: {
    rating: number; // 1-5
    comments?: string;
    submittedBy: mongoose.Types.ObjectId;
    submittedAt: Date;
  };
  cost: {
    baseCost: number;
    culturalAdaptationCost: number;
    signLanguageCost: number;
    totalCost: number;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TranslationSegmentSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  sourceText: {
    type: String,
    required: true,
  },
  translatedText: {
    type: String,
    required: true,
  },
  sourceLanguage: {
    type: String,
    required: true,
  },
  targetLanguage: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  processingTime: {
    type: Number,
    required: true,
  },
  context: {
    domain: String,
    formality: {
      type: String,
      enum: ['formal', 'informal', 'casual'],
    },
    culturalNotes: [String],
    idioms: [{
      original: String,
      translation: String,
      explanation: String,
    }],
  },
  alternatives: [{
    text: String,
    confidence: Number,
  }],
}, { _id: true });

const TranslationSessionSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  sourceLanguage: {
    type: String,
    required: true,
  },
  targetLanguage: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    enum: ['general', 'technical', 'medical', 'legal', 'business', 'education'],
    default: 'general',
  },
  mode: {
    type: String,
    enum: ['real-time', 'batch', 'document'],
    default: 'batch',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'error'],
    default: 'active',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  totalSegments: {
    type: Number,
    default: 0,
  },
  processedSegments: {
    type: Number,
    default: 0,
  },
  averageConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0,
  },
  totalProcessingTime: {
    type: Number,
    default: 0,
  },
  metadata: {
    audioQuality: {
      type: String,
      enum: ['good', 'fair', 'poor'],
    },
    dialect: String,
    speakerCount: Number,
    culturalAdaptations: Number,
    signLanguageEnabled: Boolean,
  },
}, { _id: true });

const SignLanguageTranslationSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  sourceLanguage: {
    type: String,
    required: true,
  },
  targetSignLanguage: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  frameRate: {
    type: Number,
    required: true,
  },
  resolution: {
    width: Number,
    height: Number,
  },
  gestures: [{
    id: String,
    name: String,
    startTime: Number,
    endTime: Number,
    confidence: Number,
    description: String,
  }],
  facialExpressions: [{
    id: String,
    emotion: String,
    startTime: Number,
    endTime: Number,
    intensity: Number,
  }],
  processedAt: {
    type: Date,
    default: Date.now,
  },
  processingTime: {
    type: Number,
    required: true,
  },
}, { _id: true });

const CulturalAdaptationSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  originalText: {
    type: String,
    required: true,
  },
  adaptedText: {
    type: String,
    required: true,
  },
  adaptationType: {
    type: String,
    enum: ['idiom', 'cultural_reference', 'formality', 'context', 'humor'],
    required: true,
  },
  sourceCulture: {
    type: String,
    required: true,
  },
  targetCulture: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const TranslationSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sourceLanguage: {
    type: String,
    required: true,
  },
  targetLanguage: {
    type: String,
    required: true,
  },
  translationType: {
    type: String,
    enum: ['text', 'audio', 'video', 'document', 'real-time'],
    default: 'text',
  },
  contentType: {
    type: String,
    enum: ['plain', 'rich', 'structured', 'conversational'],
    default: 'plain',
  },
  domain: {
    type: String,
    enum: ['general', 'technical', 'medical', 'legal', 'business', 'education'],
    default: 'general',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  segments: [TranslationSegmentSchema],
  session: TranslationSessionSchema,
  signLanguageTranslation: SignLanguageTranslationSchema,
  culturalAdaptations: [CulturalAdaptationSchema],
  metadata: {
    totalCharacters: Number,
    totalWords: Number,
    averageConfidence: Number,
    processingTime: Number,
    dialect: String,
    formality: {
      type: String,
      enum: ['formal', 'informal', 'casual'],
      default: 'formal',
    },
    culturalComplexity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    audioQuality: {
      type: String,
      enum: ['good', 'fair', 'poor'],
    },
    speakerCount: Number,
    signLanguageEnabled: {
      type: Boolean,
      default: false,
    },
  },
  qualityMetrics: {
    accuracy: {
      type: Number,
      min: 0,
      max: 1,
    },
    fluency: {
      type: Number,
      min: 0,
      max: 1,
    },
    culturalAppropriateness: {
      type: Number,
      min: 0,
      max: 1,
    },
    technicalCorrectness: {
      type: Number,
      min: 0,
      max: 1,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comments: String,
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: Date,
  },
  cost: {
    baseCost: {
      type: Number,
      default: 0,
    },
    culturalAdaptationCost: {
      type: Number,
      default: 0,
    },
    signLanguageCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
TranslationSchema.index({ organizationId: 1, createdAt: -1 });
TranslationSchema.index({ createdBy: 1, status: 1 });
TranslationSchema.index({ sourceLanguage: 1, targetLanguage: 1 });
TranslationSchema.index({ status: 1, priority: 1 });
TranslationSchema.index({ 'session.status': 1 });
TranslationSchema.index({ 'metadata.domain': 1 });
TranslationSchema.index({ 'qualityMetrics.overallScore': -1 });

export default mongoose.models.Translation || mongoose.model<ITranslation>('Translation', TranslationSchema);