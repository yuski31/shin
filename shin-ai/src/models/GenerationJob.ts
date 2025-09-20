import mongoose, { Document, Schema } from 'mongoose';

// Job types
export type JobType = 'text' | 'image' | 'video' | 'audio' | 'code' | 'batch';

// Job status
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying';

// Job priority
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

// Content types for batch jobs
export type BatchContentType = 'text' | 'image' | 'video' | 'audio' | 'code';

export interface IGenerationJob extends Document {
  // Basic job information
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  jobType: JobType;

  // Job identification
  jobId: string; // Unique job identifier
  title: string;
  description?: string;

  // Job configuration
  priority: JobPriority;
  status: JobStatus;
  progress: number; // 0-100

  // Content configuration
  contentType: BatchContentType;
  count: number; // Number of items to generate
  templateId?: mongoose.Types.ObjectId;
  presetId?: mongoose.Types.ObjectId;

  // Generation parameters
  parameters: {
    prompt?: string;
    systemMessage?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    customParameters?: Record<string, any>;
  };

  // Batch processing
  items: Array<{
    id: string;
    status: JobStatus;
    prompt?: string;
    result?: string;
    error?: string;
    metadata?: Record<string, any>;
  }>;

  // Results
  results: Array<{
    contentId: mongoose.Types.ObjectId;
    index: number;
    metadata?: Record<string, any>;
  }>;

  // Error handling
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;

  // Timing
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration: number; // in seconds
  actualDuration?: number;

  // Resource usage
  usage: {
    tokensUsed: number;
    cost: number;
    processingTime: number;
    providerUsed?: string;
    modelUsed?: string;
  };

  // Callbacks and webhooks
  callbackUrl?: string;
  webhookSecret?: string;

  // Metadata
  tags: string[];
  metadata: Record<string, any>;

  // Parent job for batch dependencies
  parentJobId?: string;
  childJobIds: string[];

  createdAt: Date;
  updatedAt: Date;
}

const GenerationJobSchema: Schema = new Schema({
  // Basic job information
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
  jobType: {
    type: String,
    required: true,
    enum: ['text', 'image', 'video', 'audio', 'code', 'batch'],
  },

  // Job identification
  jobId: {
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
    trim: true,
    maxlength: 1000,
  },

  // Job configuration
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  status: {
    type: String,
    required: true,
    enum: ['queued', 'processing', 'completed', 'failed', 'cancelled', 'retrying'],
    default: 'queued',
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  // Content configuration
  contentType: {
    type: String,
    required: true,
    enum: ['text', 'image', 'video', 'audio', 'code'],
  },
  count: {
    type: Number,
    required: true,
    min: 1,
    max: 1000, // Reasonable limit for batch processing
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'ContentTemplate',
    default: null,
  },
  presetId: {
    type: Schema.Types.ObjectId,
    ref: 'GenerationPreset',
    default: null,
  },

  // Generation parameters
  parameters: {
    prompt: String,
    systemMessage: String,
    model: String,
    temperature: Number,
    maxTokens: Number,
    customParameters: Schema.Types.Mixed,
  },

  // Batch processing
  items: [{
    id: String,
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'cancelled', 'retrying'],
      default: 'queued',
    },
    prompt: String,
    result: String,
    error: String,
    metadata: Schema.Types.Mixed,
  }],

  // Results
  results: [{
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
    },
    index: Number,
    metadata: Schema.Types.Mixed,
  }],

  // Error handling
  errorMessage: {
    type: String,
    default: null,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },

  // Timing
  queuedAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  estimatedDuration: {
    type: Number,
    default: 300, // 5 minutes default
  },
  actualDuration: {
    type: Number,
    default: null,
  },

  // Resource usage
  usage: {
    tokensUsed: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    processingTime: { type: Number, default: 0 },
    providerUsed: String,
    modelUsed: String,
  },

  // Callbacks and webhooks
  callbackUrl: {
    type: String,
    trim: true,
  },
  webhookSecret: {
    type: String,
    trim: true,
  },

  // Metadata
  tags: [{
    type: String,
    trim: true,
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },

  // Parent job for batch dependencies
  parentJobId: {
    type: String,
    default: null,
  },
  childJobIds: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Indexes for efficient querying
GenerationJobSchema.index({ userId: 1 });
GenerationJobSchema.index({ organization: 1 });
GenerationJobSchema.index({ jobType: 1 });
GenerationJobSchema.index({ status: 1 });
GenerationJobSchema.index({ priority: 1 });
GenerationJobSchema.index({ queuedAt: 1 });
GenerationJobSchema.index({ createdAt: -1 });
GenerationJobSchema.index({ userId: 1, status: 1 });
GenerationJobSchema.index({ organization: 1, status: 1 });
GenerationJobSchema.index({ userId: 1, jobType: 1 });
GenerationJobSchema.index({ status: 1, priority: 1, queuedAt: 1 }); // For job queue processing
GenerationJobSchema.index({ parentJobId: 1 });

// Instance methods
GenerationJobSchema.methods.start = function() {
  this.status = 'processing';
  this.startedAt = new Date();
  return this.save();
};

GenerationJobSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.actualDuration = (this.completedAt.getTime() - this.startedAt.getTime()) / 1000;
  this.progress = 100;
  return this.save();
};

GenerationJobSchema.methods.fail = function(errorMessage: string) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.completedAt = new Date();
  if (this.startedAt) {
    this.actualDuration = (this.completedAt.getTime() - this.startedAt.getTime()) / 1000;
  }
  return this.save();
};

GenerationJobSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.completedAt = new Date();
  if (this.startedAt) {
    this.actualDuration = (this.completedAt.getTime() - this.startedAt.getTime()) / 1000;
  }
  return this.save();
};

GenerationJobSchema.methods.retry = function() {
  if (this.retryCount < this.maxRetries) {
    this.retryCount += 1;
    this.status = 'retrying';
    this.errorMessage = null;
    this.startedAt = null;
    this.completedAt = null;
    this.actualDuration = null;
    return this.save();
  }
  return this;
};

GenerationJobSchema.methods.updateProgress = function(progress: number) {
  this.progress = Math.min(Math.max(progress, 0), 100);
  return this.save();
};

GenerationJobSchema.methods.addResult = function(contentId: mongoose.Types.ObjectId, index: number, metadata?: Record<string, any>) {
  this.results.push({ contentId, index, metadata });
  return this.save();
};

GenerationJobSchema.methods.updateItemStatus = function(itemId: string, status: JobStatus, result?: string, error?: string) {
  const item = this.items.find((item: any) => item.id === itemId);
  if (item) {
    item.status = status;
    if (result) item.result = result;
    if (error) item.error = error;
  }
  return this.save();
};

// Static methods
GenerationJobSchema.statics.findByUser = function(userId: string, options?: any) {
  return this.find({ userId, ...options }).sort({ createdAt: -1 });
};

GenerationJobSchema.statics.findByOrganization = function(organizationId: string, options?: any) {
  return this.find({ organization: organizationId, ...options }).sort({ createdAt: -1 });
};

GenerationJobSchema.statics.findByStatus = function(status: JobStatus, options?: any) {
  return this.find({ status, ...options }).sort({ priority: 1, queuedAt: 1 });
};

GenerationJobSchema.statics.findPendingJobs = function(limit: number = 10) {
  return this.find({
    status: { $in: ['queued', 'retrying'] }
  }).sort({ priority: 1, queuedAt: 1 }).limit(limit);
};

GenerationJobSchema.statics.getQueueStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

GenerationJobSchema.statics.getUserStats = function(userId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          status: '$status',
          jobType: '$jobType',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 },
        totalCost: { $sum: '$usage.cost' },
        totalTokens: { $sum: '$usage.tokensUsed' },
        avgDuration: { $avg: '$actualDuration' }
      }
    }
  ]);
};

export default mongoose.models.GenerationJob || mongoose.model<IGenerationJob>('GenerationJob', GenerationJobSchema);