import mongoose, { Document, Schema } from 'mongoose';

export interface IAvatarCustomization {
  body: {
    height: number;
    build: 'slim' | 'average' | 'athletic' | 'heavy';
    skinTone: string;
    age: number;
  };
  face: {
    shape: 'round' | 'oval' | 'square' | 'heart' | 'diamond';
    eyeColor: string;
    hairStyle: string;
    hairColor: string;
    facialHair?: string;
    makeup?: {
      lipstick: string;
      eyeshadow: string;
      blush: string;
    };
  };
  clothing: {
    top: {
      type: string;
      color: string;
      style: string;
    };
    bottom: {
      type: string;
      color: string;
      style: string;
    };
    shoes: {
      type: string;
      color: string;
      style: string;
    };
    accessories: Array<{
      type: string;
      name: string;
      color: string;
      position: string;
    }>;
  };
  animations: {
    idle: string;
    walk: string;
    run: string;
    jump: string;
    gesture: Record<string, string>;
  };
}

export interface IAvatarPersonality {
  traits: Record<string, number>; // e.g., {extroversion: 0.8, creativity: 0.6}
  voice: {
    pitch: number;
    speed: number;
    tone: 'friendly' | 'professional' | 'casual' | 'authoritative';
    accent: string;
  };
  behavior: {
    movementSpeed: number;
    gestureFrequency: number;
    personalSpace: number;
    interactionStyle: 'direct' | 'indirect' | 'formal' | 'casual';
  };
}

export interface IAvatarSocial {
  relationships: Array<{
    targetAvatarId: string;
    relationshipType: 'friend' | 'colleague' | 'family' | 'romantic' | 'rival';
    strength: number;
    history: Array<{
      interaction: string;
      timestamp: Date;
      emotionalImpact: number;
    }>;
  }>;
  groups: Array<{
    groupId: string;
    role: 'leader' | 'member' | 'moderator';
    joinedAt: Date;
  }>;
  reputation: {
    score: number;
    badges: string[];
    achievements: Array<{
      name: string;
      description: string;
      unlockedAt: Date;
    }>;
  };
}

export interface IAvatarEconomic {
  wallet: {
    balance: number;
    currency: string;
    transactionHistory: Array<{
      type: 'purchase' | 'sale' | 'transfer' | 'reward';
      amount: number;
      description: string;
      timestamp: Date;
      counterparty?: string;
    }>;
  };
  inventory: Array<{
    itemId: string;
    name: string;
    type: 'clothing' | 'accessory' | 'virtual_good' | 'nft';
    quantity: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    acquiredAt: Date;
  }>;
  marketplace: {
    listings: Array<{
      itemId: string;
      price: number;
      currency: string;
      listedAt: Date;
      status: 'active' | 'sold' | 'cancelled';
    }>;
    purchases: Array<{
      itemId: string;
      sellerId: string;
      price: number;
      purchasedAt: Date;
    }>;
  };
}

export interface IAvatar extends Document {
  name: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional: link to user account
  type: 'humanoid' | 'animal' | 'fantasy' | 'robot' | 'custom';
  appearance: IAvatarCustomization;
  personality: IAvatarPersonality;
  social: IAvatarSocial;
  economic: IAvatarEconomic;
  capabilities: {
    movement: {
      walkSpeed: number;
      runSpeed: number;
      jumpHeight: number;
      canFly: boolean;
      canSwim: boolean;
    };
    interaction: {
      canChat: boolean;
      canGesture: boolean;
      canEmote: boolean;
      languages: string[];
    };
    special: {
      abilities: Array<{
        name: string;
        description: string;
        cooldown: number;
        energyCost: number;
      }>;
      powers: Array<{
        name: string;
        description: string;
        level: number;
        unlockedAt: Date;
      }>;
    };
  };
  ai: {
    conversation: {
      enabled: boolean;
      model: string;
      personality: string;
      knowledgeBase: string[];
      memoryLength: number;
    };
    behavior: {
      enabled: boolean;
      autonomyLevel: number; // 0-1, how independent the avatar is
      decisionMaking: 'scripted' | 'learning' | 'hybrid';
      learningRate: number;
    };
    emotional: {
      enabled: boolean;
      mood: 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'anxious';
      emotionalRange: number;
      empathyLevel: number;
    };
  };
  virtualSpaces: Array<{
    spaceId: string;
    lastVisited: Date;
    totalTimeSpent: number;
    permissions: string[];
  }>;
  settings: {
    isPublic: boolean;
    allowCustomization: boolean;
    visibility: 'visible' | 'invisible' | 'friends_only';
    privacy: {
      profileVisible: boolean;
      locationVisible: boolean;
      activityVisible: boolean;
    };
  };
  metadata: {
    version: string;
    createdFrom: 'template' | 'photo' | 'manual' | 'ai_generated';
    templateId?: string;
    photoUrl?: string;
    generationParameters: Record<string, any>;
    lastActive: Date;
    totalActiveTime: number;
    popularityScore: number;
    rating: number;
    reviewCount: number;
  };
  analytics: {
    totalInteractions: number;
    uniqueInteractors: number;
    averageSessionLength: number;
    popularLocations: Array<{
      spaceId: string;
      visitCount: number;
      totalTime: number;
    }>;
    conversationMetrics: {
      totalConversations: number;
      averageConversationLength: number;
      topicsDiscussed: Record<string, number>;
      sentimentAnalysis: {
        positive: number;
        negative: number;
        neutral: number;
      };
    };
    economicActivity: {
      totalSpent: number;
      totalEarned: number;
      itemsTraded: number;
      reputationEarned: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const AvatarCustomizationSchema = new Schema({
  body: {
    height: { type: Number, default: 1.7 },
    build: {
      type: String,
      enum: ['slim', 'average', 'athletic', 'heavy'],
      default: 'average',
    },
    skinTone: { type: String, default: '#f4c2a1' },
    age: { type: Number, default: 25 },
  },
  face: {
    shape: {
      type: String,
      enum: ['round', 'oval', 'square', 'heart', 'diamond'],
      default: 'oval',
    },
    eyeColor: { type: String, default: '#8B4513' },
    hairStyle: { type: String, default: 'short' },
    hairColor: { type: String, default: '#8B4513' },
    facialHair: { type: String },
    makeup: {
      lipstick: { type: String },
      eyeshadow: { type: String },
      blush: { type: String },
    },
  },
  clothing: {
    top: {
      type: { type: String, default: 'tshirt' },
      color: { type: String, default: '#ffffff' },
      style: { type: String, default: 'casual' },
    },
    bottom: {
      type: { type: String, default: 'jeans' },
      color: { type: String, default: '#000080' },
      style: { type: String, default: 'casual' },
    },
    shoes: {
      type: { type: String, default: 'sneakers' },
      color: { type: String, default: '#ffffff' },
      style: { type: String, default: 'casual' },
    },
    accessories: [{
      type: { type: String, required: true },
      name: { type: String, required: true },
      color: { type: String, default: '#000000' },
      position: { type: String, default: 'neck' },
    }],
  },
  animations: {
    idle: { type: String, default: 'idle_default' },
    walk: { type: String, default: 'walk_default' },
    run: { type: String, default: 'run_default' },
    jump: { type: String, default: 'jump_default' },
    gesture: { type: Schema.Types.Mixed, default: {} },
  },
});

const AvatarPersonalitySchema = new Schema({
  traits: { type: Schema.Types.Mixed, default: {} },
  voice: {
    pitch: { type: Number, default: 1.0 },
    speed: { type: Number, default: 1.0 },
    tone: {
      type: String,
      enum: ['friendly', 'professional', 'casual', 'authoritative'],
      default: 'friendly',
    },
    accent: { type: String, default: 'neutral' },
  },
  behavior: {
    movementSpeed: { type: Number, default: 1.0 },
    gestureFrequency: { type: Number, default: 0.5 },
    personalSpace: { type: Number, default: 1.5 },
    interactionStyle: {
      type: String,
      enum: ['direct', 'indirect', 'formal', 'casual'],
      default: 'casual',
    },
  },
});

const AvatarSocialSchema = new Schema({
  relationships: [{
    targetAvatarId: { type: String, required: true },
    relationshipType: {
      type: String,
      enum: ['friend', 'colleague', 'family', 'romantic', 'rival'],
      required: true,
    },
    strength: { type: Number, default: 1.0 },
    history: [{
      interaction: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      emotionalImpact: { type: Number, default: 0 },
    }],
  }],
  groups: [{
    groupId: { type: String, required: true },
    role: {
      type: String,
      enum: ['leader', 'member', 'moderator'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  }],
  reputation: {
    score: { type: Number, default: 100 },
    badges: [{ type: String }],
    achievements: [{
      name: { type: String, required: true },
      description: { type: String, required: true },
      unlockedAt: { type: Date, default: Date.now },
    }],
  },
});

const AvatarEconomicSchema = new Schema({
  wallet: {
    balance: { type: Number, default: 1000 },
    currency: { type: String, default: 'credits' },
    transactionHistory: [{
      type: {
        type: String,
        enum: ['purchase', 'sale', 'transfer', 'reward'],
        required: true,
      },
      amount: { type: Number, required: true },
      description: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      counterparty: { type: String },
    }],
  },
  inventory: [{
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['clothing', 'accessory', 'virtual_good', 'nft'],
      required: true,
    },
    quantity: { type: Number, default: 1 },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    acquiredAt: { type: Date, default: Date.now },
  }],
  marketplace: {
    listings: [{
      itemId: { type: String, required: true },
      price: { type: Number, required: true },
      currency: { type: String, default: 'credits' },
      listedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['active', 'sold', 'cancelled'],
        default: 'active',
      },
    }],
    purchases: [{
      itemId: { type: String, required: true },
      sellerId: { type: String, required: true },
      price: { type: Number, required: true },
      purchasedAt: { type: Date, default: Date.now },
    }],
  },
});

const AvatarSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['humanoid', 'animal', 'fantasy', 'robot', 'custom'],
    default: 'humanoid',
  },
  appearance: { type: AvatarCustomizationSchema, required: true },
  personality: { type: AvatarPersonalitySchema, default: () => ({}) },
  social: { type: AvatarSocialSchema, default: () => ({}) },
  economic: { type: AvatarEconomicSchema, default: () => ({}) },
  capabilities: {
    movement: {
      walkSpeed: { type: Number, default: 1.5 },
      runSpeed: { type: Number, default: 3.0 },
      jumpHeight: { type: Number, default: 1.0 },
      canFly: { type: Boolean, default: false },
      canSwim: { type: Boolean, default: true },
    },
    interaction: {
      canChat: { type: Boolean, default: true },
      canGesture: { type: Boolean, default: true },
      canEmote: { type: Boolean, default: true },
      languages: [{ type: String }],
    },
    special: {
      abilities: [{
        name: { type: String, required: true },
        description: { type: String, required: true },
        cooldown: { type: Number, default: 0 },
        energyCost: { type: Number, default: 0 },
      }],
      powers: [{
        name: { type: String, required: true },
        description: { type: String, required: true },
        level: { type: Number, default: 1 },
        unlockedAt: { type: Date, default: Date.now },
      }],
    },
  },
  ai: {
    conversation: {
      enabled: { type: Boolean, default: true },
      model: { type: String, default: 'gpt-3.5-turbo' },
      personality: { type: String, default: 'friendly' },
      knowledgeBase: [{ type: String }],
      memoryLength: { type: Number, default: 10 },
    },
    behavior: {
      enabled: { type: Boolean, default: true },
      autonomyLevel: { type: Number, default: 0.5 },
      decisionMaking: {
        type: String,
        enum: ['scripted', 'learning', 'hybrid'],
        default: 'hybrid',
      },
      learningRate: { type: Number, default: 0.1 },
    },
    emotional: {
      enabled: { type: Boolean, default: true },
      mood: {
        type: String,
        enum: ['happy', 'sad', 'angry', 'excited', 'calm', 'anxious'],
        default: 'calm',
      },
      emotionalRange: { type: Number, default: 0.7 },
      empathyLevel: { type: Number, default: 0.6 },
    },
  },
  virtualSpaces: [{
    spaceId: { type: String, required: true },
    lastVisited: { type: Date, default: Date.now },
    totalTimeSpent: { type: Number, default: 0 },
    permissions: [{ type: String }],
  }],
  settings: {
    isPublic: { type: Boolean, default: true },
    allowCustomization: { type: Boolean, default: true },
    visibility: {
      type: String,
      enum: ['visible', 'invisible', 'friends_only'],
      default: 'visible',
    },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      locationVisible: { type: Boolean, default: true },
      activityVisible: { type: Boolean, default: true },
    },
  },
  metadata: {
    version: { type: String, default: '1.0.0' },
    createdFrom: {
      type: String,
      enum: ['template', 'photo', 'manual', 'ai_generated'],
      default: 'template',
    },
    templateId: { type: String },
    photoUrl: { type: String },
    generationParameters: { type: Schema.Types.Mixed, default: {} },
    lastActive: { type: Date, default: null },
    totalActiveTime: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  analytics: {
    totalInteractions: { type: Number, default: 0 },
    uniqueInteractors: { type: Number, default: 0 },
    averageSessionLength: { type: Number, default: 0 },
    popularLocations: [{
      spaceId: { type: String, required: true },
      visitCount: { type: Number, default: 0 },
      totalTime: { type: Number, default: 0 },
    }],
    conversationMetrics: {
      totalConversations: { type: Number, default: 0 },
      averageConversationLength: { type: Number, default: 0 },
      topicsDiscussed: { type: Schema.Types.Mixed, default: {} },
      sentimentAnalysis: {
        positive: { type: Number, default: 0 },
        negative: { type: Number, default: 0 },
        neutral: { type: Number, default: 0 },
      },
    },
    economicActivity: {
      totalSpent: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
      itemsTraded: { type: Number, default: 0 },
      reputationEarned: { type: Number, default: 0 },
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
AvatarSchema.index({ organizationId: 1 });
AvatarSchema.index({ creatorId: 1 });
AvatarSchema.index({ userId: 1 });
AvatarSchema.index({ name: 'text', description: 'text' });
AvatarSchema.index({ type: 1 });
AvatarSchema.index({ 'metadata.rating': -1 });
AvatarSchema.index({ 'metadata.popularityScore': -1 });
AvatarSchema.index({ 'social.reputation.score': -1 });
AvatarSchema.index({ 'economic.wallet.balance': -1 });
AvatarSchema.index({ createdAt: -1 });

// Method to update avatar activity
AvatarSchema.methods.updateActivity = function(spaceId: string, sessionTime: number): void {
  this.metadata.lastActive = new Date();
  this.metadata.totalActiveTime += sessionTime;

  const space = this.virtualSpaces.find((s: any) => s.spaceId === spaceId);
  if (space) {
    space.lastVisited = new Date();
    space.totalTimeSpent += sessionTime;
  } else {
    this.virtualSpaces.push({
      spaceId,
      lastVisited: new Date(),
      totalTimeSpent: sessionTime,
      permissions: ['basic'],
    });
  }
};

// Method to add conversation interaction
AvatarSchema.methods.addConversationInteraction = function(
  sentiment: 'positive' | 'negative' | 'neutral',
  topics: string[],
  duration: number
): void {
  this.analytics.totalInteractions += 1;
  this.analytics.conversationMetrics.totalConversations += 1;
  this.analytics.conversationMetrics.averageConversationLength =
    (this.analytics.conversationMetrics.averageConversationLength *
     (this.analytics.conversationMetrics.totalConversations - 1) + duration) /
    this.analytics.conversationMetrics.totalConversations;

  this.analytics.conversationMetrics.sentimentAnalysis[sentiment] += 1;

  topics.forEach(topic => {
    this.analytics.conversationMetrics.topicsDiscussed[topic] =
      (this.analytics.conversationMetrics.topicsDiscussed[topic] || 0) + 1;
  });
};

// Method to process economic transaction
AvatarSchema.methods.processTransaction = function(
  type: 'purchase' | 'sale' | 'transfer' | 'reward',
  amount: number,
  description: string,
  counterparty?: string
): void {
  const transaction = {
    type,
    amount,
    description,
    timestamp: new Date(),
    counterparty,
  };

  this.economic.wallet.transactionHistory.push(transaction);

  switch (type) {
    case 'purchase':
      this.economic.wallet.balance -= amount;
      this.analytics.economicActivity.totalSpent += amount;
      break;
    case 'sale':
    case 'reward':
      this.economic.wallet.balance += amount;
      this.analytics.economicActivity.totalEarned += amount;
      break;
    case 'transfer':
      this.economic.wallet.balance -= amount;
      break;
  }

  this.analytics.economicActivity.itemsTraded += 1;
};

// Method to update mood based on interactions
AvatarSchema.methods.updateMood = function(interactionType: string, emotionalImpact: number): void {
  const moodMap = {
    positive: ['happy', 'excited'],
    negative: ['sad', 'angry', 'anxious'],
    neutral: ['calm'],
  };

  const currentMoodIndex = Object.keys(moodMap).findIndex(moodGroup =>
    moodMap[moodGroup as keyof typeof moodMap].includes(this.ai.emotional.mood)
  );

  let newMoodIndex = currentMoodIndex;
  if (emotionalImpact > 0.5) {
    newMoodIndex = Math.min(currentMoodIndex + 1, Object.keys(moodMap).length - 1);
  } else if (emotionalImpact < -0.5) {
    newMoodIndex = Math.max(currentMoodIndex - 1, 0);
  }

  const moodGroups = Object.keys(moodMap);
  const newMoodGroup = moodGroups[newMoodIndex];
  const newMood = moodMap[newMoodGroup as keyof typeof moodMap][0];

  this.ai.emotional.mood = newMood as any;
};

// Method to get avatar capabilities summary
AvatarSchema.methods.getCapabilitiesSummary = function(): {
  movement: string[];
  interaction: string[];
  special: string[];
} {
  const capabilities = this.capabilities;

  return {
    movement: [
      `Walk: ${capabilities.movement.walkSpeed}m/s`,
      `Run: ${capabilities.movement.runSpeed}m/s`,
      `Jump: ${capabilities.movement.jumpHeight}m`,
      ...(capabilities.movement.canFly ? ['Can Fly'] : []),
      ...(capabilities.movement.canSwim ? ['Can Swim'] : []),
    ],
    interaction: [
      ...(capabilities.interaction.canChat ? ['Chat'] : []),
      ...(capabilities.interaction.canGesture ? ['Gesture'] : []),
      ...(capabilities.interaction.canEmote ? ['Emote'] : []),
      `Languages: ${capabilities.interaction.languages.join(', ')}`,
    ],
    special: [
      ...capabilities.special.abilities.map((ability: any) => ability.name),
      ...capabilities.special.powers.map((power: any) => `${power.name} (Lv.${power.level})`),
    ],
  };
};

export default mongoose.models.Avatar || mongoose.model<IAvatar>('Avatar', AvatarSchema);