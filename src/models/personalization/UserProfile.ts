import mongoose, { Document, Schema } from 'mongoose';

// Behavioral patterns and interaction history
export interface IUserBehavior extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  timestamp: Date;
  action: string; // 'click', 'view', 'search', 'bookmark', 'share', 'complete'
  targetType: string; // 'content', 'feature', 'ui_element', 'workflow'
  targetId: string;
  context: {
    page?: string;
    referrer?: string;
    userAgent?: string;
    viewport?: { width: number; height: number };
    timeSpent?: number; // milliseconds
  };
  metadata: Record<string, any>;
}

const UserBehaviorSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  action: {
    type: String,
    required: true,
    enum: ['click', 'view', 'search', 'bookmark', 'share', 'complete', 'skip', 'rate'],
  },
  targetType: {
    type: String,
    required: true,
    enum: ['content', 'feature', 'ui_element', 'workflow', 'api_call'],
  },
  targetId: {
    type: String,
    required: true,
  },
  context: {
    page: String,
    referrer: String,
    userAgent: String,
    viewport: {
      width: Number,
      height: Number,
    },
    timeSpent: Number,
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
UserBehaviorSchema.index({ userId: 1, timestamp: -1 });
UserBehaviorSchema.index({ userId: 1, action: 1 });
UserBehaviorSchema.index({ targetType: 1, targetId: 1 });
UserBehaviorSchema.index({ sessionId: 1 });

// User preferences and interests
export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  contentTypes: string[]; // ['article', 'video', 'tutorial', 'research']
  topics: string[]; // ['machine-learning', 'web-dev', 'design', 'business']
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  timePreference: 'morning' | 'afternoon' | 'evening' | 'night';
  pace: 'slow' | 'moderate' | 'fast';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    dataCollection: boolean;
    analytics: boolean;
  };
  updatedAt: Date;
}

const UserPreferencesSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  contentTypes: [{
    type: String,
    enum: ['article', 'video', 'tutorial', 'research', 'course', 'podcast', 'book'],
  }],
  topics: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate',
  },
  learningStyle: {
    type: String,
    enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
    default: 'visual',
  },
  timePreference: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    default: 'afternoon',
  },
  pace: {
    type: String,
    enum: ['slow', 'moderate', 'fast'],
    default: 'moderate',
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly', 'never'],
      default: 'daily',
    },
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private',
    },
    dataCollection: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

// Psychographic profile
export interface IUserPsychographics extends Document {
  userId: mongoose.Types.ObjectId;
  personalityTraits: {
    openness: number; // 0-1 scale
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  values: string[]; // ['achievement', 'autonomy', 'creativity', 'security', 'social-impact']
  motivations: string[]; // ['career-growth', 'skill-development', 'social-connection']
  communicationStyle: 'direct' | 'collaborative' | 'analytical' | 'expressive';
  decisionMaking: 'logical' | 'intuitive' | 'data-driven' | 'consultative';
  riskTolerance: 'low' | 'moderate' | 'high';
  confidence: number; // 0-1 scale
  updatedAt: Date;
}

const UserPsychographicsSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  personalityTraits: {
    openness: { type: Number, min: 0, max: 1, default: 0.5 },
    conscientiousness: { type: Number, min: 0, max: 1, default: 0.5 },
    extraversion: { type: Number, min: 0, max: 1, default: 0.5 },
    agreeableness: { type: Number, min: 0, max: 1, default: 0.5 },
    neuroticism: { type: Number, min: 0, max: 1, default: 0.5 },
  },
  values: [String],
  motivations: [String],
  communicationStyle: {
    type: String,
    enum: ['direct', 'collaborative', 'analytical', 'expressive'],
    default: 'collaborative',
  },
  decisionMaking: {
    type: String,
    enum: ['logical', 'intuitive', 'data-driven', 'consultative'],
    default: 'data-driven',
  },
  riskTolerance: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate',
  },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
}, {
  timestamps: true,
});

// Context awareness data
export interface IUserContext extends Document {
  userId: mongoose.Types.ObjectId;
  currentSession: {
    id: string;
    startTime: Date;
    lastActivity: Date;
    device: {
      type: 'desktop' | 'mobile' | 'tablet';
      os: string;
      browser: string;
    };
    location?: {
      timezone: string;
      country?: string;
      region?: string;
    };
  };
  circadianRhythm: {
    peakHours: number[]; // 0-23
    preferredTimes: {
      content: number[];
      communication: number[];
      learning: number[];
    };
  };
  fatigueLevel: number; // 0-1 scale
  stressLevel: number; // 0-1 scale
  focusState: 'high' | 'medium' | 'low' | 'distracted';
  environment: {
    noiseLevel: 'quiet' | 'moderate' | 'loud';
    lighting: 'bright' | 'dim' | 'dark';
    setting: 'office' | 'home' | 'public' | 'mobile';
  };
  updatedAt: Date;
}

const UserContextSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  currentSession: {
    id: String,
    startTime: Date,
    lastActivity: Date,
    device: {
      type: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
        required: true,
      },
      os: { type: String, required: true },
      browser: { type: String, required: true },
    },
    location: {
      timezone: String,
      country: String,
      region: String,
    },
  },
  circadianRhythm: {
    peakHours: [Number],
    preferredTimes: {
      content: [Number],
      communication: [Number],
      learning: [Number],
    },
  },
  fatigueLevel: { type: Number, min: 0, max: 1, default: 0 },
  stressLevel: { type: Number, min: 0, max: 1, default: 0 },
  focusState: {
    type: String,
    enum: ['high', 'medium', 'low', 'distracted'],
    default: 'medium',
  },
  environment: {
    noiseLevel: {
      type: String,
      enum: ['quiet', 'moderate', 'loud'],
      default: 'moderate',
    },
    lighting: {
      type: String,
      enum: ['bright', 'dim', 'dark'],
      default: 'bright',
    },
    setting: {
      type: String,
      enum: ['office', 'home', 'public', 'mobile'],
      default: 'home',
    },
  },
}, {
  timestamps: true,
});

// Main user profile that aggregates all personalization data
export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId;
  profileVersion: number;
  status: 'active' | 'inactive' | 'suspended';

  // Aggregated metrics
  engagementScore: number; // 0-100
  satisfactionScore: number; // 0-100
  retentionRisk: 'low' | 'medium' | 'high';

  // Feature usage tracking
  featureUsage: Record<string, {
    firstUsed: Date;
    lastUsed: Date;
    usageCount: number;
    avgSessionTime: number;
  }>;

  // Personalization settings
  adaptiveUI: {
    enabled: boolean;
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    layout: 'compact' | 'comfortable' | 'spacious';
    animations: boolean;
  };

  // A/B testing participation
  experiments: Record<string, {
    variant: string;
    enrolledAt: Date;
    completedAt?: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  profileVersion: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  engagementScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  satisfactionScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 75,
  },
  retentionRisk: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  featureUsage: {
    type: Map,
    of: {
      firstUsed: Date,
      lastUsed: Date,
      usageCount: Number,
      avgSessionTime: Number,
    },
  },
  adaptiveUI: {
    enabled: { type: Boolean, default: true },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    layout: {
      type: String,
      enum: ['compact', 'comfortable', 'spacious'],
      default: 'comfortable',
    },
    animations: { type: Boolean, default: true },
  },
  experiments: {
    type: Map,
    of: {
      variant: String,
      enrolledAt: Date,
      completedAt: Date,
    },
  },
}, {
  timestamps: true,
});

// Indexes for performance
UserProfileSchema.index({ userId: 1 });
UserProfileSchema.index({ status: 1 });
UserProfileSchema.index({ engagementScore: -1 });
UserProfileSchema.index({ retentionRisk: 1 });
UserProfileSchema.index({ 'adaptiveUI.theme': 1 });

export const UserBehavior = mongoose.models.UserBehavior || mongoose.model<IUserBehavior>('UserBehavior', UserBehaviorSchema);
export const UserPreferences = mongoose.models.UserPreferences || mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
export const UserPsychographics = mongoose.models.UserPsychographics || mongoose.model<IUserPsychographics>('UserPsychographics', UserPsychographicsSchema);
export const UserContext = mongoose.models.UserContext || mongoose.model<IUserContext>('UserContext', UserContextSchema);
export const UserProfile = mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default {
  UserBehavior,
  UserPreferences,
  UserPsychographics,
  UserContext,
  UserProfile,
};