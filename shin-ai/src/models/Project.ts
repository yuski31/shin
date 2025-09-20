import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  name: string;
  description: string;
  template: string;
  generatedCode: {
    frontend: string;
    backend: string;
    database: string;
    config: string;
  };
  status: 'generating' | 'ready' | 'deployed' | 'failed';
  deploymentUrl?: string;
  settings: {
    framework: string;
    database: string;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
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
  template: {
    type: String,
    required: true,
    default: 'nextjs-starter',
  },
  generatedCode: {
    frontend: {
      type: String,
      default: '',
    },
    backend: {
      type: String,
      default: '',
    },
    database: {
      type: String,
      default: '',
    },
    config: {
      type: String,
      default: '',
    },
  },
  status: {
    type: String,
    enum: ['generating', 'ready', 'deployed', 'failed'],
    default: 'generating',
  },
  deploymentUrl: {
    type: String,
    default: null,
  },
  settings: {
    framework: {
      type: String,
      default: 'nextjs',
    },
    database: {
      type: String,
      default: 'mongodb',
    },
    features: [{
      type: String,
    }],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ organization: 1 });
ProjectSchema.index({ userId: 1, status: 1 });
ProjectSchema.index({ organization: 1, status: 1 });
ProjectSchema.index({ userId: 1, updatedAt: -1 });
ProjectSchema.index({ organization: 1, updatedAt: -1 });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
