import mongoose, { Document, Schema } from 'mongoose';

export interface IMemoryItem extends Document {
  palaceId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: {
    type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
    data: string; // Base64 encoded or URL
    metadata?: {
      duration?: number; // for audio/video
      dimensions?: {
        width: number;
        height: number;
      }; // for images
      wordCount?: number; // for text
    };
  };
  associations: Array<{
    type: 'visual' | 'spatial' | 'emotional' | 'logical';
    description: string;
    strength: number; // 1-10
  }>;
  compression: {
    isCompressed: boolean;
    originalSize: number;
    compressedSize: number;
    algorithm: 'none' | 'gzip' | 'lz4' | 'custom';
    compressionRatio: number;
  };
  recall: {
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number; // 1-100
    lastRecallDate?: Date;
    nextRecallDate?: Date;
    recallStreak: number;
    totalRecalls: number;
    successfulRecalls: number;
    averageRecallTime: number; // in seconds
  };
  realityAnchoring: {
    isVerified: boolean;
    verificationMethod?: 'cross-reference' | 'external-source' | 'user-confirmation';
    confidenceScore: number; // 1-100
    lastVerified?: Date;
    verificationNotes?: string;
  };
  sharing: {
    isShared: boolean;
    sharedWith: mongoose.Types.ObjectId[];
    sharePermissions: {
      view: boolean;
      edit: boolean;
      delete: boolean;
      copy: boolean;
    };
    shareExpiry?: Date;
  };
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    accessCount: number;
    lastAccessed?: Date;
  };
  isArchived: boolean;
  isDeleted: boolean;
}

const MemoryItemSchema: Schema = new Schema({
  palaceId: {
    type: Schema.Types.ObjectId,
    ref: 'MemoryPalace',
    required: true,
  },
  locationId: {
    type: Schema.Types.ObjectId,
    ref: 'MemoryLocation',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'video', 'mixed'],
      required: true,
    },
    data: {
      type: String,
      required: true,
    },
    metadata: {
      duration: Number,
      dimensions: {
        width: Number,
        height: Number,
      },
      wordCount: Number,
    },
  },
  associations: [{
    type: {
      type: String,
      enum: ['visual', 'spatial', 'emotional', 'logical'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    strength: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
  }],
  compression: {
    isCompressed: {
      type: Boolean,
      default: false,
    },
    originalSize: {
      type: Number,
      default: 0,
    },
    compressedSize: {
      type: Number,
      default: 0,
    },
    algorithm: {
      type: String,
      enum: ['none', 'gzip', 'lz4', 'custom'],
      default: 'none',
    },
    compressionRatio: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 100,
    },
  },
  recall: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    confidence: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
    },
    lastRecallDate: {
      type: Date,
      default: null,
    },
    nextRecallDate: {
      type: Date,
      default: null,
    },
    recallStreak: {
      type: Number,
      default: 0,
    },
    totalRecalls: {
      type: Number,
      default: 0,
    },
    successfulRecalls: {
      type: Number,
      default: 0,
    },
    averageRecallTime: {
      type: Number,
      default: 0,
    },
  },
  realityAnchoring: {
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationMethod: {
      type: String,
      enum: ['cross-reference', 'external-source', 'user-confirmation'],
    },
    confidenceScore: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
    },
    lastVerified: {
      type: Date,
      default: null,
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  sharing: {
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedWith: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    sharePermissions: {
      view: {
        type: Boolean,
        default: true,
      },
      edit: {
        type: Boolean,
        default: false,
      },
      delete: {
        type: Boolean,
        default: false,
      },
      copy: {
        type: Boolean,
        default: false,
      },
    },
    shareExpiry: {
      type: Date,
      default: null,
    },
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
      default: null,
    },
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
MemoryItemSchema.index({ palaceId: 1, locationId: 1 });
MemoryItemSchema.index({ userId: 1, createdAt: -1 });
MemoryItemSchema.index({ userId: 1, isArchived: 1 });
MemoryItemSchema.index({ 'recall.nextRecallDate': 1 });
MemoryItemSchema.index({ 'recall.difficulty': 1 });
MemoryItemSchema.index({ priority: 1 });
MemoryItemSchema.index({ tags: 1 });
MemoryItemSchema.index({ category: 1 });
MemoryItemSchema.index({ 'sharing.isShared': 1 });
MemoryItemSchema.index({ isDeleted: 1 });

export default mongoose.models.MemoryItem || mongoose.model<IMemoryItem>('MemoryItem', MemoryItemSchema);