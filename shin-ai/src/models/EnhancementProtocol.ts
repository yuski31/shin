import mongoose, { Document, Schema } from 'mongoose';

export interface IEnhancementProtocol extends Document {
  name: string;
  description: string;
  category: 'iq-boost' | 'math-intuition' | 'creative-enhancement' | 'pattern-recognition' | 'synesthetic-learning' | 'memory-optimization';
  version: string;
  isActive: boolean;
  isPublic: boolean; // if true, available to all users; if false, custom protocol
  createdBy: mongoose.Types.ObjectId; // User who created this protocol
  organization: mongoose.Types.ObjectId;
  requirements: {
    minUserLevel: number; // minimum user level to use this protocol
    prerequisites: string[]; // other protocols that must be completed first
    restrictions: string[]; // user conditions that prevent using this protocol
    minAge?: number;
    maxAge?: number;
  };
  configuration: {
    defaultSettings: {
      intensity: number;
      frequency: number;
      duration: number;
      focusAreas: string[];
    };
    phases: Array<{
      name: string;
      description: string;
      duration: number; // minutes
      intensity: number;
      frequency: number;
      targets: string[]; // what cognitive areas this phase targets
    }>;
    safetyProtocols: {
      maxIntensity: number;
      maxDuration: number;
      minRestPeriod: number;
      emergencyThresholds: {
        stressLevel: number;
        heartRate?: number;
        cognitiveLoad: number;
      };
    };
  };
  effectiveness: {
    averageImprovement: number; // percentage
    successRate: number; // percentage of sessions that complete successfully
    userRating: number; // 1-5 stars
    totalSessions: number;
    totalUsers: number;
  };
  analytics: {
    bestPerformingDemographics: {
      ageRange?: string;
      experienceLevel?: string;
      timeOfDay?: string;
    };
    optimalConditions: {
      environment?: string;
      timeOfDay?: string;
      caffeineIntake?: string;
      sleepHours?: string;
    };
    commonSideEffects: string[];
    dropoutReasons: Array<{
      reason: string;
      frequency: number;
    }>;
  };
  metadata?: {
    researchBasis?: string;
    citations?: string[];
    lastUpdatedBy?: mongoose.Types.ObjectId;
    tags?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  createdAt: Date;
  updatedAt: Date;
}

const EnhancementProtocolSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['iq-boost', 'math-intuition', 'creative-enhancement', 'pattern-recognition', 'synesthetic-learning', 'memory-optimization'],
    required: true,
  },
  version: {
    type: String,
    required: true,
    default: '1.0.0',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  requirements: {
    minUserLevel: {
      type: Number,
      min: 1,
      max: 100,
      default: 1,
    },
    prerequisites: [{
      type: String,
      trim: true,
    }],
    restrictions: [{
      type: String,
      trim: true,
    }],
    minAge: {
      type: Number,
      min: 13,
      max: 120,
    },
    maxAge: {
      type: Number,
      min: 13,
      max: 120,
    },
  },
  configuration: {
    defaultSettings: {
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
        default: 10,
      },
      duration: {
        type: Number,
        min: 5,
        max: 120,
        default: 30,
      },
      focusAreas: [{
        type: String,
        trim: true,
      }],
    },
    phases: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
      duration: {
        type: Number,
        required: true,
        min: 1,
        max: 60,
      },
      intensity: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
      },
      frequency: {
        type: Number,
        required: true,
        min: 1,
        max: 40,
      },
      targets: [{
        type: String,
        required: true,
        trim: true,
      }],
    }],
    safetyProtocols: {
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
        default: 60,
      },
      minRestPeriod: {
        type: Number,
        min: 1,
        max: 24,
        default: 4,
      },
      emergencyThresholds: {
        stressLevel: {
          type: Number,
          min: 1,
          max: 100,
          default: 80,
        },
        heartRate: {
          type: Number,
          min: 50,
          max: 200,
        },
        cognitiveLoad: {
          type: Number,
          min: 1,
          max: 100,
          default: 90,
        },
      },
    },
  },
  effectiveness: {
    averageImprovement: {
      type: Number,
      min: -100,
      max: 200,
      default: 0,
    },
    successRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    userRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0,
    },
    totalSessions: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalUsers: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  analytics: {
    bestPerformingDemographics: {
      ageRange: String,
      experienceLevel: String,
      timeOfDay: String,
    },
    optimalConditions: {
      environment: String,
      timeOfDay: String,
      caffeineIntake: String,
      sleepHours: String,
    },
    commonSideEffects: [{
      type: String,
      trim: true,
    }],
    dropoutReasons: [{
      reason: {
        type: String,
        required: true,
        trim: true,
      },
      frequency: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    }],
  },
  metadata: {
    researchBasis: String,
    citations: [{
      type: String,
      trim: true,
    }],
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
EnhancementProtocolSchema.index({ category: 1 });
EnhancementProtocolSchema.index({ isActive: 1, isPublic: 1 });
EnhancementProtocolSchema.index({ createdBy: 1 });
EnhancementProtocolSchema.index({ organization: 1 });
EnhancementProtocolSchema.index({ 'effectiveness.userRating': -1 });
EnhancementProtocolSchema.index({ name: 'text', description: 'text' }); // Text search
EnhancementProtocolSchema.index({ createdAt: -1 });

// Method to check if user can access this protocol
EnhancementProtocolSchema.methods.canUserAccess = function(user: any): boolean {
  if (!this.isActive) return false;
  if (this.isPublic) return true;

  // Check user level
  if (user.level < this.requirements.minUserLevel) return false;

  // Check age restrictions
  if (this.requirements.minAge && user.age < this.requirements.minAge) return false;
  if (this.requirements.maxAge && user.age > this.requirements.maxAge) return false;

  // Check prerequisites
  for (const prerequisite of this.requirements.prerequisites) {
    if (!user.completedProtocols.includes(prerequisite)) return false;
  }

  // Check restrictions
  for (const restriction of this.requirements.restrictions) {
    if (user.conditions.includes(restriction)) return false;
  }

  return true;
};

// Static method to get popular protocols
EnhancementProtocolSchema.statics.getPopularProtocols = async function(limit: number = 10) {
  const protocols = await this.find({ isActive: true })
    .sort({ 'effectiveness.userRating': -1, 'effectiveness.totalSessions': -1 })
    .limit(limit)
    .populate('createdBy', 'name')
    .exec();

  return protocols;
};

// Static method to get protocols by category
EnhancementProtocolSchema.statics.getProtocolsByCategory = async function(category: string) {
  const protocols = await this.find({
    category: category,
    isActive: true
  })
    .sort({ 'effectiveness.userRating': -1 })
    .populate('createdBy', 'name')
    .exec();

  return protocols;
};

// Static method to update protocol effectiveness metrics
EnhancementProtocolSchema.statics.updateEffectiveness = async function(protocolId: mongoose.Types.ObjectId) {
  const SessionModel = mongoose.model('IntelligenceSession');

  const stats = await SessionModel.aggregate([
    { $match: { protocolId: protocolId } },
    {
      $group: {
        _id: null,
        averageImprovement: { $avg: '$results.improvementScore' },
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageRating: { $avg: '$feedback.rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    const effectiveness = {
      averageImprovement: stats[0].averageImprovement || 0,
      successRate: (stats[0].completedSessions / stats[0].totalSessions) * 100,
      totalSessions: stats[0].totalSessions,
      userRating: stats[0].averageRating || 0,
      totalUsers: await SessionModel.distinct('userId', { protocolId: protocolId }).then(count => count)
    };

    await this.findByIdAndUpdate(protocolId, {
      effectiveness: effectiveness
    });
  }
};

export default mongoose.models.EnhancementProtocol || mongoose.model<IEnhancementProtocol>('EnhancementProtocol', EnhancementProtocolSchema);