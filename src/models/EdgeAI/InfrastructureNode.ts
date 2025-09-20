import mongoose, { Document, Schema } from 'mongoose';

export interface IInfrastructureNode extends Document {
  nodeId: string;
  name: string;
  description: string;
  nodeType: 'edge-compute' | 'fog-compute' | 'cloud-compute' | 'hybrid';
  location: {
    region: string;
    zone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    facility: string;
    rack: string;
    position: string;
  };
  hardware: {
    cpu: {
      model: string;
      cores: number;
      threads: number;
      architecture: string;
      baseClock: number;
      boostClock: number;
    };
    memory: {
      total: number;
      type: string;
      speed: number;
      channels: number;
    };
    storage: {
      primary: {
        type: string;
        capacity: number;
        interface: string;
        model: string;
      };
      secondary?: {
        type: string;
        capacity: number;
        interface: string;
        model: string;
      };
    };
    gpu?: {
      model: string;
      memory: number;
      cores: number;
      architecture: string;
    };
    network: {
      interfaces: {
        name: string;
        type: string;
        speed: number;
        macAddress: string;
      }[];
      bandwidth: number;
      latency: number;
    };
    power: {
      consumption: number;
      efficiency: number;
      redundancy: boolean;
      backupPower: boolean;
    };
  };
  software: {
    os: {
      name: string;
      version: string;
      kernel: string;
      architecture: string;
    };
    runtime: {
      containerRuntime: string;
      version: string;
    };
    aiFrameworks: {
      name: string;
      version: string;
      optimized: boolean;
    }[];
    libraries: {
      name: string;
      version: string;
      purpose: string;
    }[];
  };
  capabilities: {
    compute: {
      flops: number;
      tflops: number;
      gpuFlops?: number;
      gpuTflops?: number;
    };
    memory: {
      bandwidth: number;
      latency: number;
    };
    storage: {
      readSpeed: number;
      writeSpeed: number;
      iops: number;
    };
    network: {
      throughput: number;
      latency: number;
      bandwidth: number;
    };
    ai: {
      inference: {
        performance: number;
        accuracy: number;
        supportedModels: string[];
      };
      training: {
        performance: number;
        supportedFrameworks: string[];
      };
    };
  };
  workload: {
    current: {
      cpuUsage: number;
      memoryUsage: number;
      gpuUsage?: number;
      storageUsage: number;
      networkUsage: number;
      activeJobs: number;
      queuedJobs: number;
    };
    capacity: {
      maxCpuUsage: number;
      maxMemoryUsage: number;
      maxGpuUsage?: number;
      maxStorageUsage: number;
      maxNetworkUsage: number;
      maxConcurrentJobs: number;
    };
    efficiency: {
      cpuEfficiency: number;
      memoryEfficiency: number;
      energyEfficiency: number;
      costEfficiency: number;
    };
  };
  monitoring: {
    health: {
      status: 'healthy' | 'warning' | 'critical' | 'offline';
      lastCheck: Date;
      uptime: number;
      availability: number;
    };
    metrics: {
      cpuTemperature: number;
      gpuTemperature?: number;
      powerConsumption: number;
      networkLatency: number;
      diskHealth: number;
      memoryHealth: number;
    };
    alerts: {
      id: string;
      type: 'hardware' | 'software' | 'performance' | 'security';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
      resolved: boolean;
      resolution?: string;
    }[];
    logs: {
      level: 'debug' | 'info' | 'warn' | 'error';
      message: string;
      timestamp: Date;
      source: string;
    }[];
  };
  security: {
    encryption: {
      atRest: boolean;
      inTransit: boolean;
      keyManagement: string;
    };
    accessControl: {
      authentication: string[];
      authorization: string[];
      networkPolicies: string[];
    };
    compliance: {
      standards: string[];
      certifications: string[];
      lastAudit: Date;
      nextAudit: Date;
    };
    vulnerabilities: {
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      cvssScore: number;
      status: 'open' | 'patched' | 'accepted';
      discoveredAt: Date;
      patchedAt?: Date;
    }[];
  };
  integrations: {
    service: string;
    type: 'monitoring' | 'logging' | 'security' | 'backup' | 'deployment';
    status: 'active' | 'inactive' | 'error';
    lastSync: Date;
    configuration: Record<string, any>;
  }[];
  organization: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  lastMaintenance?: Date;
}

const InfrastructureNodeSchema: Schema = new Schema({
  nodeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  nodeType: {
    type: String,
    required: true,
    enum: ['edge-compute', 'fog-compute', 'cloud-compute', 'hybrid'],
  },
  location: {
    region: { type: String, required: true },
    zone: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    facility: { type: String, required: true },
    rack: { type: String, required: true },
    position: { type: String, required: true },
  },
  hardware: {
    cpu: {
      model: { type: String, required: true },
      cores: { type: Number, required: true },
      threads: { type: Number, required: true },
      architecture: { type: String, required: true },
      baseClock: { type: Number, required: true },
      boostClock: { type: Number, required: true },
    },
    memory: {
      total: { type: Number, required: true },
      type: { type: String, required: true },
      speed: { type: Number, required: true },
      channels: { type: Number, required: true },
    },
    storage: {
      primary: {
        type: { type: String, required: true },
        capacity: { type: Number, required: true },
        interface: { type: String, required: true },
        model: { type: String, required: true },
      },
      secondary: {
        type: String,
        capacity: Number,
        interface: String,
        model: String,
      },
    },
    gpu: {
      model: String,
      memory: Number,
      cores: Number,
      architecture: String,
    },
    network: {
      interfaces: [{
        name: { type: String, required: true },
        type: { type: String, required: true },
        speed: { type: Number, required: true },
        macAddress: { type: String, required: true },
      }],
      bandwidth: { type: Number, required: true },
      latency: { type: Number, required: true },
    },
    power: {
      consumption: { type: Number, required: true },
      efficiency: { type: Number, required: true },
      redundancy: { type: Boolean, default: false },
      backupPower: { type: Boolean, default: false },
    },
  },
  software: {
    os: {
      name: { type: String, required: true },
      version: { type: String, required: true },
      kernel: { type: String, required: true },
      architecture: { type: String, required: true },
    },
    runtime: {
      containerRuntime: { type: String, required: true },
      version: { type: String, required: true },
    },
    aiFrameworks: [{
      name: { type: String, required: true },
      version: { type: String, required: true },
      optimized: { type: Boolean, default: false },
    }],
    libraries: [{
      name: { type: String, required: true },
      version: { type: String, required: true },
      purpose: { type: String, required: true },
    }],
  },
  capabilities: {
    compute: {
      flops: { type: Number, required: true },
      tflops: { type: Number, required: true },
      gpuFlops: Number,
      gpuTflops: Number,
    },
    memory: {
      bandwidth: { type: Number, required: true },
      latency: { type: Number, required: true },
    },
    storage: {
      readSpeed: { type: Number, required: true },
      writeSpeed: { type: Number, required: true },
      iops: { type: Number, required: true },
    },
    network: {
      throughput: { type: Number, required: true },
      latency: { type: Number, required: true },
      bandwidth: { type: Number, required: true },
    },
    ai: {
      inference: {
        performance: { type: Number, required: true },
        accuracy: { type: Number, required: true },
        supportedModels: [String],
      },
      training: {
        performance: { type: Number, required: true },
        supportedFrameworks: [String],
      },
    },
  },
  workload: {
    current: {
      cpuUsage: { type: Number, default: 0 },
      memoryUsage: { type: Number, default: 0 },
      gpuUsage: Number,
      storageUsage: { type: Number, default: 0 },
      networkUsage: { type: Number, default: 0 },
      activeJobs: { type: Number, default: 0 },
      queuedJobs: { type: Number, default: 0 },
    },
    capacity: {
      maxCpuUsage: { type: Number, required: true },
      maxMemoryUsage: { type: Number, required: true },
      maxGpuUsage: Number,
      maxStorageUsage: { type: Number, required: true },
      maxNetworkUsage: { type: Number, required: true },
      maxConcurrentJobs: { type: Number, required: true },
    },
    efficiency: {
      cpuEfficiency: { type: Number, default: 0 },
      memoryEfficiency: { type: Number, default: 0 },
      energyEfficiency: { type: Number, default: 0 },
      costEfficiency: { type: Number, default: 0 },
    },
  },
  monitoring: {
    health: {
      status: {
        type: String,
        enum: ['healthy', 'warning', 'critical', 'offline'],
        default: 'healthy',
      },
      lastCheck: { type: Date, default: Date.now },
      uptime: { type: Number, default: 0 },
      availability: { type: Number, default: 100 },
    },
    metrics: {
      cpuTemperature: { type: Number, default: 0 },
      gpuTemperature: Number,
      powerConsumption: { type: Number, default: 0 },
      networkLatency: { type: Number, default: 0 },
      diskHealth: { type: Number, default: 100 },
      memoryHealth: { type: Number, default: 100 },
    },
    alerts: [{
      id: { type: String, required: true },
      type: { type: String, enum: ['hardware', 'software', 'performance', 'security'], required: true },
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      resolved: { type: Boolean, default: false },
      resolution: String,
    }],
    logs: [{
      level: { type: String, enum: ['debug', 'info', 'warn', 'error'], required: true },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      source: { type: String, required: true },
    }],
  },
  security: {
    encryption: {
      atRest: { type: Boolean, default: true },
      inTransit: { type: Boolean, default: true },
      keyManagement: { type: String, default: 'aws-kms' },
    },
    accessControl: {
      authentication: [String],
      authorization: [String],
      networkPolicies: [String],
    },
    compliance: {
      standards: [String],
      certifications: [String],
      lastAudit: Date,
      nextAudit: Date,
    },
    vulnerabilities: [{
      id: { type: String, required: true },
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
      description: { type: String, required: true },
      cvssScore: { type: Number, required: true },
      status: { type: String, enum: ['open', 'patched', 'accepted'], required: true },
      discoveredAt: { type: Date, default: Date.now },
      patchedAt: Date,
    }],
  },
  integrations: [{
    service: { type: String, required: true },
    type: { type: String, enum: ['monitoring', 'logging', 'security', 'backup', 'deployment'], required: true },
    status: { type: String, enum: ['active', 'inactive', 'error'], default: 'inactive' },
    lastSync: { type: Date, default: Date.now },
    configuration: { type: Schema.Types.Mixed },
  }],
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
InfrastructureNodeSchema.index({ nodeId: 1 });
InfrastructureNodeSchema.index({ nodeType: 1 });
InfrastructureNodeSchema.index({ 'location.region': 1 });
InfrastructureNodeSchema.index({ 'monitoring.health.status': 1 });
InfrastructureNodeSchema.index({ 'workload.current.cpuUsage': -1 });
InfrastructureNodeSchema.index({ organization: 1, owner: 1 });

export default mongoose.model<IInfrastructureNode>('InfrastructureNode', InfrastructureNodeSchema);