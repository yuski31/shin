import mongoose, { Document, Schema } from 'mongoose';

export interface IUsageEvent extends Document {
  organization: mongoose.Types.ObjectId;
  apiKey?: mongoose.Types.ObjectId;
  provider: string;
  modelName: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number; // in milliseconds
  timestamp: Date;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    endpoint?: string;
    statusCode?: number;
    errorMessage?: string;
  };
}

const UsageEventSchema: Schema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  apiKey: {
    type: Schema.Types.ObjectId,
    ref: 'ApiKey',
    default: null,
  },
  provider: {
    type: String,
    required: true,
    trim: true,
  },
  modelName: {
    type: String,
    required: true,
    trim: true,
  },
  requestCount: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
  },
  inputTokens: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  outputTokens: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  latency: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    endpoint: String,
    statusCode: Number,
    errorMessage: String,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
UsageEventSchema.index({ organization: 1, timestamp: -1 });
UsageEventSchema.index({ apiKey: 1, timestamp: -1 });
UsageEventSchema.index({ provider: 1, modelName: 1, timestamp: -1 });
UsageEventSchema.index({ timestamp: -1 });

// Compound indexes for analytics queries
UsageEventSchema.index({ organization: 1, provider: 1, timestamp: -1 });
UsageEventSchema.index({ organization: 1, modelName: 1, timestamp: -1 });

// TTL index to automatically delete old usage events (1 year)
UsageEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Method to calculate total tokens
UsageEventSchema.methods.getTotalTokens = function(): number {
  return this.inputTokens + this.outputTokens;
};

// Static method to get usage statistics for an organization
UsageEventSchema.statics.getOrganizationStats = async function(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const matchStage = {
    organization: organizationId,
    timestamp: { $gte: startDate, $lte: endDate }
  };

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: '$requestCount' },
        totalInputTokens: { $sum: '$inputTokens' },
        totalOutputTokens: { $sum: '$outputTokens' },
        totalTokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } },
        totalCost: { $sum: '$cost' },
        averageLatency: { $avg: '$latency' },
        totalEvents: { $sum: 1 },
        uniqueProviders: { $addToSet: '$provider' },
        uniqueModels: { $addToSet: '$modelName' },
      }
    }
  ]);

  return stats[0] || {
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    averageLatency: 0,
    totalEvents: 0,
    uniqueProviders: [],
    uniqueModels: [],
  };
};

// Static method to get daily usage breakdown
UsageEventSchema.statics.getDailyUsage = async function(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const dailyUsage = await this.aggregate([
    {
      $match: {
        organization: organizationId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        date: { $first: '$timestamp' },
        totalRequests: { $sum: '$requestCount' },
        totalInputTokens: { $sum: '$inputTokens' },
        totalOutputTokens: { $sum: '$outputTokens' },
        totalTokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } },
        totalCost: { $sum: '$cost' },
        averageLatency: { $avg: '$latency' },
        eventCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return dailyUsage;
};

// Static method to get provider usage breakdown
UsageEventSchema.statics.getProviderUsage = async function(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const providerUsage = await this.aggregate([
    {
      $match: {
        organization: organizationId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$provider',
        totalRequests: { $sum: '$requestCount' },
        totalInputTokens: { $sum: '$inputTokens' },
        totalOutputTokens: { $sum: '$outputTokens' },
        totalTokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } },
        totalCost: { $sum: '$cost' },
        averageLatency: { $avg: '$latency' },
        requestCount: { $sum: 1 },
        models: { $addToSet: '$modelName' }
      }
    },
    {
      $sort: { totalCost: -1 }
    }
  ]);

  return providerUsage;
};

export default mongoose.models.UsageEvent || mongoose.model<IUsageEvent>('UsageEvent', UsageEventSchema);