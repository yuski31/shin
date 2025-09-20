import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'seasonal' | 'custom';
  category: 'learning' | 'social' | 'competitive' | 'creative' | 'exploration';

  // Challenge Configuration
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number; // in minutes
  maxParticipants?: number;
  minParticipants?: number;

  // Dynamic Generation Rules
  generationRules: {
    type: string;
    parameters: Record<string, any>;
    constraints: Record<string, any>;
  }[];

  // Requirements and Rewards
  requirements: {
    prerequisites?: mongoose.Types.ObjectId[]; // Achievement or level requirements
    skillRequirements?: {
      skill: string;
      minLevel: number;
    }[];
    entryFee?: {
      currency: 'primary' | 'secondary' | 'premium';
      amount: number;
    };
  };

  rewards: {
    experiencePoints: number;
    virtualCurrency: {
      primary: number;
      secondary: number;
      premium: number;
    };
    achievements: mongoose.Types.ObjectId[];
    unlockContent: mongoose.Types.ObjectId[];
    multipliers: {
      experience: number;
      currency: number;
    };
  };

  // Participation and Progress
  participants: mongoose.Types.ObjectId[];
  maxAttempts: number;
  attemptsPerUser: number;

  // Scoring System
  scoring: {
    type: 'points' | 'time' | 'accuracy' | 'completion' | 'custom';
    formula: string;
    maxScore: number;
    timeLimit?: number; // in minutes
  };

  // Scheduling
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
    isRecurring: boolean;
    recurrencePattern?: string;
  };

  // Anti-Cheating Measures
  antiCheat: {
    maxActionsPerMinute: number;
    suspiciousPatterns: string[];
    verificationRequired: boolean;
    monitoringLevel: 'low' | 'medium' | 'high';
  };

  // Metadata
  tags: string[];
  isActive: boolean;
  isVisible: boolean;
  featured: boolean;

  // Statistics
  totalParticipants: number;
  completionRate: number;
  averageScore: number;
  averageDuration: number;

  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special', 'seasonal', 'custom'],
    required: true,
  },
  category: {
    type: String,
    enum: ['learning', 'social', 'competitive', 'creative', 'exploration'],
    required: true,
  },

  // Challenge Configuration
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate',
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1,
  },
  maxParticipants: {
    type: Number,
    min: 1,
  },
  minParticipants: {
    type: Number,
    min: 1,
  },

  // Dynamic Generation Rules
  generationRules: [{
    type: {
      type: String,
      required: true,
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    constraints: {
      type: Schema.Types.Mixed,
      default: {},
    },
  }],

  // Requirements and Rewards
  requirements: {
    prerequisites: [{
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
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
    entryFee: {
      currency: {
        type: String,
        enum: ['primary', 'secondary', 'premium'],
      },
      amount: {
        type: Number,
        min: 0,
      },
    },
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
    multipliers: {
      experience: {
        type: Number,
        default: 1,
        min: 0.1,
      },
      currency: {
        type: Number,
        default: 1,
        min: 0.1,
      },
    },
  },

  // Participation and Progress
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'UserGamificationProfile',
  }],
  maxAttempts: {
    type: Number,
    default: 1,
    min: 1,
  },
  attemptsPerUser: {
    type: Number,
    default: 1,
    min: 1,
  },

  // Scoring System
  scoring: {
    type: {
      type: String,
      enum: ['points', 'time', 'accuracy', 'completion', 'custom'],
      default: 'completion',
    },
    formula: {
      type: String,
      default: 'base_score',
    },
    maxScore: {
      type: Number,
      default: 100,
      min: 1,
    },
    timeLimit: {
      type: Number,
      min: 1,
    },
  },

  // Scheduling
  schedule: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: String,
    },
  },

  // Anti-Cheating Measures
  antiCheat: {
    maxActionsPerMinute: {
      type: Number,
      default: 60,
      min: 1,
    },
    suspiciousPatterns: [{
      type: String,
    }],
    verificationRequired: {
      type: Boolean,
      default: false,
    },
    monitoringLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },

  // Metadata
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },

  // Statistics
  totalParticipants: {
    type: Number,
    default: 0,
    min: 0,
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageDuration: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes for performance
ChallengeSchema.index({ type: 1, isActive: 1 });
ChallengeSchema.index({ category: 1 });
ChallengeSchema.index({ difficulty: 1 });
ChallengeSchema.index({ 'schedule.startDate': 1 });
ChallengeSchema.index({ 'schedule.endDate': 1 });
ChallengeSchema.index({ featured: 1 });
ChallengeSchema.index({ totalParticipants: -1 });

export default mongoose.models.Challenge ||
  mongoose.model<IChallenge>('Challenge', ChallengeSchema);