import mongoose, { Document, Schema } from 'mongoose';

export interface IAttentionMetric extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  metricType: 'attention-span' | 'focus-quality' | 'distraction-resistance' | 'flow-state' | 'cognitive-load' | 'time-perception' | 'task-switching-cost' | 'attention-recovery';
  value: number;
  unit: string; // percentage, milliseconds, score, etc.
  baseline: number; // baseline value before enhancement
  improvement: number; // percentage improvement from baseline
  confidence: number; // confidence level of the measurement (0-100)
  timestamp: Date;
  context: {
    activity?: string; // reading, coding, writing, etc.
    environment?: string; // quiet, noisy, office, home, etc.
    timeOfDay?: string; // morning, afternoon, evening, night
    dayOfWeek?: string; // monday, tuesday, etc.
    mentalState?: string; // focused, tired, stressed, relaxed
    caffeineLevel?: number; // 0-5 scale
    sleepQuality?: number; // 0-10 scale
  };
  metadata?: {
    measurementMethod?: string; // self-report, biometric, behavioral, etc.
    deviceType?: string;
    accuracy?: number; // 0-100
    calibration?: number; // 0-100
  };
  createdAt: Date;
  updatedAt: Date;
}

const AttentionMetricSchema: Schema = new Schema({
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
    ref: 'FocusSession',
    default: null,
  },
  metricType: {
    type: String,
    enum: ['attention-span', 'focus-quality', 'distraction-resistance', 'flow-state', 'cognitive-load', 'time-perception', 'task-switching-cost', 'attention-recovery'],
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
  context: {
    activity: String,
    environment: String,
    timeOfDay: String,
    dayOfWeek: String,
    mentalState: String,
    caffeineLevel: {
      type: Number,
      min: 0,
      max: 5,
    },
    sleepQuality: {
      type: Number,
      min: 0,
      max: 10,
    },
  },
  metadata: {
    measurementMethod: String,
    deviceType: String,
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    calibration: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
AttentionMetricSchema.index({ userId: 1, timestamp: -1 });
AttentionMetricSchema.index({ organization: 1, timestamp: -1 });
AttentionMetricSchema.index({ userId: 1, metricType: 1, timestamp: -1 });
AttentionMetricSchema.index({ sessionId: 1, timestamp: -1 });
AttentionMetricSchema.index({ metricType: 1, timestamp: -1 });
AttentionMetricSchema.index({ timestamp: -1 });

// Method to calculate improvement percentage
AttentionMetricSchema.methods.calculateImprovement = function(): number {
  if (this.baseline === 0) return 0;
  return ((this.value - this.baseline) / this.baseline) * 100;
};

// Static method to get user's attention profile
AttentionMetricSchema.statics.getUserProfile = async function(
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

// Static method to get attention trends over time
AttentionMetricSchema.statics.getAttentionTrends = async function(
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

// Static method to get attention analytics
AttentionMetricSchema.statics.getAttentionAnalytics = async function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const analytics = await this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalMeasurements: { $sum: 1 },
        averageAttentionSpan: {
          $avg: {
            $cond: [{ $eq: ['$metricType', 'attention-span'] }, '$value', null]
          }
        },
        averageFocusQuality: {
          $avg: {
            $cond: [{ $eq: ['$metricType', 'focus-quality'] }, '$value', null]
          }
        },
        averageFlowState: {
          $avg: {
            $cond: [{ $eq: ['$metricType', 'flow-state'] }, '$value', null]
          }
        },
        averageDistractionResistance: {
          $avg: {
            $cond: [{ $eq: ['$metricType', 'distraction-resistance'] }, '$value', null]
          }
        },
        overallImprovement: { $avg: '$improvement' },
        averageConfidence: { $avg: '$confidence' },
        bestDay: { $max: '$value' },
        worstDay: { $min: '$value' }
      }
    }
  ]);

  return analytics[0] || {
    totalMeasurements: 0,
    averageAttentionSpan: 0,
    averageFocusQuality: 0,
    averageFlowState: 0,
    averageDistractionResistance: 0,
    overallImprovement: 0,
    averageConfidence: 0,
    bestDay: 0,
    worstDay: 0,
  };
};

export default mongoose.models.AttentionMetric || mongoose.model<IAttentionMetric>('AttentionMetric', AttentionMetricSchema);