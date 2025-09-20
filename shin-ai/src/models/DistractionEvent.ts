import mongoose, { Document, Schema } from 'mongoose';

export interface IDistractionEvent extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  eventType: 'notification' | 'external-interruption' | 'internal-thought' | 'environmental' | 'digital-temptation' | 'context-switch' | 'fatigue-related' | 'other';
  severity: number; // 1-10 scale
  duration: number; // milliseconds
  timestamp: Date;
  source: {
    application?: string; // browser, app name, etc.
    category: string; // social-media, work-email, personal-email, system, etc.
    trigger: string; // specific trigger (notification content, person name, etc.)
    automated: boolean; // was this an automated distraction?
  };
  context: {
    activityBefore?: string; // what was user doing before distraction
    timeSinceFocusStart?: number; // minutes since focus session started
    currentFlowState?: number; // 0-100, flow state level when distracted
    mentalFatigue?: number; // 0-100
    timeOfDay?: string;
    dayOfWeek?: string;
  };
  response: {
    action: 'ignored' | 'acknowledged' | 'engaged' | 'blocked' | 'postponed';
    responseTime: number; // milliseconds to respond
    recoveryTime?: number; // minutes to regain focus
    effectiveness?: number; // 0-100, how effective was the response?
  };
  blocking: {
    wasBlocked: boolean;
    blockingRule?: string;
    blockSuccess: boolean; // did the block actually work?
    userOverride?: boolean; // did user override the block?
  };
  impact: {
    focusDisruption: number; // 0-100
    productivityLoss: number; // 0-100
    stressIncrease?: number; // 0-100
    flowStateDrop: number; // 0-100
  };
  patterns: {
    frequency: number; // how many times this pattern occurred today
    timeSinceLast: number; // minutes since last similar distraction
    recurring: boolean; // is this a recurring pattern?
    peakHours: string[]; // hours when this distraction type peaks
  };
  metadata?: {
    deviceType?: string;
    location?: string;
    weather?: string;
    mood?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DistractionEventSchema: Schema = new Schema({
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
  eventType: {
    type: String,
    enum: ['notification', 'external-interruption', 'internal-thought', 'environmental', 'digital-temptation', 'context-switch', 'fatigue-related', 'other'],
    required: true,
  },
  severity: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
  },
  duration: {
    type: Number,
    min: 0,
    required: true, // milliseconds
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  source: {
    application: String,
    category: {
      type: String,
      required: true,
    },
    trigger: String,
    automated: {
      type: Boolean,
      default: false,
    },
  },
  context: {
    activityBefore: String,
    timeSinceFocusStart: Number, // minutes
    currentFlowState: {
      type: Number,
      min: 0,
      max: 100,
    },
    mentalFatigue: {
      type: Number,
      min: 0,
      max: 100,
    },
    timeOfDay: String,
    dayOfWeek: String,
  },
  response: {
    action: {
      type: String,
      enum: ['ignored', 'acknowledged', 'engaged', 'blocked', 'postponed'],
      required: true,
    },
    responseTime: {
      type: Number,
      min: 0,
      required: true, // milliseconds
    },
    recoveryTime: {
      type: Number,
      min: 0,
    }, // minutes
    effectiveness: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  blocking: {
    wasBlocked: {
      type: Boolean,
      default: false,
    },
    blockingRule: String,
    blockSuccess: {
      type: Boolean,
      default: false,
    },
    userOverride: Boolean,
  },
  impact: {
    focusDisruption: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    productivityLoss: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    stressIncrease: {
      type: Number,
      min: 0,
      max: 100,
    },
    flowStateDrop: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
  },
  patterns: {
    frequency: {
      type: Number,
      min: 0,
      default: 1,
    },
    timeSinceLast: {
      type: Number,
      min: 0,
      default: 0,
    }, // minutes
    recurring: {
      type: Boolean,
      default: false,
    },
    peakHours: [String],
  },
  metadata: {
    deviceType: String,
    location: String,
    weather: String,
    mood: String,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
DistractionEventSchema.index({ userId: 1, timestamp: -1 });
DistractionEventSchema.index({ organization: 1, timestamp: -1 });
DistractionEventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
DistractionEventSchema.index({ sessionId: 1, timestamp: -1 });
DistractionEventSchema.index({ eventType: 1, timestamp: -1 });
DistractionEventSchema.index({ timestamp: -1 });
DistractionEventSchema.index({ userId: 1, eventType: 1, 'source.category': 1 });

// Method to calculate impact score
DistractionEventSchema.methods.calculateImpactScore = function(): number {
  return (this.impact.focusDisruption + this.impact.productivityLoss + this.impact.flowStateDrop) / 3;
};

// Method to determine if distraction was successfully handled
DistractionEventSchema.methods.wasHandledSuccessfully = function(): boolean {
  return (
    this.response.action === 'ignored' ||
    this.response.action === 'blocked' ||
    (this.response.effectiveness && this.response.effectiveness > 70)
  );
};

// Static method to get distraction analytics
DistractionEventSchema.statics.getDistractionAnalytics = async function(
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
        totalDistractions: { $sum: 1 },
        totalBlocked: { $sum: { $cond: ['$blocking.wasBlocked', 1, 0] } },
        averageSeverity: { $avg: '$severity' },
        averageDuration: { $avg: '$duration' },
        averageImpact: { $avg: { $add: ['$impact.focusDisruption', '$impact.productivityLoss', '$impact.flowStateDrop'] } },
        distractionsByType: {
          $push: {
            type: '$eventType',
            count: 1,
            severity: '$severity',
            impact: { $avg: { $add: ['$impact.focusDisruption', '$impact.productivityLoss', '$impact.flowStateDrop'] } }
          }
        },
        distractionsBySource: {
          $push: {
            category: '$source.category',
            count: 1,
            severity: '$severity'
          }
        },
        averageRecoveryTime: { $avg: '$response.recoveryTime' },
        successfulHandlingRate: {
          $avg: {
            $cond: [
              { $or: [
                { $eq: ['$response.action', 'ignored'] },
                { $eq: ['$response.action', 'blocked'] },
                { $gt: ['$response.effectiveness', 70] }
              ]},
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  return analytics[0] || {
    totalDistractions: 0,
    totalBlocked: 0,
    averageSeverity: 0,
    averageDuration: 0,
    averageImpact: 0,
    distractionsByType: [],
    distractionsBySource: [],
    averageRecoveryTime: 0,
    successfulHandlingRate: 0,
  };
};

// Static method to get distraction patterns
DistractionEventSchema.statics.getDistractionPatterns = async function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const patterns = await this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          eventType: '$eventType',
          category: '$source.category'
        },
        count: { $sum: 1 },
        averageSeverity: { $avg: '$severity' },
        averageImpact: { $avg: { $add: ['$impact.focusDisruption', '$impact.productivityLoss', '$impact.flowStateDrop'] } },
        latestOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.eventType',
        patterns: {
          $push: {
            hour: '$_id.hour',
            category: '$_id.category',
            count: '$count',
            averageSeverity: '$averageSeverity',
            averageImpact: '$averageImpact',
            latestOccurrence: '$latestOccurrence'
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  return patterns;
};

// Static method to get blocking effectiveness
DistractionEventSchema.statics.getBlockingEffectiveness = async function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const effectiveness = await this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: startDate, $lte: endDate },
        'blocking.wasBlocked': true
      }
    },
    {
      $group: {
        _id: '$blocking.blockingRule',
        totalAttempts: { $sum: 1 },
        successfulBlocks: {
          $sum: { $cond: ['$blocking.blockSuccess', 1, 0] }
        },
        userOverrides: {
          $sum: { $cond: ['$blocking.userOverride', 1, 0] }
        },
        averageSeverity: { $avg: '$severity' },
        averageImpact: { $avg: { $add: ['$impact.focusDisruption', '$impact.productivityLoss', '$impact.flowStateDrop'] } }
      }
    },
    {
      $project: {
        rule: '$_id',
        totalAttempts: 1,
        successfulBlocks: 1,
        userOverrides: 1,
        averageSeverity: 1,
        averageImpact: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successfulBlocks', '$totalAttempts'] },
            100
          ]
        },
        overrideRate: {
          $multiply: [
            { $divide: ['$userOverrides', '$totalAttempts'] },
            100
          ]
        }
      }
    },
    {
      $sort: { successRate: -1 }
    }
  ]);

  return effectiveness;
};

export default mongoose.models.DistractionEvent || mongoose.model<IDistractionEvent>('DistractionEvent', DistractionEventSchema);