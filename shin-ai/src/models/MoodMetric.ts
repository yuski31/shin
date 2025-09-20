import mongoose, { Document, Schema } from 'mongoose';

export interface IMoodMetric extends Document {
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  metrics: {
    // Core mood indicators (1-10 scale)
    overallMood: number;
    happiness: number;
    sadness: number;
    anger: number;
    fear: number;
    disgust: number;
    surprise: number;

    // Anxiety and stress indicators
    anxiety: number;
    stress: number;
    overwhelm: number;
    panic: number;

    // Energy and motivation indicators
    energy: number;
    motivation: number;
    focus: number;
    creativity: number;

    // Social and empathy indicators
    empathy: number;
    socialConnection: number;
    loneliness: number;
    compassion: number;

    // Physical indicators
    sleepQuality: number;
    physicalWellbeing: number;
    fatigue: number;
    restlessness: number;

    // Cognitive indicators
    mentalClarity: number;
    decisionMaking: number;
    memory: number;
    learningCapacity: number;
  };
  triggers: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  context: {
    activity?: string;
    location?: string;
    socialSetting?: 'alone' | 'small_group' | 'large_group' | 'crowd';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    weather?: string;
    recentEvents?: string[];
  };
  interventions: {
    applied: string[];
    effectiveness: { [interventionName: string]: number }; // 1-10 scale
    userFeedback?: string;
  };
  patterns: {
    trend: 'improving' | 'declining' | 'stable' | 'fluctuating';
    confidence: number; // 0-1 scale
    insights: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const MoodMetricSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  metrics: {
    // Core mood indicators
    overallMood: { type: Number, min: 1, max: 10, required: true },
    happiness: { type: Number, min: 1, max: 10, required: true },
    sadness: { type: Number, min: 1, max: 10, required: true },
    anger: { type: Number, min: 1, max: 10, required: true },
    fear: { type: Number, min: 1, max: 10, required: true },
    disgust: { type: Number, min: 1, max: 10, required: true },
    surprise: { type: Number, min: 1, max: 10, required: true },

    // Anxiety and stress indicators
    anxiety: { type: Number, min: 1, max: 10, required: true },
    stress: { type: Number, min: 1, max: 10, required: true },
    overwhelm: { type: Number, min: 1, max: 10, required: true },
    panic: { type: Number, min: 1, max: 10, required: true },

    // Energy and motivation indicators
    energy: { type: Number, min: 1, max: 10, required: true },
    motivation: { type: Number, min: 1, max: 10, required: true },
    focus: { type: Number, min: 1, max: 10, required: true },
    creativity: { type: Number, min: 1, max: 10, required: true },

    // Social and empathy indicators
    empathy: { type: Number, min: 1, max: 10, required: true },
    socialConnection: { type: Number, min: 1, max: 10, required: true },
    loneliness: { type: Number, min: 1, max: 10, required: true },
    compassion: { type: Number, min: 1, max: 10, required: true },

    // Physical indicators
    sleepQuality: { type: Number, min: 1, max: 10, required: true },
    physicalWellbeing: { type: Number, min: 1, max: 10, required: true },
    fatigue: { type: Number, min: 1, max: 10, required: true },
    restlessness: { type: Number, min: 1, max: 10, required: true },

    // Cognitive indicators
    mentalClarity: { type: Number, min: 1, max: 10, required: true },
    decisionMaking: { type: Number, min: 1, max: 10, required: true },
    memory: { type: Number, min: 1, max: 10, required: true },
    learningCapacity: { type: Number, min: 1, max: 10, required: true },
  },
  triggers: {
    positive: [{ type: String }],
    negative: [{ type: String }],
    neutral: [{ type: String }],
  },
  context: {
    activity: { type: String, default: null },
    location: { type: String, default: null },
    socialSetting: {
      type: String,
      enum: ['alone', 'small_group', 'large_group', 'crowd'],
      default: null
    },
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: null
    },
    weather: { type: String, default: null },
    recentEvents: [{ type: String }],
  },
  interventions: {
    applied: [{ type: String }],
    effectiveness: { type: Map, of: Number },
    userFeedback: { type: String, default: null },
  },
  patterns: {
    trend: {
      type: String,
      enum: ['improving', 'declining', 'stable', 'fluctuating'],
      required: true
    },
    confidence: { type: Number, min: 0, max: 1, required: true },
    insights: [{ type: String }],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
MoodMetricSchema.index({ userId: 1, timestamp: -1 });
MoodMetricSchema.index({ timestamp: -1 });
MoodMetricSchema.index({ 'metrics.overallMood': 1 });
MoodMetricSchema.index({ 'patterns.trend': 1 });

export default mongoose.models.MoodMetric || mongoose.model<IMoodMetric>('MoodMetric', MoodMetricSchema);