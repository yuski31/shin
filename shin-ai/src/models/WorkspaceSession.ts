import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspaceSessionParticipant {
  userId: mongoose.Types.ObjectId;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  permissions: {
    canEdit: boolean;
    canChat: boolean;
    canShareScreen: boolean;
    canInvite: boolean;
  };
  connectionInfo: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
  };
}

export interface IWorkspaceSession extends Document {
  workspaceId: mongoose.Types.ObjectId;
  sessionId: string;
  name: string;
  description?: string;
  participants: IWorkspaceSessionParticipant[];
  status: 'active' | 'ended' | 'paused';
  sessionType: 'notebook' | 'code' | 'experiment' | 'review' | 'meeting';
  metadata: {
    startedAt: Date;
    endedAt?: Date;
    duration?: number; // minutes
    totalParticipants: number;
    maxConcurrentParticipants: number;
    filesAccessed: string[];
    operationsPerformed: number;
    lastActivityAt: Date;
  };
  settings: {
    maxParticipants: number;
    allowGuestAccess: boolean;
    requireAuthentication: boolean;
    autoSave: boolean;
    saveInterval: number; // seconds
    enableChat: boolean;
    enableScreenShare: boolean;
    enableFileUpload: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSessionParticipantSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  permissions: {
    canEdit: { type: Boolean, default: true },
    canChat: { type: Boolean, default: true },
    canShareScreen: { type: Boolean, default: false },
    canInvite: { type: Boolean, default: false },
  },
  connectionInfo: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
  },
}, { _id: true });

const WorkspaceSessionSchema: Schema = new Schema({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  participants: [WorkspaceSessionParticipantSchema],
  status: {
    type: String,
    enum: ['active', 'ended', 'paused'],
    default: 'active',
  },
  sessionType: {
    type: String,
    enum: ['notebook', 'code', 'experiment', 'review', 'meeting'],
    required: true,
  },
  metadata: {
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    duration: Number,
    totalParticipants: {
      type: Number,
      default: 0,
    },
    maxConcurrentParticipants: {
      type: Number,
      default: 0,
    },
    filesAccessed: [String],
    operationsPerformed: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  settings: {
    maxParticipants: {
      type: Number,
      default: 20,
    },
    allowGuestAccess: {
      type: Boolean,
      default: false,
    },
    requireAuthentication: {
      type: Boolean,
      default: true,
    },
    autoSave: {
      type: Boolean,
      default: true,
    },
    saveInterval: {
      type: Number,
      default: 30, // seconds
    },
    enableChat: {
      type: Boolean,
      default: true,
    },
    enableScreenShare: {
      type: Boolean,
      default: true,
    },
    enableFileUpload: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
WorkspaceSessionSchema.index({ workspaceId: 1 });
WorkspaceSessionSchema.index({ sessionId: 1 }, { unique: true });
WorkspaceSessionSchema.index({ status: 1 });
WorkspaceSessionSchema.index({ sessionType: 1 });
WorkspaceSessionSchema.index({ 'metadata.startedAt': -1 });
WorkspaceSessionSchema.index({ 'participants.userId': 1 });
WorkspaceSessionSchema.index({ 'metadata.lastActivityAt': -1 });

// Pre-save middleware to generate sessionId
WorkspaceSessionSchema.pre('save', function(next) {
  const doc = this as any;
  if (doc.isNew && !doc.sessionId) {
    doc.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method to add participant to session
WorkspaceSessionSchema.methods.addParticipant = function(
  userId: mongoose.Types.ObjectId,
  permissions: IWorkspaceSessionParticipant['permissions'],
  connectionInfo: IWorkspaceSessionParticipant['connectionInfo']
): void {
  const existingParticipant = this.participants.find((p: IWorkspaceSessionParticipant) =>
    p.userId.toString() === userId.toString()
  );

  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.leftAt = undefined;
    existingParticipant.connectionInfo = connectionInfo;
    existingParticipant.permissions = permissions;
  } else {
    this.participants.push({
      userId,
      joinedAt: new Date(),
      isActive: true,
      permissions,
      connectionInfo,
    });
  }

  this.metadata.totalParticipants = this.participants.length;
  this.metadata.maxConcurrentParticipants = Math.max(
    this.metadata.maxConcurrentParticipants,
    this.participants.filter((p: IWorkspaceSessionParticipant) => p.isActive).length
  );
  this.metadata.lastActivityAt = new Date();
};

// Method to remove participant from session
WorkspaceSessionSchema.methods.removeParticipant = function(userId: mongoose.Types.ObjectId): void {
  const participant = this.participants.find((p: IWorkspaceSessionParticipant) =>
    p.userId.toString() === userId.toString()
  );

  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
    this.metadata.lastActivityAt = new Date();
  }
};

// Method to update session activity
WorkspaceSessionSchema.methods.updateActivity = function(filesAccessed: string[] = []): void {
  this.metadata.operationsPerformed += 1;
  this.metadata.lastActivityAt = new Date();

  if (filesAccessed.length > 0) {
    filesAccessed.forEach(file => {
      if (!this.metadata.filesAccessed.includes(file)) {
        this.metadata.filesAccessed.push(file);
      }
    });
  }
};

// Method to end session
WorkspaceSessionSchema.methods.endSession = function(): void {
  this.status = 'ended';
  this.metadata.endedAt = new Date();
  this.metadata.duration = Math.round(
    (this.metadata.endedAt.getTime() - this.metadata.startedAt.getTime()) / (1000 * 60)
  );

  // Mark all participants as inactive
  this.participants.forEach((p: IWorkspaceSessionParticipant) => {
    if (p.isActive) {
      p.isActive = false;
      p.leftAt = new Date();
    }
  });
};

// Static method to find active sessions for workspace
WorkspaceSessionSchema.statics.findActiveByWorkspace = function(workspaceId: mongoose.Types.ObjectId) {
  return this.find({
    workspaceId,
    status: 'active'
  });
};

// Static method to find sessions by user
WorkspaceSessionSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    'participants.userId': userId,
    status: { $in: ['active', 'paused'] }
  });
};

// Static method to get session analytics
WorkspaceSessionSchema.statics.getAnalytics = function(workspaceId: mongoose.Types.ObjectId, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        workspaceId: workspaceId,
        'metadata.startedAt': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$metadata.startedAt' } },
          sessionType: '$sessionType'
        },
        count: { $sum: 1 },
        totalDuration: { $sum: '$metadata.duration' },
        avgParticipants: { $avg: '$metadata.maxConcurrentParticipants' }
      }
    }
  ]);
};

export default mongoose.models.WorkspaceSession || mongoose.model<IWorkspaceSession>('WorkspaceSession', WorkspaceSessionSchema);