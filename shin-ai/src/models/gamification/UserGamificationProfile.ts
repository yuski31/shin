import mongoose, { Document, Schema } from 'mongoose';

export interface IUserGamificationProfile extends Document {
  userId: mongoose.Types.ObjectId;
  // Level and XP System
  level: number;
  experiencePoints: number;
  experiencePointsToNext: number;
  totalExperienceEarned: number;

  // Virtual Currency
  virtualCurrency: {
    primary: number; // Main currency (e.g., ShinCoins)
    secondary: number; // Bonus currency
    premium: number; // Premium currency
  };

  // Achievement Progress
  achievements: mongoose.Types.ObjectId[];
  achievementProgress: {
    achievementId: mongoose.Types.ObjectId;
    progress: number;
    maxProgress: number;
    completed: boolean;
    completedAt?: Date;
  }[];

  // Skill Trees and Progression
  skillTrees: {
    treeId: mongoose.Types.ObjectId;
    unlockedNodes: mongoose.Types.ObjectId[];
    currentNode?: mongoose.Types.ObjectId;
    progress: number;
  }[];

  // Social Features
  teams: mongoose.Types.ObjectId[];
  mentorships: {
    asMentor: mongoose.Types.ObjectId[];
    asMentee: mongoose.Types.ObjectId[];
  };

  // Statistics
  stats: {
    totalPlayTime: number; // in minutes
    sessionsCompleted: number;
    challengesWon: number;
    challengesLost: number;
    tournamentsParticipated: number;
    tournamentsWon: number;
    socialInteractions: number;
    contentShared: number;
  };

  // Seasonal/Prestige Data
  currentSeason: string;
  seasonPoints: number;
  prestigeLevel: number;
  prestigeResets: number;

  // Leaderboard Positions
  leaderboardPositions: {
    global: number;
    weekly: number;
    monthly: number;
    seasonal: number;
    category: { [category: string]: number };
  };

  createdAt: Date;
  updatedAt: Date;
}

const UserGamificationProfileSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  // Level and XP System
  level: {
    type: Number,
    default: 1,
    min: 1,
  },
  experiencePoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  experiencePointsToNext: {
    type: Number,
    default: 100,
    min: 0,
  },
  totalExperienceEarned: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Virtual Currency
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

  // Achievement Progress
  achievements: [{
    type: Schema.Types.ObjectId,
    ref: 'Achievement',
  }],
  achievementProgress: [{
    achievementId: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxProgress: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  }],

  // Skill Trees and Progression
  skillTrees: [{
    treeId: {
      type: Schema.Types.ObjectId,
      ref: 'SkillTree',
      required: true,
    },
    unlockedNodes: [{
      type: Schema.Types.ObjectId,
      ref: 'SkillNode',
    }],
    currentNode: {
      type: Schema.Types.ObjectId,
      ref: 'SkillNode',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
  }],

  // Social Features
  teams: [{
    type: Schema.Types.ObjectId,
    ref: 'Team',
  }],
  mentorships: {
    asMentor: [{
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    }],
    asMentee: [{
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
    }],
  },

  // Statistics
  stats: {
    totalPlayTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    sessionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    challengesWon: {
      type: Number,
      default: 0,
      min: 0,
    },
    challengesLost: {
      type: Number,
      default: 0,
      min: 0,
    },
    tournamentsParticipated: {
      type: Number,
      default: 0,
      min: 0,
    },
    tournamentsWon: {
      type: Number,
      default: 0,
      min: 0,
    },
    socialInteractions: {
      type: Number,
      default: 0,
      min: 0,
    },
    contentShared: {
      type: Number,
      default: 0,
      min: 0,
    },
  },

  // Seasonal/Prestige Data
  currentSeason: {
    type: String,
    default: 'season_1',
  },
  seasonPoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  prestigeLevel: {
    type: Number,
    default: 0,
    min: 0,
  },
  prestigeResets: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Leaderboard Positions
  leaderboardPositions: {
    global: {
      type: Number,
      default: 0,
    },
    weekly: {
      type: Number,
      default: 0,
    },
    monthly: {
      type: Number,
      default: 0,
    },
    seasonal: {
      type: Number,
      default: 0,
    },
    category: {
      type: Map,
      of: Number,
      default: {},
    },
  },
}, {
  timestamps: true,
});

// Indexes for performance
UserGamificationProfileSchema.index({ userId: 1 });
UserGamificationProfileSchema.index({ level: -1 });
UserGamificationProfileSchema.index({ 'virtualCurrency.primary': -1 });
UserGamificationProfileSchema.index({ 'stats.sessionsCompleted': -1 });
UserGamificationProfileSchema.index({ 'leaderboardPositions.global': 1 });
UserGamificationProfileSchema.index({ currentSeason: 1, seasonPoints: -1 });

export default mongoose.models.UserGamificationProfile ||
  mongoose.model<IUserGamificationProfile>('UserGamificationProfile', UserGamificationProfileSchema);