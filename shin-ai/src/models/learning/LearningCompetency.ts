import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningCompetency extends Document {
  name: string;
  description: string;
  domain: string;
  category: string;
  level: 'foundational' | 'intermediate' | 'advanced' | 'expert';
  prerequisites: mongoose.Types.ObjectId[];
  relatedCompetencies: mongoose.Types.ObjectId[];
  assessmentCriteria: {
    name: string;
    description: string;
    weight: number;
    type: 'knowledge' | 'skill' | 'behavior' | 'experience';
  }[];
  metadata: {
    industry: string;
    framework: string; // e.g., 'SFIA', 'Bloom\'s Taxonomy', 'Dreyfus Model'
    version: string;
    isActive: boolean;
    lastUpdated: Date;
    createdBy: string;
  };
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LearningCompetencySchema: Schema = new Schema({
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
  category: {
    type: String,
    required: true,
    index: true,
  },
  level: {
    type: String,
    enum: ['foundational', 'intermediate', 'advanced', 'expert'],
    default: 'foundational',
    index: true,
  },
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'LearningCompetency',
  }],
  relatedCompetencies: [{
    type: Schema.Types.ObjectId,
    ref: 'LearningCompetency',
  }],
  assessmentCriteria: [{
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    type: {
      type: String,
      enum: ['knowledge', 'skill', 'behavior', 'experience'],
      required: true,
    },
  }],
  metadata: {
    industry: {
      type: String,
      default: 'general',
    },
    framework: {
      type: String,
      default: 'custom',
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      required: true,
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
LearningCompetencySchema.index({ name: 1, domain: 1 });
LearningCompetencySchema.index({ domain: 1, category: 1 });
LearningCompetencySchema.index({ level: 1 });
LearningCompetencySchema.index({ organizationId: 1, domain: 1 });
LearningCompetencySchema.index({ 'metadata.industry': 1 });
LearningCompetencySchema.index({ 'metadata.framework': 1 });
LearningCompetencySchema.index({ 'metadata.isActive': 1 });

export default mongoose.models.LearningCompetency || mongoose.model<ILearningCompetency>('LearningCompetency', LearningCompetencySchema);