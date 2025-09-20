import mongoose, { Document, Schema } from 'mongoose';

export interface IEnvironmentPort {
  internal: number;
  external?: number;
  protocol: 'tcp' | 'udp';
  description?: string;
}

export interface IEnvironmentVolume {
  hostPath: string;
  containerPath: string;
  mode: 'ro' | 'rw';
  description?: string;
}

export interface IEnvironmentVariable {
  name: string;
  value: string;
  isSecret: boolean;
}

export interface IEnvironment extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'jupyter' | 'code' | 'experiment' | 'custom';
  baseImage: string; // Docker base image
  dockerfile?: string;
  ports: IEnvironmentPort[];
  volumes: IEnvironmentVolume[];
  environmentVariables: IEnvironmentVariable[];
  dependencies: {
    python?: string[];
    node?: string[];
    conda?: Record<string, string>;
    pip?: Record<string, string>;
    apt?: string[];
    custom?: Record<string, any>;
  };
  resources: {
    cpu: number; // CPU cores
    memory: number; // GB
    gpu?: number; // GPU count
    storage: number; // GB
  };
  configuration: {
    workingDirectory: string;
    command?: string[];
    entrypoint?: string[];
    user?: string;
    restartPolicy: 'no' | 'always' | 'on-failure' | 'unless-stopped';
    networkMode: 'bridge' | 'host' | 'none' | 'container';
    privileged: boolean;
    capabilities?: string[];
    securityOptions?: string[];
  };
  status: 'creating' | 'running' | 'stopped' | 'failed' | 'deleting';
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    lastStartedAt?: Date;
    lastStoppedAt?: Date;
    totalRuntime: number; // minutes
    containerId?: string;
    containerName: string;
    hostIp?: string;
    hostPort?: number;
    accessUrl?: string;
    logs: {
      stdout: string[];
      stderr: string[];
      lastUpdated: Date;
    };
    healthCheck: {
      enabled: boolean;
      endpoint?: string;
      interval: number; // seconds
      timeout: number; // seconds
      retries: number;
      lastCheck?: Date;
      status: 'healthy' | 'unhealthy' | 'unknown';
    };
    tags: string[];
    labels: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EnvironmentPortSchema = new Schema({
  internal: {
    type: Number,
    required: true,
  },
  external: Number,
  protocol: {
    type: String,
    enum: ['tcp', 'udp'],
    default: 'tcp',
  },
  description: String,
}, { _id: true });

const EnvironmentVolumeSchema = new Schema({
  hostPath: {
    type: String,
    required: true,
  },
  containerPath: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ['ro', 'rw'],
    default: 'rw',
  },
  description: String,
}, { _id: true });

const EnvironmentVariableSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  isSecret: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

const EnvironmentSchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  type: {
    type: String,
    enum: ['jupyter', 'code', 'experiment', 'custom'],
    required: true,
  },
  baseImage: {
    type: String,
    required: true,
  },
  dockerfile: String,
  ports: [EnvironmentPortSchema],
  volumes: [EnvironmentVolumeSchema],
  environmentVariables: [EnvironmentVariableSchema],
  dependencies: {
    python: [String],
    node: [String],
    conda: {
      type: Map,
      of: String,
    },
    pip: {
      type: Map,
      of: String,
    },
    apt: [String],
    custom: {
      type: Schema.Types.Mixed,
    },
  },
  resources: {
    cpu: {
      type: Number,
      default: 1,
      min: 0.1,
    },
    memory: {
      type: Number,
      default: 2,
      min: 0.5,
    },
    gpu: Number,
    storage: {
      type: Number,
      default: 10,
      min: 1,
    },
  },
  configuration: {
    workingDirectory: {
      type: String,
      default: '/workspace',
    },
    command: [String],
    entrypoint: [String],
    user: String,
    restartPolicy: {
      type: String,
      enum: ['no', 'always', 'on-failure', 'unless-stopped'],
      default: 'unless-stopped',
    },
    networkMode: {
      type: String,
      enum: ['bridge', 'host', 'none', 'container'],
      default: 'bridge',
    },
    privileged: {
      type: Boolean,
      default: false,
    },
    capabilities: [String],
    securityOptions: [String],
  },
  status: {
    type: String,
    enum: ['creating', 'running', 'stopped', 'failed', 'deleting'],
    default: 'stopped',
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
    lastStartedAt: Date,
    lastStoppedAt: Date,
    totalRuntime: {
      type: Number,
      default: 0,
    },
    containerId: String,
    containerName: {
      type: String,
      required: true,
    },
    hostIp: String,
    hostPort: Number,
    accessUrl: String,
    logs: {
      stdout: [String],
      stderr: [String],
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    healthCheck: {
      enabled: {
        type: Boolean,
        default: false,
      },
      endpoint: String,
      interval: {
        type: Number,
        default: 30,
      },
      timeout: {
        type: Number,
        default: 10,
      },
      retries: {
        type: Number,
        default: 3,
      },
      lastCheck: Date,
      status: {
        type: String,
        enum: ['healthy', 'unhealthy', 'unknown'],
        default: 'unknown',
      },
    },
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
EnvironmentSchema.index({ workspaceId: 1 });
EnvironmentSchema.index({ workspaceId: 1, type: 1 });
EnvironmentSchema.index({ 'metadata.createdBy': 1 });
EnvironmentSchema.index({ status: 1 });
EnvironmentSchema.index({ 'metadata.containerName': 1 }, { unique: true });
EnvironmentSchema.index({ 'metadata.tags': 1 });

// Pre-save middleware to generate container name
EnvironmentSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isNew && !doc.metadata.containerName) {
    doc.metadata.containerName = `${doc.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }
  next();
});

// Method to start environment
EnvironmentSchema.methods.start = function(): void {
  this.status = 'running';
  this.metadata.lastStartedAt = new Date();
};

// Method to stop environment
EnvironmentSchema.methods.stop = function(): void {
  this.status = 'stopped';
  this.metadata.lastStoppedAt = new Date();
};

// Method to add log entry
EnvironmentSchema.methods.addLog = function(stdout: string, stderr: string = ''): void {
  this.metadata.logs.stdout.push(stdout);
  if (stderr) {
    this.metadata.logs.stderr.push(stderr);
  }
  this.metadata.logs.lastUpdated = new Date();

  // Keep only last 1000 log entries
  if (this.metadata.logs.stdout.length > 1000) {
    this.metadata.logs.stdout = this.metadata.logs.stdout.slice(-1000);
  }
  if (this.metadata.logs.stderr.length > 1000) {
    this.metadata.logs.stderr = this.metadata.logs.stderr.slice(-1000);
  }
};

// Method to update health status
EnvironmentSchema.methods.updateHealthStatus = function(status: 'healthy' | 'unhealthy' | 'unknown'): void {
  this.metadata.healthCheck.status = status;
  this.metadata.healthCheck.lastCheck = new Date();
};

// Method to add port mapping
EnvironmentSchema.methods.addPort = function(port: Omit<IEnvironmentPort, 'description'>): void {
  this.ports.push(port);
};

// Method to add volume
EnvironmentSchema.methods.addVolume = function(volume: Omit<IEnvironmentVolume, 'description'>): void {
  this.volumes.push(volume);
};

// Method to add environment variable
EnvironmentSchema.methods.addEnvironmentVariable = function(envVar: Omit<IEnvironmentVariable, 'isSecret'>): void {
  this.environmentVariables.push({
    ...envVar,
    isSecret: false,
  });
};

// Method to add secret environment variable
EnvironmentSchema.methods.addSecret = function(name: string, value: string): void {
  this.environmentVariables.push({
    name,
    value,
    isSecret: true,
  });
};

// Static method to find environments by workspace
EnvironmentSchema.statics.findByWorkspace = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({ workspaceId, status: { $ne: 'deleted' } });
};

// Static method to find running environments
EnvironmentSchema.statics.findRunning = function() {
  return this.find({ status: 'running' });
};

// Static method to find environments by type
EnvironmentSchema.statics.findByType = function(type: IEnvironment['type']) {
  return this.find({ type, status: { $ne: 'deleted' } });
};

// Static method to get environment statistics
EnvironmentSchema.statics.getStatistics = function(workspaceId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { workspaceId, status: { $ne: 'deleted' }, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type'
        },
        count: { $sum: 1 },
        running: {
          $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
        },
        totalRuntime: { $sum: '$metadata.totalRuntime' }
      }
    }
  ]);
};

export default mongoose.models.Environment || mongoose.model<IEnvironment>('Environment', EnvironmentSchema);