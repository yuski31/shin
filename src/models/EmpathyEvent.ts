import mongoose, { Document, Schema } from 'mongoose';

export interface IEmpathyEvent extends Document {
  userId: mongoose.Types.ObjectId;
  eventType: 'social_interaction' | 'emotional_contagion' | 'cultural_translation' | 'micro_expression' | 'empathy_prediction';
  timestamp: Date;
  participants: {
    user: mongoose.Types.ObjectId;
    others: mongoose.Types.ObjectId[];
    roles: string[];
  };
  emotionalData: {
    detectedEmotions: {
      emotion: string;
      intensity: number; // 1-10 scale
      confidence: number; // 0-1 scale
    }[];
    microExpressions: {
      type: string;
      duration: number; // in milliseconds
      intensity: number; // 1-10 scale
      context: string;
    }[];
    sentiment: {
      score: number; // -1 to 1 scale
      magnitude: number; // 0-1 scale
      primaryEmotion: string;
    };
  };
  culturalContext: {
    primaryCulture: string;
    secondaryCultures: string[];
    emotionalNorms: {
      [culture: string]: {
        emotionalExpression: 'reserved' | 'expressive' | 'moderate';
        socialDistance: 'close' | 'moderate' | 'distant';
        communicationStyle: 'direct' | 'indirect' | 'contextual';
      };
    };
    translationNeeded: boolean;
    translationAccuracy: number; // 0-1 scale
  };
  contagionPrediction: {
    predicted: boolean;
    confidence: number; // 0-1 scale
    direction: 'positive' | 'negative' | 'neutral';
    magnitude: number; // 1-10 scale
    timeframe: number; // in minutes
    affectedParticipants: mongoose.Types.ObjectId[];
  };
  interactionQuality: {
    empathyLevel: number; // 1-10 scale
    connectionDepth: number; // 1-10 scale
    mutualUnderstanding: number; // 1-10 scale
    emotionalSafety: number; // 1-10 scale
    outcome: 'positive' | 'negative' | 'neutral' | 'mixed';
  };
  metadata: {
    source: 'simulation' | 'real_interaction' | 'mixed';
    confidence: number; // 0-1 scale
    dataQuality: number; // 1-10 scale
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmpathyEventSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventType: {
    type: String,
    enum: ['social_interaction', 'emotional_contagion', 'cultural_translation', 'micro_expression', 'empathy_prediction'],
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  participants: {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    others: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    roles: [{ type: String }],
  },
  emotionalData: {
    detectedEmotions: [{
      emotion: { type: String, required: true },
      intensity: { type: Number, min: 1, max: 10, required: true },
      confidence: { type: Number, min: 0, max: 1, required: true },
    }],
    microExpressions: [{
      type: { type: String, required: true },
      duration: { type: Number, required: true },
      intensity: { type: Number, min: 1, max: 10, required: true },
      context: { type: String, required: true },
    }],
    sentiment: {
      score: { type: Number, min: -1, max: 1, required: true },
      magnitude: { type: Number, min: 0, max: 1, required: true },
      primaryEmotion: { type: String, required: true },
    },
  },
  culturalContext: {
    primaryCulture: { type: String, required: true },
    secondaryCultures: [{ type: String }],
    emotionalNorms: { type: Map, of: {
      emotionalExpression: { type: String, enum: ['reserved', 'expressive', 'moderate'] },
      socialDistance: { type: String, enum: ['close', 'moderate', 'distant'] },
      communicationStyle: { type: String, enum: ['direct', 'indirect', 'contextual'] },
    }},
    translationNeeded: { type: Boolean, default: false },
    translationAccuracy: { type: Number, min: 0, max: 1, default: 0 },
  },
  contagionPrediction: {
    predicted: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    direction: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    magnitude: { type: Number, min: 1, max: 10, default: 1 },
    timeframe: { type: Number, default: 0 },
    affectedParticipants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  interactionQuality: {
    empathyLevel: { type: Number, min: 1, max: 10, required: true },
    connectionDepth: { type: Number, min: 1, max: 10, required: true },
    mutualUnderstanding: { type: Number, min: 1, max: 10, required: true },
    emotionalSafety: { type: Number, min: 1, max: 10, required: true },
    outcome: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'mixed'],
      required: true
    },
  },
  metadata: {
    source: {
      type: String,
      enum: ['simulation', 'real_interaction', 'mixed'],
      default: 'simulation'
    },
    confidence: { type: Number, min: 0, max: 1, required: true },
    dataQuality: { type: Number, min: 1, max: 10, required: true },
    notes: { type: String, default: null },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
EmpathyEventSchema.index({ userId: 1, timestamp: -1 });
EmpathyEventSchema.index({ eventType: 1 });
EmpathyEventSchema.index({ 'participants.others': 1 });
EmpathyEventSchema.index({ timestamp: -1 });
EmpathyEventSchema.index({ 'interactionQuality.outcome': 1 });

export default mongoose.models.EmpathyEvent || mongoose.model<IEmpathyEvent>('EmpathyEvent', EmpathyEventSchema);