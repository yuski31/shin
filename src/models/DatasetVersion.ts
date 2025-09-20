import mongoose, { Document, Schema } from 'mongoose';

export interface IDatasetSource {
  type: 'file' | 'database' | 'api' | 'stream' | 'synthetic';
  location: string; // File path, database connection string, API endpoint, etc.
  parameters?: Record<string, any>;
  timestamp: Date;
  checksum?: string;
}

export interface IDatasetColumn {
  name: string;
  type: string; // Data type (string, int, float, etc.)
  description?: string;
  nullable: boolean;
  unique: boolean;
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    std?: number;
    uniqueCount?: number;
    nullCount?: number;
    distribution?: Record<string, number>;
  };
}

export interface IDatasetVersion extends Document {
  workspaceId: mongoose.Types.ObjectId;
  datasetId: string; // DVC dataset identifier
  version: string; // Semantic version
  name: string;
  description?: string;
  parentVersion?: string; // Previous version this was derived from
  sources: IDatasetSource[]; // Data lineage
  columns: IDatasetColumn[];
  metadata: {
    format: string; // csv, json, parquet, etc.
    compression?: string;
    encoding: string;
    separator?: string; // For CSV
    totalRows: number;
    totalColumns: number;
    fileSize: number; // bytes
    checksum: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    lastModified: Date;
    tags: string[];
    labels: Record<string, string>;
    qualityScore?: number; // Data quality score (0-1)
    completenessScore?: number; // Data completeness score (0-1)
    preprocessingSteps?: string[]; // Applied preprocessing steps
    validationResults?: {
      passed: boolean;
      errors: string[];
      warnings: string[];
    };
  };
  statistics: {
    totalSize: number; // bytes
    rowCount: number;
    columnCount: number;
    nullPercentage: number;
    duplicatePercentage: number;
    dataTypes: Record<string, number>; // Count by data type
    memoryUsage: number; // Estimated memory usage in MB
  };
  status: 'active' | 'archived' | 'deprecated' | 'deleted';
  isValidated: boolean;
  validationRules?: {
    requiredColumns: string[];
    dataTypeConstraints: Record<string, string>;
    valueConstraints: Record<string, any>;
    customRules: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const DatasetSourceSchema = new Schema({
  type: {
    type: String,
    enum: ['file', 'database', 'api', 'stream', 'synthetic'],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  parameters: {
    type: Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  checksum: String,
}, { _id: true });

const DatasetColumnSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  description: String,
  nullable: {
    type: Boolean,
    default: true,
  },
  unique: {
    type: Boolean,
    default: false,
  },
  statistics: {
    min: Number,
    max: Number,
    mean: Number,
    median: Number,
    std: Number,
    uniqueCount: Number,
    nullCount: Number,
    distribution: {
      type: Map,
      of: Number,
    },
  },
}, { _id: true });

const DatasetVersionSchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  datasetId: {
    type: String,
    required: true,
    index: true,
  },
  version: {
    type: String,
    required: true,
    match: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/,
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
  parentVersion: String,
  sources: [DatasetSourceSchema],
  columns: [DatasetColumnSchema],
  metadata: {
    format: {
      type: String,
      required: true,
    },
    compression: String,
    encoding: {
      type: String,
      default: 'utf-8',
    },
    separator: String,
    totalRows: {
      type: Number,
      required: true,
    },
    totalColumns: {
      type: Number,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    checksum: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    tags: [String],
    labels: {
      type: Map,
      of: String,
      default: {},
    },
    qualityScore: Number,
    completenessScore: Number,
    preprocessingSteps: [String],
    validationResults: {
      passed: Boolean,
      errors: [String],
      warnings: [String],
    },
  },
  statistics: {
    totalSize: {
      type: Number,
      required: true,
    },
    rowCount: {
      type: Number,
      required: true,
    },
    columnCount: {
      type: Number,
      required: true,
    },
    nullPercentage: {
      type: Number,
      default: 0,
    },
    duplicatePercentage: {
      type: Number,
      default: 0,
    },
    dataTypes: {
      type: Map,
      of: Number,
      default: {},
    },
    memoryUsage: {
      type: Number,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deprecated', 'deleted'],
    default: 'active',
  },
  isValidated: {
    type: Boolean,
    default: false,
  },
  validationRules: {
    requiredColumns: [String],
    dataTypeConstraints: {
      type: Map,
      of: String,
    },
    valueConstraints: {
      type: Schema.Types.Mixed,
    },
    customRules: [String],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
DatasetVersionSchema.index({ workspaceId: 1, datasetId: 1 });
DatasetVersionSchema.index({ workspaceId: 1, version: 1 });
DatasetVersionSchema.index({ datasetId: 1, version: 1 }, { unique: true });
DatasetVersionSchema.index({ 'metadata.createdBy': 1 });
DatasetVersionSchema.index({ 'metadata.format': 1 });
DatasetVersionSchema.index({ 'metadata.tags': 1 });
DatasetVersionSchema.index({ status: 1 });
DatasetVersionSchema.index({ 'metadata.createdAt': -1 });

// Pre-save middleware to update lastModified
DatasetVersionSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isModified() && !doc.isNew) {
    doc.metadata.lastModified = new Date();
  }
  next();
});

// Method to add data source
DatasetVersionSchema.methods.addSource = function(source: Omit<IDatasetSource, 'timestamp'>): void {
  this.sources.push({
    ...source,
    timestamp: new Date(),
  });
  this.metadata.lastModified = new Date();
};

// Method to add column
DatasetVersionSchema.methods.addColumn = function(column: Omit<IDatasetColumn, 'statistics'>): void {
  this.columns.push(column);
  this.metadata.totalColumns = this.columns.length;
  this.statistics.columnCount = this.columns.length;
  this.metadata.lastModified = new Date();
};

// Method to update column statistics
DatasetVersionSchema.methods.updateColumnStatistics = function(
  columnName: string,
  statistics: IDatasetColumn['statistics']
): void {
  const column = this.columns.find((c: IDatasetColumn) => c.name === columnName);
  if (column) {
    column.statistics = statistics;
    this.metadata.lastModified = new Date();
  }
};

// Method to validate dataset
DatasetVersionSchema.methods.validate = function(): { passed: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required columns
  if (this.validationRules?.requiredColumns) {
    const missingColumns = this.validationRules.requiredColumns.filter(
      (col: string) => !this.columns.some((c: IDatasetColumn) => c.name === col)
    );
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  // Check data quality
  if (this.statistics.nullPercentage > 50) {
    warnings.push('High percentage of null values detected');
  }

  if (this.statistics.duplicatePercentage > 10) {
    warnings.push('High percentage of duplicate values detected');
  }

  const result = {
    passed: errors.length === 0,
    errors,
    warnings,
  };

  this.metadata.validationResults = result;
  this.isValidated = true;
  this.metadata.lastModified = new Date();

  return result;
};

// Method to archive dataset
DatasetVersionSchema.methods.archive = function(): void {
  this.status = 'archived';
  this.metadata.lastModified = new Date();
};

// Method to deprecate dataset
DatasetVersionSchema.methods.deprecate = function(): void {
  this.status = 'deprecated';
  this.metadata.lastModified = new Date();
};

// Static method to find latest version by datasetId
DatasetVersionSchema.statics.findLatestByDatasetId = function(datasetId: string) {
  return this.findOne({ datasetId, status: { $ne: 'deleted' } })
    .sort({ version: -1 });
};

// Static method to get version lineage
DatasetVersionSchema.statics.getLineage = function(datasetId: string) {
  return this.find({ datasetId, status: { $ne: 'deleted' } })
    .sort({ version: 1 });
};

// Static method to find datasets by source
DatasetVersionSchema.statics.findBySource = function(sourceLocation: string) {
  return this.find({
    'sources.location': sourceLocation,
    status: { $ne: 'deleted' }
  });
};

// Static method to get dataset statistics
DatasetVersionSchema.statics.getStatistics = function(workspaceId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { workspaceId, status: { $ne: 'deleted' } } },
    {
      $group: {
        _id: null,
        totalDatasets: { $sum: 1 },
        totalSize: { $sum: '$statistics.totalSize' },
        totalRows: { $sum: '$metadata.totalRows' },
        avgQualityScore: { $avg: '$metadata.qualityScore' },
        formats: { $push: '$metadata.format' },
        formatCounts: {
          $push: {
            format: '$metadata.format',
            count: 1
          }
        }
      }
    }
  ]);
};

export default mongoose.models.DatasetVersion || mongoose.model<IDatasetVersion>('DatasetVersion', DatasetVersionSchema);