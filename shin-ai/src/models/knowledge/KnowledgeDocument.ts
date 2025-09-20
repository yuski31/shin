import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeDocument extends Document {
  title: string;
  content: string;
  type: 'pdf' | 'docx' | 'txt' | 'html' | 'markdown' | 'url' | 'code';
  source: string;
  metadata: {
    author?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    fileSize?: number;
    pageCount?: number;
    language?: string;
    tags?: string[];
  };
  organizationId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedConcepts: mongoose.Types.ObjectId[];
  topics: mongoose.Types.ObjectId[];
  insights: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema: Schema = new Schema({
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
    enum: ['pdf', 'docx', 'txt', 'html', 'markdown', 'url', 'code'],
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  metadata: {
    author: String,
    createdAt: Date,
    modifiedAt: Date,
    fileSize: Number,
    pageCount: Number,
    language: String,
    tags: [String],
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  extractedConcepts: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeConcept',
  }],
  topics: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeTopic',
  }],
  insights: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeInsight',
  }],
}, {
  timestamps: true,
});

// Indexes for better query performance
KnowledgeDocumentSchema.index({ organizationId: 1, createdAt: -1 });
KnowledgeDocumentSchema.index({ uploadedBy: 1 });
KnowledgeDocumentSchema.index({ processingStatus: 1 });
KnowledgeDocumentSchema.index({ type: 1 });
KnowledgeDocumentSchema.index({ 'metadata.tags': 1 });
KnowledgeDocumentSchema.index({ title: 'text', content: 'text' });

export default mongoose.models.KnowledgeDocument || mongoose.model<IKnowledgeDocument>('KnowledgeDocument', KnowledgeDocumentSchema);