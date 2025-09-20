import mongoose, { Document, Schema } from 'mongoose';

export interface IXRSession extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  sessionType: 'mixed-reality' | 'haptic-feedback' | 'digital-human' | 'collaborative';
  status: 'active' | 'paused' | 'completed' | 'archived';
  participants: mongoose.Types.ObjectId[];
  settings: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    maxParticipants: number;
    duration: number; // in minutes
    recording: boolean;
    streaming: boolean;
  };
  metadata: {
    deviceInfo?: {
      type: string;
      capabilities: string[];
      sensors: string[];
    };
    environment?: {
      type: 'indoor' | 'outdoor' | 'mixed';
      lighting: 'low' | 'medium' | 'high';
      noiseLevel: 'quiet' | 'moderate' | 'loud';
    };
    performance?: {
      fps: number;
      latency: number;
      bandwidth: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

const XRSessionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
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
  sessionType: {
    type: String,
    enum: ['mixed-reality', 'haptic-feedback', 'digital-human', 'collaborative'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active',
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  settings: {
    quality: {
      type: String,
      enum: ['low', 'medium', 'high', 'ultra'],
      default: 'medium',
    },
    maxParticipants: {
      type: Number,
      default: 10,
      max: 100,
    },
    duration: {
      type: Number,
      default: 60, // 60 minutes
    },
    recording: {
      type: Boolean,
      default: false,
    },
    streaming: {
      type: Boolean,
      default: false,
    },
  },
  metadata: {
    deviceInfo: {
      type: {
        type: String,
        enum: ['hmd', 'mobile', 'desktop', 'tablet'],
      },
      capabilities: [String],
      sensors: [String],
    },
    environment: {
      type: {
        type: String,
        enum: ['indoor', 'outdoor', 'mixed'],
      },
      lighting: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      noiseLevel: {
        type: String,
        enum: ['quiet', 'moderate', 'loud'],
      },
    },
    performance: {
      fps: Number,
      latency: Number,
      bandwidth: Number,
    },
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
XRSessionSchema.index({ userId: 1, organization: 1 });
XRSessionSchema.index({ sessionType: 1, status: 1 });
XRSessionSchema.index({ createdAt: -1 });
XRSessionSchema.index({ participants: 1 });

export default mongoose.models.XRSession || mongoose.model<IXRSession>('XRSession', XRSessionSchema);