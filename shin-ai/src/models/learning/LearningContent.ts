import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningContent extends Document {
  title: string;
  description: string;
  content: string;
  type: 'course' | 'module' | 'lesson' | 'assessment' | 'resource' | 'video' | 'interactive';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  prerequisites: mongoose.Types.ObjectId[];
  competencies: mongoose.Types.ObjectId[];
  tags: string[];
  metadata: {
    author: string;
    version: string;
    lastUpdated: Date;
    isActive: boolean;
    rating: number;
    totalRatings: number;
    completionRate: number;
    fileSize?: number;
    mediaType?: string;
    externalUrl?: string;
  };
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LearningContentSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['course', 'module', 'lesson', 'assessment', 'resource', 'video', 'interactive'],
    required: true,
    index: true,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner',
    index: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
  },
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'LearningContent',
  }],
  competencies: [{
    type: Schema.Types.ObjectId,
    ref: 'LearningCompetency',
  }],
  tags: [String],
  metadata: {
    author: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    fileSize: Number,
    mediaType: String,
    externalUrl: String,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
LearningContentSchema.index({ type: 1, difficulty: 1 });
LearningContentSchema.index({ organizationId: 1, type: 1 });
LearningContentSchema.index({ tags: 1 });
LearningContentSchema.index({ 'metadata.isActive': 1 });
LearningContentSchema.index({ 'metadata.rating': -1 });
LearningContentSchema.index({ createdAt: -1 });

export default mongoose.models.LearningContent || mongoose.model<ILearningContent>('LearningContent', LearningContentSchema);