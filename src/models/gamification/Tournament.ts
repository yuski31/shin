import mongoose, { Document, Schema } from 'mongoose';

export interface ITournament extends Document {
  name: string;
  description: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'ladder';
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';

  // Tournament Configuration
  category: 'competitive' | 'casual' | 'ranked' | 'special' | 'seasonal';
  maxParticipants: number;
  minParticipants: number;
  teamSize: number; // 1 for individual, >1 for team tournaments

  // Bracket System
  bracket: {
    rounds: {
      roundNumber: number;
      matches: mongoose.Types.ObjectId[]; // References to TournamentMatch
      status: 'pending' | 'active' | 'completed';
    }[];
    currentRound: number;
    totalRounds: number;
  };

  // Registration and Participation
  registration: {
    startDate: Date;
    endDate: Date;
    entryFee?: {
      currency: 'primary' | 'secondary' | 'premium';
      amount: number;
    };
    requirements: {
      minLevel?: number;
      requiredAchievements?: mongoose.Types.ObjectId[];
      skillRequirements?: {
        skill: string;
        minLevel: number;
      }[];
    };
  };

  participants: {
    userId: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    seed?: number;
    status: 'registered' | 'confirmed' | 'eliminated' | 'disqualified';
    joinedAt: Date;
  }[];

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

  // Scheduling
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
    matchSchedule: {
      roundNumber: number;
      scheduledTime: Date;
      duration: number; // in minutes
    }[];
  };

  // Rules and Settings
  rules: {
    timeLimit?: number; // per match in minutes
    scoringSystem: string;
    tiebreakerRules: string[];
    disqualificationRules: string[];
    spectatorMode: boolean;
    streamingAllowed: boolean;
  };

  // Anti-Cheating Measures
  antiCheat: {
    monitoringLevel: 'low' | 'medium' | 'high' | 'maximum';
    verificationRequired: boolean;
    replayAnalysis: boolean;
    spectatorVerification: boolean;
    automatedDetection: boolean;
  };

  // Statistics and Results
  statistics: {
    totalMatches: number;
    completedMatches: number;
    averageMatchDuration: number;
    totalSpectators: number;
    peakConcurrentViewers: number;
  };

  results: {
    winner: mongoose.Types.ObjectId; // User or Team ID
    runnerUp?: mongoose.Types.ObjectId;
    finalStandings: {
      position: number;
      participantId: mongoose.Types.ObjectId;
      score: number;
    }[];
  };

  // Metadata
  tags: string[];
  isPublic: boolean;
  featured: boolean;
  season?: string;
  event?: string;

  // Administrative
  createdBy: mongoose.Types.ObjectId;
  managedBy: mongoose.Types.ObjectId[];
  sponsors?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema: Schema = new Schema({
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
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'ladder'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'registration', 'active', 'completed', 'cancelled'],
    default: 'draft',
  },

  // Tournament Configuration
  category: {
    type: String,
    enum: ['competitive', 'casual', 'ranked', 'special', 'seasonal'],
    default: 'casual',
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
  },
  minParticipants: {
    type: Number,
    default: 2,
    min: 2,
  },
  teamSize: {
    type: Number,
    default: 1,
    min: 1,
  },

  // Bracket System
  bracket: {
    rounds: [{
      roundNumber: {
        type: Number,
        required: true,
      },
      matches: [{
        type: Schema.Types.ObjectId,
        ref: 'TournamentMatch',
      }],
      status: {
        type: String,
        enum: ['pending', 'active', 'completed'],
        default: 'pending',
      },
    }],
    currentRound: {
      type: Number,
      default: 1,
    },
    totalRounds: {
      type: Number,
      required: true,
    },
  },

  // Registration and Participation
  registration: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
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
    requirements: {
      minLevel: {
        type: Number,
        min: 1,
      },
      requiredAchievements: [{
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
    },
  },

  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    seed: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'eliminated', 'disqualified'],
      default: 'registered',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],

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
    matchSchedule: [{
      roundNumber: {
        type: Number,
        required: true,
      },
      scheduledTime: {
        type: Date,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
        min: 1,
      },
    }],
  },

  // Rules and Settings
  rules: {
    timeLimit: {
      type: Number,
      min: 1,
    },
    scoringSystem: {
      type: String,
      default: 'standard',
    },
    tiebreakerRules: [{
      type: String,
    }],
    disqualificationRules: [{
      type: String,
    }],
    spectatorMode: {
      type: Boolean,
      default: true,
    },
    streamingAllowed: {
      type: Boolean,
      default: true,
    },
  },

  // Anti-Cheating Measures
  antiCheat: {
    monitoringLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'maximum'],
      default: 'medium',
    },
    verificationRequired: {
      type: Boolean,
      default: false,
    },
    replayAnalysis: {
      type: Boolean,
      default: false,
    },
    spectatorVerification: {
      type: Boolean,
      default: false,
    },
    automatedDetection: {
      type: Boolean,
      default: true,
    },
  },

  // Statistics and Results
  statistics: {
    totalMatches: {
      type: Number,
      default: 0,
    },
    completedMatches: {
      type: Number,
      default: 0,
    },
    averageMatchDuration: {
      type: Number,
      default: 0,
    },
    totalSpectators: {
      type: Number,
      default: 0,
    },
    peakConcurrentViewers: {
      type: Number,
      default: 0,
    },
  },

  results: {
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    },
    runnerUp: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    },
    finalStandings: [{
      position: {
        type: Number,
        required: true,
      },
      participantId: {
        type: Schema.Types.ObjectId,
        ref: 'UserGamificationProfile',
        required: true,
      },
      score: {
        type: Number,
        default: 0,
      },
    }],
  },

  // Metadata
  tags: [{
    type: String,
    trim: true,
  }],
  isPublic: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  season: {
    type: String,
  },
  event: {
    type: String,
  },

  // Administrative
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  managedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  sponsors: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Indexes for performance
TournamentSchema.index({ status: 1 });
TournamentSchema.index({ category: 1 });
TournamentSchema.index({ 'registration.startDate': 1 });
TournamentSchema.index({ 'registration.endDate': 1 });
TournamentSchema.index({ 'schedule.startDate': 1 });
TournamentSchema.index({ featured: 1 });
TournamentSchema.index({ createdBy: 1 });

export default mongoose.models.Tournament ||
  mongoose.model<ITournament>('Tournament', TournamentSchema);