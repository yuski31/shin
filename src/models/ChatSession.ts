import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  providerId?: mongoose.Types.ObjectId;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    responseTime?: number;
  };
}

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  title: string;
  mode: 'single' | 'multi';
  providers: mongoose.Types.ObjectId[]; // For multi mode
  messages: IMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'AIProvider',
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    model: String,
    tokens: Number,
    responseTime: Number,
  },
}, { _id: true });

const ChatSessionSchema: Schema = new Schema({
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
  mode: {
    type: String,
    enum: ['single', 'multi'],
    required: true,
  },
  providers: [{
    type: Schema.Types.ObjectId,
    ref: 'AIProvider',
    required: true,
  }],
  messages: [MessageSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ChatSessionSchema.index({ userId: 1 });
ChatSessionSchema.index({ organization: 1 });
ChatSessionSchema.index({ userId: 1, isActive: 1 });
ChatSessionSchema.index({ organization: 1, isActive: 1 });
ChatSessionSchema.index({ userId: 1, updatedAt: -1 });
ChatSessionSchema.index({ organization: 1, updatedAt: -1 });

export default mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
