import mongoose, { Document, Schema } from 'mongoose';

export interface ITournamentMatch extends Document {
  tournamentId: mongoose.Types.ObjectId;
  roundNumber: number;
  matchNumber: number;

  // Participants
  participants: {
    userId?: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    seed?: number;
    score: number;
    status: 'pending' | 'active' | 'completed' | 'forfeited' | 'disqualified';
  }[];

  // Match Configuration
  type: 'single' | 'best_of_three' | 'best_of_five' | 'custom';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

  // Scheduling
  schedule: {
    scheduledTime: Date;
    actualStartTime?: Date;
    actualEndTime?: Date;
    duration: number; // in minutes
    timezone: string;
  };

  // Scoring and Results
  scoring: {
    format: 'points' | 'rounds' | 'time' | 'custom';
    maxScore: number;
    timeLimit?: number;
    rounds: {
      roundNumber: number;
      participant1Score?: number;
      participant2Score?: number;
      winner?: mongoose.Types.ObjectId;
      duration: number;
    }[];
  };

  results: {
    winner?: mongoose.Types.ObjectId;
    loser?: mongoose.Types.ObjectId;
    finalScore: {
      participant1: number;
      participant2: number;
    };
    statistics: {
      totalActions: number;
      averageResponseTime: number;
      peakPerformance: number;
    };
  };

  // Anti-Cheating and Monitoring
  monitoring: {
    spectatorCount: number;
    suspiciousActivities: {
      timestamp: Date;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      resolved: boolean;
    }[];
    verificationStatus: 'pending' | 'verified' | 'flagged' | 'cleared';
    replayAvailable: boolean;
    automatedDetectionResults: Record<string, any>;
  };

  // Live Features
  live: {
    isStreaming: boolean;
    streamUrl?: string;
    viewerCount: number;
    chatMessages: number;
    highlights: {
      timestamp: Date;
      type: string;
      description: string;
    }[];
  };

  // Rewards and Progression
  rewards: {
    experiencePoints: number;
    virtualCurrency: {
      primary: number;
      secondary: number;
      premium: number;
    };
    achievements: mongoose.Types.ObjectId[];
  };

  // Metadata
  venue?: string; // Physical or virtual venue
  referee?: mongoose.Types.ObjectId;
  commentators?: mongoose.Types.ObjectId[];
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const TournamentMatchSchema: Schema = new Schema({
  tournamentId: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
  },
  roundNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  matchNumber: {
    type: Number,
    required: true,
    min: 1,
  },

  // Participants
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    seed: {
      type: Number,
      min: 1,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'forfeited', 'disqualified'],
      default: 'pending',
    },
  }],

  // Match Configuration
  type: {
    type: String,
    enum: ['single', 'best_of_three', 'best_of_five', 'custom'],
    default: 'single',
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
  },

  // Scheduling
  schedule: {
    scheduledTime: {
      type: Date,
      required: true,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 60,
      min: 1,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },

  // Scoring and Results
  scoring: {
    format: {
      type: String,
      enum: ['points', 'rounds', 'time', 'custom'],
      default: 'points',
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
    rounds: [{
      roundNumber: {
        type: Number,
        required: true,
        min: 1,
      },
      participant1Score: {
        type: Number,
        min: 0,
      },
      participant2Score: {
        type: Number,
        min: 0,
      },
      winner: {
        type: Schema.Types.ObjectId,
        ref: 'UserGamificationProfile',
      },
      duration: {
        type: Number,
        default: 0,
        min: 0,
      },
    }],
  },

  results: {
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    },
    loser: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    },
    finalScore: {
      participant1: {
        type: Number,
        default: 0,
        min: 0,
      },
      participant2: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    statistics: {
      totalActions: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
        min: 0,
      },
      peakPerformance: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },

  // Anti-Cheating and Monitoring
  monitoring: {
    spectatorCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    suspiciousActivities: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
      type: {
        type: String,
        required: true,
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
      },
      description: {
        type: String,
        required: true,
      },
      resolved: {
        type: Boolean,
        default: false,
      },
    }],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'flagged', 'cleared'],
      default: 'pending',
    },
    replayAvailable: {
      type: Boolean,
      default: false,
    },
    automatedDetectionResults: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },

  // Live Features
  live: {
    isStreaming: {
      type: Boolean,
      default: false,
    },
    streamUrl: {
      type: String,
    },
    viewerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    chatMessages: {
      type: Number,
      default: 0,
      min: 0,
    },
    highlights: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
      type: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    }],
  },

  // Rewards and Progression
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
  },

  // Metadata
  venue: {
    type: String,
  },
  referee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  commentators: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Indexes for performance
TournamentMatchSchema.index({ tournamentId: 1, roundNumber: 1 });
TournamentMatchSchema.index({ status: 1 });
TournamentMatchSchema.index({ 'schedule.scheduledTime': 1 });
TournamentMatchSchema.index({ 'participants.userId': 1 });
TournamentMatchSchema.index({ 'participants.teamId': 1 });

export default mongoose.models.TournamentMatch ||
  mongoose.model<ITournamentMatch>('TournamentMatch', TournamentMatchSchema);