import mongoose, { Document, ObjectId } from 'mongoose';

export interface IStreamEvent extends Document {
  _id: ObjectId;
  organizationId: ObjectId;
  eventType: string;
  eventId: string;
  timestamp: Date;
  source: string;
  data: Record<string, any>;
  schemaVersion: string;
  processed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: EventMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventMetadata {
  quality: DataQuality;
  source: string;
  tags: string[];
  processingTime?: number;
  errorMessage?: string;
}

export interface DataQuality {
  score: number;
  issues: string[];
  validated: boolean;
}

const StreamEventSchema = new mongoose.Schema<IStreamEvent>({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  schemaVersion: {
    type: String,
    required: true,
    default: '1.0'
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  metadata: {
    quality: {
      score: { type: Number, min: 0, max: 1 },
      issues: [String],
      validated: Boolean
    },
    source: String,
    tags: [String],
    processingTime: Number,
    errorMessage: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
StreamEventSchema.index({ organizationId: 1, timestamp: -1 });
StreamEventSchema.index({ eventType: 1, timestamp: -1 });
StreamEventSchema.index({ processingStatus: 1, timestamp: 1 });

export default mongoose.models.StreamEvent || mongoose.model<IStreamEvent>('StreamEvent', StreamEventSchema);