import mongoose, { Document, Schema } from 'mongoose';

export interface ISkillNode extends Document {
  name: string;
  description: string;
  icon: string;
  category: 'cognitive' | 'technical' | 'creative' | 'social' | 'special';

  // Node Requirements
  requirements: {
    level?: number;
    prerequisites: mongoose.Types.ObjectId[]; // Other skill nodes
    requiredAchievements?: mongoose.Types.ObjectId[];
    cost: {
      experiencePoints: number;
      virtualCurrency: {
        primary: number;
        secondary: number;
        premium: number;
      };
    };
  };

  // Node Effects
  effects: {
    statModifiers: {
      experienceMultiplier?: number;
      currencyMultiplier?: number;
      challengeSuccessRate?: number;
      learningSpeed?: number;
      socialInteractionBonus?: number;
    };
    unlockContent: mongoose.Types.ObjectId[];
    specialAbilities: string[];
    passiveEffects: string[];
  };

  // Node Progression
  maxLevel: number;
  currentLevel: number;
  experienceToNext: number;

  // Visual Properties
  position: {
    x: number;
    y: number;
  };
  connections: mongoose.Types.ObjectId[]; // Connected skill nodes

  // Metadata
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isHidden: boolean;
  isUltimate: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISkillTree extends Document {
  name: string;
  description: string;
  theme: string;
  category: 'intelligence' | 'creativity' | 'productivity' | 'social' | 'special';

  // Tree Structure
  rootNodes: mongoose.Types.ObjectId[];
  allNodes: mongoose.Types.ObjectId[];

  // Tree Requirements
  requirements: {
    minUserLevel?: number;
    requiredAchievements?: mongoose.Types.ObjectId[];
    specialRequirements?: string[];
  };

  // Tree Progression
  totalNodes: number;
  unlockedNodes: number;
  completionPercentage: number;

  // Rewards for completion
  completionRewards: {
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

  // Metadata
  isActive: boolean;
  isPremium: boolean;
  season?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  // Statistics
  totalUsers: number;
  averageCompletionTime: number; // in hours
  popularityScore: number;

  createdAt: Date;
  updatedAt: Date;
}

const SkillNodeSchema: Schema = new Schema({
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
    maxlength: 300,
  },
  icon: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['cognitive', 'technical', 'creative', 'social', 'special'],
    required: true,
  },

  // Node Requirements
  requirements: {
    level: {
      type: Number,
      min: 1,
    },
    prerequisites: [{
      type: Schema.Types.ObjectId,
      ref: 'SkillNode',
    }],
    requiredAchievements: [{
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    }],
    cost: {
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
    },
  },

  // Node Effects
  effects: {
    statModifiers: {
      experienceMultiplier: {
        type: Number,
        min: 0.1,
        default: 1,
      },
      currencyMultiplier: {
        type: Number,
        min: 0.1,
        default: 1,
      },
      challengeSuccessRate: {
        type: Number,
        min: 0,
        max: 100,
      },
      learningSpeed: {
        type: Number,
        min: 0.1,
        default: 1,
      },
      socialInteractionBonus: {
        type: Number,
        min: 0,
      },
    },
    unlockContent: [{
      type: Schema.Types.ObjectId,
      ref: 'Content',
    }],
    specialAbilities: [{
      type: String,
    }],
    passiveEffects: [{
      type: String,
    }],
  },

  // Node Progression
  maxLevel: {
    type: Number,
    default: 1,
    min: 1,
  },
  currentLevel: {
    type: Number,
    default: 0,
    min: 0,
  },
  experienceToNext: {
    type: Number,
    default: 100,
    min: 0,
  },

  // Visual Properties
  position: {
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
  },
  connections: [{
    type: Schema.Types.ObjectId,
    ref: 'SkillNode',
  }],

  // Metadata
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  isUltimate: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const SkillTreeSchema: Schema = new Schema({
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
  theme: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['intelligence', 'creativity', 'productivity', 'social', 'special'],
    required: true,
  },

  // Tree Structure
  rootNodes: [{
    type: Schema.Types.ObjectId,
    ref: 'SkillNode',
  }],
  allNodes: [{
    type: Schema.Types.ObjectId,
    ref: 'SkillNode',
  }],

  // Tree Requirements
  requirements: {
    minUserLevel: {
      type: Number,
      min: 1,
    },
    requiredAchievements: [{
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    }],
    specialRequirements: [{
      type: String,
    }],
  },

  // Tree Progression
  totalNodes: {
    type: Number,
    default: 0,
    min: 0,
  },
  unlockedNodes: {
    type: Number,
    default: 0,
    min: 0,
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  // Rewards for completion
  completionRewards: {
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

  // Metadata
  isActive: {
    type: Boolean,
    default: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  season: {
    type: String,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate',
  },

  // Statistics
  totalUsers: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageCompletionTime: {
    type: Number,
    default: 0,
    min: 0,
  },
  popularityScore: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes for performance
SkillNodeSchema.index({ category: 1 });
SkillNodeSchema.index({ rarity: 1 });
SkillNodeSchema.index({ isHidden: 1 });

SkillTreeSchema.index({ category: 1 });
SkillTreeSchema.index({ isActive: 1 });
SkillTreeSchema.index({ isPremium: 1 });
SkillTreeSchema.index({ difficulty: 1 });
SkillTreeSchema.index({ popularityScore: -1 });

export const SkillNode = mongoose.models.SkillNode ||
  mongoose.model<ISkillNode>('SkillNode', SkillNodeSchema);

export const SkillTree = mongoose.models.SkillTree ||
  mongoose.model<ISkillTree>('SkillTree', SkillTreeSchema);

export default SkillTree;