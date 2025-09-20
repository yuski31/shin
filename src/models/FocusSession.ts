import mongoose, { Document, Schema } from 'mongoose';

export interface IFocusSession extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  protocolId: mongoose.Types.ObjectId;
  sessionType: 'deep-work' | 'flow-state' | 'meditation' | 'attention-training' | 'distraction-blocking';
  status: 'active' | 'completed' | 'paused' | 'terminated';
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  settings: {
    intensity: number; // 1-10 scale
    focusMode: 'time-dilation' | 'meditation-guided' | 'ambient-enhancement' | 'distraction-blocking';
    duration: number; // minutes
    distractionBlocking: boolean;
    ambientEnvironment: string; // nature sounds, white noise, etc.
    timeDilationFactor: number; // 1.0-2.0x speed perception
    focusAreas: string[];
    safetyLimits: {
      maxIntensity: number;
      maxDuration: number;
      minBreakInterval: number; // minutes
    };
  };
  metrics: {
    attentionScore: number; // 0-100
    cognitiveLoad: number; // 0-100 percentage
    flowStateLevel: number; // 0-100
    distractionCount: number;
    focusQuality: number; // 0-100
    timePerceptionRatio: number; // subjective time vs real time
  };
  results: {
    productivityScore: number; // 0-100
    tasksCompleted: number;
    focusTimeRatio: number; // percentage of time in focused state
    improvementScore: number; // percentage improvement
    sessionEffectiveness: number; // overall effectiveness rating
  };
  safety: {
    eyeStrainLevel?: number; // 0-100
    mentalFatigue: number; // 0-100
    consentGiven: boolean;
    lastSafetyCheck: Date;
    emergencyStop: boolean;
  };
  distractions: {
    blockedDistractions: number;
    distractionPatterns: string[];
    distractionTypes: {
      notifications: number;
      externalInterruptions: number;
      internalThoughts: number;
      environmental: number;
    };
  };
  metadata?: {
    deviceType?: string;
    environment?: string;
    caffeineIntake?: number; // mg
    sleepHours?: number;
    stressLevel?: number; // 0-100
  };
  createdAt: Date;
  updatedAt: Date;
}

const FocusSessionSchema: Schema = new Schema({
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
  protocolId: {
    type: Schema.Types.ObjectId,
    ref: 'EnhancementProtocol',
    required: true,
  },
  sessionType: {
    type: String,
    enum: ['deep-work', 'flow-state', 'meditation', 'attention-training', 'distraction-blocking'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'terminated'],
    default: 'active',
  },
  startTime: {
    type: Date,
    default: Date.now,
    required: true,
  },
  endTime: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number,
    default: 0,
    min: 0,
  },
  settings: {
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    focusMode: {
      type: String,
      enum: ['time-dilation', 'meditation-guided', 'ambient-enhancement', 'distraction-blocking'],
      default: 'ambient-enhancement',
    },
    duration: {
      type: Number,
      min: 5,
      max: 480, // 8 hours max
      default: 60, // minutes
    },
    distractionBlocking: {
      type: Boolean,
      default: true,
    },
    ambientEnvironment: {
      type: String,
      default: 'white-noise',
    },
    timeDilationFactor: {
      type: Number,
      min: 1.0,
      max: 2.0,
      default: 1.0,
    },
    focusAreas: [{
      type: String,
      trim: true,
    }],
    safetyLimits: {
      maxIntensity: {
        type: Number,
        min: 1,
        max: 10,
        default: 8,
      },
      maxDuration: {
        type: Number,
        min: 5,
        max: 480,
        default: 120, // minutes
      },
      minBreakInterval: {
        type: Number,
        min: 5,
        max: 60,
        default: 15, // minutes
      },
    },
  },
  metrics: {
    attentionScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    cognitiveLoad: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    flowStateLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    distractionCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    focusQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    timePerceptionRatio: {
      type: Number,
      min: 0.5,
      max: 3.0,
      default: 1.0,
    },
  },
  results: {
    productivityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tasksCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },
    focusTimeRatio: {
      type: Number,
      min: 0,
      max: 100,
      default: 0, // percentage
    },
    improvementScore: {
      type: Number,
      min: -50,
      max: 200,
      default: 0, // percentage
    },
    sessionEffectiveness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  safety: {
    eyeStrainLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    mentalFatigue: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    lastSafetyCheck: {
      type: Date,
      default: Date.now,
    },
    emergencyStop: {
      type: Boolean,
      default: false,
    },
  },
  distractions: {
    blockedDistractions: {
      type: Number,
      min: 0,
      default: 0,
    },
    distractionPatterns: [{
      type: String,
      trim: true,
    }],
    distractionTypes: {
      notifications: {
        type: Number,
        min: 0,
        default: 0,
      },
      externalInterruptions: {
        type: Number,
        min: 0,
        default: 0,
      },
      internalThoughts: {
        type: Number,
        min: 0,
        default: 0,
      },
      environmental: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
  },
  metadata: {
    deviceType: String,
    environment: String,
    caffeineIntake: Number,
    sleepHours: Number,
    stressLevel: Number,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
FocusSessionSchema.index({ userId: 1 });
FocusSessionSchema.index({ organization: 1 });
FocusSessionSchema.index({ userId: 1, status: 1 });
FocusSessionSchema.index({ protocolId: 1 });
FocusSessionSchema.index({ sessionType: 1 });
FocusSessionSchema.index({ startTime: -1 });
FocusSessionSchema.index({ userId: 1, startTime: -1 });

// Method to calculate session duration
FocusSessionSchema.methods.calculateDuration = function(): number {
  if (this.endTime) {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  return Math.floor((Date.now() - this.startTime.getTime()) / (1000 * 60));
};

// Method to check if session is safe to continue
FocusSessionSchema.methods.isSafeToContinue = function(): boolean {
  const now = new Date();
  const timeSinceLastCheck = (now.getTime() - this.safety.lastSafetyCheck.getTime()) / (1000 * 60); // minutes

  return (
    !this.safety.emergencyStop &&
    this.metrics.cognitiveLoad < 90 &&
    this.safety.mentalFatigue < 80 &&
    this.settings.intensity <= this.settings.safetyLimits.maxIntensity &&
    this.duration < this.settings.safetyLimits.maxDuration &&
    timeSinceLastCheck < 5 // Check safety every 5 minutes
  );
};

// Method to update focus metrics
FocusSessionSchema.methods.updateFocusMetrics = function(
  attentionScore: number,
  cognitiveLoad: number,
  flowStateLevel: number
): void {
  this.metrics.attentionScore = Math.max(0, Math.min(100, attentionScore));
  this.metrics.cognitiveLoad = Math.max(0, Math.min(100, cognitiveLoad));
  this.metrics.flowStateLevel = Math.max(0, Math.min(100, flowStateLevel));
  this.metrics.focusQuality = (attentionScore + flowStateLevel - cognitiveLoad * 0.3) / 2;
};

// Static method to get user's focus statistics
FocusSessionSchema.statics.getUserStats = async function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const stats = await this.aggregate([
    {
      $match: {
        userId: userId,
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalDuration: { $sum: '$duration' },
        averageAttentionScore: { $avg: '$metrics.attentionScore' },
        averageFlowState: { $avg: '$metrics.flowStateLevel' },
        averageProductivity: { $avg: '$results.productivityScore' },
        averageFocusQuality: { $avg: '$metrics.focusQuality' },
        averageImprovement: { $avg: '$results.improvementScore' },
        totalDistractionsBlocked: { $sum: '$distractions.blockedDistractions' },
        sessionTypes: { $addToSet: '$sessionType' },
      }
    }
  ]);

  return stats[0] || {
    totalSessions: 0,
    completedSessions: 0,
    totalDuration: 0,
    averageAttentionScore: 0,
    averageFlowState: 0,
    averageProductivity: 0,
    averageFocusQuality: 0,
    averageImprovement: 0,
    totalDistractionsBlocked: 0,
    sessionTypes: [],
  };
};

// Static method to get focus trends over time
FocusSessionSchema.statics.getFocusTrends = async function(
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  let groupId: any;

  switch (interval) {
    case 'daily':
      groupId = {
        year: { $year: '$startTime' },
        month: { $month: '$startTime' },
        day: { $dayOfMonth: '$startTime' }
      };
      break;
    case 'weekly':
      groupId = {
        year: { $year: '$startTime' },
        week: { $week: '$startTime' }
      };
      break;
    case 'monthly':
      groupId = {
        year: { $year: '$startTime' },
        month: { $month: '$startTime' }
      };
      break;
  }

  const trends = await this.aggregate([
    {
      $match: {
        userId: userId,
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupId,
        date: { $first: '$startTime' },
        averageAttentionScore: { $avg: '$metrics.attentionScore' },
        averageFlowState: { $avg: '$metrics.flowStateLevel' },
        averageProductivity: { $avg: '$results.productivityScore' },
        averageFocusQuality: { $avg: '$metrics.focusQuality' },
        totalSessions: { $sum: 1 },
        totalDistractionsBlocked: { $sum: '$distractions.blockedDistractions' },
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  return trends;
};

export default mongoose.models.FocusSession || mongoose.model<IFocusSession>('FocusSession', FocusSessionSchema);