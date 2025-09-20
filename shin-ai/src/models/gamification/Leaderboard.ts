import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaderboard extends Document {
  name: string;
  description: string;
  type: 'global' | 'weekly' | 'monthly' | 'seasonal' | 'category' | 'tournament' | 'custom';

  // Leaderboard Configuration
  category?: string; // For category-specific leaderboards
  scope: 'individual' | 'team' | 'organization';
  metric: string; // e.g., 'experiencePoints', 'challengesWon', 'totalScore'
  timeframe: {
    startDate: Date;
    endDate: Date;
    resetSchedule: 'never' | 'daily' | 'weekly' | 'monthly' | 'seasonal';
  };

  // Scoring Configuration
  scoring: {
    primaryMetric: string;
    secondaryMetrics: string[];
    weightFormula: string;
    normalizationMethod: 'none' | 'z-score' | 'min-max' | 'percentile';
  };

  // Anti-Cheating Measures
  antiCheat: {
    suspiciousActivityThreshold: number;
    verificationRequired: boolean;
    manualReviewRequired: boolean;
    automatedDetection: {
      rapidProgression: boolean;
      unusualPatterns: boolean;
      botDetection: boolean;
      duplicateAccounts: boolean;
    };
    penalties: {
      warning: boolean;
      temporaryBan: boolean;
      permanentBan: boolean;
      scoreReset: boolean;
    };
  };

  // Entry Requirements
  requirements: {
    minLevel?: number;
    requiredAchievements?: mongoose.Types.ObjectId[];
    regionRestrictions?: string[];
    skillRequirements?: {
      skill: string;
      minLevel: number;
    }[];
  };

  // Prize Structure
  prizes: {
    placement: number;
    rewards: {
      experiencePoints: number;
      virtualCurrency: {
        primary: number;
        secondary: number;
        premium: number;
      };
      achievements: mongoose.Types.ObjectId[];
      unlockContent: mongoose.Types.ObjectId[];
      specialRewards: string[];
    };
  }[];

  // Current Rankings
  rankings: {
    rank: number;
    userId?: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    score: number;
    change: number; // Position change from last period
    trend: 'up' | 'down' | 'stable';
    metadata: Record<string, any>;
  }[];

  // Historical Data
  history: {
    period: string;
    rankings: mongoose.Types.ObjectId[]; // References to historical snapshots
    winner: mongoose.Types.ObjectId;
    totalParticipants: number;
  }[];

  // Statistics
  statistics: {
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    participationRate: number;
    volatility: number; // How much rankings change
  };

  // Real-time Features
  realTime: {
    isEnabled: boolean;
    updateFrequency: number; // seconds
    liveTracking: boolean;
    spectatorMode: boolean;
  };

  // Administrative
  isActive: boolean;
  isPublic: boolean;
  featured: boolean;
  createdBy: mongoose.Types.ObjectId;
  managedBy: mongoose.Types.ObjectId[];

  // Metadata
  tags: string[];
  season?: string;
  event?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LeaderboardSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  type: {
    type: String,
    enum: ['global', 'weekly', 'monthly', 'seasonal', 'category', 'tournament', 'custom'],
    required: true,
  },

  // Leaderboard Configuration
  category: {
    type: String,
    trim: true,
  },
  scope: {
    type: String,
    enum: ['individual', 'team', 'organization'],
    default: 'individual',
  },
  metric: {
    type: String,
    required: true,
    trim: true,
  },
  timeframe: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    resetSchedule: {
      type: String,
      enum: ['never', 'daily', 'weekly', 'monthly', 'seasonal'],
      default: 'weekly',
    },
  },

  // Scoring Configuration
  scoring: {
    primaryMetric: {
      type: String,
      required: true,
    },
    secondaryMetrics: [{
      type: String,
    }],
    weightFormula: {
      type: String,
      default: 'primary',
    },
    normalizationMethod: {
      type: String,
      enum: ['none', 'z-score', 'min-max', 'percentile'],
      default: 'none',
    },
  },

  // Anti-Cheating Measures
  antiCheat: {
    suspiciousActivityThreshold: {
      type: Number,
      default: 100,
      min: 1,
    },
    verificationRequired: {
      type: Boolean,
      default: false,
    },
    manualReviewRequired: {
      type: Boolean,
      default: false,
    },
    automatedDetection: {
      rapidProgression: {
        type: Boolean,
        default: true,
      },
      unusualPatterns: {
        type: Boolean,
        default: true,
      },
      botDetection: {
        type: Boolean,
        default: true,
      },
      duplicateAccounts: {
        type: Boolean,
        default: true,
      },
    },
    penalties: {
      warning: {
        type: Boolean,
        default: true,
      },
      temporaryBan: {
        type: Boolean,
        default: true,
      },
      permanentBan: {
        type: Boolean,
        default: false,
      },
      scoreReset: {
        type: Boolean,
        default: false,
      },
    },
  },

  // Entry Requirements
  requirements: {
    minLevel: {
      type: Number,
      min: 1,
    },
    requiredAchievements: [{
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    }],
    regionRestrictions: [{
      type: String,
    }],
    skillRequirements: [{
      skill: {
        type: String,
        required: true,
      },
      minLevel: {
        type: Number,
        required: true,
        min: 1,
      },
    }],
  },

  // Prize Structure
  prizes: [{
    placement: {
      type: Number,
      required: true,
      min: 1,
    },
    rewards: {
      experiencePoints: {
        type: Number,
        default: 0,
        min: 0,
      },
      virtualCurrency: {
        primary: {
          type: Number,
          default: 0,
          min: 0,
        },
        secondary: {
          type: Number,
          default: 0,
          min: 0,
        },
        premium: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      achievements: [{
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
      }],
      unlockContent: [{
        type: Schema.Types.ObjectId,
        ref: 'Content',
      }],
      specialRewards: [{
        type: String,
      }],
    },
  }],

  // Current Rankings
  rankings: [{
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    change: {
      type: Number,
      default: 0,
    },
    trend: {
      type: String,
      enum: ['up', 'down', 'stable'],
      default: 'stable',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  }],

  // Historical Data
  history: [{
    period: {
      type: String,
      required: true,
    },
    rankings: [{
      type: Schema.Types.ObjectId,
      ref: 'LeaderboardSnapshot',
    }],
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    },
    totalParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
  }],

  // Statistics
  statistics: {
    totalParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    highestScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowestScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    participationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    volatility: {
      type: Number,
      default: 0,
      min: 0,
    },
  },

  // Real-time Features
  realTime: {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    updateFrequency: {
      type: Number,
      default: 30,
      min: 5,
    },
    liveTracking: {
      type: Boolean,
      default: false,
    },
    spectatorMode: {
      type: Boolean,
      default: false,
    },
  },

  // Administrative
  isActive: {
    type: Boolean,
    default: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  managedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Metadata
  tags: [{
    type: String,
    trim: true,
  }],
  season: {
    type: String,
  },
  event: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for performance
LeaderboardSchema.index({ type: 1, isActive: 1 });
LeaderboardSchema.index({ category: 1 });
LeaderboardSchema.index({ scope: 1 });
LeaderboardSchema.index({ 'timeframe.startDate': 1 });
LeaderboardSchema.index({ 'timeframe.endDate': 1 });
LeaderboardSchema.index({ featured: 1 });
LeaderboardSchema.index({ 'statistics.totalParticipants': -1 });

export default mongoose.models.Leaderboard ||
  mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema);