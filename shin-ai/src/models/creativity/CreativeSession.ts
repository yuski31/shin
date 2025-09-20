import mongoose, { Document, Schema } from 'mongoose';

export interface ICreativeSession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  sessionType: 'idea_generation' | 'artistic_creation' | 'brainstorming' | 'creative_writing' | 'design' | 'music_composition';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  goals: string[];
  constraints: {
    timeLimit?: number;
    resourceLimit?: string;
    theme?: string;
    style?: string;
    targetAudience?: string;
  };
  metrics: {
    ideasGenerated: number;
    breakthroughsAchieved: number;
    creativityScore: number; // 1-10 scale
    flowStateAchieved: boolean;
    distractionEvents: number;
  };
  tools: {
    ideaGeneration?: string[];
    artisticEnhancement?: string[];
    creativeBlockBusters?: string[];
  };
  environment: {
    location?: string;
    mood?: number; // 1-10 scale
    energy?: number; // 1-10 scale
    distractionsBlocked?: string[];
  };
  outcomes: {
    outputs: mongoose.Types.ObjectId[]; // References to ArtisticOutput
    breakthroughs: mongoose.Types.ObjectId[]; // References to CreativeBreakthrough
    satisfactionScore?: number; // 1-10 scale
  };
  createdAt: Date;
  updatedAt: Date;
}

const CreativeSessionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  sessionType: {
    type: String,
    enum: ['idea_generation', 'artistic_creation', 'brainstorming', 'creative_writing', 'design', 'music_composition'],
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
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active',
  },
  goals: [{
    type: String,
  }],
  constraints: {
    timeLimit: { type: Number, default: null },
    resourceLimit: { type: String, default: null },
    theme: { type: String, default: null },
    style: { type: String, default: null },
    targetAudience: { type: String, default: null },
  },
  metrics: {
    ideasGenerated: { type: Number, default: 0 },
    breakthroughsAchieved: { type: Number, default: 0 },
    creativityScore: { type: Number, min: 1, max: 10, default: 5 },
    flowStateAchieved: { type: Boolean, default: false },
    distractionEvents: { type: Number, default: 0 },
  },
  tools: {
    ideaGeneration: [{ type: String }],
    artisticEnhancement: [{ type: String }],
    creativeBlockBusters: [{ type: String }],
  },
  environment: {
    location: { type: String, default: null },
    mood: { type: Number, min: 1, max: 10, default: null },
    energy: { type: Number, min: 1, max: 10, default: null },
    distractionsBlocked: [{ type: String }],
  },
  outcomes: {
    outputs: [{
      type: Schema.Types.ObjectId,
      ref: 'ArtisticOutput',
    }],
    breakthroughs: [{
      type: Schema.Types.ObjectId,
      ref: 'CreativeBreakthrough',
    }],
    satisfactionScore: { type: Number, min: 1, max: 10, default: null },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CreativeSessionSchema.index({ userId: 1, startTime: -1 });
CreativeSessionSchema.index({ sessionType: 1 });
CreativeSessionSchema.index({ status: 1 });
CreativeSessionSchema.index({ 'metrics.creativityScore': -1 });

export default mongoose.models.CreativeSession || mongoose.model<ICreativeSession>('CreativeSession', CreativeSessionSchema);