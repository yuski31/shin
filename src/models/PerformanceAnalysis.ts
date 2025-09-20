import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformanceMetric {
  name: string;
  value: number;
  unit: string; // 'ms', 'bytes', 'percentage', 'count', 'ops/sec'
  category: 'runtime' | 'memory' | 'cpu' | 'io' | 'network' | 'custom';
  description?: string;
  threshold?: {
    warning: number;
    critical: number;
    direction: 'higher' | 'lower'; // Whether higher or lower values are worse
  };
  tags: string[];
  metadata: {
    timestamp: Date;
    source: string; // Function, module, endpoint, etc.
    context: Record<string, any>;
  };
}

export interface IPerformanceBottleneck {
  id: string;
  type: 'cpu_bound' | 'memory_bound' | 'io_bound' | 'network_bound' | 'lock_contention' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    file: string;
    function?: string;
    line?: number;
    column?: number;
  };
  impact: {
    percentage: number; // Performance impact percentage
    estimatedTime: number; // Estimated time savings in ms
  };
  recommendation: string;
  effort: 'low' | 'medium' | 'high'; // Effort to fix
  tags: string[];
  metadata: {
    detectedAt: Date;
    confidence: number; // 0-1 score
    occurrences: number;
  }
}

export interface IPerformanceAnalysis extends Document {
  workspaceId: mongoose.Types.ObjectId;
  codeVersionId: mongoose.Types.ObjectId;
  analysisId: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  type: 'profiling' | 'benchmarking' | 'load_testing' | 'memory_analysis' | 'custom';
  tool: string; // Profiler tool name
  toolVersion: string;
  metrics: IPerformanceMetric[];
  bottlenecks: IPerformanceBottleneck[];
  summary: {
    totalMetrics: number;
    warningMetrics: number;
    criticalMetrics: number;
    performanceScore: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    totalBottlenecks: number;
    criticalBottlenecks: number;
    highBottlenecks: number;
    recommendationsCount: number;
    estimatedImprovement: number; // Percentage
  };
  configuration: {
    profilingOptions: Record<string, any>;
    benchmarks: Record<string, any>;
    thresholds: {
      performanceScore: number;
      maxResponseTime: number; // ms
      maxMemoryUsage: number; // MB
      maxCpuUsage: number; // percentage
    };
    includePatterns: string[];
    excludePatterns: string[];
  };
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    completedAt?: Date;
    duration?: number; // milliseconds
    triggeredBy: 'manual' | 'commit' | 'push' | 'schedule' | 'pr' | 'deployment';
    commitHash?: string;
    branch?: string;
    pullRequest?: string;
    environment: 'development' | 'staging' | 'production';
    target: 'function' | 'module' | 'endpoint' | 'application';
    inputData?: Record<string, any>;
    baselineAnalysisId?: string; // Previous analysis for comparison
    tags: string[];
    labels: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceMetricSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['runtime', 'memory', 'cpu', 'io', 'network', 'custom'],
    required: true,
  },
  description: String,
  threshold: {
    warning: Number,
    critical: Number,
    direction: {
      type: String,
      enum: ['higher', 'lower'],
    },
  },
  tags: [String],
  metadata: {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    source: String,
    context: {
      type: Schema.Types.Mixed,
    },
  },
}, { _id: true });

const PerformanceBottleneckSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['cpu_bound', 'memory_bound', 'io_bound', 'network_bound', 'lock_contention', 'custom'],
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
  location: {
    file: String,
    function: String,
    line: Number,
    column: Number,
  },
  impact: {
    percentage: Number,
    estimatedTime: Number,
  },
  recommendation: {
    type: String,
    required: true,
  },
  effort: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
  },
  tags: [String],
  metadata: {
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    confidence: Number,
    occurrences: Number,
  },
}, { _id: true });

const PerformanceAnalysisSchema: Schema = new Schema({
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
  analysisId: {
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
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  type: {
    type: String,
    enum: ['profiling', 'benchmarking', 'load_testing', 'memory_analysis', 'custom'],
    required: true,
  },
  tool: {
    type: String,
    required: true,
  },
  toolVersion: {
    type: String,
    required: true,
  },
  metrics: [PerformanceMetricSchema],
  bottlenecks: [PerformanceBottleneckSchema],
  summary: {
    totalMetrics: {
      type: Number,
      default: 0,
    },
    warningMetrics: {
      type: Number,
      default: 0,
    },
    criticalMetrics: {
      type: Number,
      default: 0,
    },
    performanceScore: {
      type: Number,
      default: 100,
    },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'A',
    },
    totalBottlenecks: {
      type: Number,
      default: 0,
    },
    criticalBottlenecks: {
      type: Number,
      default: 0,
    },
    highBottlenecks: {
      type: Number,
      default: 0,
    },
    recommendationsCount: {
      type: Number,
      default: 0,
    },
    estimatedImprovement: {
      type: Number,
      default: 0,
    },
  },
  configuration: {
    profilingOptions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    benchmarks: {
      type: Schema.Types.Mixed,
      default: {},
    },
    thresholds: {
      performanceScore: {
        type: Number,
        default: 80,
      },
      maxResponseTime: {
        type: Number,
        default: 1000, // ms
      },
      maxMemoryUsage: {
        type: Number,
        default: 100, // MB
      },
      maxCpuUsage: {
        type: Number,
        default: 80, // percentage
      },
    },
    includePatterns: [String],
    excludePatterns: [String],
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
      enum: ['manual', 'commit', 'push', 'schedule', 'pr', 'deployment'],
      default: 'manual',
    },
    commitHash: String,
    branch: String,
    pullRequest: String,
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development',
    },
    target: {
      type: String,
      enum: ['function', 'module', 'endpoint', 'application'],
      default: 'application',
    },
    inputData: {
      type: Schema.Types.Mixed,
    },
    baselineAnalysisId: String,
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
PerformanceAnalysisSchema.index({ workspaceId: 1 });
PerformanceAnalysisSchema.index({ codeVersionId: 1 });
PerformanceAnalysisSchema.index({ analysisId: 1 }, { unique: true });
PerformanceAnalysisSchema.index({ 'metadata.createdBy': 1 });
PerformanceAnalysisSchema.index({ status: 1 });
PerformanceAnalysisSchema.index({ type: 1 });
PerformanceAnalysisSchema.index({ 'metadata.createdAt': -1 });
PerformanceAnalysisSchema.index({ 'summary.performanceScore': 1 });

// Pre-save middleware to generate analysisId
PerformanceAnalysisSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isNew && !doc.analysisId) {
    doc.analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method to add metric
PerformanceAnalysisSchema.methods.addMetric = function(metric: Omit<IPerformanceMetric, 'metadata'> & { metadata?: { source?: string; context?: Record<string, any> } }): void {
  this.metrics.push({
    ...metric,
    metadata: {
      timestamp: new Date(),
      source: metric.metadata?.source || 'unknown',
      context: metric.metadata?.context || {},
    },
  });

  this.updateSummary();
};

// Method to add bottleneck
PerformanceAnalysisSchema.methods.addBottleneck = function(bottleneck: Omit<IPerformanceBottleneck, 'metadata'> & { metadata?: { confidence?: number; occurrences?: number } }): void {
  this.bottlenecks.push({
    ...bottleneck,
    metadata: {
      detectedAt: new Date(),
      confidence: bottleneck.metadata?.confidence || 1.0,
      occurrences: bottleneck.metadata?.occurrences || 1,
    },
  });

  this.updateSummary();
};

// Method to update summary
PerformanceAnalysisSchema.methods.updateSummary = function(): void {
  const metrics = this.metrics as IPerformanceMetric[];
  const bottlenecks = this.bottlenecks as IPerformanceBottleneck[];

  this.summary.totalMetrics = metrics.length;
  this.summary.warningMetrics = metrics.filter((m: IPerformanceMetric) =>
    m.threshold && (
      (m.threshold.direction === 'higher' && m.value > m.threshold.warning) ||
      (m.threshold.direction === 'lower' && m.value < m.threshold.warning)
    )
  ).length;
  this.summary.criticalMetrics = metrics.filter((m: IPerformanceMetric) =>
    m.threshold && (
      (m.threshold.direction === 'higher' && m.value > m.threshold.critical) ||
      (m.threshold.direction === 'lower' && m.value < m.threshold.critical)
    )
  ).length;

  this.summary.totalBottlenecks = bottlenecks.length;
  this.summary.criticalBottlenecks = bottlenecks.filter((b: IPerformanceBottleneck) => b.severity === 'critical').length;
  this.summary.highBottlenecks = bottlenecks.filter((b: IPerformanceBottleneck) => b.severity === 'high').length;
  this.summary.recommendationsCount = bottlenecks.length;

  // Calculate estimated improvement
  const totalEstimatedTime = bottlenecks.reduce((sum: number, b: IPerformanceBottleneck) => sum + b.impact.estimatedTime, 0);
  const baselineTime = metrics.find((m: IPerformanceMetric) => m.name === 'total_time' || m.name === 'response_time')?.value || 1000;
  this.summary.estimatedImprovement = Math.min(100, (totalEstimatedTime / baselineTime) * 100);

  // Calculate performance score (0-100)
  const criticalPenalty = this.summary.criticalMetrics * 10;
  const warningPenalty = this.summary.warningMetrics * 2;
  const bottleneckPenalty = this.summary.criticalBottlenecks * 15 + this.summary.highBottlenecks * 5;

  this.summary.performanceScore = Math.max(0, 100 - criticalPenalty - warningPenalty - bottleneckPenalty);

  // Assign grade
  if (this.summary.performanceScore >= 90) this.summary.grade = 'A';
  else if (this.summary.performanceScore >= 80) this.summary.grade = 'B';
  else if (this.summary.performanceScore >= 70) this.summary.grade = 'C';
  else if (this.summary.performanceScore >= 60) this.summary.grade = 'D';
  else this.summary.grade = 'F';
};

// Method to complete analysis
PerformanceAnalysisSchema.methods.complete = function(duration: number): void {
  this.status = 'completed';
  this.metadata.completedAt = new Date();
  this.metadata.duration = duration;
  this.updateSummary();
};

// Method to fail analysis
PerformanceAnalysisSchema.methods.fail = function(error: string): void {
  this.status = 'failed';
  // Could add error field to metadata
};

// Static method to find analyses by workspace
PerformanceAnalysisSchema.statics.findByWorkspace = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({ workspaceId, status: { $ne: 'deleted' } })
    .sort({ 'metadata.createdAt': -1 });
};

// Static method to find performance regressions
PerformanceAnalysisSchema.statics.findRegressions = function(workspaceId: mongoose.Types.ObjectId, baselineAnalysisId: string) {
  return this.find({
    workspaceId,
    'metadata.baselineAnalysisId': baselineAnalysisId,
    status: 'completed'
  }).then((analyses: IPerformanceAnalysis[]) => {
    // Compare current analysis with baseline
    return analyses.filter((analysis: IPerformanceAnalysis) => {
      // This would implement regression detection logic
      return analysis.summary.performanceScore < 80; // Example threshold
    });
  });
};

// Static method to get analysis statistics
PerformanceAnalysisSchema.statics.getStatistics = function(workspaceId: mongoose.Types.ObjectId, days: number = 30) {
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
        avgPerformanceScore: { $avg: '$summary.performanceScore' },
        totalBottlenecks: { $sum: '$summary.totalBottlenecks' },
        criticalBottlenecks: { $sum: '$summary.criticalBottlenecks' },
        avgDuration: { $avg: '$metadata.duration' }
      }
    }
  ]);
};

export default mongoose.models.PerformanceAnalysis || mongoose.model<IPerformanceAnalysis>('PerformanceAnalysis', PerformanceAnalysisSchema);