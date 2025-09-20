import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunicationEvent extends Document {
  sessionId: string;
  type: 'translation' | 'communication_enhancement' | 'cultural_adaptation' | 'emotion_analysis' | 'sarcasm_detection';
  direction: 'incoming' | 'outgoing' | 'bidirectional';
  sourceLanguage?: string;
  targetLanguage?: string;
  content: {
    original: string;
    processed?: string;
    enhanced?: string;
    metadata?: {
      length: number;
      complexity: 'low' | 'medium' | 'high';
      sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
      emotion?: string;
      sarcasmDetected?: boolean;
      ironyDetected?: boolean;
      culturalSensitivity?: 'low' | 'medium' | 'high' | 'critical';
    };
  };
  enhancement: {
    thoughtToText?: {
      enabled: boolean;
      wpm: number;
      accuracy: number;
      neuralPatterns: string[];
    };
    emotionToEmoji?: {
      enabled: boolean;
      primaryEmotion: string;
      emoji: string;
      confidence: number;
      alternatives: Array<{
        emotion: string;
        emoji: string;
        confidence: number;
      }>;
    };
    culturalContext?: {
      enabled: boolean;
      sourceCulture: string;
      targetCulture: string;
      adaptations: Array<{
        type: 'idiom' | 'reference' | 'formality' | 'context' | 'humor';
        original: string;
        adapted: string;
        explanation: string;
      }>;
    };
    mathematicalConversion?: {
      enabled: boolean;
      symbolicLanguage: string;
      conversionType: 'natural_language' | 'formal_notation' | 'visual_representation';
      complexity: 'basic' | 'intermediate' | 'advanced';
    };
  };
  participants: Array<{
    id: string;
    role: 'sender' | 'receiver' | 'facilitator' | 'observer';
    language: string;
    communicationStyle: 'verbal' | 'text' | 'visual' | 'symbolic';
    enhancementPreferences: {
      realTime: boolean;
      culturalAdaptation: boolean;
      emotionEnhancement: boolean;
      mathematicalConversion: boolean;
    };
  }>;
  metadata: {
    duration: number; // milliseconds
    processingTime: number;
    qualityScore: number; // 0-1
    userSatisfaction?: number;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'voice_assistant' | 'xr_device';
    inputMethod: 'keyboard' | 'voice' | 'gesture' | 'brain_computer_interface' | 'eye_tracking';
    outputMethod: 'text' | 'voice' | 'visual' | 'haptic' | 'emoji';
    environment: 'quiet' | 'noisy' | 'crowded' | 'professional' | 'casual';
  };
  feedback: {
    rating?: number; // 1-5
    comments?: string;
    improvement?: string;
    submittedAt?: Date;
  };
  createdBy: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationEventSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['translation', 'communication_enhancement', 'cultural_adaptation', 'emotion_analysis', 'sarcasm_detection'],
    required: true,
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing', 'bidirectional'],
    default: 'bidirectional',
  },
  sourceLanguage: String,
  targetLanguage: String,
  content: {
    original: {
      type: String,
      required: true,
    },
    processed: String,
    enhanced: String,
    metadata: {
      length: Number,
      complexity: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral', 'mixed'],
      },
      emotion: String,
      sarcasmDetected: Boolean,
      ironyDetected: Boolean,
      culturalSensitivity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
    },
  },
  enhancement: {
    thoughtToText: {
      enabled: Boolean,
      wpm: Number,
      accuracy: Number,
      neuralPatterns: [String],
    },
    emotionToEmoji: {
      enabled: Boolean,
      primaryEmotion: String,
      emoji: String,
      confidence: Number,
      alternatives: [{
        emotion: String,
        emoji: String,
        confidence: Number,
      }],
    },
    culturalContext: {
      enabled: Boolean,
      sourceCulture: String,
      targetCulture: String,
      adaptations: [{
        type: {
          type: String,
          enum: ['idiom', 'reference', 'formality', 'context', 'humor'],
        },
        original: String,
        adapted: String,
        explanation: String,
      }],
    },
    mathematicalConversion: {
      enabled: Boolean,
      symbolicLanguage: String,
      conversionType: {
        type: String,
        enum: ['natural_language', 'formal_notation', 'visual_representation'],
      },
      complexity: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced'],
      },
    },
  },
  participants: [{
    id: String,
    role: {
      type: String,
      enum: ['sender', 'receiver', 'facilitator', 'observer'],
    },
    language: String,
    communicationStyle: {
      type: String,
      enum: ['verbal', 'text', 'visual', 'symbolic'],
    },
    enhancementPreferences: {
      realTime: Boolean,
      culturalAdaptation: Boolean,
      emotionEnhancement: Boolean,
      mathematicalConversion: Boolean,
    },
  }],
  metadata: {
    duration: Number,
    processingTime: Number,
    qualityScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    userSatisfaction: {
      type: Number,
      min: 0,
      max: 1,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'voice_assistant', 'xr_device'],
    },
    inputMethod: {
      type: String,
      enum: ['keyboard', 'voice', 'gesture', 'brain_computer_interface', 'eye_tracking'],
    },
    outputMethod: {
      type: String,
      enum: ['text', 'voice', 'visual', 'haptic', 'emoji'],
    },
    environment: {
      type: String,
      enum: ['quiet', 'noisy', 'crowded', 'professional', 'casual'],
    },
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comments: String,
    improvement: String,
    submittedAt: Date,
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
CommunicationEventSchema.index({ sessionId: 1, createdAt: -1 });
CommunicationEventSchema.index({ type: 1, createdAt: -1 });
CommunicationEventSchema.index({ 'metadata.qualityScore': -1 });
CommunicationEventSchema.index({ sourceLanguage: 1, targetLanguage: 1 });
CommunicationEventSchema.index({ 'enhancement.thoughtToText.enabled': 1 });
CommunicationEventSchema.index({ 'enhancement.emotionToEmoji.enabled': 1 });
CommunicationEventSchema.index({ 'enhancement.culturalContext.enabled': 1 });

export default mongoose.models.CommunicationEvent || mongoose.model<ICommunicationEvent>('CommunicationEvent', CommunicationEventSchema);