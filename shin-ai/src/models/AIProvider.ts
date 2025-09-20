import mongoose, { Document, Schema } from 'mongoose';

// Provider types enum
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface' | 'replicate' | 'together' | 'custom';

// Supported features enum
export type SupportedFeatures = 'chat' | 'embeddings' | 'image-generation' | 'audio' | 'vision' | 'function-calling' | 'streaming';

// Routing strategy enum
export type RoutingStrategy = 'round-robin' | 'least-latency' | 'cost-optimized' | 'capability-based';

// Health status interface
export interface IHealthStatus {
  lastHealthCheck: Date;
  isHealthy: boolean;
  responseTime: number; // in milliseconds
  errorRate: number; // percentage 0-100
  consecutiveFailures: number;
  lastError?: string;
}

// Rate limits interface
export interface IRateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  tokensPerMinute: number;
  tokensPerHour: number;
}

// Load balancing configuration
export interface ILoadBalancingConfig {
  strategy: RoutingStrategy;
  failoverEnabled: boolean;
  maxRetries: number;
  retryDelay: number; // in milliseconds
  circuitBreakerThreshold: number; // consecutive failures before circuit breaker
  healthCheckInterval: number; // in milliseconds
}

export interface IAIProvider extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  name: string;
  type: ProviderType;
  baseUrl: string;
  apiKey: string; // This will be encrypted in production
  models: string[];
  isActive: boolean;

  // Enhanced configuration
  healthCheckUrl?: string;
  rateLimits?: IRateLimits;
  costPerToken?: number; // cost per 1000 tokens
  supportedFeatures: SupportedFeatures[];

  // Health status tracking
  healthStatus: IHealthStatus;

  // Load balancing configuration
  loadBalancing: ILoadBalancingConfig;

  // Legacy fields for backward compatibility
  lastTested?: Date;
  testStatus?: 'success' | 'failed' | 'pending';

  createdAt: Date;
  updatedAt: Date;
}

const AIProviderSchema: Schema = new Schema({
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
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['openai', 'anthropic', 'google', 'cohere', 'huggingface', 'replicate', 'together', 'custom'],
  },
  baseUrl: {
    type: String,
    required: true,
    trim: true,
  },
  apiKey: {
    type: String,
    required: true,
  },
  models: [{
    type: String,
    required: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },

  // Enhanced configuration fields
  healthCheckUrl: {
    type: String,
    trim: true,
    default: null,
  },
  rateLimits: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 },
    tokensPerMinute: { type: Number, default: 100000 },
    tokensPerHour: { type: Number, default: 1000000 },
  },
  costPerToken: {
    type: Number,
    default: 0.002, // Default cost per 1000 tokens
  },
  supportedFeatures: [{
    type: String,
    enum: ['chat', 'embeddings', 'image-generation', 'audio', 'vision', 'function-calling', 'streaming'],
    default: ['chat'],
  }],

  // Health status tracking
  healthStatus: {
    lastHealthCheck: { type: Date, default: null },
    isHealthy: { type: Boolean, default: true },
    responseTime: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    consecutiveFailures: { type: Number, default: 0 },
    lastError: { type: String, default: null },
  },

  // Load balancing configuration
  loadBalancing: {
    strategy: {
      type: String,
      enum: ['round-robin', 'least-latency', 'cost-optimized', 'capability-based'],
      default: 'round-robin',
    },
    failoverEnabled: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 1000 },
    circuitBreakerThreshold: { type: Number, default: 5 },
    healthCheckInterval: { type: Number, default: 30000 }, // 30 seconds
  },

  // Legacy fields for backward compatibility
  lastTested: {
    type: Date,
    default: null,
  },
  testStatus: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
AIProviderSchema.index({ userId: 1 });
AIProviderSchema.index({ organization: 1 });
AIProviderSchema.index({ userId: 1, isActive: 1 });
AIProviderSchema.index({ organization: 1, isActive: 1 });
AIProviderSchema.index({ baseUrl: 1 });
AIProviderSchema.index({ type: 1 });
AIProviderSchema.index({ 'healthStatus.isHealthy': 1 });
AIProviderSchema.index({ 'loadBalancing.strategy': 1 });
AIProviderSchema.index({ organization: 1, type: 1 });
AIProviderSchema.index({ organization: 1, 'healthStatus.isHealthy': 1 });

// Instance methods for health checking and load balancing
AIProviderSchema.methods.updateHealthStatus = function(
  isHealthy: boolean,
  responseTime: number,
  error?: string
) {
  const now = new Date();
  const currentErrorRate = this.healthStatus.errorRate;
  const newConsecutiveFailures = isHealthy ? 0 : this.healthStatus.consecutiveFailures + 1;

  // Calculate new error rate (weighted average)
  const totalChecks = this.healthStatus.consecutiveFailures + (isHealthy ? 1 : 0);
  const newErrorRate = totalChecks > 0 ? (newConsecutiveFailures / totalChecks) * 100 : 0;

  this.healthStatus = {
    lastHealthCheck: now,
    isHealthy,
    responseTime,
    errorRate: Math.min(newErrorRate, 100),
    consecutiveFailures: newConsecutiveFailures,
    lastError: error || null,
  };

  return this.save();
};

AIProviderSchema.methods.isCircuitBreakerOpen = function() {
  return this.healthStatus.consecutiveFailures >= this.loadBalancing.circuitBreakerThreshold;
};

AIProviderSchema.methods.getWeight = function() {
  if (!this.healthStatus.isHealthy || this.isCircuitBreakerOpen()) {
    return 0;
  }

  switch (this.loadBalancing.strategy) {
    case 'least-latency':
      return Math.max(0, 1000 - this.healthStatus.responseTime);
    case 'cost-optimized':
      return this.costPerToken > 0 ? 1 / this.costPerToken : 1;
    default:
      return 1; // round-robin or capability-based
  }
};

// Static methods for provider selection
AIProviderSchema.statics.findHealthyProviders = function(organizationId: string, type?: string) {
  const query: any = {
    organization: organizationId,
    isActive: true,
    'healthStatus.isHealthy': true,
  };

  if (type) {
    query.type = type;
  }

  return this.find(query).sort({ 'healthStatus.responseTime': 1 });
};

AIProviderSchema.statics.findProvidersByCapability = function(organizationId: string, feature: string) {
  return this.find({
    organization: organizationId,
    isActive: true,
    'healthStatus.isHealthy': true,
    supportedFeatures: feature,
  }).sort({ 'healthStatus.responseTime': 1 });
};

export default mongoose.models.AIProvider || mongoose.model<IAIProvider>('AIProvider', AIProviderSchema);
