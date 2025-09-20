import mongoose, { Document, Schema } from 'mongoose';

export type DesignType = 'ui-ux' | 'brand-identity' | 'architecture-cad' | 'fashion-product' | 'mixed';

export type ProjectStatus = 'draft' | 'in-progress' | 'review' | 'approved' | 'archived';

export interface IDesignProject extends Document {
  name: string;
  description: string;
  type: DesignType;
  status: ProjectStatus;
  organization: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  settings: {
    isPublic: boolean;
    allowComments: boolean;
    requireApproval: boolean;
    autoSave: boolean;
  };
  metadata: {
    tags: string[];
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deadline?: Date;
    budget?: number;
    client?: string;
  };
  assets: mongoose.Types.ObjectId[];
  versions: mongoose.Types.ObjectId[];
  currentVersion: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DesignProjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['ui-ux', 'brand-identity', 'architecture-cad', 'fashion-product', 'mixed'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'review', 'approved', 'archived'],
    default: 'draft',
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    autoSave: {
      type: Boolean,
      default: true,
    },
  },
  metadata: {
    tags: [{
      type: String,
      trim: true,
    }],
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    deadline: {
      type: Date,
    },
    budget: {
      type: Number,
      min: 0,
    },
    client: {
      type: String,
      trim: true,
    },
  },
  assets: [{
    type: Schema.Types.ObjectId,
    ref: 'DesignAsset',
  }],
  versions: [{
    type: Schema.Types.ObjectId,
    ref: 'DesignVersion',
  }],
  currentVersion: {
    type: Schema.Types.ObjectId,
    ref: 'DesignVersion',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
DesignProjectSchema.index({ organization: 1 });
DesignProjectSchema.index({ owner: 1 });
DesignProjectSchema.index({ type: 1 });
DesignProjectSchema.index({ status: 1 });
DesignProjectSchema.index({ 'metadata.priority': 1 });
DesignProjectSchema.index({ 'metadata.tags': 1 });
DesignProjectSchema.index({ organization: 1, status: 1 });
DesignProjectSchema.index({ organization: 1, type: 1 });
DesignProjectSchema.index({ owner: 1, updatedAt: -1 });

// Virtual for asset count
DesignProjectSchema.virtual('assetCount').get(function(this: IDesignProject) {
  return this.assets.length;
});

// Virtual for collaborator count
DesignProjectSchema.virtual('collaboratorCount').get(function(this: IDesignProject) {
  return this.collaborators.length;
});

// Method to check if user can access project
DesignProjectSchema.methods.canUserAccess = function(userId: mongoose.Types.ObjectId): boolean {
  return (
    this.owner.toString() === userId.toString() ||
    this.collaborators.some((collaboratorId: mongoose.Types.ObjectId) =>
      collaboratorId.toString() === userId.toString()
    )
  );
};

// Method to check if user can edit project
DesignProjectSchema.methods.canUserEdit = function(userId: mongoose.Types.ObjectId): boolean {
  return this.owner.toString() === userId.toString();
};

export default mongoose.models.DesignProject || mongoose.model<IDesignProject>('DesignProject', DesignProjectSchema);