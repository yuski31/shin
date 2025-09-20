import mongoose, { Document, Schema } from 'mongoose';

export interface IMemoryLocation extends Document {
  palaceId: mongoose.Types.ObjectId;
  roomId: string;
  name: string;
  description?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  type: 'fixed' | 'dynamic';
  capacity: number;
  currentOccupancy: number;
  visualMarkers: Array<{
    type: 'image' | 'color' | 'shape' | 'text';
    position: {
      x: number;
      y: number;
      z: number;
    };
    content: string;
    size: number;
  }>;
  audioCue?: {
    soundFile: string;
    volume: number;
    loop: boolean;
    triggerDistance: number;
  };
  accessibility: {
    isAccessible: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    specialInstructions?: string;
  };
  metadata: {
    totalMemories: number;
    recallCount: number;
    averageRecallTime: number; // in seconds
    lastAccessed?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  tags: string[];
  isActive: boolean;
}

const MemoryLocationSchema: Schema = new Schema({
  palaceId: {
    type: Schema.Types.ObjectId,
    ref: 'MemoryPalace',
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  type: {
    type: String,
    enum: ['fixed', 'dynamic'],
    default: 'fixed',
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 50,
    default: 10,
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0,
  },
  visualMarkers: [{
    type: {
      type: String,
      enum: ['image', 'color', 'shape', 'text'],
      required: true,
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
    },
    content: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 10,
    },
  }],
  audioCue: {
    soundFile: String,
    volume: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    loop: {
      type: Boolean,
      default: false,
    },
    triggerDistance: {
      type: Number,
      default: 5,
      min: 1,
      max: 50,
    },
  },
  accessibility: {
    isAccessible: {
      type: Boolean,
      default: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  metadata: {
    totalMemories: {
      type: Number,
      default: 0,
    },
    recallCount: {
      type: Number,
      default: 0,
    },
    averageRecallTime: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
MemoryLocationSchema.index({ palaceId: 1, roomId: 1 });
MemoryLocationSchema.index({ palaceId: 1, isActive: 1 });
MemoryLocationSchema.index({ 'metadata.totalMemories': -1 });
MemoryLocationSchema.index({ 'metadata.lastAccessed': -1 });
MemoryLocationSchema.index({ tags: 1 });
MemoryLocationSchema.index({ type: 1 });

export default mongoose.models.MemoryLocation || mongoose.model<IMemoryLocation>('MemoryLocation', MemoryLocationSchema);