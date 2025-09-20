import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  name: string;
  description: string;
  icon: string;
  category: 'gameplay' | 'social' | 'progression' | 'special' | 'seasonal';
  type: 'progress' | 'completion' | 'social' | 'time_based' | 'score_based';

  // Achievement Requirements
  requirements: {
    type: string;
    target: number;
    metric: string; // e.g., 'sessions_completed', 'challenges_won', 'time_played'
    comparison: 'gte' | 'lte' | 'eq' | 'between';
  }[];

  // Rewards
  rewards: {
    experiencePoints: number;
    virtualCurrency: {
      primary: number;
      secondary: number;
      premium: number;
    };
    unlockContent?: mongoose.Types.ObjectId[];
    specialPrivileges?: string[];
  };

  // Rarity and Visibility
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isHidden: boolean;
  hiddenDescription?: string;

  // Progression
  maxProgress: number;
  currentProgress: number; // For global tracking

  // Metadata
  season?: string;
  event?: string;
  isActive: boolean;
  isRepeatable: boolean;
  cooldownHours?: number; // For repeatable achievements

  // Statistics
  timesEarned: number;
  uniqueEarners: number;

  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema: Schema = new Schema({
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
  icon: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['gameplay', 'social', 'progression', 'special', 'seasonal'],
    required: true,
  },
  type: {
    type: String,
    enum: ['progress', 'completion', 'social', 'time_based', 'score_based'],
    required: true,
  },

  // Achievement Requirements
  requirements: [{
    type: {
      type: String,
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    metric: {
      type: String,
      required: true,
    },
    comparison: {
      type: String,
      enum: ['gte', 'lte', 'eq', 'between'],
      default: 'gte',
    },
  }],

  // Rewards
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
    unlockContent: [{
      type: Schema.Types.ObjectId,
      ref: 'Content',
    }],
    specialPrivileges: [{
      type: String,
    }],
  },

  // Rarity and Visibility
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  hiddenDescription: {
    type: String,
    trim: true,
  },

  // Progression
  maxProgress: {
    type: Number,
    default: 1,
    min: 1,
  },
  currentProgress: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Metadata
  season: {
    type: String,
  },
  event: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isRepeatable: {
    type: Boolean,
    default: false,
  },
  cooldownHours: {
    type: Number,
    min: 0,
  },

  // Statistics
  timesEarned: {
    type: Number,
    default: 0,
    min: 0,
  },
  uniqueEarners: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes for performance
AchievementSchema.index({ category: 1 });
AchievementSchema.index({ type: 1 });
AchievementSchema.index({ rarity: 1 });
AchievementSchema.index({ isActive: 1 });
AchievementSchema.index({ season: 1 });
AchievementSchema.index({ timesEarned: -1 });

export default mongoose.models.Achievement ||
  mongoose.model<IAchievement>('Achievement', AchievementSchema);