import mongoose, { Document, Schema } from 'mongoose';

// Content and item representations for recommendations
export interface IContentItem extends Document {
  id: string;
  type: 'article' | 'video' | 'course' | 'tutorial' | 'research' | 'book' | 'podcast';
  title: string;
  description: string;
  tags: string[];
  topics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number; // minutes
  content: {
    url?: string;
    text?: string;
    metadata: Record<string, any>;
  };
  quality: {
    score: number; // 0-100
    rating: number; // 1-5 stars
    reviewCount: number;
  };
  engagement: {
    views: number;
    completions: number;
    bookmarks: number;
    shares: number;
    avgRating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContentItemSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['article', 'video', 'course', 'tutorial', 'research', 'book', 'podcast'],
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: [String],
  topics: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate',
  },
  estimatedTime: {
    type: Number,
    required: true,
  },
  content: {
    url: String,
    text: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  quality: {
    score: { type: Number, min: 0, max: 100, default: 50 },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    reviewCount: { type: Number, default: 0 },
  },
  engagement: {
    views: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    avgRating: { type: Number, min: 1, max: 5, default: 3 },
  },
}, {
  timestamps: true,
});

// User-item interaction matrix for collaborative filtering
export interface IUserItemInteraction extends Document {
  userId: mongoose.Types.ObjectId;
  itemId: string; // ContentItem id
  itemType: string;
  interactionType: 'view' | 'click' | 'bookmark' | 'complete' | 'rate' | 'share' | 'skip';
  weight: number; // Interaction strength (1-10)
  timestamp: Date;
  context: {
    sessionId: string;
    device: string;
    timeSpent?: number;
    rating?: number; // 1-5 stars
    feedback?: string;
  };
  metadata: Record<string, any>;
}

const UserItemInteractionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemId: {
    type: String,
    required: true,
  },
  itemType: {
    type: String,
    required: true,
  },
  interactionType: {
    type: String,
    required: true,
    enum: ['view', 'click', 'bookmark', 'complete', 'rate', 'share', 'skip'],
  },
  weight: {
    type: Number,
    min: 1,
    max: 10,
    default: 1,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  context: {
    sessionId: String,
    device: String,
    timeSpent: Number,
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
UserItemInteractionSchema.index({ userId: 1, itemId: 1, interactionType: 1 });
UserItemInteractionSchema.index({ userId: 1, timestamp: -1 });
UserItemInteractionSchema.index({ itemId: 1, interactionType: 1 });
UserItemInteractionSchema.index({ itemType: 1 });

// Recommendation results and explanations
export interface IRecommendation extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  type: 'content' | 'feature' | 'workflow' | 'social' | 'learning_path';
  items: Array<{
    itemId: string;
    itemType: string;
    score: number; // 0-1 confidence score
    reason: string; // Explanation for recommendation
    metadata: Record<string, any>;
  }>;
  context: {
    triggeredBy: 'user_action' | 'scheduled' | 'onboarding' | 're_engagement';
    userState: {
      engagement: 'high' | 'medium' | 'low';
      fatigue: 'low' | 'medium' | 'high';
      context: string;
    };
    algorithm: {
      type: 'collaborative' | 'content_based' | 'hybrid' | 'context_aware';
      version: string;
      parameters: Record<string, any>;
    };
  };
  status: 'generated' | 'delivered' | 'viewed' | 'acted_upon' | 'dismissed';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['content', 'feature', 'workflow', 'social', 'learning_path'],
  },
  items: [{
    itemId: { type: String, required: true },
    itemType: { type: String, required: true },
    score: { type: Number, min: 0, max: 1, required: true },
    reason: { type: String, required: true },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  }],
  context: {
    triggeredBy: {
      type: String,
      enum: ['user_action', 'scheduled', 'onboarding', 're_engagement'],
      required: true,
    },
    userState: {
      engagement: {
        type: String,
        enum: ['high', 'medium', 'low'],
        required: true,
      },
      fatigue: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
      },
      context: { type: String, required: true },
    },
    algorithm: {
      type: {
        type: String,
        enum: ['collaborative', 'content_based', 'hybrid', 'context_aware'],
        required: true,
      },
      version: { type: String, required: true },
      parameters: {
        type: Map,
        of: Schema.Types.Mixed,
      },
    },
  },
  status: {
    type: String,
    enum: ['generated', 'delivered', 'viewed', 'acted_upon', 'dismissed'],
    default: 'generated',
  },
  expiresAt: Date,
}, {
  timestamps: true,
});

// Indexes for recommendation queries
RecommendationSchema.index({ userId: 1, type: 1 });
RecommendationSchema.index({ userId: 1, 'context.triggeredBy': 1 });
RecommendationSchema.index({ status: 1, expiresAt: 1 });
RecommendationSchema.index({ createdAt: -1 });

// User similarity matrix for collaborative filtering
export interface IUserSimilarity extends Document {
  userId1: mongoose.Types.ObjectId;
  userId2: mongoose.Types.ObjectId;
  similarityScore: number; // -1 to 1 (cosine similarity)
  similarityType: 'behavioral' | 'preference' | 'psychographic' | 'combined';
  calculation: {
    method: 'cosine' | 'pearson' | 'jaccard' | 'euclidean';
    parameters: Record<string, any>;
    lastUpdated: Date;
  };
  sharedInteractions: number;
  confidence: number; // 0-1
  createdAt: Date;
  updatedAt: Date;
}

const UserSimilaritySchema: Schema = new Schema({
  userId1: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userId2: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  similarityScore: {
    type: Number,
    min: -1,
    max: 1,
    required: true,
  },
  similarityType: {
    type: String,
    enum: ['behavioral', 'preference', 'psychographic', 'combined'],
    required: true,
  },
  calculation: {
    method: {
      type: String,
      enum: ['cosine', 'pearson', 'jaccard', 'euclidean'],
      required: true,
    },
    parameters: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  sharedInteractions: {
    type: Number,
    default: 0,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5,
  },
}, {
  timestamps: true,
});

// Ensure user pairs are unique and ordered
UserSimilaritySchema.index({ userId1: 1, userId2: 1 }, { unique: true });
UserSimilaritySchema.index({ similarityScore: -1 });
UserSimilaritySchema.index({ similarityType: 1, similarityScore: -1 });

// Item embeddings for content-based filtering
export interface IItemEmbedding extends Document {
  itemId: string;
  itemType: string;
  embedding: number[]; // Vector representation
  model: {
    name: string;
    version: string;
    dimensions: number;
  };
  metadata: {
    textLength: number;
    language: string;
    topics: string[];
    quality: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ItemEmbeddingSchema: Schema = new Schema({
  itemId: {
    type: String,
    required: true,
    unique: true,
  },
  itemType: {
    type: String,
    required: true,
  },
  embedding: [Number],
  model: {
    name: { type: String, required: true },
    version: { type: String, required: true },
    dimensions: { type: Number, required: true },
  },
  metadata: {
    textLength: Number,
    language: String,
    topics: [String],
    quality: Number,
  },
}, {
  timestamps: true,
});

// Indexes for embedding queries
ItemEmbeddingSchema.index({ itemId: 1, itemType: 1 }, { unique: true });
ItemEmbeddingSchema.index({ 'model.name': 1, 'model.version': 1 });

// A/B testing and experimentation
export interface IExperiment extends Document {
  id: string;
  name: string;
  description: string;
  type: 'ui' | 'feature' | 'algorithm' | 'content';
  status: 'draft' | 'active' | 'paused' | 'completed';

  variants: Array<{
    id: string;
    name: string;
    weight: number; // 0-100 percentage
    config: Record<string, any>;
  }>;

  targeting: {
    userSegments: string[];
    conditions: Record<string, any>;
    exclusions: string[];
  };

  metrics: Array<{
    name: string;
    type: 'conversion' | 'engagement' | 'retention' | 'satisfaction';
    goal: 'maximize' | 'minimize';
  }>;

  duration: {
    startDate: Date;
    endDate?: Date;
    maxUsers?: number;
  };

  results?: {
    variant: string;
    metrics: Record<string, number>;
    confidence: number;
    winner: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

const ExperimentSchema: Schema = new Schema({
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
    enum: ['ui', 'feature', 'algorithm', 'content'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft',
  },
  variants: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    weight: { type: Number, min: 0, max: 100, required: true },
    config: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  }],
  targeting: {
    userSegments: [String],
    conditions: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    exclusions: [String],
  },
  metrics: [{
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['conversion', 'engagement', 'retention', 'satisfaction'],
      required: true,
    },
    goal: {
      type: String,
      enum: ['maximize', 'minimize'],
      required: true,
    },
  }],
  duration: {
    startDate: { type: Date, required: true },
    endDate: Date,
    maxUsers: Number,
  },
  results: {
    variant: String,
    metrics: {
      type: Map,
      of: Number,
    },
    confidence: Number,
    winner: Boolean,
  },
}, {
  timestamps: true,
});

// Indexes for experiment queries
ExperimentSchema.index({ status: 1, 'duration.startDate': 1 });
ExperimentSchema.index({ type: 1, status: 1 });

export const ContentItem = mongoose.models.ContentItem || mongoose.model<IContentItem>('ContentItem', ContentItemSchema);
export const UserItemInteraction = mongoose.models.UserItemInteraction || mongoose.model<IUserItemInteraction>('UserItemInteraction', UserItemInteractionSchema);
export const Recommendation = mongoose.models.Recommendation || mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
export const UserSimilarity = mongoose.models.UserSimilarity || mongoose.model<IUserSimilarity>('UserSimilarity', UserSimilaritySchema);
export const ItemEmbedding = mongoose.models.ItemEmbedding || mongoose.model<IItemEmbedding>('ItemEmbedding', ItemEmbeddingSchema);
export const Experiment = mongoose.models.Experiment || mongoose.model<IExperiment>('Experiment', ExperimentSchema);

export default {
  ContentItem,
  UserItemInteraction,
  Recommendation,
  UserSimilarity,
  ItemEmbedding,
  Experiment,
};