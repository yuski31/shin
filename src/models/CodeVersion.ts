import mongoose, { Document, Schema } from 'mongoose';

export interface ICodeConflict {
  filePath: string;
  conflictType: 'content' | 'structure' | 'dependency' | 'syntax';
  ours: {
    content: string;
    lineStart: number;
    lineEnd: number;
  };
  theirs: {
    content: string;
    lineStart: number;
    lineEnd: number;
  };
  base?: {
    content: string;
    lineStart: number;
    lineEnd: number;
  };
  resolved?: {
    content: string;
    resolvedBy: mongoose.Types.ObjectId;
    resolvedAt: Date;
    strategy: 'manual' | 'ours' | 'theirs' | 'auto';
  };
}

export interface ICodeVersion extends Document {
  workspaceId: mongoose.Types.ObjectId;
  filePath: string;
  version: string; // Git commit hash or version number
  content: string;
  language: string; // Programming language
  encoding: string;
  size: number; // bytes
  checksum: string;
  metadata: {
    author: mongoose.Types.ObjectId;
    committer?: mongoose.Types.ObjectId;
    authoredAt: Date;
    committedAt: Date;
    message: string;
    parentVersions: string[]; // Parent commit hashes
    branch: string;
    tags: string[];
    labels: Record<string, string>;
    reviewStatus: 'pending' | 'approved' | 'rejected' | 'changes_requested';
    reviewers: {
      userId: mongoose.Types.ObjectId;
      status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
      reviewedAt?: Date;
      comments?: string;
    }[];
    conflicts: ICodeConflict[];
    isMerged: boolean;
    mergeStrategy?: 'merge' | 'rebase' | 'squash';
    mergeBase?: string;
  };
  analysis: {
    complexity: number; // Cyclomatic complexity
    maintainabilityIndex: number; // 0-100 score
    technicalDebt: number; // Estimated hours
    codeSmells: {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      line: number;
      column: number;
    }[];
    dependencies: {
      internal: string[]; // Internal imports/modules
      external: string[]; // External packages
      versionConstraints: Record<string, string>;
    };
    testCoverage?: number; // Percentage
    performance: {
      estimatedRuntime: number; // milliseconds
      memoryUsage: number; // MB
      bottlenecks: string[];
    };
  };
  status: 'active' | 'archived' | 'deleted';
  isLocked: boolean;
  lockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CodeConflictSchema = new Schema({
  filePath: {
    type: String,
    required: true,
  },
  conflictType: {
    type: String,
    enum: ['content', 'structure', 'dependency', 'syntax'],
    required: true,
  },
  ours: {
    content: String,
    lineStart: Number,
    lineEnd: Number,
  },
  theirs: {
    content: String,
    lineStart: Number,
    lineEnd: Number,
  },
  base: {
    content: String,
    lineStart: Number,
    lineEnd: Number,
  },
  resolved: {
    content: String,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    strategy: {
      type: String,
      enum: ['manual', 'ours', 'theirs', 'auto'],
    },
  },
}, { _id: true });

const CodeVersionSchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  filePath: {
    type: String,
    required: true,
    index: true,
  },
  version: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  encoding: {
    type: String,
    default: 'utf-8',
  },
  size: {
    type: Number,
    required: true,
  },
  checksum: {
    type: String,
    required: true,
  },
  metadata: {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    committer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    authoredAt: {
      type: Date,
      default: Date.now,
    },
    committedAt: {
      type: Date,
      default: Date.now,
    },
    message: {
      type: String,
      required: true,
    },
    parentVersions: [String],
    branch: {
      type: String,
      default: 'main',
    },
    tags: [String],
    labels: {
      type: Map,
      of: String,
      default: {},
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending',
    },
    reviewers: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      },
      reviewedAt: Date,
      comments: String,
    }],
    conflicts: [CodeConflictSchema],
    isMerged: {
      type: Boolean,
      default: false,
    },
    mergeStrategy: {
      type: String,
      enum: ['merge', 'rebase', 'squash'],
    },
    mergeBase: String,
  },
  analysis: {
    complexity: Number,
    maintainabilityIndex: Number,
    technicalDebt: Number,
    codeSmells: [{
      type: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      description: String,
      line: Number,
      column: Number,
    }],
    dependencies: {
      internal: [String],
      external: [String],
      versionConstraints: {
        type: Map,
        of: String,
      },
    },
    testCoverage: Number,
    performance: {
      estimatedRuntime: Number,
      memoryUsage: Number,
      bottlenecks: [String],
    },
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockReason: String,
}, {
  timestamps: true,
});

// Indexes for better query performance
CodeVersionSchema.index({ workspaceId: 1, filePath: 1 });
CodeVersionSchema.index({ workspaceId: 1, version: 1 });
CodeVersionSchema.index({ filePath: 1, version: 1 }, { unique: true });
CodeVersionSchema.index({ 'metadata.author': 1 });
CodeVersionSchema.index({ 'metadata.branch': 1 });
CodeVersionSchema.index({ 'metadata.reviewStatus': 1 });
CodeVersionSchema.index({ 'metadata.committedAt': -1 });
CodeVersionSchema.index({ status: 1 });

// Pre-save middleware to calculate checksum and size
CodeVersionSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isModified('content')) {
    doc.size = Buffer.byteLength(doc.content, doc.encoding);
    doc.checksum = require('crypto').createHash('sha256').update(doc.content).digest('hex');
  }
  next();
});

// Method to add conflict
CodeVersionSchema.methods.addConflict = function(conflict: Omit<ICodeConflict, 'resolved'>): void {
  this.metadata.conflicts.push(conflict);
};

// Method to resolve conflict
CodeVersionSchema.methods.resolveConflict = function(
  conflictIndex: number,
  resolution: string,
  resolvedBy: mongoose.Types.ObjectId,
  strategy: 'manual' | 'ours' | 'theirs' | 'auto'
): void {
  if (this.metadata.conflicts[conflictIndex]) {
    this.metadata.conflicts[conflictIndex].resolved = {
      content: resolution,
      resolvedBy,
      resolvedAt: new Date(),
      strategy,
    };
  }
};

// Method to check if all conflicts are resolved
CodeVersionSchema.methods.areConflictsResolved = function(): boolean {
  return this.metadata.conflicts.every((conflict: ICodeConflict) => conflict.resolved);
};

// Method to update review status
CodeVersionSchema.methods.updateReviewStatus = function(
  reviewerId: mongoose.Types.ObjectId,
  status: ICodeVersion['metadata']['reviewStatus'],
  comments?: string
): void {
  const reviewer = this.metadata.reviewers.find((r: any) => r.userId.toString() === reviewerId.toString());
  if (reviewer) {
    reviewer.status = status;
    reviewer.reviewedAt = new Date();
    if (comments) {
      reviewer.comments = comments;
    }
  } else {
    this.metadata.reviewers.push({
      userId: reviewerId,
      status,
      reviewedAt: new Date(),
      comments,
    });
  }

  // Update overall review status
  const reviews = this.metadata.reviewers;
  if (reviews.every((r: any) => r.status === 'approved')) {
    this.metadata.reviewStatus = 'approved';
  } else if (reviews.some((r: any) => r.status === 'rejected')) {
    this.metadata.reviewStatus = 'rejected';
  } else if (reviews.some((r: any) => r.status === 'changes_requested')) {
    this.metadata.reviewStatus = 'changes_requested';
  }
};

// Method to lock file
CodeVersionSchema.methods.lock = function(reason: string): void {
  this.isLocked = true;
  this.lockReason = reason;
};

// Method to unlock file
CodeVersionSchema.methods.unlock = function(): void {
  this.isLocked = false;
  this.lockReason = undefined;
};

// Method to archive version
CodeVersionSchema.methods.archive = function(): void {
  this.status = 'archived';
};

// Static method to find versions by file path
CodeVersionSchema.statics.findByFilePath = function(filePath: string) {
  return this.find({ filePath, status: { $ne: 'deleted' } })
    .sort({ 'metadata.committedAt': -1 });
};

// Static method to find versions by author
CodeVersionSchema.statics.findByAuthor = function(authorId: mongoose.Types.ObjectId) {
  return this.find({
    'metadata.author': authorId,
    status: { $ne: 'deleted' }
  }).sort({ 'metadata.committedAt': -1 });
};

// Static method to find pending reviews
CodeVersionSchema.statics.findPendingReviews = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({
    workspaceId,
    'metadata.reviewStatus': { $in: ['pending', 'changes_requested'] },
    status: 'active'
  });
};

// Static method to get version diff
CodeVersionSchema.statics.getDiff = function(version1Id: string, version2Id: string) {
  return this.find({
    _id: { $in: [new mongoose.Types.ObjectId(version1Id), new mongoose.Types.ObjectId(version2Id)] }
  }).then((versions: ICodeVersion[]) => {
    // This would be implemented with a proper diff library
    // For now, return basic comparison
    return {
      versions,
      diff: {
        added: 0,
        removed: 0,
        modified: versions.length,
        conflicts: []
      }
    };
  });
};

// Static method to get code statistics
CodeVersionSchema.statics.getStatistics = function(workspaceId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { workspaceId, status: 'active', 'metadata.committedAt': { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$metadata.committedAt' } },
          language: '$language'
        },
        count: { $sum: 1 },
        totalSize: { $sum: '$size' },
        avgComplexity: { $avg: '$analysis.complexity' },
        totalTechnicalDebt: { $sum: '$analysis.technicalDebt' }
      }
    }
  ]);
};

export default mongoose.models.CodeVersion || mongoose.model<ICodeVersion>('CodeVersion', CodeVersionSchema);