import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeInsight extends Document {
  title: string;
  content: string;
  type: 'summary' | 'trend' | 'pattern' | 'anomaly' | 'recommendation' | 'prediction';
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  domain: string;
  sourceDocuments: mongoose.Types.ObjectId[];
  relatedConcepts: mongoose.Types.ObjectId[];
  tags: string[];
  metadata: {
    generatedBy: string;
    processingTime: number;
    modelVersion: string;
    parameters: Record<string, any>;
    validationScore: number;
  };
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeInsightSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['summary', 'trend', 'pattern', 'anomaly', 'recommendation', 'prediction'],
    required: true,
    index: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  impact: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  domain: {
    type: String,
    required: true,
    index: true,
  },
  sourceDocuments: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeDocument',
    required: true,
  }],
  relatedConcepts: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeConcept',
  }],
  tags: [String],
  metadata: {
    generatedBy: {
      type: String,
      required: true,
    },
    processingTime: Number,
    modelVersion: String,
    parameters: Schema.Types.Mixed,
    validationScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
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
KnowledgeInsightSchema.index({ type: 1, confidence: -1 });
KnowledgeInsightSchema.index({ impact: 1, createdAt: -1 });
KnowledgeInsightSchema.index({ domain: 1, type: 1 });
KnowledgeInsightSchema.index({ organizationId: 1, createdAt: -1 });
KnowledgeInsightSchema.index({ tags: 1 });
KnowledgeInsightSchema.index({ 'metadata.generatedBy': 1 });

export default mongoose.models.KnowledgeInsight || mongoose.model<IKnowledgeInsight>('KnowledgeInsight', KnowledgeInsightSchema);