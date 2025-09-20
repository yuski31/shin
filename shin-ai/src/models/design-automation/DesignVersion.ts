import mongoose, { Document, Schema } from 'mongoose';

export type VersionType = 'major' | 'minor' | 'patch' | 'auto-save';

export interface IDesignVersion extends Document {
  version: string;
  type: VersionType;
  project: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  parentVersion?: mongoose.Types.ObjectId;
  changes: {
    description: string;
    breaking: boolean;
    features: string[];
    fixes: string[];
    modifications: Array<{
      asset: mongoose.Types.ObjectId;
      change: string;
      before?: any;
      after?: any;
    }>;
  };
  snapshot: {
    assets: mongoose.Types.ObjectId[];
    metadata: Record<string, any>;
    configuration: Record<string, any>;
  };
  metadata: {
    branch: string;
    tags: string[];
    releaseNotes?: string;
    compatibility: string[];
    dependencies: Array<{
      name: string;
      version: string;
      type: 'asset' | 'template' | 'external';
    }>;
  };
  approval: {
    required: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    reviewers: mongoose.Types.ObjectId[];
    status: 'pending' | 'approved' | 'rejected' | 'changes-requested';
    comments: Array<{
      user: mongoose.Types.ObjectId;
      comment: string;
      createdAt: Date;
    }>;
  };
  deployment: {
    environment: 'development' | 'staging' | 'production';
    deployedAt?: Date;
    deployedBy?: mongoose.Types.ObjectId;
    rollbackVersion?: mongoose.Types.ObjectId;
  };
  performance: {
    fileSize: number;
    loadTime: number;
    complexity: number;
    accessibility: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DesignVersionSchema: Schema = new Schema({
  version: {
    type: String,
    required: true,
    match: /^\d+\.\d+\.\d+$/,
  },
  type: {
    type: String,
    enum: ['major', 'minor', 'patch', 'auto-save'],
    default: 'patch',
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'DesignProject',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentVersion: {
    type: Schema.Types.ObjectId,
    ref: 'DesignVersion',
  },
  changes: {
    description: {
      type: String,
      required: true,
    },
    breaking: {
      type: Boolean,
      default: false,
    },
    features: [String],
    fixes: [String],
    modifications: [{
      asset: {
        type: Schema.Types.ObjectId,
        ref: 'DesignAsset',
      },
      change: String,
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    }],
  },
  snapshot: {
    assets: [{
      type: Schema.Types.ObjectId,
      ref: 'DesignAsset',
    }],
    metadata: Schema.Types.Mixed,
    configuration: Schema.Types.Mixed,
  },
  metadata: {
    branch: {
      type: String,
      default: 'main',
    },
    tags: [String],
    releaseNotes: String,
    compatibility: [String],
    dependencies: [{
      name: String,
      version: String,
      type: {
        type: String,
        enum: ['asset', 'template', 'external'],
      },
    }],
  },
  approval: {
    required: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    reviewers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes-requested'],
      default: 'pending',
    },
    comments: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  deployment: {
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development',
    },
    deployedAt: Date,
    deployedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rollbackVersion: {
      type: Schema.Types.ObjectId,
      ref: 'DesignVersion',
    },
  },
  performance: {
    fileSize: {
      type: Number,
      default: 0,
    },
    loadTime: {
      type: Number,
      default: 0,
    },
    complexity: {
      type: Number,
      default: 0,
    },
    accessibility: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
DesignVersionSchema.index({ project: 1 });
DesignVersionSchema.index({ createdBy: 1 });
DesignVersionSchema.index({ version: 1 });
DesignVersionSchema.index({ 'metadata.branch': 1 });
DesignVersionSchema.index({ 'approval.status': 1 });
DesignVersionSchema.index({ 'deployment.environment': 1 });
DesignVersionSchema.index({ project: 1, version: -1 });
DesignVersionSchema.index({ project: 1, createdAt: -1 });

// Virtual for isLatest
DesignVersionSchema.virtual('isLatest').get(function(this: IDesignVersion) {
  // This would need to be populated with the latest version logic
  return true;
});

// Virtual for change count
DesignVersionSchema.virtual('changeCount').get(function(this: IDesignVersion) {
  return this.changes.features.length + this.changes.fixes.length + this.changes.modifications.length;
});

// Method to approve version
DesignVersionSchema.methods.approve = function(approverId: mongoose.Types.ObjectId): Promise<IDesignVersion> {
  this.approval.status = 'approved';
  this.approval.approvedBy = approverId;
  this.approval.approvedAt = new Date();
  return this.save();
};

// Method to reject version
DesignVersionSchema.methods.reject = function(): Promise<IDesignVersion> {
  this.approval.status = 'rejected';
  return this.save();
};

// Method to request changes
DesignVersionSchema.methods.requestChanges = function(): Promise<IDesignVersion> {
  this.approval.status = 'changes-requested';
  return this.save();
};

// Method to deploy version
DesignVersionSchema.methods.deploy = function(environment: string, deployerId: mongoose.Types.ObjectId): Promise<IDesignVersion> {
  this.deployment.environment = environment as 'development' | 'staging' | 'production';
  this.deployment.deployedAt = new Date();
  this.deployment.deployedBy = deployerId;
  return this.save();
};

// Method to rollback version
DesignVersionSchema.methods.rollback = function(rollbackVersionId: mongoose.Types.ObjectId): Promise<IDesignVersion> {
  this.deployment.rollbackVersion = rollbackVersionId;
  return this.save();
};

// Method to add comment
DesignVersionSchema.methods.addComment = function(userId: mongoose.Types.ObjectId, comment: string): Promise<IDesignVersion> {
  this.approval.comments.push({
    user: userId,
    comment,
    createdAt: new Date(),
  });
  return this.save();
};

export default mongoose.models.DesignVersion || mongoose.model<IDesignVersion>('DesignVersion', DesignVersionSchema);