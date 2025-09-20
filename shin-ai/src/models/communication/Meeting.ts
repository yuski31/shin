import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetingParticipant {
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: 'organizer' | 'participant' | 'guest';
  joinedAt: Date;
  leftAt?: Date;
  audioQuality?: 'good' | 'fair' | 'poor';
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: {
      joy: number;
      anger: number;
      sadness: number;
      fear: number;
      surprise: number;
    };
  };
}

export interface IMeetingActionItem {
  id: string;
  description: string;
  assignee?: mongoose.Types.ObjectId | string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  context?: string;
  confidence: number;
}

export interface IMeetingTranscript {
  id: string;
  speaker: string;
  speakerId?: string;
  text: string;
  timestamp: Date;
  startTime: number; // seconds from meeting start
  endTime: number;
  confidence: number;
  sentiment?: {
    polarity: number; // -1 to 1
    magnitude: number; // 0 to infinity
    emotions: string[];
  };
}

export interface IMeetingSummary {
  id: string;
  type: 'extractive' | 'abstractive' | 'hybrid';
  content: string;
  keyPoints: string[];
  decisions: string[];
  generatedAt: Date;
  confidence: number;
  model?: string;
}

export interface IMeeting extends Document {
  title: string;
  description?: string;
  organizationId: mongoose.Types.ObjectId;
  organizerId: mongoose.Types.ObjectId;
  participants: IMeetingParticipant[];
  scheduledStart: Date;
  actualStart?: Date;
  actualEnd?: Date;
  duration?: number; // minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  meetingType: 'internal' | 'external' | 'interview' | 'training' | 'other';
  platform: 'zoom' | 'teams' | 'webex' | 'gotomeeting' | 'custom';
  recordingUrl?: string;
  transcript: IMeetingTranscript[];
  actionItems: IMeetingActionItem[];
  summaries: IMeetingSummary[];
  metadata: {
    totalParticipants: number;
    averageSentiment: number;
    dominantEmotions: string[];
    topics: string[];
    language: string;
    audioQuality: 'good' | 'fair' | 'poor';
    transcriptionConfidence: number;
  };
  followUps: {
    type: 'email' | 'task' | 'calendar' | 'reminder';
    recipient: mongoose.Types.ObjectId | string;
    content: string;
    scheduledFor?: Date;
    sentAt?: Date;
    status: 'pending' | 'sent' | 'failed';
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MeetingParticipantSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['organizer', 'participant', 'guest'],
    default: 'participant',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: {
    type: Date,
    default: null,
  },
  audioQuality: {
    type: String,
    enum: ['good', 'fair', 'poor'],
    default: 'good',
  },
  sentiment: {
    overall: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    emotions: {
      joy: Number,
      anger: Number,
      sadness: Number,
      fear: Number,
      surprise: Number,
    },
  },
}, { _id: true });

const MeetingActionItemSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  assignee: {
    type: Schema.Types.Mixed, // ObjectId or string
    default: null,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  dueDate: {
    type: Date,
    default: null,
  },
  context: {
    type: String,
    default: null,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
}, { timestamps: true });

const MeetingTranscriptSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  speaker: {
    type: String,
    required: true,
  },
  speakerId: {
    type: String,
    default: null,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  startTime: {
    type: Number,
    required: true,
  },
  endTime: {
    type: Number,
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  sentiment: {
    polarity: {
      type: Number,
      min: -1,
      max: 1,
    },
    magnitude: {
      type: Number,
      min: 0,
    },
    emotions: [String],
  },
}, { _id: true });

const MeetingSummarySchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['extractive', 'abstractive', 'hybrid'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  keyPoints: [String],
  decisions: [String],
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  model: {
    type: String,
    default: null,
  },
}, { _id: true });

const MeetingFollowUpSchema = new Schema({
  type: {
    type: String,
    enum: ['email', 'task', 'calendar', 'reminder'],
    required: true,
  },
  recipient: {
    type: Schema.Types.Mixed, // ObjectId or string
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  scheduledFor: {
    type: Date,
    default: null,
  },
  sentAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
}, { _id: true });

const MeetingSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  organizerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [MeetingParticipantSchema],
  scheduledStart: {
    type: Date,
    required: true,
  },
  actualStart: {
    type: Date,
    default: null,
  },
  actualEnd: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'scheduled',
  },
  meetingType: {
    type: String,
    enum: ['internal', 'external', 'interview', 'training', 'other'],
    default: 'internal',
  },
  platform: {
    type: String,
    enum: ['zoom', 'teams', 'webex', 'gotomeeting', 'custom'],
    default: 'custom',
  },
  recordingUrl: {
    type: String,
    default: null,
  },
  transcript: [MeetingTranscriptSchema],
  actionItems: [MeetingActionItemSchema],
  summaries: [MeetingSummarySchema],
  metadata: {
    totalParticipants: Number,
    averageSentiment: Number,
    dominantEmotions: [String],
    topics: [String],
    language: {
      type: String,
      default: 'en',
    },
    audioQuality: {
      type: String,
      enum: ['good', 'fair', 'poor'],
      default: 'good',
    },
    transcriptionConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
  },
  followUps: [MeetingFollowUpSchema],
}, {
  timestamps: true,
});

// Indexes for better query performance
MeetingSchema.index({ organizationId: 1, scheduledStart: -1 });
MeetingSchema.index({ organizerId: 1, status: 1 });
MeetingSchema.index({ status: 1, actualStart: -1 });
MeetingSchema.index({ 'participants.userId': 1 });
MeetingSchema.index({ 'actionItems.status': 1 });
MeetingSchema.index({ 'actionItems.assignee': 1 });
MeetingSchema.index({ 'followUps.status': 1 });

export default mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);