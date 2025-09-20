import mongoose, { Document, Schema } from 'mongoose';

export interface ICognitiveMetric extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  metricType: 'iq-score' | 'memory-retention' | 'pattern-recognition' | 'problem-solving' | 'creativity-index' | 'learning-speed' | 'focus-duration' | 'neural-flexibility';
  value: number;
  unit: string; // percentage, score, milliseconds, etc.
  baseline: number; // baseline value before enhancement
  improvement: number; // percentage improvement from baseline
  confidence: number; // confidence level of the measurement (0-100)
  timestamp: Date;
  metadata?: {
    testVersion?: string;
    difficulty?: number; // 1-10 scale
    timeSpent?: number; // seconds
    environment?: string;
    fatigueLevel?: number; // 0-100
    mood?: number; // -10 to +10 scale
  };
  createdAt: Date;
  updatedAt: Date;
}

const CognitiveMetricSchema: Schema = new Schema({
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
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'IntelligenceSession',
    default: null,
  },
  metricType: {
    type: String,
    enum: ['iq-score', 'memory-retention', 'pattern-recognition', 'problem-solving', 'creativity-index', 'learning-speed', 'focus-duration', 'neural-flexibility'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  baseline: {
    type: Number,
    default: 0,
  },
  improvement: {
    type: Number,
    default: 0, // percentage
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  metadata: {
    testVersion: String,
    difficulty: {
      type: Number,
      min: 1,
      max: 10,
    },
    timeSpent: {
      type: Number,
      min: 0,
    }, // seconds
    environment: String,
    fatigueLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    mood: {
      type: Number,
      min: -10,
      max: 10,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CognitiveMetricSchema.index({ userId: 1, timestamp: -1 });
CognitiveMetricSchema.index({ organization: 1, timestamp: -1 });
CognitiveMetricSchema.index({ userId: 1, metricType: 1, timestamp: -1 });
CognitiveMetricSchema.index({ sessionId: 1, timestamp: -1 });
CognitiveMetricSchema.index({ metricType: 1, timestamp: -1 });
CognitiveMetricSchema.index({ timestamp: -1 });

// Method to calculate improvement percentage
CognitiveMetricSchema.methods.calculateImprovement = function(): number {
  if (this.baseline === 0) return 0;
  return ((this.value - this.baseline) / this.baseline) * 100;
};

// Static method to get user's cognitive profile
CognitiveMetricSchema.statics.getUserProfile = async function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const profile = await this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$metricType',
        latestValue: { $last: '$value' },
        latestTimestamp: { $last: '$timestamp' },
        averageValue: { $avg: '$value' },
        minValue: { $min: '$value' },
        maxValue: { $max: '$value' },
        averageImprovement: { $avg: '$improvement' },
        averageConfidence: { $avg: '$confidence' },
        totalMeasurements: { $sum: 1 },
        baseline: { $first: '$baseline' }
      }
    },
    {
      $sort: { latestTimestamp: -1 }
    }
  ]);

  return profile;
};

// Static method to get cognitive trends over time
CognitiveMetricSchema.statics.getCognitiveTrends = async function(
  userId: mongoose.Types.ObjectId,
  metricType: string,
  startDate: Date,
  endDate: Date,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  let groupId: any;

  switch (interval) {
    case 'daily':
      groupId = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
      break;
    case 'weekly':
      groupId = {
        year: { $year: '$timestamp' },
        week: { $week: '$timestamp' }
      };
      break;
    case 'monthly':
      groupId = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' }
      };
      break;
  }

  const trends = await this.aggregate([
    {
      $match: {
        userId: userId,
        metricType: metricType,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupId,
        date: { $first: '$timestamp' },
        averageValue: { $avg: '$value' },
        averageImprovement: { $avg: '$improvement' },
        averageConfidence: { $avg: '$confidence' },
        measurementCount: { $sum: 1 },
        minValue: { $min: '$value' },
        maxValue: { $max: '$value' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return trends;
};

// Static method to get comparative analytics
CognitiveMetricSchema.statics.getComparativeAnalytics = async function(
  userId: mongoose.Types.ObjectId,
  metricType: string,
  startDate: Date,
  endDate: Date
) {
  const analytics = await this.aggregate([
    {
      $match: {
        metricType: metricType,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        userValue: {
          $avg: {
            $cond: [{ $eq: ['$userId', userId] }, '$value', null]
          }
        },
        userImprovement: {
          $avg: {
            $cond: [{ $eq: ['$userId', userId] }, '$improvement', null]
          }
        },
        globalAverage: { $avg: '$value' },
        globalImprovement: { $avg: '$improvement' },
        percentileRank: { $avg: 0 } // Simplified percentile calculation
      }
    }
  ]);

  return analytics[0] || {
    userValue: 0,
    userImprovement: 0,
    globalAverage: 0,
    globalImprovement: 0,
    percentileRank: 0
  };
};

export default mongoose.models.CognitiveMetric || mongoose.model<ICognitiveMetric>('CognitiveMetric', CognitiveMetricSchema);