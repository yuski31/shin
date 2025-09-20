import mongoose, { Document, Schema } from 'mongoose';

export interface IInspirationSource extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  domain: string; // art, science, technology, literature, music, nature, etc.
  sourceType: 'book' | 'article' | 'artwork' | 'music' | 'video' | 'person' | 'experience' | 'concept' | 'place' | 'historical_event';
  tags: string[];
  metadata: {
    author?: string;
    year?: number;
    genre?: string;
    style?: string;
    url?: string;
    location?: string;
    significance?: string;
  };
  content: {
    summary?: string;
    keyConcepts: string[];
    themes: string[];
    emotionalTone?: 'inspiring' | 'melancholic' | 'energetic' | 'peaceful' | 'thoughtful' | 'dramatic';
    complexity: number; // 1-10 scale
  };
  connections: {
    relatedDomains: string[];
    crossReferences: {
      sourceId: mongoose.Types.ObjectId;
      connectionType: 'similar_theme' | 'contrasting_approach' | 'evolutionary_development' | 'inspirational_source';
      strength: number; // 1-10 scale
      description: string;
    }[];
  };
  usage: {
    timesReferenced: number;
    lastUsed: Date;
    mostSuccessfulContext?: string;
    averageImpact: number; // 1-10 scale
  };
  rating: {
    userRating: number; // 1-10 scale
    systemRating: number; // 1-10 scale based on usage patterns
    communityRating?: number; // 1-10 scale from other users
  };
  accessibility: 'private' | 'shared' | 'public' | 'curated';
  createdAt: Date;
  updatedAt: Date;
}

const InspirationSourceSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  domain: {
    type: String,
    required: true,
    trim: true,
  },
  sourceType: {
    type: String,
    enum: ['book', 'article', 'artwork', 'music', 'video', 'person', 'experience', 'concept', 'place', 'historical_event'],
    required: true,
  },
  tags: [{
    type: String,
  }],
  metadata: {
    author: { type: String, default: null },
    year: { type: Number, default: null },
    genre: { type: String, default: null },
    style: { type: String, default: null },
    url: { type: String, default: null },
    location: { type: String, default: null },
    significance: { type: String, default: null },
  },
  content: {
    summary: { type: String, default: null },
    keyConcepts: [{ type: String }],
    themes: [{ type: String }],
    emotionalTone: {
      type: String,
      enum: ['inspiring', 'melancholic', 'energetic', 'peaceful', 'thoughtful', 'dramatic'],
      default: null,
    },
    complexity: { type: Number, min: 1, max: 10, default: 5 },
  },
  connections: {
    relatedDomains: [{ type: String }],
    crossReferences: [{
      sourceId: {
        type: Schema.Types.ObjectId,
        ref: 'InspirationSource',
        required: true,
      },
      connectionType: {
        type: String,
        enum: ['similar_theme', 'contrasting_approach', 'evolutionary_development', 'inspirational_source'],
        required: true,
      },
      strength: { type: Number, min: 1, max: 10, required: true },
      description: { type: String, required: true },
    }],
  },
  usage: {
    timesReferenced: { type: Number, default: 0 },
    lastUsed: { type: Date, default: null },
    mostSuccessfulContext: { type: String, default: null },
    averageImpact: { type: Number, min: 1, max: 10, default: 5 },
  },
  rating: {
    userRating: { type: Number, min: 1, max: 10, default: 5 },
    systemRating: { type: Number, min: 1, max: 10, default: 5 },
    communityRating: { type: Number, min: 1, max: 10, default: null },
  },
  accessibility: {
    type: String,
    enum: ['private', 'shared', 'public', 'curated'],
    default: 'private',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
InspirationSourceSchema.index({ userId: 1, domain: 1 });
InspirationSourceSchema.index({ domain: 1 });
InspirationSourceSchema.index({ sourceType: 1 });
InspirationSourceSchema.index({ tags: 1 });
InspirationSourceSchema.index({ 'rating.systemRating': -1 });

export default mongoose.models.InspirationSource || mongoose.model<IInspirationSource>('InspirationSource', InspirationSourceSchema);