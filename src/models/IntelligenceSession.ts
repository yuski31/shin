import mongoose, { Document, Schema } from 'mongoose';

export interface IIntelligenceSession extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  protocolId: mongoose.Types.ObjectId;
  sessionType: 'iq-boost' | 'math-intuition' | 'creative-enhancement' | 'pattern-recognition' | 'synesthetic-learning';
  status: 'active' | 'completed' | 'paused' | 'terminated';
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  settings: {
    intensity: number; // 1-10 scale
    frequency: number; // Hz for neural stimulation simulation
    duration: number; // minutes
    focusAreas: string[];
    safetyLimits: {
      maxIntensity: number;
      maxDuration: number;
      minRestPeriod: number; // hours
    };
  };
  metrics: {
    cognitiveLoad: number; // percentage
    neuralActivity: number; // simulated neural activity level
    performanceScore: number; // 0-100
    stressLevel: number; // 0-100
  };
  results: {
    improvementScore: number; // percentage improvement
    patternsRecognized: number;
    problemsSolved: number;
    creativityIndex: number; // 0-100
    memoryRetention: number; // percentage
  };
  safety: {
    heartRate?: number; // BPM (simulated)
    stressMarkers: number; // 0-100
    consentGiven: boolean;
    lastSafetyCheck: Date;
    emergencyStop: boolean;
  };
  metadata?: {
    deviceType?: string;
    environment?: string;
    weather?: string;
    caffeineIntake?: number; // mg
    sleepHours?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const IntelligenceSessionSchema: Schema = new Schema({
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
    enum: ['iq-boost', 'math-intuition', 'creative-enhancement', 'pattern-recognition', 'synesthetic-learning'],
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
    frequency: {
      type: Number,
      min: 1,
      max: 40,
      default: 10, // Hz
    },
    duration: {
      type: Number,
      min: 5,
      max: 120,
      default: 30, // minutes
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
        max: 180,
        default: 60, // minutes
      },
      minRestPeriod: {
        type: Number,
        min: 1,
        max: 24,
        default: 4, // hours
      },
    },
  },
  metrics: {
    cognitiveLoad: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    neuralActivity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    stressLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  results: {
    improvementScore: {
      type: Number,
      min: -100,
      max: 200,
      default: 0, // percentage
    },
    patternsRecognized: {
      type: Number,
      min: 0,
      default: 0,
    },
    problemsSolved: {
      type: Number,
      min: 0,
      default: 0,
    },
    creativityIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    memoryRetention: {
      type: Number,
      min: 0,
      max: 100,
      default: 0, // percentage
    },
  },
  safety: {
    heartRate: {
      type: Number,
      min: 40,
      max: 200,
      default: null,
    },
    stressMarkers: {
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
  metadata: {
    deviceType: String,
    environment: String,
    weather: String,
    caffeineIntake: Number,
    sleepHours: Number,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
IntelligenceSessionSchema.index({ userId: 1 });
IntelligenceSessionSchema.index({ organization: 1 });
IntelligenceSessionSchema.index({ userId: 1, status: 1 });
IntelligenceSessionSchema.index({ protocolId: 1 });
IntelligenceSessionSchema.index({ sessionType: 1 });
IntelligenceSessionSchema.index({ startTime: -1 });
IntelligenceSessionSchema.index({ userId: 1, startTime: -1 });

// Method to calculate session duration
IntelligenceSessionSchema.methods.calculateDuration = function(): number {
  if (this.endTime) {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  return Math.floor((Date.now() - this.startTime.getTime()) / (1000 * 60));
};

// Method to check if session is safe to continue
IntelligenceSessionSchema.methods.isSafeToContinue = function(): boolean {
  const now = new Date();
  const timeSinceLastCheck = (now.getTime() - this.safety.lastSafetyCheck.getTime()) / (1000 * 60); // minutes

  return (
    !this.safety.emergencyStop &&
    this.metrics.stressLevel < 80 &&
    this.settings.intensity <= this.settings.safetyLimits.maxIntensity &&
    this.duration < this.settings.safetyLimits.maxDuration &&
    timeSinceLastCheck < 5 // Check safety every 5 minutes
  );
};

// Static method to get user's session statistics
IntelligenceSessionSchema.statics.getUserStats = async function(
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
        averageImprovement: { $avg: '$results.improvementScore' },
        averagePerformance: { $avg: '$metrics.performanceScore' },
        sessionTypes: { $addToSet: '$sessionType' },
        averageStressLevel: { $avg: '$metrics.stressLevel' },
      }
    }
  ]);

  return stats[0] || {
    totalSessions: 0,
    completedSessions: 0,
    totalDuration: 0,
    averageImprovement: 0,
    averagePerformance: 0,
    sessionTypes: [],
    averageStressLevel: 0,
  };
};

export default mongoose.models.IntelligenceSession || mongoose.model<IIntelligenceSession>('IntelligenceSession', IntelligenceSessionSchema);