import mongoose, { Document, Schema } from 'mongoose';

export interface IArtisticOutput extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  contentType: 'text' | 'image' | 'audio' | 'video' | 'mixed_media' | 'design' | 'music';
  medium: 'writing' | 'painting' | 'drawing' | 'sculpture' | 'photography' | 'digital_art' | 'music' | 'video' | 'animation' | 'design';
  genre?: string;
  style?: string;
  content: {
    text?: string;
    imageUrls?: string[];
    audioUrls?: string[];
    videoUrls?: string[];
    metadata?: {
      dimensions?: { width: number; height: number };
      duration?: number; // for audio/video in seconds
      fileSize?: number;
      format?: string;
      resolution?: string;
    };
  };
  enhancement: {
    applied: {
      name: string;
      type: 'style_transfer' | 'color_harmony' | 'rhythm_enhancement' | 'genre_fusion' | 'tempo_synchronization';
      parameters: { [key: string]: any };
      timestamp: Date;
    }[];
    originalVersion?: mongoose.Types.ObjectId; // Reference to previous version
    improvementScore: number; // 1-10 scale
  };
  metrics: {
    creativityScore: number; // 1-10 scale
    technicalQuality: number; // 1-10 scale
    emotionalImpact: number; // 1-10 scale
    originality: number; // 1-10 scale
    completion: number; // 1-10 scale
  };
  feedback: {
    userRating?: number; // 1-10 scale
    expertReview?: {
      score: number;
      comments: string;
      reviewerId: mongoose.Types.ObjectId;
      timestamp: Date;
    }[];
    publicShares: number;
    likes: number;
    comments: {
      userId: mongoose.Types.ObjectId;
      content: string;
      timestamp: Date;
    }[];
  };
  visibility: 'private' | 'shared' | 'public' | 'portfolio';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ArtisticOutputSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'CreativeSession',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'mixed_media', 'design', 'music'],
    required: true,
  },
  medium: {
    type: String,
    enum: ['writing', 'painting', 'drawing', 'sculpture', 'photography', 'digital_art', 'music', 'video', 'animation', 'design'],
    required: true,
  },
  genre: {
    type: String,
    default: null,
  },
  style: {
    type: String,
    default: null,
  },
  content: {
    text: { type: String, default: null },
    imageUrls: [{ type: String }],
    audioUrls: [{ type: String }],
    videoUrls: [{ type: String }],
    metadata: {
      dimensions: {
        width: { type: Number, default: null },
        height: { type: Number, default: null },
      },
      duration: { type: Number, default: null },
      fileSize: { type: Number, default: null },
      format: { type: String, default: null },
      resolution: { type: String, default: null },
    },
  },
  enhancement: {
    applied: [{
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['style_transfer', 'color_harmony', 'rhythm_enhancement', 'genre_fusion', 'tempo_synchronization'],
        required: true,
      },
      parameters: { type: Schema.Types.Mixed },
      timestamp: { type: Date, default: Date.now },
    }],
    originalVersion: {
      type: Schema.Types.ObjectId,
      ref: 'ArtisticOutput',
      default: null,
    },
    improvementScore: { type: Number, min: 1, max: 10, default: 5 },
  },
  metrics: {
    creativityScore: { type: Number, min: 1, max: 10, default: 5 },
    technicalQuality: { type: Number, min: 1, max: 10, default: 5 },
    emotionalImpact: { type: Number, min: 1, max: 10, default: 5 },
    originality: { type: Number, min: 1, max: 10, default: 5 },
    completion: { type: Number, min: 1, max: 10, default: 5 },
  },
  feedback: {
    userRating: { type: Number, min: 1, max: 10, default: null },
    expertReview: [{
      score: { type: Number, min: 1, max: 10, required: true },
      comments: { type: String, required: true },
      reviewerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      timestamp: { type: Date, default: Date.now },
    }],
    publicShares: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    }],
  },
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public', 'portfolio'],
    default: 'private',
  },
  tags: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Indexes for better query performance
ArtisticOutputSchema.index({ userId: 1, createdAt: -1 });
ArtisticOutputSchema.index({ sessionId: 1 });
ArtisticOutputSchema.index({ contentType: 1 });
ArtisticOutputSchema.index({ medium: 1 });
ArtisticOutputSchema.index({ visibility: 1 });
ArtisticOutputSchema.index({ 'metrics.creativityScore': -1 });

export default mongoose.models.ArtisticOutput || mongoose.model<IArtisticOutput>('ArtisticOutput', ArtisticOutputSchema);