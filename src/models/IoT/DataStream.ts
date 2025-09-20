import mongoose, { Document, Schema } from 'mongoose';

export interface IDataStream extends Document {
  streamId: string;
  name: string;
  description: string;
  deviceType: 'sensor' | 'actuator' | 'gateway' | 'edge-device' | 'mobile-device';
  dataType: 'temperature' | 'humidity' | 'pressure' | 'motion' | 'light' | 'sound' | 'chemical' | 'electrical' | 'custom';
  protocol: 'mqtt' | 'http' | 'websocket' | 'coap' | 'modbus' | 'opc-ua' | 'custom';
  format: 'json' | 'xml' | 'csv' | 'binary' | 'protobuf' | 'custom';
  frequency: {
    value: number;
    unit: 'hz' | 'seconds' | 'minutes' | 'hours';
  };
  quality: {
    accuracy: number;
    precision: number;
    reliability: number;
    latency: number;
  };
  security: {
    encryption: boolean;
    authentication: string;
    authorization: string;
    integrity: boolean;
  };
  processing: {
    realTime: boolean;
    batch: boolean;
    edge: boolean;
    cloud: boolean;
    rules: {
      name: string;
      condition: string;
      action: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
    }[];
    transformations: {
      type: 'filter' | 'aggregate' | 'enrich' | 'normalize' | 'custom';
      config: Record<string, any>;
    }[];
  };
  storage: {
    retention: {
      duration: number;
      unit: 'days' | 'weeks' | 'months' | 'years';
    };
    compression: boolean;
    replication: number;
    backup: boolean;
  };
  analytics: {
    enabled: boolean;
    metrics: string[];
    alerts: {
      threshold: number;
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
      action: string;
    }[];
    predictions: {
      model: string;
      horizon: number;
      confidence: number;
    }[];
  };
  metadata: {
    location: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy: number;
    };
    environment: string;
    tags: string[];
    custom: Record<string, any>;
  };
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  health: {
    score: number;
    lastCheck: Date;
    issues: {
      type: 'connectivity' | 'data-quality' | 'performance' | 'security';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
    }[];
  };
  statistics: {
    totalMessages: number;
    messagesPerSecond: number;
    averageLatency: number;
    errorRate: number;
    uptime: number;
    lastActivity: Date;
  };
  organization: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DataStreamSchema: Schema = new Schema({
  streamId: {
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
  deviceType: {
    type: String,
    required: true,
    enum: ['sensor', 'actuator', 'gateway', 'edge-device', 'mobile-device'],
  },
  dataType: {
    type: String,
    required: true,
    enum: ['temperature', 'humidity', 'pressure', 'motion', 'light', 'sound', 'chemical', 'electrical', 'custom'],
  },
  protocol: {
    type: String,
    required: true,
    enum: ['mqtt', 'http', 'websocket', 'coap', 'modbus', 'opc-ua', 'custom'],
  },
  format: {
    type: String,
    required: true,
    enum: ['json', 'xml', 'csv', 'binary', 'protobuf', 'custom'],
  },
  frequency: {
    value: { type: Number, required: true },
    unit: {
      type: String,
      required: true,
      enum: ['hz', 'seconds', 'minutes', 'hours'],
    },
  },
  quality: {
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    precision: { type: Number, required: true, min: 0, max: 100 },
    reliability: { type: Number, required: true, min: 0, max: 100 },
    latency: { type: Number, required: true, min: 0 },
  },
  security: {
    encryption: { type: Boolean, default: true },
    authentication: { type: String, required: true },
    authorization: { type: String, required: true },
    integrity: { type: Boolean, default: true },
  },
  processing: {
    realTime: { type: Boolean, default: true },
    batch: { type: Boolean, default: false },
    edge: { type: Boolean, default: false },
    cloud: { type: Boolean, default: true },
    rules: [{
      name: { type: String, required: true },
      condition: { type: String, required: true },
      action: { type: String, required: true },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
    }],
    transformations: [{
      type: {
        type: String,
        enum: ['filter', 'aggregate', 'enrich', 'normalize', 'custom'],
        required: true,
      },
      config: { type: Schema.Types.Mixed, required: true },
    }],
  },
  storage: {
    retention: {
      duration: { type: Number, required: true },
      unit: {
        type: String,
        required: true,
        enum: ['days', 'weeks', 'months', 'years'],
      },
    },
    compression: { type: Boolean, default: true },
    replication: { type: Number, default: 1 },
    backup: { type: Boolean, default: true },
  },
  analytics: {
    enabled: { type: Boolean, default: true },
    metrics: [String],
    alerts: [{
      threshold: { type: Number, required: true },
      operator: {
        type: String,
        enum: ['gt', 'lt', 'eq', 'gte', 'lte'],
        required: true,
      },
      action: { type: String, required: true },
    }],
    predictions: [{
      model: { type: String, required: true },
      horizon: { type: Number, required: true },
      confidence: { type: Number, required: true, min: 0, max: 1 },
    }],
  },
  metadata: {
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      altitude: Number,
      accuracy: { type: Number, required: true },
    },
    environment: { type: String, required: true },
    tags: [String],
    custom: { type: Schema.Types.Mixed },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'maintenance'],
    default: 'active',
  },
  health: {
    score: { type: Number, default: 100, min: 0, max: 100 },
    lastCheck: { type: Date, default: Date.now },
    issues: [{
      type: {
        type: String,
        enum: ['connectivity', 'data-quality', 'performance', 'security'],
        required: true,
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
      },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    }],
  },
  statistics: {
    totalMessages: { type: Number, default: 0 },
    messagesPerSecond: { type: Number, default: 0 },
    averageLatency: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0, min: 0, max: 100 },
    uptime: { type: Number, default: 100, min: 0, max: 100 },
    lastActivity: { type: Date, default: Date.now },
  },
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
DataStreamSchema.index({ streamId: 1 });
DataStreamSchema.index({ deviceType: 1 });
DataStreamSchema.index({ dataType: 1 });
DataStreamSchema.index({ protocol: 1 });
DataStreamSchema.index({ status: 1 });
DataStreamSchema.index({ 'metadata.location': '2dsphere' });
DataStreamSchema.index({ 'health.score': -1 });
DataStreamSchema.index({ organization: 1, owner: 1 });

export default mongoose.model<IDataStream>('DataStream', DataStreamSchema);