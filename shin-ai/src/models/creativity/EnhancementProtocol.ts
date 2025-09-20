import mongoose, { Document, Schema } from 'mongoose';

export interface IEnhancementProtocol extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  protocolType: 'style_transfer' | 'color_harmony' | 'rhythm_enhancement' | 'genre_fusion' | 'tempo_synchronization' | 'creative_blockbuster' | 'inspiration_booster';
  category: 'artistic' | 'technical' | 'cognitive' | 'emotional' | 'combinatorial';
  parameters: {
    [key: string]: any; // Flexible parameters based on protocol type
  };
  effectiveness: {
    averageImprovement: number; // 1-10 scale
    successRate: number; // 0-1 scale
    usageCount: number;
    lastUsed: Date;
    bestResults: {
      sessionId: mongoose.Types.ObjectId;
      improvementScore: number;
      timestamp: Date;
    }[];
  };
  configuration: {
    intensity: number; // 1-10 scale - how strong the enhancement should be
    duration?: number; // in minutes - how long to apply
    frequency?: 'once' | 'continuous' | 'scheduled';
    triggers?: string[]; // What triggers this protocol to activate
    prerequisites?: string[]; // What must be true before applying
  };
  learning: {
    adaptsToUser: boolean; // Whether protocol learns from user preferences
    userFeedback: {
      rating: number; // 1-10 scale
      comments?: string;
      timestamp: Date;
    }[];
    performanceHistory: {
      date: Date;
      effectiveness: number;
      userSatisfaction: number;
    }[];
  };
  compatibility: {
    contentTypes: string[]; // Which types of content this works with
    creativeDomains: string[]; // Which creative domains this enhances
    skillLevels: ('beginner' | 'intermediate' | 'advanced')[]; // Which skill levels benefit
  };
  safety: {
    ethicalBoundaries: string[]; // What this protocol won't do
    creativityAuthenticity: number; // 1-10 scale - how much it preserves original creativity
    userControl: number; // 1-10 scale - how much user control is maintained
  };
  sharing: {
    isPublic: boolean;
    sharedBy?: mongoose.Types.ObjectId; // Original creator if shared
    adaptations: mongoose.Types.ObjectId[]; // Other users' adaptations of this protocol
    communityRating?: number; // 1-10 scale
  };
  createdAt: Date;
  updatedAt: Date;
}

const EnhancementProtocolSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  protocolType: {
    type: String,
    enum: ['style_transfer', 'color_harmony', 'rhythm_enhancement', 'genre_fusion', 'tempo_synchronization', 'creative_blockbuster', 'inspiration_booster'],
    required: true,
  },
  category: {
    type: String,
    enum: ['artistic', 'technical', 'cognitive', 'emotional', 'combinatorial'],
    required: true,
  },
  parameters: {
    type: Schema.Types.Mixed,
    required: true,
  },
  effectiveness: {
    averageImprovement: { type: Number, min: 1, max: 10, default: 5 },
    successRate: { type: Number, min: 0, max: 1, default: 0.5 },
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date, default: null },
    bestResults: [{
      sessionId: {
        type: Schema.Types.ObjectId,
        ref: 'CreativeSession',
      },
      improvementScore: { type: Number, min: 1, max: 10 },
      timestamp: { type: Date, default: Date.now },
    }],
  },
  configuration: {
    intensity: { type: Number, min: 1, max: 10, required: true },
    duration: { type: Number, default: null },
    frequency: {
      type: String,
      enum: ['once', 'continuous', 'scheduled'],
      default: 'once',
    },
    triggers: [{ type: String }],
    prerequisites: [{ type: String }],
  },
  learning: {
    adaptsToUser: { type: Boolean, default: false },
    userFeedback: [{
      rating: { type: Number, min: 1, max: 10 },
      comments: { type: String, default: null },
      timestamp: { type: Date, default: Date.now },
    }],
    performanceHistory: [{
      date: { type: Date },
      effectiveness: { type: Number, min: 1, max: 10 },
      userSatisfaction: { type: Number, min: 1, max: 10 },
    }],
  },
  compatibility: {
    contentTypes: [{ type: String }],
    creativeDomains: [{ type: String }],
    skillLevels: [{
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    }],
  },
  safety: {
    ethicalBoundaries: [{ type: String }],
    creativityAuthenticity: { type: Number, min: 1, max: 10, default: 10 },
    userControl: { type: Number, min: 1, max: 10, default: 10 },
  },
  sharing: {
    isPublic: { type: Boolean, default: false },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adaptations: [{
      type: Schema.Types.ObjectId,
      ref: 'EnhancementProtocol',
    }],
    communityRating: { type: Number, min: 1, max: 10, default: null },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
EnhancementProtocolSchema.index({ userId: 1, protocolType: 1 });
EnhancementProtocolSchema.index({ protocolType: 1 });
EnhancementProtocolSchema.index({ category: 1 });
EnhancementProtocolSchema.index({ 'effectiveness.averageImprovement': -1 });
EnhancementProtocolSchema.index({ sharing: 1 });

export default mongoose.models.EnhancementProtocol || mongoose.model<IEnhancementProtocol>('EnhancementProtocol', EnhancementProtocolSchema);