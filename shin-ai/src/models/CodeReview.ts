import mongoose, { Document, Schema } from 'mongoose';

export interface ICodeReviewIssue {
  type: 'error' | 'warning' | 'info' | 'style';
  category: 'syntax' | 'security' | 'performance' | 'maintainability' | 'style' | 'documentation' | 'best_practice';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  rule: string; // Linter rule name
  ruleUrl?: string; // Link to rule documentation
  suggestion?: string;
  isAutoFixable: boolean;
  autoFix?: string;
  tags: string[];
  metadata: {
    createdAt: Date;
    tool: string; // Linter name (eslint, pylint, etc.)
    version: string;
    confidence: number; // 0-1 score
  }
}

export interface ICodeReview extends Document {
  workspaceId: mongoose.Types.ObjectId;
  codeVersionId: mongoose.Types.ObjectId;
  reviewId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  type: 'automated' | 'manual' | 'security' | 'performance' | 'style';
  issues: ICodeReviewIssue[];
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
    style: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    autoFixable: number;
    score: number; // 0-100 quality score
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  configuration: {
    tools: string[]; // Enabled linters/analyzers
    rules: Record<string, any>; // Rule configurations
    thresholds: {
      maxErrors: number;
      maxWarnings: number;
      minScore: number;
    };
    excludePatterns: string[];
    includePatterns: string[];
  };
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    completedAt?: Date;
    duration?: number; // milliseconds
    triggeredBy: 'manual' | 'commit' | 'push' | 'schedule' | 'pr';
    commitHash?: string;
    branch?: string;
    pullRequest?: string;
    reviewers: {
      userId: mongoose.Types.ObjectId;
      status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
      reviewedAt?: Date;
      comments?: string;
    }[];
    tags: string[];
    labels: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CodeReviewIssueSchema = new Schema({
  type: {
    type: String,
    enum: ['error', 'warning', 'info', 'style'],
    required: true,
  },
  category: {
    type: String,
    enum: ['syntax', 'security', 'performance', 'maintainability', 'style', 'documentation', 'best_practice'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  file: {
    type: String,
    required: true,
  },
  line: {
    type: Number,
    required: true,
  },
  column: {
    type: Number,
    required: true,
  },
  endLine: Number,
  endColumn: Number,
  rule: {
    type: String,
    required: true,
  },
  ruleUrl: String,
  suggestion: String,
  isAutoFixable: {
    type: Boolean,
    default: false,
  },
  autoFix: String,
  tags: [String],
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tool: String,
    version: String,
    confidence: Number,
  },
}, { _id: true });

const CodeReviewSchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  codeVersionId: {
    type: Schema.Types.ObjectId,
    ref: 'CodeVersion',
    required: true,
  },
  reviewId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending',
  },
  type: {
    type: String,
    enum: ['automated', 'manual', 'security', 'performance', 'style'],
    required: true,
  },
  issues: [CodeReviewIssueSchema],
  summary: {
    totalIssues: {
      type: Number,
      default: 0,
    },
    errors: {
      type: Number,
      default: 0,
    },
    warnings: {
      type: Number,
      default: 0,
    },
    info: {
      type: Number,
      default: 0,
    },
    style: {
      type: Number,
      default: 0,
    },
    critical: {
      type: Number,
      default: 0,
    },
    high: {
      type: Number,
      default: 0,
    },
    medium: {
      type: Number,
      default: 0,
    },
    low: {
      type: Number,
      default: 0,
    },
    autoFixable: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 100,
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'A',
    },
  },
  configuration: {
    tools: [String],
    rules: {
      type: Schema.Types.Mixed,
      default: {},
    },
    thresholds: {
      maxErrors: {
        type: Number,
        default: 0,
      },
      maxWarnings: {
        type: Number,
        default: 10,
      },
      minScore: {
        type: Number,
        default: 80,
      },
    },
    excludePatterns: [String],
    includePatterns: [String],
  },
  metadata: {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    duration: Number,
    triggeredBy: {
      type: String,
      enum: ['manual', 'commit', 'push', 'schedule', 'pr'],
      default: 'manual',
    },
    commitHash: String,
    branch: String,
    pullRequest: String,
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
    tags: [String],
    labels: {
      type: Map,
      of: String,
      default: {},
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CodeReviewSchema.index({ workspaceId: 1 });
CodeReviewSchema.index({ codeVersionId: 1 });
CodeReviewSchema.index({ reviewId: 1 }, { unique: true });
CodeReviewSchema.index({ 'metadata.createdBy': 1 });
CodeReviewSchema.index({ status: 1 });
CodeReviewSchema.index({ type: 1 });
CodeReviewSchema.index({ 'metadata.createdAt': -1 });
CodeReviewSchema.index({ 'summary.score': 1 });

// Pre-save middleware to generate reviewId
CodeReviewSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isNew && !doc.reviewId) {
    doc.reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method to add issue
CodeReviewSchema.methods.addIssue = function(issue: Omit<ICodeReviewIssue, 'metadata'> & { metadata?: { tool?: string; version?: string; confidence?: number } }): void {
  this.issues.push({
    ...issue,
    metadata: {
      createdAt: new Date(),
      tool: issue.metadata?.tool || 'unknown',
      version: issue.metadata?.version || '1.0.0',
      confidence: issue.metadata?.confidence || 1.0,
    },
  });

  // Update summary
  this.updateSummary();
};

// Method to update summary
CodeReviewSchema.methods.updateSummary = function(): void {
  const issues = this.issues as ICodeReviewIssue[];
  this.summary.totalIssues = issues.length;
  this.summary.errors = issues.filter((i: ICodeReviewIssue) => i.type === 'error').length;
  this.summary.warnings = issues.filter((i: ICodeReviewIssue) => i.type === 'warning').length;
  this.summary.info = issues.filter((i: ICodeReviewIssue) => i.type === 'info').length;
  this.summary.style = issues.filter((i: ICodeReviewIssue) => i.type === 'style').length;
  this.summary.critical = issues.filter((i: ICodeReviewIssue) => i.severity === 'critical').length;
  this.summary.high = issues.filter((i: ICodeReviewIssue) => i.severity === 'high').length;
  this.summary.medium = issues.filter((i: ICodeReviewIssue) => i.severity === 'medium').length;
  this.summary.low = issues.filter((i: ICodeReviewIssue) => i.severity === 'low').length;
  this.summary.autoFixable = issues.filter((i: ICodeReviewIssue) => i.isAutoFixable).length;

  // Calculate score (0-100)
  const errorPenalty = this.summary.errors * 10;
  const warningPenalty = this.summary.warnings * 2;
  const criticalPenalty = this.summary.critical * 20;
  const highPenalty = this.summary.high * 5;
  const mediumPenalty = this.summary.medium * 1;

  this.summary.score = Math.max(0, 100 - errorPenalty - warningPenalty - criticalPenalty - highPenalty - mediumPenalty);

  // Assign grade
  if (this.summary.score >= 90) this.summary.grade = 'A';
  else if (this.summary.score >= 80) this.summary.grade = 'B';
  else if (this.summary.score >= 70) this.summary.grade = 'C';
  else if (this.summary.score >= 60) this.summary.grade = 'D';
  else this.summary.grade = 'F';
};

// Method to complete review
CodeReviewSchema.methods.complete = function(duration: number): void {
  this.status = 'completed';
  this.metadata.completedAt = new Date();
  this.metadata.duration = duration;
  this.updateSummary();
};

// Method to fail review
CodeReviewSchema.methods.fail = function(error: string): void {
  this.status = 'failed';
  // Could add error field to metadata
};

// Method to add reviewer
CodeReviewSchema.methods.addReviewer = function(userId: mongoose.Types.ObjectId): void {
  const existingReviewer = this.metadata.reviewers.find((r: any) => r.userId.toString() === userId.toString());
  if (!existingReviewer) {
    this.metadata.reviewers.push({
      userId,
      status: 'pending',
    });
  }
};

// Method to update reviewer status
CodeReviewSchema.methods.updateReviewerStatus = function(
  userId: mongoose.Types.ObjectId,
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested',
  comments?: string
): void {
  const reviewer = this.metadata.reviewers.find((r: any) => r.userId.toString() === userId.toString());
  if (reviewer) {
    reviewer.status = status;
    reviewer.reviewedAt = new Date();
    if (comments) {
      reviewer.comments = comments;
    }
  }
};

// Static method to find reviews by workspace
CodeReviewSchema.statics.findByWorkspace = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({ workspaceId, status: { $ne: 'deleted' } })
    .sort({ 'metadata.createdAt': -1 });
};

// Static method to find reviews by code version
CodeReviewSchema.statics.findByCodeVersion = function(codeVersionId: mongoose.Types.ObjectId) {
  return this.find({ codeVersionId })
    .sort({ 'metadata.createdAt': -1 });
};

// Static method to find pending reviews
CodeReviewSchema.statics.findPending = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({
    workspaceId,
    status: 'pending'
  });
};

// Static method to find failed reviews
CodeReviewSchema.statics.findFailed = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({
    workspaceId,
    status: 'failed'
  });
};

// Static method to get review statistics
CodeReviewSchema.statics.getStatistics = function(workspaceId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { workspaceId, 'metadata.createdAt': { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$metadata.createdAt' } },
          type: '$type'
        },
        count: { $sum: 1 },
        avgScore: { $avg: '$summary.score' },
        totalIssues: { $sum: '$summary.totalIssues' },
        avgDuration: { $avg: '$metadata.duration' }
      }
    }
  ]);
};

export default mongoose.models.CodeReview || mongoose.model<ICodeReview>('CodeReview', CodeReviewSchema);