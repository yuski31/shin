import mongoose, { Document, Schema } from 'mongoose';

export interface ISmartContract extends Document {
  contractId: string;
  name: string;
  description: string;
  contractAddress: string;
  network: 'ethereum' | 'polygon' | 'bsc' | 'arbitrum' | 'optimism';
  contractType: 'erc20' | 'erc721' | 'erc1155' | 'custom';
  abi: any[];
  bytecode: string;
  sourceCode?: string;
  compilerVersion?: string;
  optimization: boolean;
  owner: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  deploymentStatus: 'pending' | 'deployed' | 'failed' | 'verified';
  deploymentTxHash?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  functions: {
    name: string;
    type: 'function' | 'event' | 'constructor';
    inputs: { name: string; type: string }[];
    outputs?: { name: string; type: string }[];
    stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
    signature: string;
  }[];
  events: {
    name: string;
    inputs: { name: string; type: string; indexed: boolean }[];
    signature: string;
  }[];
  metadata: {
    tags: string[];
    category: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    auditStatus: 'unaudited' | 'audited' | 'certified';
    lastAuditDate?: Date;
    auditor?: string;
    securityScore: number;
    gasEfficiency: number;
    documentation: string;
  };
  usage: {
    totalTransactions: number;
    uniqueUsers: number;
    totalValueLocked: number;
    gasUsed: number;
    lastActivity: Date;
    activeUsers: number;
  };
  monitoring: {
    alerts: {
      type: 'security' | 'performance' | 'usage';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
      resolved: boolean;
    }[];
    healthScore: number;
    lastHealthCheck: Date;
    performanceMetrics: {
      averageGasUsed: number;
      averageExecutionTime: number;
      failureRate: number;
      successRate: number;
    };
  };
  integrations: {
    service: string;
    type: 'oracle' | 'bridge' | 'dex' | 'lending' | 'staking' | 'governance';
    status: 'active' | 'inactive' | 'error';
    lastSync: Date;
    configuration: Record<string, any>;
  }[];
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  verifiedAt?: Date;
}

const SmartContractSchema: Schema = new Schema({
  contractId: {
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
  contractAddress: {
    type: String,
    unique: true,
    sparse: true,
  },
  network: {
    type: String,
    required: true,
    enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism'],
  },
  contractType: {
    type: String,
    required: true,
    enum: ['erc20', 'erc721', 'erc1155', 'custom'],
  },
  abi: {
    type: Schema.Types.Mixed,
    required: true,
  },
  bytecode: {
    type: String,
    required: true,
  },
  sourceCode: String,
  compilerVersion: String,
  optimization: {
    type: Boolean,
    default: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  deploymentStatus: {
    type: String,
    enum: ['pending', 'deployed', 'failed', 'verified'],
    default: 'pending',
  },
  deploymentTxHash: String,
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'failed'],
    default: 'unverified',
  },
  functions: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['function', 'event', 'constructor'], required: true },
    inputs: [{
      name: String,
      type: String,
    }],
    outputs: [{
      name: String,
      type: String,
    }],
    stateMutability: {
      type: String,
      enum: ['pure', 'view', 'nonpayable', 'payable'],
      required: true,
    },
    signature: { type: String, required: true },
  }],
  events: [{
    name: { type: String, required: true },
    inputs: [{
      name: String,
      type: String,
      indexed: Boolean,
    }],
    signature: { type: String, required: true },
  }],
  metadata: {
    tags: [String],
    category: { type: String, default: 'general' },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    auditStatus: {
      type: String,
      enum: ['unaudited', 'audited', 'certified'],
      default: 'unaudited',
    },
    lastAuditDate: Date,
    auditor: String,
    securityScore: { type: Number, min: 0, max: 100, default: 50 },
    gasEfficiency: { type: Number, min: 0, max: 100, default: 50 },
    documentation: String,
  },
  usage: {
    totalTransactions: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    totalValueLocked: { type: Number, default: 0 },
    gasUsed: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    activeUsers: { type: Number, default: 0 },
  },
  monitoring: {
    alerts: [{
      type: { type: String, enum: ['security', 'performance', 'usage'], required: true },
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      resolved: { type: Boolean, default: false },
    }],
    healthScore: { type: Number, min: 0, max: 100, default: 100 },
    lastHealthCheck: { type: Date, default: Date.now },
    performanceMetrics: {
      averageGasUsed: { type: Number, default: 0 },
      averageExecutionTime: { type: Number, default: 0 },
      failureRate: { type: Number, min: 0, max: 100, default: 0 },
      successRate: { type: Number, min: 0, max: 100, default: 100 },
    },
  },
  integrations: [{
    service: { type: String, required: true },
    type: {
      type: String,
      enum: ['oracle', 'bridge', 'dex', 'lending', 'staking', 'governance'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error'],
      default: 'inactive',
    },
    lastSync: { type: Date, default: Date.now },
    configuration: { type: Schema.Types.Mixed },
  }],
}, {
  timestamps: true,
});

// Indexes for performance
SmartContractSchema.index({ owner: 1, organization: 1 });
SmartContractSchema.index({ contractAddress: 1, network: 1 });
SmartContractSchema.index({ deploymentStatus: 1 });
SmartContractSchema.index({ verificationStatus: 1 });
SmartContractSchema.index({ 'metadata.category': 1 });
SmartContractSchema.index({ 'metadata.tags': 1 });
SmartContractSchema.index({ 'monitoring.healthScore': -1 });
SmartContractSchema.index({ createdAt: -1 });

export default mongoose.model<ISmartContract>('SmartContract', SmartContractSchema);