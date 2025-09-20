import mongoose, { Document, Schema } from 'mongoose';

export interface IModelArtifact {
  name: string;
  path: string;
  size: number; // bytes
  checksum: string;
  type: 'model' | 'checkpoint' | 'config' | 'metadata' | 'other';
  format: string; // e.g., 'pkl', 'h5', 'pb', 'onnx'
  createdAt: Date;
}

export interface IModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  loss?: number;
  validationLoss?: number;
  trainingTime?: number; // minutes
  inferenceTime?: number; // milliseconds
  modelSize?: number; // MB
  customMetrics?: Record<string, number>;
}

export interface IModelVersion extends Document {
  workspaceId: mongoose.Types.ObjectId;
  modelId: string; // DVC model identifier
  version: string; // Semantic version (e.g., '1.0.0', '1.1.0')
  name: string;
  description?: string;
  parentVersion?: string; // Previous version this was branched from
  branch?: string; // Git branch name
  commitHash?: string; // Git commit hash
  artifacts: IModelArtifact[];
  metrics: IModelMetrics;
  parameters: Record<string, any>; // Training parameters
  metadata: {
    framework: string; // e.g., 'tensorflow', 'pytorch', 'sklearn'
    frameworkVersion: string;
    pythonVersion: string;
    dependencies: Record<string, string>; // Package versions
    datasetVersion?: string; // Reference to dataset version used
    experimentId?: string; // MLflow experiment ID
    trainingScript?: string; // Path to training script
    configFile?: string; // Path to config file
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    lastModified: Date;
    tags: string[];
    labels: Record<string, string>;
  };
  status: 'active' | 'archived' | 'deprecated' | 'deleted';
  isProduction: boolean;
  deploymentInfo?: {
    endpoint?: string;
    deployedAt?: Date;
    deployedBy?: mongoose.Types.ObjectId;
    environment: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ModelArtifactSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  checksum: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['model', 'checkpoint', 'config', 'metadata', 'other'],
    default: 'model',
  },
  format: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const ModelMetricsSchema = new Schema({
  accuracy: Number,
  precision: Number,
  recall: Number,
  f1Score: Number,
  loss: Number,
  validationLoss: Number,
  trainingTime: Number,
  inferenceTime: Number,
  modelSize: Number,
  customMetrics: {
    type: Map,
    of: Number,
  },
});

const ModelVersionSchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  modelId: {
    type: String,
    required: true,
    index: true,
  },
  version: {
    type: String,
    required: true,
    match: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, // Semantic versioning
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
  branch: String,
  commitHash: String,
  artifacts: [ModelArtifactSchema],
  metrics: ModelMetricsSchema,
  parameters: {
    type: Schema.Types.Mixed,
    default: {},
  },
  metadata: {
    framework: {
      type: String,
      required: true,
    },
    frameworkVersion: {
      type: String,
      required: true,
    },
    pythonVersion: {
      type: String,
      required: true,
    },
    dependencies: {
      type: Map,
      of: String,
      default: {},
    },
    datasetVersion: String,
    experimentId: String,
    trainingScript: String,
    configFile: String,
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
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deprecated', 'deleted'],
    default: 'active',
  },
  isProduction: {
    type: Boolean,
    default: false,
  },
  deploymentInfo: {
    endpoint: String,
    deployedAt: Date,
    deployedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    environment: String,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ModelVersionSchema.index({ workspaceId: 1, modelId: 1 });
ModelVersionSchema.index({ workspaceId: 1, version: 1 });
ModelVersionSchema.index({ modelId: 1, version: 1 }, { unique: true });
ModelVersionSchema.index({ 'metadata.createdBy': 1 });
ModelVersionSchema.index({ 'metadata.framework': 1 });
ModelVersionSchema.index({ 'metadata.tags': 1 });
ModelVersionSchema.index({ status: 1 });
ModelVersionSchema.index({ isProduction: 1 });
ModelVersionSchema.index({ 'metadata.createdAt': -1 });

// Pre-save middleware to update lastModified
ModelVersionSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isModified() && !doc.isNew) {
    doc.metadata.lastModified = new Date();
  }
  next();
});

// Method to add artifact
ModelVersionSchema.methods.addArtifact = function(artifact: Omit<IModelArtifact, 'createdAt'>): void {
  this.artifacts.push({
    ...artifact,
    createdAt: new Date(),
  });
};

// Method to remove artifact
ModelVersionSchema.methods.removeArtifact = function(artifactPath: string): void {
  this.artifacts = this.artifacts.filter((a: IModelArtifact) => a.path !== artifactPath);
};

// Method to update metrics
ModelVersionSchema.methods.updateMetrics = function(metrics: Partial<IModelMetrics>): void {
  Object.assign(this.metrics, metrics);
};

// Method to deploy model
ModelVersionSchema.methods.deploy = function(
  endpoint: string,
  environment: string,
  deployedBy: mongoose.Types.ObjectId
): void {
  this.isProduction = true;
  this.deploymentInfo = {
    endpoint,
    deployedAt: new Date(),
    deployedBy,
    environment,
  };
  this.metadata.lastModified = new Date();
};

// Method to archive model
ModelVersionSchema.methods.archive = function(): void {
  this.status = 'archived';
  this.metadata.lastModified = new Date();
};

// Method to deprecate model
ModelVersionSchema.methods.deprecate = function(): void {
  this.status = 'deprecated';
  this.metadata.lastModified = new Date();
};

// Static method to find latest version by modelId
ModelVersionSchema.statics.findLatestByModelId = function(modelId: string) {
  return this.findOne({ modelId, status: { $ne: 'deleted' } })
    .sort({ version: -1 });
};

// Static method to find production version
ModelVersionSchema.statics.findProductionVersion = function(modelId: string) {
  return this.findOne({ modelId, isProduction: true, status: 'active' });
};

// Static method to get version history
ModelVersionSchema.statics.getVersionHistory = function(modelId: string) {
  return this.find({ modelId, status: { $ne: 'deleted' } })
    .sort({ version: -1 });
};

// Static method to compare versions
ModelVersionSchema.statics.compareVersions = function(version1Id: string, version2Id: string) {
  return this.aggregate([
    { $match: { _id: { $in: [new mongoose.Types.ObjectId(version1Id), new mongoose.Types.ObjectId(version2Id)] } } },
    {
      $group: {
        _id: null,
        versions: { $push: '$$ROOT' },
        differences: {
          $push: {
            metrics: '$metrics',
            parameters: '$parameters',
            artifacts: '$artifacts',
            metadata: '$metadata'
          }
        }
      }
    }
  ]);
};

export default mongoose.models.ModelVersion || mongoose.model<IModelVersion>('ModelVersion', ModelVersionSchema);