import mongoose, { Document, Schema } from 'mongoose';

export interface IInternalCommunicationMessage {
  id: string;
  sender: mongoose.Types.ObjectId;
  recipients: {
    userId: mongoose.Types.ObjectId;
    readAt?: Date;
    acknowledgedAt?: Date;
  }[];
  subject?: string;
  content: {
    text: string;
    html?: string;
    attachments?: {
      filename: string;
      url: string;
      size: number;
      type: string;
    }[];
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  urgency: number; // 0-1 score
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  category: 'announcement' | 'task' | 'reminder' | 'feedback' | 'approval' | 'general';
  tags: string[];
  routing: {
    score: number;
    factors: {
      name: string;
      value: number;
      weight: number;
    }[];
    suggestedChannels: string[];
  };
  responseSuggestions: {
    template: string;
    confidence: number;
    context: string;
  }[];
  compliance: {
    flagged: boolean;
    flags: {
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      confidence: number;
    }[];
    approved: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
  };
  metadata: {
    sentiment: number;
    topics: string[];
    entities: {
      name: string;
      type: string;
      confidence: number;
    }[];
    language: string;
    processingTime: number;
  };
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'archived' | 'deleted';
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInternalCommunicationThread {
  id: string;
  organizationId: mongoose.Types.ObjectId;
  title: string;
  type: 'conversation' | 'task' | 'project' | 'announcement' | 'feedback';
  participants: mongoose.Types.ObjectId[];
  messages: IInternalCommunicationMessage[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'active' | 'resolved' | 'archived' | 'deleted';
  knowledgeBase: {
    linkedArticles: mongoose.Types.ObjectId[];
    suggestedArticles: mongoose.Types.ObjectId[];
    confidence: number;
  };
  metadata: {
    totalMessages: number;
    averageResponseTime: number;
    resolutionTime?: number;
    satisfaction?: number;
    topics: string[];
    sentimentTrend: number[];
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  archivedAt?: Date;
}

export interface IInternalCommunicationTemplate {
  id: string;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: 'greeting' | 'task' | 'reminder' | 'feedback' | 'approval' | 'announcement';
  content: {
    subject: string;
    body: string;
    variables: {
      name: string;
      type: 'text' | 'number' | 'date' | 'user' | 'organization';
      required: boolean;
      defaultValue?: string;
    }[];
  };
  usage: {
    totalUses: number;
    lastUsed?: Date;
    averageSatisfaction?: number;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInternalCommunicationKnowledgeBase {
  id: string;
  organizationId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'article' | 'faq' | 'policy' | 'procedure' | 'tutorial';
  category: string;
  tags: string[];
  metadata: {
    views: number;
    helpful: number;
    notHelpful: number;
    averageRating: number;
    lastUpdated: Date;
    author: mongoose.Types.ObjectId;
    reviewers: mongoose.Types.ObjectId[];
  };
  semantic: {
    embedding?: number[];
    topics: string[];
    keywords: string[];
    summary: string;
  };
  access: {
    level: 'public' | 'internal' | 'confidential' | 'restricted';
    allowedRoles: string[];
    allowedUsers: mongoose.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IInternalCommunicationAnalytics {
  id: string;
  organizationId: mongoose.Types.ObjectId;
  period: {
    start: Date;
    end: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
  metrics: {
    totalMessages: number;
    totalThreads: number;
    averageResponseTime: number;
    resolutionRate: number;
    satisfactionScore: number;
    priorityDistribution: {
      low: number;
      normal: number;
      high: number;
      urgent: number;
    };
    categoryDistribution: {
      announcement: number;
      task: number;
      reminder: number;
      feedback: number;
      approval: number;
      general: number;
    };
    channelEffectiveness: {
      channel: string;
      usage: number;
      satisfaction: number;
      responseTime: number;
    }[];
    topTopics: {
      topic: string;
      frequency: number;
      sentiment: number;
    }[];
    knowledgeBase: {
      totalArticles: number;
      totalViews: number;
      averageRating: number;
      topSearches: string[];
    };
    compliance: {
      totalFlagged: number;
      falsePositives: number;
      approvalRate: number;
      averageReviewTime: number;
    };
  };
  trends: {
    messageVolume: number[];
    responseTime: number[];
    satisfaction: number[];
    priority: number[];
  };
  generatedAt: Date;
}

const InternalCommunicationMessageSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipients: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: Date,
    acknowledgedAt: Date,
  }],
  subject: String,
  content: {
    text: {
      type: String,
      required: true,
    },
    html: String,
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      type: String,
    }],
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  urgency: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5,
  },
  sensitivity: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'internal',
  },
  category: {
    type: String,
    enum: ['announcement', 'task', 'reminder', 'feedback', 'approval', 'general'],
    default: 'general',
  },
  tags: [String],
  routing: {
    score: Number,
    factors: [{
      name: String,
      value: Number,
      weight: Number,
    }],
    suggestedChannels: [String],
  },
  responseSuggestions: [{
    template: String,
    confidence: Number,
    context: String,
  }],
  compliance: {
    flagged: {
      type: Boolean,
      default: false,
    },
    flags: [{
      type: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      description: String,
      confidence: Number,
    }],
    approved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
  },
  metadata: {
    sentiment: Number,
    topics: [String],
    entities: [{
      name: String,
      type: String,
      confidence: Number,
    }],
    language: String,
    processingTime: Number,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'read', 'archived', 'deleted'],
    default: 'draft',
  },
  sentAt: Date,
  deliveredAt: Date,
}, {
  timestamps: true,
  _id: true
});

const InternalCommunicationThreadSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['conversation', 'task', 'project', 'announcement', 'feedback'],
    default: 'conversation',
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  messages: [InternalCommunicationMessageSchema],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived', 'deleted'],
    default: 'active',
  },
  knowledgeBase: {
    linkedArticles: [{
      type: Schema.Types.ObjectId,
      ref: 'InternalCommunicationKnowledgeBase',
    }],
    suggestedArticles: [{
      type: Schema.Types.ObjectId,
      ref: 'InternalCommunicationKnowledgeBase',
    }],
    confidence: Number,
  },
  metadata: {
    totalMessages: Number,
    averageResponseTime: Number,
    resolutionTime: Number,
    satisfaction: Number,
    topics: [String],
    sentimentTrend: [Number],
  },
}, {
  timestamps: true,
  _id: true
});

const InternalCommunicationTemplateSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ['greeting', 'task', 'reminder', 'feedback', 'approval', 'announcement'],
    required: true,
  },
  content: {
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    variables: [{
      name: String,
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'user', 'organization'],
      },
      required: Boolean,
      defaultValue: String,
    }],
  },
  usage: {
    totalUses: Number,
    lastUsed: Date,
    averageSatisfaction: Number,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
  _id: true
});

const InternalCommunicationKnowledgeBaseSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['article', 'faq', 'policy', 'procedure', 'tutorial'],
    default: 'article',
  },
  category: String,
  tags: [String],
  metadata: {
    views: Number,
    helpful: Number,
    notHelpful: Number,
    averageRating: Number,
    lastUpdated: Date,
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  semantic: {
    embedding: [Number],
    topics: [String],
    keywords: [String],
    summary: String,
  },
  access: {
    level: {
      type: String,
      enum: ['public', 'internal', 'confidential', 'restricted'],
      default: 'internal',
    },
    allowedRoles: [String],
    allowedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
}, {
  timestamps: true,
  _id: true
});

const InternalCommunicationAnalyticsSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  period: {
    start: Date,
    end: Date,
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    },
  },
  metrics: {
    totalMessages: Number,
    totalThreads: Number,
    averageResponseTime: Number,
    resolutionRate: Number,
    satisfactionScore: Number,
    priorityDistribution: {
      low: Number,
      normal: Number,
      high: Number,
      urgent: Number,
    },
    categoryDistribution: {
      announcement: Number,
      task: Number,
      reminder: Number,
      feedback: Number,
      approval: Number,
      general: Number,
    },
    channelEffectiveness: [{
      channel: String,
      usage: Number,
      satisfaction: Number,
      responseTime: Number,
    }],
    topTopics: [{
      topic: String,
      frequency: Number,
      sentiment: Number,
    }],
    knowledgeBase: {
      totalArticles: Number,
      totalViews: Number,
      averageRating: Number,
      topSearches: [String],
    },
    compliance: {
      totalFlagged: Number,
      falsePositives: Number,
      approvalRate: Number,
      averageReviewTime: Number,
    },
  },
  trends: {
    messageVolume: [Number],
    responseTime: [Number],
    satisfaction: [Number],
    priority: [Number],
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

// Export models
export const InternalCommunicationMessage = mongoose.models.InternalCommunicationMessage ||
  mongoose.model('InternalCommunicationMessage', InternalCommunicationMessageSchema);

export const InternalCommunicationThread = mongoose.models.InternalCommunicationThread ||
  mongoose.model('InternalCommunicationThread', InternalCommunicationThreadSchema);

export const InternalCommunicationTemplate = mongoose.models.InternalCommunicationTemplate ||
  mongoose.model('InternalCommunicationTemplate', InternalCommunicationTemplateSchema);

export const InternalCommunicationKnowledgeBase = mongoose.models.InternalCommunicationKnowledgeBase ||
  mongoose.model('InternalCommunicationKnowledgeBase', InternalCommunicationKnowledgeBaseSchema);

export const InternalCommunicationAnalytics = mongoose.models.InternalCommunicationAnalytics ||
  mongoose.model('InternalCommunicationAnalytics', InternalCommunicationAnalyticsSchema);

// Indexes for better query performance
InternalCommunicationMessageSchema.index({ sender: 1, createdAt: -1 });
InternalCommunicationMessageSchema.index({ 'recipients.userId': 1, status: 1 });
InternalCommunicationMessageSchema.index({ priority: 1, urgency: -1 });
InternalCommunicationMessageSchema.index({ category: 1, tags: 1 });
InternalCommunicationMessageSchema.index({ 'compliance.flagged': 1 });

InternalCommunicationThreadSchema.index({ organizationId: 1, status: 1, updatedAt: -1 });
InternalCommunicationThreadSchema.index({ participants: 1, status: 1 });
InternalCommunicationThreadSchema.index({ priority: 1, status: 1 });

InternalCommunicationKnowledgeBaseSchema.index({ organizationId: 1, type: 1 });
InternalCommunicationKnowledgeBaseSchema.index({ category: 1, tags: 1 });
InternalCommunicationKnowledgeBaseSchema.index({ 'metadata.averageRating': -1 });

InternalCommunicationAnalyticsSchema.index({ organizationId: 1, 'period.start': -1 });