import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningPath extends Document {
  title: string;
  description: string;
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  contentItems: {
    contentId: mongoose.Types.ObjectId;
    order: number;
    isCompleted: boolean;
    completedAt?: Date;
    timeSpent: number; // in minutes
    score?: number;
    notes?: string;
  }[];
  competencies: mongoose.Types.ObjectId[];
  skillGaps: {
    competencyId: mongoose.Types.ObjectId;
    gapLevel: number;
    priority: 'low' | 'medium' | 'high';
  }[];
  progress: number; // percentage 0-100
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  metadata: {
    estimatedDuration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
    createdBy: 'user' | 'system' | 'ai' | 'expert';
    adaptive: boolean;
    lastActivity: Date;
    completionDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LearningPathSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  contentItems: [{
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningContent',
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    notes: String,
  }],
  competencies: [{
    type: Schema.Types.ObjectId,
    ref: 'LearningCompetency',
  }],
  skillGaps: [{
    competencyId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningCompetency',
      required: true,
    },
    gapLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'abandoned'],
    default: 'active',
    index: true,
  },
  metadata: {
    estimatedDuration: {
      type: Number,
      required: true,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'],
      default: 'mixed',
    },
    createdBy: {
      type: String,
      enum: ['user', 'system', 'ai', 'expert'],
      default: 'system',
    },
    adaptive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    completionDate: Date,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
LearningPathSchema.index({ userId: 1, status: 1 });
LearningPathSchema.index({ organizationId: 1, status: 1 });
LearningPathSchema.index({ 'metadata.difficulty': 1 });
LearningPathSchema.index({ 'metadata.learningStyle': 1 });
LearningPathSchema.index({ progress: -1 });
LearningPathSchema.index({ 'metadata.lastActivity': -1 });

export default mongoose.models.LearningPath || mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);