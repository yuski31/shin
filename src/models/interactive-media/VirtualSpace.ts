import mongoose, { Document, Schema } from 'mongoose';

export interface IVirtualSpaceEnvironment {
  type: 'indoor' | 'outdoor' | 'underwater' | 'space' | 'fantasy' | 'custom';
  weather: {
    type: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
    intensity: number;
    windSpeed: number;
    windDirection: {
      x: number;
      y: number;
      z: number;
    };
  };
  timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night' | 'custom';
  lighting: {
    ambientColor: string;
    ambientIntensity: number;
    sunPosition: {
      x: number;
      y: number;
      z: number;
    };
    sunColor: string;
    sunIntensity: number;
  };
  physics: {
    gravity: {
      x: number;
      y: number;
      z: number;
    };
    airDensity: number;
    waterDensity: number;
    enableCollisions: boolean;
  };
}

export interface IVirtualSpaceObject {
  id: string;
  name: string;
  type: 'static' | 'interactive' | 'animated' | 'physics' | 'trigger';
  modelUrl: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
  physics: {
    mass: number;
    drag: number;
    angularDrag: number;
    useGravity: boolean;
    isKinematic: boolean;
    collisionShape: 'box' | 'sphere' | 'capsule' | 'mesh';
  };
  interactions: Array<{
    trigger: 'proximity' | 'collision' | 'gaze' | 'gesture' | 'click';
    action: string;
    parameters: Record<string, any>;
    cooldown: number;
  }>;
  animations: Array<{
    name: string;
    duration: number;
    loop: boolean;
    autoPlay: boolean;
    triggers: string[];
  }>;
  metadata: Record<string, any>;
}

export interface IVirtualSpaceZone {
  id: string;
  name: string;
  type: 'safe' | 'danger' | 'quest' | 'social' | 'economic' | 'restricted';
  boundaries: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  rules: {
    allowBuilding: boolean;
    allowCombat: boolean;
    allowTrading: boolean;
    allowMagic: boolean;
    maxOccupancy: number;
    entryRequirements: string[];
    environmentalEffects: Array<{
      type: 'healing' | 'damage' | 'buff' | 'debuff';
      value: number;
      frequency: number;
    }>;
  };
  aesthetics: {
    groundTexture: string;
    skyColor: string;
    ambientSound: string;
    particleEffects: string[];
  };
}

export interface IVirtualSpace extends Document {
  title: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  type: 'personal' | 'public' | 'private' | 'guild' | 'event' | 'commercial';
  capacity: {
    maxUsers: number;
    currentUsers: number;
    maxObjects: number;
    currentObjects: number;
  };
  environment: IVirtualSpaceEnvironment;
  objects: IVirtualSpaceObject[];
  zones: IVirtualSpaceZone[];
  economy: {
    currency: string;
    tradingEnabled: boolean;
    marketplace: {
      enabled: boolean;
      taxRate: number;
      allowedItems: string[];
    };
    resources: Array<{
      name: string;
      type: 'mineral' | 'plant' | 'animal' | 'energy' | 'magic';
      spawnRate: number;
      maxQuantity: number;
      regenerationRate: number;
      locations: Array<{
        x: number;
        y: number;
        z: number;
      }>;
    }>;
  };
  social: {
    allowVoiceChat: boolean;
    allowTextChat: boolean;
    allowPrivateMessages: boolean;
    moderation: {
      enabled: boolean;
      autoModeration: boolean;
      bannedWords: string[];
      maxMessageRate: number;
    };
    groups: Array<{
      id: string;
      name: string;
      maxMembers: number;
      permissions: string[];
    }>;
  };
  permissions: {
    access: 'public' | 'invite_only' | 'password' | 'whitelist';
    password?: string;
    whitelist: mongoose.Types.ObjectId[];
    roles: Array<{
      name: string;
      permissions: string[];
      maxUsers: number;
    }>;
  };
  events: Array<{
    id: string;
    name: string;
    description: string;
    startTime: Date;
    endTime: Date;
    maxParticipants: number;
    currentParticipants: number;
    location: {
      x: number;
      y: number;
      z: number;
    };
    type: 'gathering' | 'competition' | 'performance' | 'educational' | 'social';
    rewards: Array<{
      type: 'currency' | 'item' | 'experience' | 'achievement';
      value: number;
      name: string;
    }>;
  }>;
  analytics: {
    totalVisits: number;
    uniqueVisitors: number;
    averageSessionTime: number;
    popularZones: Array<{
      zoneId: string;
      visitCount: number;
      averageTime: number;
    }>;
    economicData: {
      totalTransactions: number;
      totalValue: number;
      averageTransactionValue: number;
      topTraders: Array<{
        userId: string;
        totalValue: number;
        transactionCount: number;
      }>;
    };
    socialData: {
      totalMessages: number;
      activeUsers: number;
      groupFormations: number;
      conflictIncidents: number;
    };
  };
  settings: {
    persistence: boolean;
    backupFrequency: number; // hours
    allowUserGeneratedContent: boolean;
    contentModeration: boolean;
    physicsEnabled: boolean;
    networking: {
      region: string;
      maxLatency: number;
      allowP2P: boolean;
    };
  };
  metadata: {
    version: string;
    createdFrom: 'template' | 'scratch' | 'import';
    templateId?: string;
    thumbnailUrl: string;
    tags: string[];
    category: string;
    rating: number;
    reviewCount: number;
    lastMaintenance: Date;
    serverRegion: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VirtualSpaceEnvironmentSchema = new Schema({
  type: {
    type: String,
    enum: ['indoor', 'outdoor', 'underwater', 'space', 'fantasy', 'custom'],
    default: 'outdoor',
  },
  weather: {
    type: {
      type: String,
      enum: ['clear', 'rain', 'snow', 'fog', 'storm'],
      default: 'clear',
    },
    intensity: { type: Number, default: 0 },
    windSpeed: { type: Number, default: 0 },
    windDirection: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
  },
  timeOfDay: {
    type: String,
    enum: ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night', 'custom'],
    default: 'noon',
  },
  lighting: {
    ambientColor: { type: String, default: '#ffffff' },
    ambientIntensity: { type: Number, default: 1.0 },
    sunPosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 1 },
      z: { type: Number, default: 0 },
    },
    sunColor: { type: String, default: '#ffffff' },
    sunIntensity: { type: Number, default: 1.0 },
  },
  physics: {
    gravity: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: -9.81 },
      z: { type: Number, default: 0 },
    },
    airDensity: { type: Number, default: 1.225 },
    waterDensity: { type: Number, default: 1000 },
    enableCollisions: { type: Boolean, default: true },
  },
});

const VirtualSpaceObjectSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['static', 'interactive', 'animated', 'physics', 'trigger'],
    default: 'static',
  },
  modelUrl: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  rotation: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
    w: { type: Number, required: true },
  },
  scale: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  physics: {
    mass: { type: Number, default: 1.0 },
    drag: { type: Number, default: 0 },
    angularDrag: { type: Number, default: 0.05 },
    useGravity: { type: Boolean, default: true },
    isKinematic: { type: Boolean, default: false },
    collisionShape: {
      type: String,
      enum: ['box', 'sphere', 'capsule', 'mesh'],
      default: 'box',
    },
  },
  interactions: [{
    trigger: {
      type: String,
      enum: ['proximity', 'collision', 'gaze', 'gesture', 'click'],
      required: true,
    },
    action: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed, default: {} },
    cooldown: { type: Number, default: 0 },
  }],
  animations: [{
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    loop: { type: Boolean, default: false },
    autoPlay: { type: Boolean, default: false },
    triggers: [{ type: String }],
  }],
  metadata: { type: Schema.Types.Mixed, default: {} },
});

const VirtualSpaceZoneSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['safe', 'danger', 'quest', 'social', 'economic', 'restricted'],
    default: 'safe',
  },
  boundaries: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  }],
  rules: {
    allowBuilding: { type: Boolean, default: true },
    allowCombat: { type: Boolean, default: false },
    allowTrading: { type: Boolean, default: true },
    allowMagic: { type: Boolean, default: false },
    maxOccupancy: { type: Number, default: 100 },
    entryRequirements: [{ type: String }],
    environmentalEffects: [{
      type: {
        type: String,
        enum: ['healing', 'damage', 'buff', 'debuff'],
        required: true,
      },
      value: { type: Number, required: true },
      frequency: { type: Number, required: true },
    }],
  },
  aesthetics: {
    groundTexture: { type: String },
    skyColor: { type: String, default: '#87CEEB' },
    ambientSound: { type: String },
    particleEffects: [{ type: String }],
  },
});

const VirtualSpaceSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['personal', 'public', 'private', 'guild', 'event', 'commercial'],
    default: 'public',
  },
  capacity: {
    maxUsers: { type: Number, default: 100 },
    currentUsers: { type: Number, default: 0 },
    maxObjects: { type: Number, default: 1000 },
    currentObjects: { type: Number, default: 0 },
  },
  environment: { type: VirtualSpaceEnvironmentSchema, required: true },
  objects: [VirtualSpaceObjectSchema],
  zones: [VirtualSpaceZoneSchema],
  economy: {
    currency: { type: String, default: 'credits' },
    tradingEnabled: { type: Boolean, default: true },
    marketplace: {
      enabled: { type: Boolean, default: true },
      taxRate: { type: Number, default: 0.05 },
      allowedItems: [{ type: String }],
    },
    resources: [{
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['mineral', 'plant', 'animal', 'energy', 'magic'],
        required: true,
      },
      spawnRate: { type: Number, default: 1.0 },
      maxQuantity: { type: Number, default: 100 },
      regenerationRate: { type: Number, default: 1.0 },
      locations: [{
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true },
      }],
    }],
  },
  social: {
    allowVoiceChat: { type: Boolean, default: true },
    allowTextChat: { type: Boolean, default: true },
    allowPrivateMessages: { type: Boolean, default: true },
    moderation: {
      enabled: { type: Boolean, default: true },
      autoModeration: { type: Boolean, default: true },
      bannedWords: [{ type: String }],
      maxMessageRate: { type: Number, default: 10 },
    },
    groups: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      maxMembers: { type: Number, default: 50 },
      permissions: [{ type: String }],
    }],
  },
  permissions: {
    access: {
      type: String,
      enum: ['public', 'invite_only', 'password', 'whitelist'],
      default: 'public',
    },
    password: { type: String },
    whitelist: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    roles: [{
      name: { type: String, required: true },
      permissions: [{ type: String }],
      maxUsers: { type: Number, default: 10 },
    }],
  },
  events: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    maxParticipants: { type: Number, default: 50 },
    currentParticipants: { type: Number, default: 0 },
    location: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
    },
    type: {
      type: String,
      enum: ['gathering', 'competition', 'performance', 'educational', 'social'],
      required: true,
    },
    rewards: [{
      type: {
        type: String,
        enum: ['currency', 'item', 'experience', 'achievement'],
        required: true,
      },
      value: { type: Number, required: true },
      name: { type: String, required: true },
    }],
  }],
  analytics: {
    totalVisits: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    averageSessionTime: { type: Number, default: 0 },
    popularZones: [{
      zoneId: { type: String, required: true },
      visitCount: { type: Number, default: 0 },
      averageTime: { type: Number, default: 0 },
    }],
    economicData: {
      totalTransactions: { type: Number, default: 0 },
      totalValue: { type: Number, default: 0 },
      averageTransactionValue: { type: Number, default: 0 },
      topTraders: [{
        userId: { type: String, required: true },
        totalValue: { type: Number, default: 0 },
        transactionCount: { type: Number, default: 0 },
      }],
    },
    socialData: {
      totalMessages: { type: Number, default: 0 },
      activeUsers: { type: Number, default: 0 },
      groupFormations: { type: Number, default: 0 },
      conflictIncidents: { type: Number, default: 0 },
    },
  },
  settings: {
    persistence: { type: Boolean, default: true },
    backupFrequency: { type: Number, default: 24 },
    allowUserGeneratedContent: { type: Boolean, default: true },
    contentModeration: { type: Boolean, default: true },
    physicsEnabled: { type: Boolean, default: true },
    networking: {
      region: { type: String, default: 'us-east-1' },
      maxLatency: { type: Number, default: 100 },
      allowP2P: { type: Boolean, default: true },
    },
  },
  metadata: {
    version: { type: String, default: '1.0.0' },
    createdFrom: {
      type: String,
      enum: ['template', 'scratch', 'import'],
      default: 'template',
    },
    templateId: { type: String },
    thumbnailUrl: { type: String },
    tags: [{ type: String }],
    category: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    lastMaintenance: { type: Date, default: Date.now },
    serverRegion: { type: String, default: 'us-east-1' },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
VirtualSpaceSchema.index({ organizationId: 1 });
VirtualSpaceSchema.index({ creatorId: 1 });
VirtualSpaceSchema.index({ title: 'text', description: 'text' });
VirtualSpaceSchema.index({ type: 1 });
VirtualSpaceSchema.index({ 'permissions.access': 1 });
VirtualSpaceSchema.index({ 'metadata.rating': -1 });
VirtualSpaceSchema.index({ 'analytics.totalVisits': -1 });
VirtualSpaceSchema.index({ createdAt: -1 });

// Method to update user count
VirtualSpaceSchema.methods.updateUserCount = function(delta: number): void {
  this.capacity.currentUsers = Math.max(0, this.capacity.currentUsers + delta);
  if (delta > 0) {
    this.analytics.totalVisits += 1;
  }
};

// Method to add object
VirtualSpaceSchema.methods.addObject = function(objectData: Partial<IVirtualSpaceObject>): IVirtualSpaceObject {
  const object: IVirtualSpaceObject = {
    id: `object_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: objectData.name || 'New Object',
    type: objectData.type || 'static',
    modelUrl: objectData.modelUrl || '',
    position: objectData.position || { x: 0, y: 0, z: 0 },
    rotation: objectData.rotation || { x: 0, y: 0, z: 0, w: 1 },
    scale: objectData.scale || { x: 1, y: 1, z: 1 },
    physics: objectData.physics || {
      mass: 1.0,
      drag: 0,
      angularDrag: 0.05,
      useGravity: true,
      isKinematic: false,
      collisionShape: 'box',
    },
    interactions: objectData.interactions || [],
    animations: objectData.animations || [],
    metadata: objectData.metadata || {},
  };

  this.objects.push(object);
  this.capacity.currentObjects += 1;
  return object;
};

// Method to update analytics
VirtualSpaceSchema.methods.updateAnalytics = function(
  sessionTime: number,
  zoneVisits: Array<{ zoneId: string; timeSpent: number }>,
  transactions: Array<{ value: number; type: string }>,
  socialActivity: { messages: number; groups: number; conflicts: number }
): void {
  this.analytics.averageSessionTime =
    (this.analytics.averageSessionTime * (this.analytics.totalVisits - 1) + sessionTime) / this.analytics.totalVisits;

  // Update zone popularity
  zoneVisits.forEach(visit => {
    const existing = this.analytics.popularZones.find((zone: any) => zone.zoneId === visit.zoneId);
    if (existing) {
      existing.visitCount += 1;
      existing.averageTime = (existing.averageTime * (existing.visitCount - 1) + visit.timeSpent) / existing.visitCount;
    } else {
      this.analytics.popularZones.push({
        zoneId: visit.zoneId,
        visitCount: 1,
        averageTime: visit.timeSpent,
      });
    }
  });

  // Update economic data
  transactions.forEach(transaction => {
    this.analytics.economicData.totalTransactions += 1;
    this.analytics.economicData.totalValue += transaction.value;
    this.analytics.economicData.averageTransactionValue =
      this.analytics.economicData.totalValue / this.analytics.economicData.totalTransactions;
  });

  // Update social data
  this.analytics.socialData.totalMessages += socialActivity.messages;
  this.analytics.socialData.groupFormations += socialActivity.groups;
  this.analytics.socialData.conflictIncidents += socialActivity.conflicts;
};

// Method to get space status
VirtualSpaceSchema.methods.getStatus = function(): {
  isOnline: boolean;
  occupancy: number;
  health: 'good' | 'warning' | 'critical';
  issues: string[];
} {
  const occupancy = this.capacity.currentUsers / this.capacity.maxUsers;
  const issues: string[] = [];

  if (occupancy > 0.9) issues.push('High occupancy');
  if (this.analytics.economicData.totalTransactions === 0) issues.push('No economic activity');
  if (this.analytics.socialData.conflictIncidents > 10) issues.push('High conflict rate');

  return {
    isOnline: true,
    occupancy,
    health: issues.length > 2 ? 'critical' : issues.length > 0 ? 'warning' : 'good',
    issues,
  };
};

export default mongoose.models.VirtualSpace || mongoose.model<IVirtualSpace>('VirtualSpace', VirtualSpaceSchema);