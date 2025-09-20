import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description: string;
  tag: string; // Short identifier (e.g., "TEAM1")

  // Team Configuration
  type: 'competitive' | 'casual' | 'guild' | 'study_group' | 'project';
  maxMembers: number;
  minMembers: number;
  isPublic: boolean;
  requiresApproval: boolean;

  // Leadership and Hierarchy
  founder: mongoose.Types.ObjectId;
  leaders: mongoose.Types.ObjectId[];
  members: {
    userId: mongoose.Types.ObjectId;
    role: 'member' | 'moderator' | 'admin' | 'founder';
    joinedAt: Date;
    permissions: string[];
  }[];

  // Team Statistics
  stats: {
    totalMembers: number;
    activeMembers: number;
    challengesCompleted: number;
    tournamentsWon: number;
    totalScore: number;
    averageLevel: number;
  };

  // Team Resources
  resources: {
    sharedStorage: number; // in GB
    virtualCurrency: {
      primary: number;
      secondary: number;
      premium: number;
    };
    unlockedContent: mongoose.Types.ObjectId[];
  };

  // Communication Settings
  communication: {
    discordServer?: string;
    slackChannel?: string;
    internalChat: boolean;
    announcementChannel: boolean;
  };

  // Activity and Engagement
  activity: {
    lastActivity: Date;
    weeklyActivityScore: number;
    monthlyActivityScore: number;
    engagementRate: number; // percentage
  };

  // Matching Algorithm Data
  preferences: {
    skillFocus: string[];
    activityLevel: 'low' | 'medium' | 'high' | 'competitive';
    timeZone: string;
    preferredPlayTimes: string[];
    competitiveLevel: 'casual' | 'competitive' | 'professional';
  };

  // Social Features
  social: {
    isRecruiting: boolean;
    recruitmentMessage?: string;
    socialLinks: {
      website?: string;
      twitter?: string;
      discord?: string;
      youtube?: string;
    };
    showcase: {
      achievements: mongoose.Types.ObjectId[];
      highlights: string[];
      featuredMembers: mongoose.Types.ObjectId[];
    };
  };

  // Team Progression
  level: number;
  experiencePoints: number;
  reputationScore: number;

  // Seasonal Data
  currentSeason: string;
  seasonStats: {
    season: string;
    points: number;
    rank: number;
    achievements: mongoose.Types.ObjectId[];
  }[];

  // Metadata
  tags: string[];
  region: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  tag: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 10,
    match: /^[A-Z0-9]+$/,
  },

  // Team Configuration
  type: {
    type: String,
    enum: ['competitive', 'casual', 'guild', 'study_group', 'project'],
    default: 'casual',
  },
  maxMembers: {
    type: Number,
    default: 50,
    min: 1,
    max: 1000,
  },
  minMembers: {
    type: Number,
    default: 1,
    min: 1,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  requiresApproval: {
    type: Boolean,
    default: false,
  },

  // Leadership and Hierarchy
  founder: {
    type: Schema.Types.ObjectId,
    ref: 'UserGamificationProfile',
    required: true,
  },
  leaders: [{
    type: Schema.Types.ObjectId,
    ref: 'UserGamificationProfile',
  }],
  members: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'UserGamificationProfile',
      required: true,
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin', 'founder'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    permissions: [{
      type: String,
    }],
  }],

  // Team Statistics
  stats: {
    totalMembers: {
      type: Number,
      default: 1,
      min: 0,
    },
    activeMembers: {
      type: Number,
      default: 1,
      min: 0,
    },
    challengesCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    tournamentsWon: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageLevel: {
      type: Number,
      default: 1,
      min: 1,
    },
  },

  // Team Resources
  resources: {
    sharedStorage: {
      type: Number,
      default: 1,
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
    unlockedContent: [{
      type: Schema.Types.ObjectId,
      ref: 'Content',
    }],
  },

  // Communication Settings
  communication: {
    discordServer: {
      type: String,
    },
    slackChannel: {
      type: String,
    },
    internalChat: {
      type: Boolean,
      default: true,
    },
    announcementChannel: {
      type: Boolean,
      default: true,
    },
  },

  // Activity and Engagement
  activity: {
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    weeklyActivityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyActivityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },

  // Matching Algorithm Data
  preferences: {
    skillFocus: [{
      type: String,
    }],
    activityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'competitive'],
      default: 'medium',
    },
    timeZone: {
      type: String,
      default: 'UTC',
    },
    preferredPlayTimes: [{
      type: String,
    }],
    competitiveLevel: {
      type: String,
      enum: ['casual', 'competitive', 'professional'],
      default: 'casual',
    },
  },

  // Social Features
  social: {
    isRecruiting: {
      type: Boolean,
      default: false,
    },
    recruitmentMessage: {
      type: String,
      maxlength: 300,
    },
    socialLinks: {
      website: {
        type: String,
      },
      twitter: {
        type: String,
      },
      discord: {
        type: String,
      },
      youtube: {
        type: String,
      },
    },
    showcase: {
      achievements: [{
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
      }],
      highlights: [{
        type: String,
      }],
      featuredMembers: [{
        type: Schema.Types.ObjectId,
        ref: 'UserGamificationProfile',
      }],
    },
  },

  // Team Progression
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
  reputationScore: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Seasonal Data
  currentSeason: {
    type: String,
    default: 'season_1',
  },
  seasonStats: [{
    season: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    achievements: [{
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    }],
  }],

  // Metadata
  tags: [{
    type: String,
    trim: true,
  }],
  region: {
    type: String,
    default: 'global',
  },
  language: {
    type: String,
    default: 'en',
  },
}, {
  timestamps: true,
});

// Indexes for performance
TeamSchema.index({ tag: 1 }, { unique: true });
TeamSchema.index({ type: 1 });
TeamSchema.index({ isPublic: 1 });
TeamSchema.index({ 'social.isRecruiting': 1 });
TeamSchema.index({ 'stats.totalMembers': -1 });
TeamSchema.index({ level: -1 });
TeamSchema.index({ reputationScore: -1 });
TeamSchema.index({ currentSeason: 1 });

export default mongoose.models.Team ||
  mongoose.model<ITeam>('Team', TeamSchema);