import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeTopic extends Document {
  name: string;
  description: string;
  domain: string;
  popularity: number;
  trend: 'rising' | 'stable' | 'declining';
  relatedTopics: mongoose.Types.ObjectId[];
  expertCount: number;
  documentCount: number;
  metadata: {
    keywords: string[];
    lastAnalyzed: Date;
    confidence: number;
    category: string;
  };
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeTopicSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    required: true,
    index: true,
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  trend: {
    type: String,
    enum: ['rising', 'stable', 'declining'],
    default: 'stable',
  },
  relatedTopics: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeTopic',
  }],
  expertCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  documentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  metadata: {
    keywords: [String],
    lastAnalyzed: {
      type: Date,
      default: Date.now,
    },
    confidence: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    category: {
      type: String,
      default: 'general',
    },
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
KnowledgeTopicSchema.index({ name: 1, domain: 1 });
KnowledgeTopicSchema.index({ popularity: -1 });
KnowledgeTopicSchema.index({ trend: 1 });
KnowledgeTopicSchema.index({ organizationId: 1, domain: 1 });
KnowledgeTopicSchema.index({ 'metadata.category': 1 });
KnowledgeTopicSchema.index({ 'metadata.keywords': 1 });

export default mongoose.models.KnowledgeTopic || mongoose.model<IKnowledgeTopic>('KnowledgeTopic', KnowledgeTopicSchema);