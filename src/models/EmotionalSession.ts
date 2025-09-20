import mongoose, { Document, Schema } from 'mongoose';

export interface IEmotionalSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionType: 'empathy' | 'mood_optimization' | 'resilience_training' | 'therapeutic_narrative';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  emotionalState: {
    baseline: {
      mood: number; // 1-10 scale
      anxiety: number; // 1-10 scale
      stress: number; // 1-10 scale
      empathy: number; // 1-10 scale
    };
    current: {
      mood: number;
      anxiety: number;
      stress: number;
      empathy: number;
    };
    target: {
      mood: number;
      anxiety: number;
      stress: number;
      empathy: number;
    };
  };
  interventions: {
    type: string;
    name: string;
    effectiveness: number; // 1-10 scale
    appliedAt: Date;
    duration: number; // in minutes
  }[];
  safetyFlags: {
    crisisDetected: boolean;
    professionalHelpRecommended: boolean;
    sessionPaused: boolean;
    reason?: string;
  };
  metadata: {
    deviceInfo?: string;
    location?: string;
    weather?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmotionalSessionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionType: {
    type: String,
    enum: ['empathy', 'mood_optimization', 'resilience_training', 'therapeutic_narrative'],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number,
    default: null,
  },
  emotionalState: {
    baseline: {
      mood: { type: Number, min: 1, max: 10, required: true },
      anxiety: { type: Number, min: 1, max: 10, required: true },
      stress: { type: Number, min: 1, max: 10, required: true },
      empathy: { type: Number, min: 1, max: 10, required: true },
    },
    current: {
      mood: { type: Number, min: 1, max: 10, required: true },
      anxiety: { type: Number, min: 1, max: 10, required: true },
      stress: { type: Number, min: 1, max: 10, required: true },
      empathy: { type: Number, min: 1, max: 10, required: true },
    },
    target: {
      mood: { type: Number, min: 1, max: 10, required: true },
      anxiety: { type: Number, min: 1, max: 10, required: true },
      stress: { type: Number, min: 1, max: 10, required: true },
      empathy: { type: Number, min: 1, max: 10, required: true },
    },
  },
  interventions: [{
    type: { type: String, required: true },
    name: { type: String, required: true },
    effectiveness: { type: Number, min: 1, max: 10, required: true },
    appliedAt: { type: Date, default: Date.now },
    duration: { type: Number, required: true },
  }],
  safetyFlags: {
    crisisDetected: { type: Boolean, default: false },
    professionalHelpRecommended: { type: Boolean, default: false },
    sessionPaused: { type: Boolean, default: false },
    reason: { type: String, default: null },
  },
  metadata: {
    deviceInfo: { type: String, default: null },
    location: { type: String, default: null },
    weather: { type: String, default: null },
    notes: { type: String, default: null },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
EmotionalSessionSchema.index({ userId: 1, sessionType: 1 });
EmotionalSessionSchema.index({ startTime: -1 });
EmotionalSessionSchema.index({ 'emotionalState.baseline.mood': 1 });
EmotionalSessionSchema.index({ 'safetyFlags.crisisDetected': 1 });

export default mongoose.models.EmotionalSession || mongoose.model<IEmotionalSession>('EmotionalSession', EmotionalSessionSchema);