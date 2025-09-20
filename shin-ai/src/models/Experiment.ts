import mongoose, { Document, Schema } from 'mongoose';

export interface IExperimentRun {
  runId: string; // MLflow run ID
  name: string;
  status: 'running' | 'finished' | 'failed' | 'killed';
  startTime: Date;
  endTime?: Date;
  duration?: number; // seconds
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  tags: Record<string, string>;
  artifacts: {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
  }[];
  metadata: {
    userId: mongoose.Types.ObjectId;
    source: string; // Git commit, notebook, script path
    entryPoint: string; // Main script/function
    environment: {
      pythonVersion: string;
      packages: Record<string, string>;
      dockerImage?: string;
      computeResources: {
        cpu: number;
        memory: number;
        gpu?: number;
      };
    };
    logs: string[]; // Log file paths
    errorMessage?: string;
    stackTrace?: string;
  };
}

export interface IExperiment extends Document {
  workspaceId: mongoose.Types.ObjectId;
  experimentId: string; // MLflow experiment ID
  name: string;
  description?: string;
  artifactLocation: string; // S3, GCS, or local path
  tags: Record<string, string>;
  runs: IExperimentRun[];
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    lastRunAt?: Date;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgDuration: number; // seconds
    bestMetrics: Record<string, number>;
    status: 'active' | 'archived' | 'deleted';
    framework?: string; // 'pytorch', 'tensorflow', 'sklearn', etc.
    taskType?: string; // 'classification', 'regression', 'clustering', etc.
  };
  lifecycleStage: 'active' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const ExperimentRunSchema = new Schema({
  runId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['running', 'finished', 'failed', 'killed'],
    default: 'running',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
  duration: Number,
  parameters: {
    type: Schema.Types.Mixed,
    default: {},
  },
  metrics: {
    type: Map,
    of: Number,
    default: {},
  },
  tags: {
    type: Map,
    of: String,
    default: {},
  },
  artifacts: [{
    name: String,
    path: String,
    type: {
      type: String,
      enum: ['file', 'directory'],
    },
    size: Number,
  }],
  metadata: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: String,
    entryPoint: String,
    environment: {
      pythonVersion: String,
      packages: {
        type: Map,
        of: String,
      },
      dockerImage: String,
      computeResources: {
        cpu: Number,
        memory: Number,
        gpu: Number,
      },
    },
    logs: [String],
    errorMessage: String,
    stackTrace: String,
  },
}, { _id: true });

const ExperimentSchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  experimentId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  artifactLocation: {
    type: String,
    required: true,
  },
  tags: {
    type: Map,
    of: String,
    default: {},
  },
  runs: [ExperimentRunSchema],
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
    lastRunAt: Date,
    totalRuns: {
      type: Number,
      default: 0,
    },
    successfulRuns: {
      type: Number,
      default: 0,
    },
    failedRuns: {
      type: Number,
      default: 0,
    },
    avgDuration: {
      type: Number,
      default: 0,
    },
    bestMetrics: {
      type: Map,
      of: Number,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
    },
    framework: String,
    taskType: String,
  },
  lifecycleStage: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ExperimentSchema.index({ workspaceId: 1 });
ExperimentSchema.index({ experimentId: 1 }, { unique: true });
ExperimentSchema.index({ 'metadata.createdBy': 1 });
ExperimentSchema.index({ 'metadata.status': 1 });
ExperimentSchema.index({ 'metadata.createdAt': -1 });
ExperimentSchema.index({ 'runs.status': 1 });
ExperimentSchema.index({ 'runs.startTime': -1 });

// Pre-save middleware to generate experimentId
ExperimentSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isNew && !doc.experimentId) {
    doc.experimentId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method to add experiment run
ExperimentSchema.methods.addRun = function(run: Omit<IExperimentRun, 'startTime'>): void {
  this.runs.push({
    ...run,
    startTime: new Date(),
  });

  this.metadata.totalRuns += 1;
  this.metadata.lastRunAt = new Date();

  if (run.status === 'finished') {
    this.metadata.successfulRuns += 1;
  } else if (run.status === 'failed') {
    this.metadata.failedRuns += 1;
  }

  // Update average duration
  if (run.duration) {
    const totalDuration = this.metadata.avgDuration * (this.metadata.totalRuns - 1) + run.duration;
    this.metadata.avgDuration = totalDuration / this.metadata.totalRuns;
  }

  // Update best metrics
  Object.entries(run.metrics).forEach(([key, value]) => {
    if (!this.metadata.bestMetrics.has(key) ||
        (this.metadata.bestMetrics.get(key) || 0) < value) {
      this.metadata.bestMetrics.set(key, value);
    }
  });
};

// Method to update run status
ExperimentSchema.methods.updateRunStatus = function(
  runId: string,
  status: IExperimentRun['status'],
  endTime?: Date,
  errorMessage?: string,
  stackTrace?: string
): void {
  const run = this.runs.find((r: IExperimentRun) => r.runId === runId);
  if (run) {
    run.status = status;
    run.endTime = endTime || new Date();
    run.duration = run.endTime.getTime() - run.startTime.getTime();

    if (errorMessage) {
      run.metadata.errorMessage = errorMessage;
    }
    if (stackTrace) {
      run.metadata.stackTrace = stackTrace;
    }

    // Update metadata
    if (status === 'finished') {
      this.metadata.successfulRuns += 1;
    } else if (status === 'failed') {
      this.metadata.failedRuns += 1;
    }

    // Update average duration
    const totalDuration = this.metadata.avgDuration * (this.metadata.totalRuns - 1) + (run.duration || 0);
    this.metadata.avgDuration = totalDuration / this.metadata.totalRuns;
  }
};

// Method to get run by ID
ExperimentSchema.methods.getRun = function(runId: string): IExperimentRun | undefined {
  return this.runs.find((r: IExperimentRun) => r.runId === runId);
};

// Method to archive experiment
ExperimentSchema.methods.archive = function(): void {
  this.metadata.status = 'archived';
};

// Method to delete experiment
ExperimentSchema.methods.delete = function(): void {
  this.lifecycleStage = 'deleted';
};

// Static method to find active experiments by workspace
ExperimentSchema.statics.findActiveByWorkspace = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({
    workspaceId,
    'metadata.status': 'active',
    lifecycleStage: 'active'
  });
};

// Static method to find experiments by user
ExperimentSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    'metadata.createdBy': userId,
    'metadata.status': 'active',
    lifecycleStage: 'active'
  });
};

// Static method to get experiment statistics
ExperimentSchema.statics.getStatistics = function(workspaceId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        workspaceId,
        'metadata.status': 'active',
        lifecycleStage: 'active',
        'metadata.createdAt': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$metadata.createdAt' } },
          framework: '$metadata.framework'
        },
        count: { $sum: 1 },
        totalRuns: { $sum: '$metadata.totalRuns' },
        successfulRuns: { $sum: '$metadata.successfulRuns' },
        avgDuration: { $avg: '$metadata.avgDuration' }
      }
    }
  ]);
};

// Static method to find best performing runs
ExperimentSchema.statics.findBestRuns = function(
  workspaceId: mongoose.Types.ObjectId,
  metric: string,
  limit: number = 10
) {
  return this.aggregate([
    { $match: { workspaceId, 'metadata.status': 'active', lifecycleStage: 'active' } },
    { $unwind: '$runs' },
    { $match: { 'runs.status': 'finished' } },
    { $sort: { [`runs.metrics.${metric}`]: -1 } },
    { $limit: limit },
    {
      $project: {
        experimentId: 1,
        experimentName: '$name',
        runId: '$runs.runId',
        runName: '$runs.name',
        metric: `$runs.metrics.${metric}`,
        parameters: '$runs.parameters',
        startTime: '$runs.startTime'
      }
    }
  ]);
};

export default mongoose.models.Experiment || mongoose.model<IExperiment>('Experiment', ExperimentSchema);