import mongoose, { Document, Schema } from 'mongoose';

// Optimal timing and circadian rhythm tracking
export interface IUserTiming extends Document {
  userId: mongoose.Types.ObjectId;
  timezone: string;
  circadianPattern: {
    peakHours: number[]; // 0-23 hours
    activeDays: number[]; // 0-6 (Sunday-Saturday)
    preferredTimes: {
      contentConsumption: number[];
      communication: number[];
      learning: number[];
      creativeWork: number[];
    };
    avoidanceHours: number[]; // Hours to avoid notifications
  };
  weeklyPattern: {
    day: number; // 0-6
    avgSessions: number;
    avgDuration: number;
    peakHour: number;
  }[];
  monthlyTrends: {
    month: number; // 1-12
    avgEngagement: number;
    preferredContent: string[];
  }[];
  seasonalPreferences: {
    season: 'spring' | 'summer' | 'fall' | 'winter';
    engagementMultiplier: number;
    preferredTopics: string[];
  }[];
  updatedAt: Date;
}

const UserTimingSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  circadianPattern: {
    peakHours: [Number],
    activeDays: [Number],
    preferredTimes: {
      contentConsumption: [Number],
      communication: [Number],
      learning: [Number],
      creativeWork: [Number],
    },
    avoidanceHours: [Number],
  },
  weeklyPattern: [{
    day: Number,
    avgSessions: Number,
    avgDuration: Number,
    peakHour: Number,
  }],
  monthlyTrends: [{
    month: Number,
    avgEngagement: Number,
    preferredContent: [String],
  }],
  seasonalPreferences: [{
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter'],
    },
    engagementMultiplier: Number,
    preferredTopics: [String],
  }],
}, {
  timestamps: true,
});

// Channel preferences and multi-arm bandit optimization
export interface IChannelPreference extends Document {
  userId: mongoose.Types.ObjectId;
  channels: {
    email: {
      enabled: boolean;
      preference: number; // 0-1
      openRate: number;
      clickRate: number;
      unsubscribeRate: number;
      optimalTimes: number[];
      lastUsed: Date;
    };
    push: {
      enabled: boolean;
      preference: number;
      openRate: number;
      clickRate: number;
      dismissRate: number;
      optimalTimes: number[];
      lastUsed: Date;
    };
    sms: {
      enabled: boolean;
      preference: number;
      openRate: number;
      clickRate: number;
      cost: number;
      optimalTimes: number[];
      lastUsed: Date;
    };
    inApp: {
      enabled: boolean;
      preference: number;
      viewRate: number;
      interactionRate: number;
      dismissRate: number;
      lastUsed: Date;
    };
  };
  bandit: {
    algorithm: 'epsilon-greedy' | 'ucb' | 'thompson';
    parameters: Record<string, any>;
    armRewards: Record<string, number>;
    totalTrials: number;
    lastUpdated: Date;
  };
  updatedAt: Date;
}

const ChannelPreferenceSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  channels: {
    email: {
      enabled: { type: Boolean, default: true },
      preference: { type: Number, min: 0, max: 1, default: 0.5 },
      openRate: { type: Number, min: 0, max: 1, default: 0 },
      clickRate: { type: Number, min: 0, max: 1, default: 0 },
      unsubscribeRate: { type: Number, min: 0, max: 1, default: 0 },
      optimalTimes: [Number],
      lastUsed: Date,
    },
    push: {
      enabled: { type: Boolean, default: true },
      preference: { type: Number, min: 0, max: 1, default: 0.5 },
      openRate: { type: Number, min: 0, max: 1, default: 0 },
      clickRate: { type: Number, min: 0, max: 1, default: 0 },
      dismissRate: { type: Number, min: 0, max: 1, default: 0 },
      optimalTimes: [Number],
      lastUsed: Date,
    },
    sms: {
      enabled: { type: Boolean, default: false },
      preference: { type: Number, min: 0, max: 1, default: 0.2 },
      openRate: { type: Number, min: 0, max: 1, default: 0 },
      clickRate: { type: Number, min: 0, max: 1, default: 0 },
      cost: { type: Number, default: 0.05 },
      optimalTimes: [Number],
      lastUsed: Date,
    },
    inApp: {
      enabled: { type: Boolean, default: true },
      preference: { type: Number, min: 0, max: 1, default: 0.8 },
      viewRate: { type: Number, min: 0, max: 1, default: 0 },
      interactionRate: { type: Number, min: 0, max: 1, default: 0 },
      dismissRate: { type: Number, min: 0, max: 1, default: 0 },
      lastUsed: Date,
    },
  },
  bandit: {
    algorithm: {
      type: String,
      enum: ['epsilon-greedy', 'ucb', 'thompson'],
      default: 'epsilon-greedy',
    },
    parameters: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    armRewards: {
      type: Map,
      of: Number,
    },
    totalTrials: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
}, {
  timestamps: true,
});

// Message templates and personalization
export interface IMessageTemplate extends Document {
  id: string;
  name: string;
  type: 'notification' | 'recommendation' | 'reminder' | 'feedback' | 'onboarding';
  category: 'engagement' | 'retention' | 'conversion' | 'support' | 'education';

  content: {
    subject?: string;
    title: string;
    body: string;
    actionLabel?: string;
    actionUrl?: string;
  };

  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'user_property';
    required: boolean;
    defaultValue?: any;
    description: string;
  }>;

  conditions: {
    userSegments: string[];
    triggers: string[];
    cooldown: number; // hours between similar messages
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  };

  performance: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    dismissed: number;
    unsubscribed: number;
  };

  variants: Array<{
    id: string;
    weight: number;
    content: {
      subject?: string;
      title: string;
      body: string;
      actionLabel?: string;
      actionUrl?: string;
    };
  }>;

  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['notification', 'recommendation', 'reminder', 'feedback', 'onboarding'],
    required: true,
  },
  category: {
    type: String,
    enum: ['engagement', 'retention', 'conversion', 'support', 'education'],
    required: true,
  },
  content: {
    subject: String,
    title: { type: String, required: true },
    body: { type: String, required: true },
    actionLabel: String,
    actionUrl: String,
  },
  variables: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date', 'user_property'],
      required: true,
    },
    required: { type: Boolean, default: false },
    defaultValue: Schema.Types.Mixed,
    description: { type: String, required: true },
  }],
  conditions: {
    userSegments: [String],
    triggers: [String],
    cooldown: { type: Number, default: 24 },
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly'],
      default: 'weekly',
    },
  },
  performance: {
    sent: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    dismissed: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
  },
  variants: [{
    id: { type: String, required: true },
    weight: { type: Number, min: 0, max: 100, required: true },
    content: {
      subject: String,
      title: { type: String, required: true },
      body: { type: String, required: true },
      actionLabel: String,
      actionUrl: String,
    },
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Fatigue and burnout detection
export interface IUserFatigue extends Document {
  userId: mongoose.Types.ObjectId;
  currentLevel: number; // 0-1 scale
  trend: 'decreasing' | 'stable' | 'increasing';

  metrics: {
    sessionDuration: number; // average in minutes
    sessionFrequency: number; // sessions per day
    breakFrequency: number; // breaks per hour
    errorRate: number; // errors per session
    frustrationSignals: number; // count of frustration indicators
    contextSwitching: number; // switches per session
  };

  patterns: {
    burnoutRisk: 'low' | 'medium' | 'high' | 'critical';
    exhaustionSignals: string[];
    recoveryTime: number; // hours needed to recover
    optimalBreakInterval: number; // minutes
  };

  interventions: Array<{
    type: 'break_reminder' | 'content_simplification' | 'reduced_frequency' | 'encouragement';
    triggeredAt: Date;
    effectiveness: number; // 0-1
    cooldownUntil: Date;
  }>;

  thresholds: {
    maxSessionTime: number; // minutes
    maxSessionsPerDay: number;
    minBreakInterval: number; // minutes
    errorRateThreshold: number;
  };

  updatedAt: Date;
}

const UserFatigueSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  currentLevel: {
    type: Number,
    min: 0,
    max: 1,
    default: 0,
  },
  trend: {
    type: String,
    enum: ['decreasing', 'stable', 'increasing'],
    default: 'stable',
  },
  metrics: {
    sessionDuration: { type: Number, default: 0 },
    sessionFrequency: { type: Number, default: 0 },
    breakFrequency: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    frustrationSignals: { type: Number, default: 0 },
    contextSwitching: { type: Number, default: 0 },
  },
  patterns: {
    burnoutRisk: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    exhaustionSignals: [String],
    recoveryTime: { type: Number, default: 2 },
    optimalBreakInterval: { type: Number, default: 60 },
  },
  interventions: [{
    type: {
      type: String,
      enum: ['break_reminder', 'content_simplification', 'reduced_frequency', 'encouragement'],
      required: true,
    },
    triggeredAt: { type: Date, required: true },
    effectiveness: { type: Number, min: 0, max: 1, default: 0.5 },
    cooldownUntil: { type: Date, required: true },
  }],
  thresholds: {
    maxSessionTime: { type: Number, default: 120 },
    maxSessionsPerDay: { type: Number, default: 10 },
    minBreakInterval: { type: Number, default: 30 },
    errorRateThreshold: { type: Number, default: 0.1 },
  },
}, {
  timestamps: true,
});

// Engagement campaigns and sequences
export interface IEngagementCampaign extends Document {
  id: string;
  name: string;
  description: string;
  type: 'onboarding' | 're_engagement' | 'feature_adoption' | 'retention' | 'winback';

  target: {
    segments: string[];
    filters: Record<string, any>;
    size: number;
    estimatedReach: number;
  };

  sequence: Array<{
    step: number;
    delay: number; // hours after previous step
    channel: 'email' | 'push' | 'sms' | 'in_app';
    templateId: string;
    conditions: Record<string, any>;
    fallback?: {
      channel: string;
      templateId: string;
    };
  }>;

  schedule: {
    startDate: Date;
    endDate?: Date;
    timezone: string;
    frequency: 'once' | 'recurring';
    recurringPattern?: string; // cron expression
  };

  performance: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalConverted: number;
    dropOffRate: number;
    completionRate: number;
  };

  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const EngagementCampaignSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['onboarding', 're_engagement', 'feature_adoption', 'retention', 'winback'],
    required: true,
  },
  target: {
    segments: [String],
    filters: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    size: Number,
    estimatedReach: Number,
  },
  sequence: [{
    step: { type: Number, required: true },
    delay: { type: Number, required: true },
    channel: {
      type: String,
      enum: ['email', 'push', 'sms', 'in_app'],
      required: true,
    },
    templateId: { type: String, required: true },
    conditions: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    fallback: {
      channel: String,
      templateId: String,
    },
  }],
  schedule: {
    startDate: { type: Date, required: true },
    endDate: Date,
    timezone: { type: String, default: 'UTC' },
    frequency: {
      type: String,
      enum: ['once', 'recurring'],
      default: 'once',
    },
    recurringPattern: String,
  },
  performance: {
    totalSent: { type: Number, default: 0 },
    totalOpened: { type: Number, default: 0 },
    totalClicked: { type: Number, default: 0 },
    totalConverted: { type: Number, default: 0 },
    dropOffRate: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

// Indexes for performance
EngagementCampaignSchema.index({ status: 1, 'schedule.startDate': 1 });
EngagementCampaignSchema.index({ type: 1, status: 1 });

export const UserTiming = mongoose.models.UserTiming || mongoose.model<IUserTiming>('UserTiming', UserTimingSchema);
export const ChannelPreference = mongoose.models.ChannelPreference || mongoose.model<IChannelPreference>('ChannelPreference', ChannelPreferenceSchema);
export const MessageTemplate = mongoose.models.MessageTemplate || mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
export const UserFatigue = mongoose.models.UserFatigue || mongoose.model<IUserFatigue>('UserFatigue', UserFatigueSchema);
export const EngagementCampaign = mongoose.models.EngagementCampaign || mongoose.model<IEngagementCampaign>('EngagementCampaign', EngagementCampaignSchema);

export default {
  UserTiming,
  ChannelPreference,
  MessageTemplate,
  UserFatigue,
  EngagementCampaign,
};