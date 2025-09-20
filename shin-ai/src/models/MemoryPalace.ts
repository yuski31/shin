import mongoose, { Document, Schema } from 'mongoose';

export interface IMemoryPalace extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  isPublic: boolean;
  isTemplate: boolean;
  template?: string;
  imageUrl?: string;
  structure: {
    type: 'image-based' | 'custom' | 'template';
    rooms: Array<{
      id: string;
      name: string;
      description?: string;
      position: {
        x: number;
        y: number;
        z: number;
      };
      dimensions: {
        width: number;
        height: number;
        depth: number;
      };
      color?: string;
      imageUrl?: string;
    }>;
    connections: Array<{
      fromRoomId: string;
      toRoomId: string;
      type: 'door' | 'hallway' | 'stairs';
    }>;
  };
  settings: {
    enableSpatialAudio: boolean;
    enableCompression: boolean;
    autoBackup: boolean;
    privacyLevel: 'private' | 'shared' | 'public';
  };
  metadata: {
    totalMemories: number;
    totalLocations: number;
    lastAccessed?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  analytics: {
    totalRecallSessions: number;
    averageRecallAccuracy: number;
    mostUsedRoom?: string;
    leastUsedRoom?: string;
  };
}

const MemoryPalaceSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  template: {
    type: String,
    enum: ['roman-villa', 'medieval-castle', 'modern-house', 'custom'],
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  structure: {
    type: {
      type: String,
      enum: ['image-based', 'custom', 'template'],
      required: true,
    },
    rooms: [{
      id: {
        type: String,
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
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true },
      },
      dimensions: {
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        depth: { type: Number, required: true },
      },
      color: String,
      imageUrl: String,
    }],
    connections: [{
      fromRoomId: {
        type: String,
        required: true,
      },
      toRoomId: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['door', 'hallway', 'stairs'],
        required: true,
      },
    }],
  },
  settings: {
    enableSpatialAudio: {
      type: Boolean,
      default: true,
    },
    enableCompression: {
      type: Boolean,
      default: true,
    },
    autoBackup: {
      type: Boolean,
      default: true,
    },
    privacyLevel: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
    },
  },
  metadata: {
    totalMemories: {
      type: Number,
      default: 0,
    },
    totalLocations: {
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
  analytics: {
    totalRecallSessions: {
      type: Number,
      default: 0,
    },
    averageRecallAccuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    mostUsedRoom: String,
    leastUsedRoom: String,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
MemoryPalaceSchema.index({ userId: 1, createdAt: -1 });
MemoryPalaceSchema.index({ userId: 1, isPublic: 1 });
MemoryPalaceSchema.index({ isTemplate: 1, template: 1 });
MemoryPalaceSchema.index({ 'metadata.totalMemories': -1 });
MemoryPalaceSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.MemoryPalace || mongoose.model<IMemoryPalace>('MemoryPalace', MemoryPalaceSchema);