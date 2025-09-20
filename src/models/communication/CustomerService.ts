import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomerServiceChannel {
  type: 'email' | 'chat' | 'phone' | 'social' | 'sms' | 'web';
  channelId: string;
  metadata: {
    platform?: string; // facebook, twitter, whatsapp, etc.
    threadId?: string;
    messageId?: string;
    senderId?: string;
    recipientId?: string;
  };
}

export interface ICustomerServiceIntent {
  id: string;
  primary: string;
  secondary?: string;
  confidence: number;
  hierarchy: string[]; // hierarchical classification path
  entities: {
    name: string;
    value: string;
    confidence: number;
    position: {
      start: number;
      end: number;
    };
  }[];
  sentiment: {
    polarity: number; // -1 to 1
    magnitude: number; // 0 to infinity
    emotions: string[];
  };
}

export interface ICustomerServiceMessage {
  id: string;
  channel: ICustomerServiceChannel;
  direction: 'inbound' | 'outbound';
  sender: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    role: 'customer' | 'agent' | 'bot' | 'system';
  };
  content: {
    text?: string;
    attachments?: {
      type: 'image' | 'video' | 'audio' | 'document' | 'location';
      url: string;
      filename?: string;
      size?: number;
    }[];
    metadata: {
      language?: string;
      sentiment?: number;
      urgency?: 'low' | 'medium' | 'high' | 'critical';
      priority?: number;
    };
  };
  timestamp: Date;
  processingTime?: number;
  responseTime?: number;
  status: 'received' | 'processing' | 'responded' | 'escalated' | 'closed';
}

export interface ICustomerServiceEscalation {
  id: string;
  reason: 'complexity' | 'sentiment' | 'urgency' | 'manual' | 'timeout' | 'churn_risk';
  confidence: number;
  predictedChurn: number; // 0-1 probability
  factors: {
    name: string;
    value: number;
    weight: number;
  }[];
  escalatedAt: Date;
  escalatedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolution?: string;
}

export interface ICustomerServiceResolution {
  id: string;
  type: 'automated' | 'agent_assisted' | 'escalated' | 'self_service';
  outcome: 'resolved' | 'partially_resolved' | 'unresolved' | 'escalated';
  satisfaction?: number; // 1-5
  firstResponseTime: number; // seconds
  resolutionTime: number; // seconds
  botHandoff: boolean;
  handoffReason?: string;
  qualityScore: number; // 0-1
  feedback?: {
    rating: number;
    comments?: string;
    submittedAt: Date;
  };
}

export interface ICustomerServiceConversation {
  id: string;
  organizationId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    customerId?: string;
    segment?: string;
    lifetimeValue?: number;
    previousTickets?: number;
    satisfactionHistory?: number[];
  };
  status: 'active' | 'resolved' | 'escalated' | 'closed' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ICustomerServiceChannel[];
  messages: ICustomerServiceMessage[];
  intents: ICustomerServiceIntent[];
  escalations: ICustomerServiceEscalation[];
  resolution?: ICustomerServiceResolution;
  metadata: {
    totalMessages: number;
    responseCount: number;
    averageResponseTime: number;
    firstResponseTime: number;
    resolutionTime: number;
    satisfaction?: number;
    churnRisk: number;
    sentimentTrend: number[];
    topics: string[];
    languages: string[];
    automatedResponses: number;
    agentHandoffs: number;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface ICustomerServiceTicket extends Document {
  id: string;
  organizationId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  subcategory?: string;
  tags: string[];
  customerId?: mongoose.Types.ObjectId;
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    customerId?: string;
    segment?: string;
    lifetimeValue?: number;
    satisfactionHistory?: number[];
  };
  assignedTo?: mongoose.Types.ObjectId;
  assignedTeam?: string;
  conversations: ICustomerServiceConversation[];
  intents: ICustomerServiceIntent[];
  escalations: ICustomerServiceEscalation[];
  resolution?: ICustomerServiceResolution;
  satisfaction?: {
    rating: number; // 1-5
    feedback?: string;
    submittedAt: Date;
  };
  metadata: {
    totalConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    firstResponseTime: number;
    resolutionTime: number;
    churnRisk: number;
    sentimentScore: number;
    automatedResolutionRate: number;
    escalationRate: number;
    satisfactionTrend: number[];
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

const CustomerServiceChannelSchema = new Schema({
  type: {
    type: String,
    enum: ['email', 'chat', 'phone', 'social', 'sms', 'web'],
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  metadata: {
    platform: String,
    threadId: String,
    messageId: String,
    senderId: String,
    recipientId: String,
  },
}, { _id: true });

const CustomerServiceIntentSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  primary: {
    type: String,
    required: true,
  },
  secondary: String,
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  hierarchy: [String],
  entities: [{
    name: String,
    value: String,
    confidence: Number,
    position: {
      start: Number,
      end: Number,
    },
  }],
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

const CustomerServiceMessageSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  channel: CustomerServiceChannelSchema,
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true,
  },
  sender: {
    id: {
      type: String,
      required: true,
    },
    name: String,
    email: String,
    phone: String,
    role: {
      type: String,
      enum: ['customer', 'agent', 'bot', 'system'],
      required: true,
    },
  },
  content: {
    text: String,
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'location'],
      },
      url: String,
      filename: String,
      size: Number,
    }],
    metadata: {
      language: String,
      sentiment: Number,
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      priority: Number,
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  processingTime: Number,
  responseTime: Number,
  status: {
    type: String,
    enum: ['received', 'processing', 'responded', 'escalated', 'closed'],
    default: 'received',
  },
}, { _id: true });

const CustomerServiceEscalationSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    enum: ['complexity', 'sentiment', 'urgency', 'manual', 'timeout', 'churn_risk'],
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  predictedChurn: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  factors: [{
    name: String,
    value: Number,
    weight: Number,
  }],
  escalatedAt: {
    type: Date,
    default: Date.now,
  },
  escalatedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: Date,
  resolution: String,
}, { _id: true });

const CustomerServiceResolutionSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['automated', 'agent_assisted', 'escalated', 'self_service'],
    required: true,
  },
  outcome: {
    type: String,
    enum: ['resolved', 'partially_resolved', 'unresolved', 'escalated'],
    required: true,
  },
  satisfaction: {
    type: Number,
    min: 1,
    max: 5,
  },
  firstResponseTime: {
    type: Number,
    required: true,
  },
  resolutionTime: {
    type: Number,
    required: true,
  },
  botHandoff: {
    type: Boolean,
    default: false,
  },
  handoffReason: String,
  qualityScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comments: String,
    submittedAt: Date,
  },
}, { _id: true });

const CustomerServiceConversationSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    customerId: String,
    segment: String,
    lifetimeValue: Number,
    previousTickets: Number,
    satisfactionHistory: [Number],
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'escalated', 'closed', 'abandoned'],
    default: 'active',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  channels: [CustomerServiceChannelSchema],
  messages: [CustomerServiceMessageSchema],
  intents: [CustomerServiceIntentSchema],
  escalations: [CustomerServiceEscalationSchema],
  resolution: CustomerServiceResolutionSchema,
  metadata: {
    totalMessages: Number,
    responseCount: Number,
    averageResponseTime: Number,
    firstResponseTime: Number,
    resolutionTime: Number,
    satisfaction: Number,
    churnRisk: Number,
    sentimentTrend: [Number],
    topics: [String],
    languages: [String],
    automatedResponses: Number,
    agentHandoffs: Number,
  },
}, {
  timestamps: true,
  _id: true
});

const CustomerServiceTicketSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'pending', 'resolved', 'closed', 'escalated'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  category: {
    type: String,
    required: true,
  },
  subcategory: String,
  tags: [String],
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    customerId: String,
    segment: String,
    lifetimeValue: Number,
    satisfactionHistory: [Number],
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedTeam: String,
  conversations: [CustomerServiceConversationSchema],
  intents: [CustomerServiceIntentSchema],
  escalations: [CustomerServiceEscalationSchema],
  resolution: CustomerServiceResolutionSchema,
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    submittedAt: Date,
  },
  metadata: {
    totalConversations: Number,
    totalMessages: Number,
    averageResponseTime: Number,
    firstResponseTime: Number,
    resolutionTime: Number,
    churnRisk: Number,
    sentimentScore: Number,
    automatedResolutionRate: Number,
    escalationRate: Number,
    satisfactionTrend: [Number],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CustomerServiceTicketSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
CustomerServiceTicketSchema.index({ assignedTo: 1, status: 1 });
CustomerServiceTicketSchema.index({ priority: 1, status: 1 });
CustomerServiceTicketSchema.index({ category: 1, subcategory: 1 });
CustomerServiceTicketSchema.index({ 'customerInfo.customerId': 1 });
CustomerServiceTicketSchema.index({ 'metadata.churnRisk': -1 });
CustomerServiceTicketSchema.index({ 'metadata.satisfaction': 1 });

export default mongoose.models.CustomerServiceTicket || mongoose.model<ICustomerServiceTicket>('CustomerServiceTicket', CustomerServiceTicketSchema);