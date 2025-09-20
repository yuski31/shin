import mongoose, { Document, Schema } from 'mongoose';

export interface ICreativeBreakthrough extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  breakthroughType: 'insight' | 'connection' | 'innovation' | 'solution' | 'revelation' | 'paradigm_shift';
  domain: string; // The creative domain where breakthrough occurred
  context: {
    sessionType: string;
    toolsUsed: string[];
    constraints: string[];
    inspirationSources: mongoose.Types.ObjectId[];
    timeOfDay?: string;
    environment?: string;
  };
  content: {
    before: string; // What was the situation/problem before breakthrough
    during: string; // The breakthrough moment itself
    after: string; // What changed after the breakthrough
    insight: string; // The key insight or realization
  };
  impact: {
    immediate: {
      ideasGenerated: number;
      productivityBoost: number; // 1-10 scale
      creativitySpike: number; // 1-10 scale
    };
    potential: {
      applications: string[];
      scalability: number; // 1-10 scale
      marketPotential?: number; // 1-10 scale
      innovationLevel: number; // 1-10 scale
    };
  };
  metrics: {
    noveltyScore: number; // 1-10 scale
    usefulnessScore: number; // 1-10 scale
    implementationDifficulty: number; // 1-10 scale
    breakthroughMagnitude: number; // 1-10 scale
    confidence: number; // 0-1 scale (how confident the system is this was a breakthrough)
  };
  patterns: {
    trigger: string; // What triggered the breakthrough
    patternType: 'sudden_insight' | 'gradual_buildup' | 'combinatorial_creativity' | 'constraint_removal' | 'cross_domain_transfer';
    frequency: 'rare' | 'occasional' | 'frequent';
    similarBreakthroughs: mongoose.Types.ObjectId[]; // References to similar breakthroughs
  };
  sharing: {
    isPublic: boolean;
    sharedWith: mongoose.Types.ObjectId[]; // Users this breakthrough was shared with
    anonymized: boolean; // Whether personal details are hidden when shared
    useCase: string; // How others can use this breakthrough
  };
  followUp: {
    implemented: boolean;
    implementationDate?: Date;
    results: string;
    nextSteps: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const CreativeBreakthroughSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'CreativeSession',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  breakthroughType: {
    type: String,
    enum: ['insight', 'connection', 'innovation', 'solution', 'revelation', 'paradigm_shift'],
    required: true,
  },
  domain: {
    type: String,
    required: true,
    trim: true,
  },
  context: {
    sessionType: { type: String, required: true },
    toolsUsed: [{ type: String }],
    constraints: [{ type: String }],
    inspirationSources: [{
      type: Schema.Types.ObjectId,
      ref: 'InspirationSource',
    }],
    timeOfDay: { type: String, default: null },
    environment: { type: String, default: null },
  },
  content: {
    before: { type: String, required: true },
    during: { type: String, required: true },
    after: { type: String, required: true },
    insight: { type: String, required: true },
  },
  impact: {
    immediate: {
      ideasGenerated: { type: Number, default: 0 },
      productivityBoost: { type: Number, min: 1, max: 10, default: 5 },
      creativitySpike: { type: Number, min: 1, max: 10, default: 5 },
    },
    potential: {
      applications: [{ type: String }],
      scalability: { type: Number, min: 1, max: 10, default: 5 },
      marketPotential: { type: Number, min: 1, max: 10, default: null },
      innovationLevel: { type: Number, min: 1, max: 10, default: 5 },
    },
  },
  metrics: {
    noveltyScore: { type: Number, min: 1, max: 10, required: true },
    usefulnessScore: { type: Number, min: 1, max: 10, required: true },
    implementationDifficulty: { type: Number, min: 1, max: 10, required: true },
    breakthroughMagnitude: { type: Number, min: 1, max: 10, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
  },
  patterns: {
    trigger: { type: String, required: true },
    patternType: {
      type: String,
      enum: ['sudden_insight', 'gradual_buildup', 'combinatorial_creativity', 'constraint_removal', 'cross_domain_transfer'],
      required: true,
    },
    frequency: {
      type: String,
      enum: ['rare', 'occasional', 'frequent'],
      default: 'occasional',
    },
    similarBreakthroughs: [{
      type: Schema.Types.ObjectId,
      ref: 'CreativeBreakthrough',
    }],
  },
  sharing: {
    isPublic: { type: Boolean, default: false },
    sharedWith: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    anonymized: { type: Boolean, default: false },
    useCase: { type: String, default: null },
  },
  followUp: {
    implemented: { type: Boolean, default: false },
    implementationDate: { type: Date, default: null },
    results: { type: String, default: null },
    nextSteps: [{ type: String }],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CreativeBreakthroughSchema.index({ userId: 1, createdAt: -1 });
CreativeBreakthroughSchema.index({ sessionId: 1 });
CreativeBreakthroughSchema.index({ breakthroughType: 1 });
CreativeBreakthroughSchema.index({ domain: 1 });
CreativeBreakthroughSchema.index({ 'metrics.breakthroughMagnitude': -1 });

export default mongoose.models.CreativeBreakthrough || mongoose.model<ICreativeBreakthrough>('CreativeBreakthrough', CreativeBreakthroughSchema);