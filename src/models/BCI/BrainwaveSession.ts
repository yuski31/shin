import mongoose, { Document, Schema } from 'mongoose';

export interface IBrainwaveData {
  timestamp: Date;
  frequency: number;
  amplitude: number;
  channel: string;
  quality: number;
  metadata?: {
    electrodePosition?: string;
    signalToNoiseRatio?: number;
    artifacts?: string[];
  };
}

export interface IBrainwavePattern {
  patternId: string;
  patternType: 'alpha' | 'beta' | 'theta' | 'delta' | 'gamma' | 'custom';
  frequencyRange: {
    min: number;
    max: number;
  };
  characteristics: {
    averageAmplitude: number;
    peakFrequency: number;
    duration: number;
    stability: number;
  };
  confidence: number;
  detectedAt: Date;
}

export interface IBCISession extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  sessionType: 'cognitive-assessment' | 'neurofeedback' | 'bci-control' | 'research' | 'therapy';
  status: 'active' | 'paused' | 'completed' | 'archived';
  deviceInfo: {
    deviceType: 'eeg-headset' | 'implant' | 'wearable' | 'desktop' | 'mobile';
    model: string;
    serialNumber: string;
    channels: string[];
    samplingRate: number;
    connectionType: 'bluetooth' | 'usb' | 'wifi' | 'wired';
  };
  brainwaveData: IBrainwaveData[];
  patterns: IBrainwavePattern[];
  metrics: {
    attention: {
      score: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      baseline: number;
    };
    relaxation: {
      score: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      baseline: number;
    };
    cognitiveLoad: {
      score: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      baseline: number;
    };
    stress: {
      score: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      baseline: number;
    };
    focus: {
      score: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      baseline: number;
    };
  };
  controls: {
    commands: Array<{
      command: string;
      confidence: number;
      timestamp: Date;
      brainwaveSignature: string;
    }>;
    accuracy: number;
    responseTime: number;
  };
  analysis: {
    cognitiveState: 'focused' | 'distracted' | 'relaxed' | 'stressed' | 'fatigued' | 'alert';
    recommendations: string[];
    insights: Array<{
      type: 'pattern' | 'anomaly' | 'trend' | 'correlation';
      description: string;
      confidence: number;
      timestamp: Date;
    }>;
    biomarkers: Record<string, number>;
  };
  settings: {
    realTimeProcessing: boolean;
    artifactDetection: boolean;
    adaptiveThresholds: boolean;
    dataRetention: number; // days
    privacyMode: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // minutes
}

const BrainwaveDataSchema = new Schema({
  timestamp: {
    type: Date,
    required: true,
  },
  frequency: {
    type: Number,
    required: true,
    min: 0.5,
    max: 100,
  },
  amplitude: {
    type: Number,
    required: true,
  },
  channel: {
    type: String,
    required: true,
  },
  quality: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  metadata: {
    electrodePosition: String,
    signalToNoiseRatio: Number,
    artifacts: [String],
  },
}, { _id: true });

const BrainwavePatternSchema = new Schema({
  patternId: {
    type: String,
    required: true,
  },
  patternType: {
    type: String,
    enum: ['alpha', 'beta', 'theta', 'delta', 'gamma', 'custom'],
    required: true,
  },
  frequencyRange: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  characteristics: {
    averageAmplitude: {
      type: Number,
      required: true,
    },
    peakFrequency: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    stability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  detectedAt: {
    type: Date,
    required: true,
  },
}, { _id: true });

const BCISessionSchema: Schema = new Schema({
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
  sessionType: {
    type: String,
    enum: ['cognitive-assessment', 'neurofeedback', 'bci-control', 'research', 'therapy'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active',
  },
  deviceInfo: {
    deviceType: {
      type: String,
      enum: ['eeg-headset', 'implant', 'wearable', 'desktop', 'mobile'],
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    serialNumber: {
      type: String,
      required: true,
    },
    channels: [String],
    samplingRate: {
      type: Number,
      required: true,
      min: 100,
      max: 2000,
    },
    connectionType: {
      type: String,
      enum: ['bluetooth', 'usb', 'wifi', 'wired'],
      required: true,
    },
  },
  brainwaveData: [BrainwaveDataSchema],
  patterns: [BrainwavePatternSchema],
  metrics: {
    attention: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
        default: 'stable',
      },
      baseline: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
    },
    relaxation: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
        default: 'stable',
      },
      baseline: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
    },
    cognitiveLoad: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
        default: 'stable',
      },
      baseline: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
    },
    stress: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
        default: 'stable',
      },
      baseline: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
    },
    focus: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
        default: 'stable',
      },
      baseline: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
    },
  },
  controls: {
    commands: [{
      command: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      timestamp: Date,
      brainwaveSignature: String,
    }],
    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    responseTime: {
      type: Number,
      default: 0,
    },
  },
  analysis: {
    cognitiveState: {
      type: String,
      enum: ['focused', 'distracted', 'relaxed', 'stressed', 'fatigued', 'alert'],
      default: 'focused',
    },
    recommendations: [String],
    insights: [{
      type: {
        type: String,
        enum: ['pattern', 'anomaly', 'trend', 'correlation'],
      },
      description: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      timestamp: Date,
    }],
    biomarkers: Schema.Types.Mixed,
  },
  settings: {
    realTimeProcessing: {
      type: Boolean,
      default: true,
    },
    artifactDetection: {
      type: Boolean,
      default: true,
    },
    adaptiveThresholds: {
      type: Boolean,
      default: true,
    },
    dataRetention: {
      type: Number,
      default: 90,
    },
    privacyMode: {
      type: Boolean,
      default: false,
    },
  },
  startedAt: Date,
  endedAt: Date,
  duration: Number,
}, {
  timestamps: true,
});

// Indexes for better query performance
BCISessionSchema.index({ userId: 1, organization: 1 });
BCISessionSchema.index({ sessionType: 1, status: 1 });
BCISessionSchema.index({ 'deviceInfo.deviceType': 1 });
BCISessionSchema.index({ 'metrics.attention.score': -1 });
BCISessionSchema.index({ 'analysis.cognitiveState': 1 });
BCISessionSchema.index({ createdAt: -1 });
BCISessionSchema.index({ startedAt: -1 });

export default mongoose.models.BCISession || mongoose.model<IBCISession>('BCISession', BCISessionSchema);