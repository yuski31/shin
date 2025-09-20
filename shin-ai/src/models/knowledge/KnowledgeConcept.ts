import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeConcept extends Document {
  name: string;
  description: string;
  domain: string;
  confidence: number;
  frequency: number;
  relationships: {
    conceptId: mongoose.Types.ObjectId;
    relationshipType: 'related' | 'parent' | 'child' | 'synonym' | 'antonym';
    strength: number;
  }[];
  metadata: {
    sourceDocuments: mongoose.Types.ObjectId[];
    expertReferences: mongoose.Types.ObjectId[];
    lastUpdated: Date;
    version: number;
  };
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeConceptSchema: Schema = new Schema({
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
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.5,
  },
  frequency: {
    type: Number,
    default: 1,
    min: 0,
  },
  relationships: [{
    conceptId: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeConcept',
      required: true,
    },
    relationshipType: {
      type: String,
      enum: ['related', 'parent', 'child', 'synonym', 'antonym'],
      required: true,
    },
    strength: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  }],
  metadata: {
    sourceDocuments: [{
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
    }],
    expertReferences: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
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
KnowledgeConceptSchema.index({ name: 1, domain: 1 });
KnowledgeConceptSchema.index({ confidence: -1 });
KnowledgeConceptSchema.index({ frequency: -1 });
KnowledgeConceptSchema.index({ organizationId: 1, domain: 1 });
KnowledgeConceptSchema.index({ 'relationships.conceptId': 1 });
KnowledgeConceptSchema.index({ 'metadata.sourceDocuments': 1 });

export default mongoose.models.KnowledgeConcept || mongoose.model<IKnowledgeConcept>('KnowledgeConcept', KnowledgeConceptSchema);