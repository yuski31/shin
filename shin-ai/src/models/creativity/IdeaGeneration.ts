import mongoose, { Document, Schema } from 'mongoose';

export interface IIdeaGeneration extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  timestamp: Date;
  method: 'cross_domain_inspiration' | 'random_association' | 'constraint_based' | 'divergent_thinking' | 'brainstorming_facilitator';
  prompt: string;
  domain: string; // art, science, technology, literature, music, etc.
  constraints: {
    timeLimit?: number;
    wordLimit?: number;
    theme?: string;
    style?: string;
    targetAudience?: string;
  };
  inspiration: {
    sources: {
      domain: string;
      concept: string;
      relevance: number; // 1-10 scale
    }[];
    crossDomainConnections: {
      sourceDomain: string;
      targetDomain: string;
      connectionStrength: number;
      insight: string;
    }[];
  };
  output: {
    ideas: {
      content: string;
      creativity: number; // 1-10 scale
      feasibility: number; // 1-10 scale
      novelty: number; // 1-10 scale
      relevance: number; // 1-10 scale
      timestamp: Date;
    }[];
    totalIdeas: number;
    breakthroughIdeas: number;
  };
  metrics: {
    generationTime: number; // in seconds
    averageIdeaQuality: number; // 1-10 scale
    diversityScore: number; // 0-1 scale
    constraintAdherence: number; // 0-1 scale
  };
  userFeedback: {
    satisfaction: number; // 1-10 scale
    easeOfUse: number; // 1-10 scale
    inspirationLevel: number; // 1-10 scale
    comments?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const IdeaGenerationSchema: Schema = new Schema({
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
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  method: {
    type: String,
    enum: ['cross_domain_inspiration', 'random_association', 'constraint_based', 'divergent_thinking', 'brainstorming_facilitator'],
    required: true,
  },
  prompt: {
    type: String,
    required: true,
    trim: true,
  },
  domain: {
    type: String,
    required: true,
    trim: true,
  },
  constraints: {
    timeLimit: { type: Number, default: null },
    wordLimit: { type: Number, default: null },
    theme: { type: String, default: null },
    style: { type: String, default: null },
    targetAudience: { type: String, default: null },
  },
  inspiration: {
    sources: [{
      domain: { type: String, required: true },
      concept: { type: String, required: true },
      relevance: { type: Number, min: 1, max: 10, required: true },
    }],
    crossDomainConnections: [{
      sourceDomain: { type: String, required: true },
      targetDomain: { type: String, required: true },
      connectionStrength: { type: Number, min: 1, max: 10, required: true },
      insight: { type: String, required: true },
    }],
  },
  output: {
    ideas: [{
      content: { type: String, required: true },
      creativity: { type: Number, min: 1, max: 10, required: true },
      feasibility: { type: Number, min: 1, max: 10, required: true },
      novelty: { type: Number, min: 1, max: 10, required: true },
      relevance: { type: Number, min: 1, max: 10, required: true },
      timestamp: { type: Date, default: Date.now },
    }],
    totalIdeas: { type: Number, default: 0 },
    breakthroughIdeas: { type: Number, default: 0 },
  },
  metrics: {
    generationTime: { type: Number, default: 0 },
    averageIdeaQuality: { type: Number, min: 1, max: 10, default: 5 },
    diversityScore: { type: Number, min: 0, max: 1, default: 0 },
    constraintAdherence: { type: Number, min: 0, max: 1, default: 0 },
  },
  userFeedback: {
    satisfaction: { type: Number, min: 1, max: 10, default: null },
    easeOfUse: { type: Number, min: 1, max: 10, default: null },
    inspirationLevel: { type: Number, min: 1, max: 10, default: null },
    comments: { type: String, default: null },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
IdeaGenerationSchema.index({ userId: 1, timestamp: -1 });
IdeaGenerationSchema.index({ sessionId: 1 });
IdeaGenerationSchema.index({ method: 1 });
IdeaGenerationSchema.index({ domain: 1 });

export default mongoose.models.IdeaGeneration || mongoose.model<IIdeaGeneration>('IdeaGeneration', IdeaGenerationSchema);