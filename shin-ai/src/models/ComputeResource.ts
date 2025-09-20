import mongoose, { Document, Schema } from 'mongoose';

export interface IResourceAllocation {
  environmentId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  allocatedAt: Date;
  requestedResources: {
    cpu: number;
    memory: number;
    gpu?: number;
    storage: number;
  };
  actualResources: {
    cpu: number;
    memory: number;
    gpu?: number;
    storage: number;
  };
  priority: 'low' | 'normal' | 'high' | 'critical';
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
  status: 'pending' | 'allocated' | 'running' | 'completed' | 'failed' | 'cancelled';
  metadata: {
    sessionId?: string;
    jobId?: string;
    queuePosition?: number;
    waitTime?: number; // seconds
    cost?: number; // Cost in credits/tokens
  };
}

export interface IComputeResource extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  type: 'cpu' | 'gpu' | 'tpu' | 'shared';
  provider: 'aws' | 'gcp' | 'azure' | 'local' | 'custom';
  region: string;
  specifications: {
    cpu: {
      cores: number;
      model?: string;
      frequency?: number; // GHz
    };
    memory: {
      total: number; // GB
      available: number; // GB
      type: 'DDR3' | 'DDR4' | 'DDR5' | 'unknown';
    };
    gpu?: {
      count: number;
      model: string;
      memory: number; // GB per GPU
      cudaVersion?: string;
    };
    storage: {
      total: number; // GB
      available: number; // GB
      type: 'SSD' | 'HDD' | 'NVMe' | 'unknown';
      iops?: number;
    };
    network: {
      bandwidth: number; // Mbps
      latency?: number; // ms
    };
  };
  status: 'available' | 'busy' | 'maintenance' | 'offline' | 'error';
  currentAllocation?: IResourceAllocation;
  allocationHistory: IResourceAllocation[];
  configuration: {
    maxConcurrentAllocations: number;
    defaultAllocationTime: number; // minutes
    autoScale: boolean;
    scaleThreshold: number; // percentage
    scaleMin: number;
    scaleMax: number;
    costPerHour: number;
    currency: string;
  };
  monitoring: {
    uptime: number; // percentage
    lastHealthCheck: Date;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      cpuUsage: number; // percentage
      memoryUsage: number; // percentage
      gpuUsage?: number; // percentage
      diskUsage: number; // percentage
      networkUsage: number; // percentage
      temperature?: number; // Celsius
      powerConsumption?: number; // Watts
    };
    alerts: {
      type: 'cpu' | 'memory' | 'gpu' | 'disk' | 'network' | 'temperature' | 'custom';
      severity: 'info' | 'warning' | 'error' | 'critical';
      message: string;
      timestamp: Date;
      resolved?: Date;
    }[];
  };
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    lastMaintenance?: Date;
    tags: string[];
    labels: Record<string, string>;
    cost: {
      total: number;
      currency: string;
      period: 'hourly' | 'daily' | 'monthly';
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const ResourceAllocationSchema = new Schema({
  environmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Environment',
    required: true,
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  allocatedAt: {
    type: Date,
    default: Date.now,
  },
  requestedResources: {
    cpu: Number,
    memory: Number,
    gpu: Number,
    storage: Number,
  },
  actualResources: {
    cpu: Number,
    memory: Number,
    gpu: Number,
    storage: Number,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal',
  },
  estimatedDuration: Number,
  actualDuration: Number,
  status: {
    type: String,
    enum: ['pending', 'allocated', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  metadata: {
    sessionId: String,
    jobId: String,
    queuePosition: Number,
    waitTime: Number,
    cost: Number,
  },
}, { _id: true });

const ComputeResourceSchema: Schema = new Schema({
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
  type: {
    type: String,
    enum: ['cpu', 'gpu', 'tpu', 'shared'],
    required: true,
  },
  provider: {
    type: String,
    enum: ['aws', 'gcp', 'azure', 'local', 'custom'],
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  specifications: {
    cpu: {
      cores: {
        type: Number,
        required: true,
      },
      model: String,
      frequency: Number,
    },
    memory: {
      total: {
        type: Number,
        required: true,
      },
      available: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ['DDR3', 'DDR4', 'DDR5', 'unknown'],
        default: 'unknown',
      },
    },
    gpu: {
      count: Number,
      model: String,
      memory: Number,
      cudaVersion: String,
    },
    storage: {
      total: {
        type: Number,
        required: true,
      },
      available: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ['SSD', 'HDD', 'NVMe', 'unknown'],
        default: 'unknown',
      },
      iops: Number,
    },
    network: {
      bandwidth: {
        type: Number,
        required: true,
      },
      latency: Number,
    },
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'maintenance', 'offline', 'error'],
    default: 'available',
  },
  currentAllocation: ResourceAllocationSchema,
  allocationHistory: [ResourceAllocationSchema],
  configuration: {
    maxConcurrentAllocations: {
      type: Number,
      default: 1,
    },
    defaultAllocationTime: {
      type: Number,
      default: 60, // minutes
    },
    autoScale: {
      type: Boolean,
      default: false,
    },
    scaleThreshold: {
      type: Number,
      default: 80, // percentage
    },
    scaleMin: {
      type: Number,
      default: 1,
    },
    scaleMax: {
      type: Number,
      default: 10,
    },
    costPerHour: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  monitoring: {
    uptime: {
      type: Number,
      default: 100,
    },
    lastHealthCheck: {
      type: Date,
      default: Date.now,
    },
    healthStatus: {
      type: String,
      enum: ['healthy', 'degraded', 'unhealthy'],
      default: 'healthy',
    },
    metrics: {
      cpuUsage: Number,
      memoryUsage: Number,
      gpuUsage: Number,
      diskUsage: Number,
      networkUsage: Number,
      temperature: Number,
      powerConsumption: Number,
    },
    alerts: [{
      type: {
        type: String,
        enum: ['cpu', 'memory', 'gpu', 'disk', 'network', 'temperature', 'custom'],
      },
      severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'critical'],
      },
      message: String,
      timestamp: Date,
      resolved: Date,
    }],
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
    lastMaintenance: Date,
    tags: [String],
    labels: {
      type: Map,
      of: String,
      default: {},
    },
    cost: {
      total: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      period: {
        type: String,
        enum: ['hourly', 'daily', 'monthly'],
        default: 'hourly',
      },
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ComputeResourceSchema.index({ workspaceId: 1 });
ComputeResourceSchema.index({ workspaceId: 1, type: 1 });
ComputeResourceSchema.index({ workspaceId: 1, status: 1 });
ComputeResourceSchema.index({ provider: 1, region: 1 });
ComputeResourceSchema.index({ 'metadata.createdBy': 1 });
ComputeResourceSchema.index({ 'metadata.tags': 1 });
ComputeResourceSchema.index({ status: 1 });

// Pre-save middleware to update available resources
ComputeResourceSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isModified('specifications.memory.total')) {
    doc.specifications.memory.available = doc.specifications.memory.total;
  }
  if (doc.isModified('specifications.storage.total')) {
    doc.specifications.storage.available = doc.specifications.storage.total;
  }
  next();
});

// Method to allocate resources
ComputeResourceSchema.methods.allocate = function(
  allocation: Omit<IResourceAllocation, 'allocatedAt' | 'status' | 'metadata'>
): boolean {
  if (this.status !== 'available') {
    return false;
  }

  // Check if resources are available
  if (this.specifications.memory.available < allocation.requestedResources.memory) {
    return false;
  }
  if (this.specifications.storage.available < allocation.requestedResources.storage) {
    return false;
  }

  // Update resource availability
  this.specifications.memory.available -= allocation.actualResources.memory;
  this.specifications.storage.available -= allocation.actualResources.storage;

  // Create allocation record
  const newAllocation: IResourceAllocation = {
    ...allocation,
    allocatedAt: new Date(),
    status: 'allocated',
    metadata: { queuePosition: 0 },
  };

  this.currentAllocation = newAllocation;
  this.allocationHistory.push(newAllocation);
  this.status = 'busy';

  return true;
};

// Method to deallocate resources
ComputeResourceSchema.methods.deallocate = function(): void {
  if (this.currentAllocation) {
    // Update resource availability
    this.specifications.memory.available += this.currentAllocation.actualResources.memory;
    this.specifications.storage.available += this.currentAllocation.actualResources.storage;

    // Update allocation status
    this.currentAllocation.status = 'completed';
    this.currentAllocation.actualDuration = Math.round(
      (Date.now() - this.currentAllocation.allocatedAt.getTime()) / (1000 * 60)
    );

    // Update cost
    if (this.currentAllocation.actualDuration && this.configuration.costPerHour) {
      this.currentAllocation.metadata.cost =
        (this.currentAllocation.actualDuration / 60) * this.configuration.costPerHour;
    }

    this.currentAllocation = undefined;
    this.status = 'available';
  }
};

// Method to update monitoring metrics
ComputeResourceSchema.methods.updateMetrics = function(metrics: Partial<IComputeResource['monitoring']['metrics']>): void {
  Object.assign(this.monitoring.metrics, metrics);
  this.monitoring.lastHealthCheck = new Date();

  // Update health status based on metrics
  if (this.monitoring.metrics.cpuUsage > 95 || this.monitoring.metrics.memoryUsage > 95) {
    this.monitoring.healthStatus = 'unhealthy';
  } else if (this.monitoring.metrics.cpuUsage > 80 || this.monitoring.metrics.memoryUsage > 80) {
    this.monitoring.healthStatus = 'degraded';
  } else {
    this.monitoring.healthStatus = 'healthy';
  }
};

// Method to add alert
ComputeResourceSchema.methods.addAlert = function(
  type: IComputeResource['monitoring']['alerts'][0]['type'],
  severity: IComputeResource['monitoring']['alerts'][0]['severity'],
  message: string
): void {
  this.monitoring.alerts.push({
    type,
    severity,
    message,
    timestamp: new Date(),
  });
};

// Method to resolve alert
ComputeResourceSchema.methods.resolveAlert = function(alertIndex: number): void {
  if (this.monitoring.alerts[alertIndex]) {
    this.monitoring.alerts[alertIndex].resolved = new Date();
  }
};

// Static method to find available resources
ComputeResourceSchema.statics.findAvailable = function() {
  return this.find({ status: 'available' });
};

// Static method to find resources by type
ComputeResourceSchema.statics.findByType = function(type: IComputeResource['type']) {
  return this.find({ type });
};

// Static method to get resource utilization
ComputeResourceSchema.statics.getUtilization = function(workspaceId: mongoose.Types.ObjectId, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { workspaceId, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type'
        },
        totalResources: { $sum: 1 },
        availableResources: {
          $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
        },
        avgUtilization: {
          $avg: {
            $divide: [
              { $subtract: ['$specifications.memory.total', '$specifications.memory.available'] },
              '$specifications.memory.total'
            ]
          }
        }
      }
    }
  ]);
};

// Static method to get allocation statistics
ComputeResourceSchema.statics.getAllocationStats = function(workspaceId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { workspaceId } },
    { $unwind: '$allocationHistory' },
    {
      $group: {
        _id: {
          resourceId: '$_id',
          resourceName: '$name',
          priority: '$allocationHistory.priority'
        },
        totalAllocations: { $sum: 1 },
        avgDuration: { $avg: '$allocationHistory.actualDuration' },
        totalCost: { $sum: '$allocationHistory.metadata.cost' }
      }
    }
  ]);
};

export default mongoose.models.ComputeResource || mongoose.model<IComputeResource>('ComputeResource', ComputeResourceSchema);