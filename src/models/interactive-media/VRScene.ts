import mongoose, { Document, Schema } from 'mongoose';

export interface IVRGazePoint {
  timestamp: Date;
  x: number;
  y: number;
  z: number;
  confidence: number;
  fixationDuration: number;
}

export interface IVRHapticPattern {
  id: string;
  name: string;
  duration: number;
  intensity: number;
  frequency: number;
  pattern: Array<{
    startTime: number;
    endTime: number;
    amplitude: number;
  }>;
}

export interface IVRGesture {
  id: string;
  name: string;
  hand: 'left' | 'right' | 'both';
  type: 'pinch' | 'grab' | 'point' | 'wave' | 'custom';
  confidence: number;
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  velocity: {
    x: number;
    y: number;
    z: number;
  };
}

export interface IVRSpatialAnchor {
  id: string;
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
  type: 'persistent' | 'temporary';
  metadata: Record<string, any>;
}

export interface IVRScene extends Document {
  title: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  environment: {
    type: '360_photo' | '360_video' | '3d_model' | 'procedural';
    skybox: {
      front: string;
      back: string;
      left: string;
      right: string;
      top: string;
      bottom: string;
    };
    lighting: {
      ambientColor: string;
      ambientIntensity: number;
      directionalLight: {
        color: string;
        intensity: number;
        direction: {
          x: number;
          y: number;
          z: number;
        };
      };
      pointLights: Array<{
        position: { x: number; y: number; z: number };
        color: string;
        intensity: number;
        range: number;
      }>;
    };
    audio: {
      ambient: string;
      spatial: Array<{
        position: { x: number; y: number; z: number };
        audioUrl: string;
        volume: number;
        loop: boolean;
      }>;
    };
  };
  interactions: {
    gazeTracking: {
      enabled: boolean;
      foveatedRendering: boolean;
      fixationThreshold: number;
      gazePoints: IVRGazePoint[];
    };
    gestureRecognition: {
      enabled: boolean;
      handTracking: boolean;
      gestures: IVRGesture[];
      sensitivity: number;
    };
    hapticFeedback: {
      enabled: boolean;
      patterns: IVRHapticPattern[];
      controllers: Array<{
        hand: 'left' | 'right';
        vibrationMotor: boolean;
        forceFeedback: boolean;
      }>;
    };
    spatialComputing: {
      slam: {
        enabled: boolean;
        trackingType: 'marker' | 'markerless' | 'hybrid';
        anchors: IVRSpatialAnchor[];
        mappingQuality: number;
      };
      occlusion: {
        enabled: boolean;
        depthEstimation: boolean;
        meshReconstruction: boolean;
      };
    };
  };
  objects: Array<{
    id: string;
    name: string;
    type: 'static' | 'interactive' | 'animated';
    modelUrl: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    scale: { x: number; y: number; z: number };
    physics: {
      enabled: boolean;
      mass: number;
      drag: number;
      angularDrag: number;
      useGravity: boolean;
      isKinematic: boolean;
    };
    interactions: Array<{
      trigger: 'gaze' | 'gesture' | 'proximity' | 'collision';
      action: string;
      parameters: Record<string, any>;
    }>;
    animations: Array<{
      name: string;
      duration: number;
      loop: boolean;
      autoPlay: boolean;
    }>;
  }>;
  settings: {
    maxUsers: number;
    isPublic: boolean;
    allowRecording: boolean;
    quality: 'low' | 'medium' | 'high' | 'ultra';
    targetFrameRate: number;
  };
  metadata: {
    version: string;
    duration: number;
    fileSize: number;
    thumbnailUrl: string;
    lastAccessed: Date;
    accessCount: number;
    averageRating: number;
    totalRatings: number;
  };
  analytics: {
    totalViews: number;
    uniqueUsers: number;
    averageSessionTime: number;
    popularObjects: Array<{
      objectId: string;
      interactionCount: number;
    }>;
    heatmaps: Array<{
      timestamp: Date;
      data: Record<string, any>;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VRGazePointSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  z: { type: Number, required: true },
  confidence: { type: Number, default: 1.0 },
  fixationDuration: { type: Number, default: 0 },
});

const VRHapticPatternSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  intensity: { type: Number, default: 1.0 },
  frequency: { type: Number, default: 1000 },
  pattern: [{
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    amplitude: { type: Number, required: true },
  }],
});

const VRGestureSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  hand: {
    type: String,
    enum: ['left', 'right', 'both'],
    default: 'right',
  },
  type: {
    type: String,
    enum: ['pinch', 'grab', 'point', 'wave', 'custom'],
    required: true,
  },
  confidence: { type: Number, default: 1.0 },
  landmarks: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  }],
  velocity: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
});

const VRSpatialAnchorSchema = new Schema({
  id: { type: String, required: true },
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
  type: {
    type: String,
    enum: ['persistent', 'temporary'],
    default: 'temporary',
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
});

const VRSceneSchema: Schema = new Schema({
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
  environment: {
    type: {
      type: String,
      enum: ['360_photo', '360_video', '3d_model', 'procedural'],
      default: '3d_model',
    },
    skybox: {
      front: { type: String },
      back: { type: String },
      left: { type: String },
      right: { type: String },
      top: { type: String },
      bottom: { type: String },
    },
    lighting: {
      ambientColor: { type: String, default: '#ffffff' },
      ambientIntensity: { type: Number, default: 1.0 },
      directionalLight: {
        color: { type: String, default: '#ffffff' },
        intensity: { type: Number, default: 1.0 },
        direction: {
          x: { type: Number, default: 0 },
          y: { type: Number, default: -1 },
          z: { type: Number, default: 0 },
        },
      },
      pointLights: [{
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          z: { type: Number, required: true },
        },
        color: { type: String, default: '#ffffff' },
        intensity: { type: Number, default: 1.0 },
        range: { type: Number, default: 10 },
      }],
    },
    audio: {
      ambient: { type: String },
      spatial: [{
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          z: { type: Number, required: true },
        },
        audioUrl: { type: String, required: true },
        volume: { type: Number, default: 1.0 },
        loop: { type: Boolean, default: true },
      }],
    },
  },
  interactions: {
    gazeTracking: {
      enabled: { type: Boolean, default: true },
      foveatedRendering: { type: Boolean, default: false },
      fixationThreshold: { type: Number, default: 0.5 },
      gazePoints: [VRGazePointSchema],
    },
    gestureRecognition: {
      enabled: { type: Boolean, default: true },
      handTracking: { type: Boolean, default: true },
      gestures: [VRGestureSchema],
      sensitivity: { type: Number, default: 0.8 },
    },
    hapticFeedback: {
      enabled: { type: Boolean, default: true },
      patterns: [VRHapticPatternSchema],
      controllers: [{
        hand: {
          type: String,
          enum: ['left', 'right'],
          required: true,
        },
        vibrationMotor: { type: Boolean, default: true },
        forceFeedback: { type: Boolean, default: false },
      }],
    },
    spatialComputing: {
      slam: {
        enabled: { type: Boolean, default: true },
        trackingType: {
          type: String,
          enum: ['marker', 'markerless', 'hybrid'],
          default: 'markerless',
        },
        anchors: [VRSpatialAnchorSchema],
        mappingQuality: { type: Number, default: 1.0 },
      },
      occlusion: {
        enabled: { type: Boolean, default: false },
        depthEstimation: { type: Boolean, default: false },
        meshReconstruction: { type: Boolean, default: false },
      },
    },
  },
  objects: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['static', 'interactive', 'animated'],
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
      enabled: { type: Boolean, default: false },
      mass: { type: Number, default: 1.0 },
      drag: { type: Number, default: 0 },
      angularDrag: { type: Number, default: 0.05 },
      useGravity: { type: Boolean, default: true },
      isKinematic: { type: Boolean, default: false },
    },
    interactions: [{
      trigger: {
        type: String,
        enum: ['gaze', 'gesture', 'proximity', 'collision'],
        required: true,
      },
      action: { type: String, required: true },
      parameters: { type: Schema.Types.Mixed, default: {} },
    }],
    animations: [{
      name: { type: String, required: true },
      duration: { type: Number, required: true },
      loop: { type: Boolean, default: false },
      autoPlay: { type: Boolean, default: false },
    }],
  }],
  settings: {
    maxUsers: { type: Number, default: 10 },
    isPublic: { type: Boolean, default: false },
    allowRecording: { type: Boolean, default: false },
    quality: {
      type: String,
      enum: ['low', 'medium', 'high', 'ultra'],
      default: 'high',
    },
    targetFrameRate: { type: Number, default: 90 },
  },
  metadata: {
    version: { type: String, default: '1.0.0' },
    duration: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    thumbnailUrl: { type: String },
    lastAccessed: { type: Date, default: null },
    accessCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
  },
  analytics: {
    totalViews: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    averageSessionTime: { type: Number, default: 0 },
    popularObjects: [{
      objectId: { type: String, required: true },
      interactionCount: { type: Number, default: 0 },
    }],
    heatmaps: [{
      timestamp: { type: Date, default: Date.now },
      data: { type: Schema.Types.Mixed, default: {} },
    }],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
VRSceneSchema.index({ organizationId: 1 });
VRSceneSchema.index({ creatorId: 1 });
VRSceneSchema.index({ title: 'text', description: 'text' });
VRSceneSchema.index({ 'settings.isPublic': 1 });
VRSceneSchema.index({ 'metadata.averageRating': -1 });
VRSceneSchema.index({ 'analytics.totalViews': -1 });
VRSceneSchema.index({ createdAt: -1 });

// Method to add gaze point
VRSceneSchema.methods.addGazePoint = function(gazePoint: Omit<IVRGazePoint, 'timestamp'>): IVRGazePoint {
  const point: IVRGazePoint = {
    ...gazePoint,
    timestamp: new Date(),
  };
  this.interactions.gazeTracking.gazePoints.push(point);
  return point;
};

// Method to add gesture
VRSceneSchema.methods.addGesture = function(gesture: Omit<IVRGesture, 'id'>): IVRGesture {
  const gestureWithId: IVRGesture = {
    ...gesture,
    id: `gesture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  this.interactions.gestureRecognition.gestures.push(gestureWithId);
  return gestureWithId;
};

// Method to update analytics
VRSceneSchema.methods.updateAnalytics = function(sessionTime: number, interactedObjects: string[]): void {
  this.analytics.totalViews += 1;
  this.analytics.averageSessionTime =
    (this.analytics.averageSessionTime * (this.analytics.totalViews - 1) + sessionTime) / this.analytics.totalViews;

  interactedObjects.forEach(objectId => {
    const existing = this.analytics.popularObjects.find((obj: any) => obj.objectId === objectId);
    if (existing) {
      existing.interactionCount += 1;
    } else {
      this.analytics.popularObjects.push({ objectId, interactionCount: 1 });
    }
  });
};

// Method to get scene quality settings
VRSceneSchema.methods.getQualitySettings = function(): {
  renderQuality: string;
  frameRate: number;
  enableFoveatedRendering: boolean;
} {
  const settings = this.settings;
  return {
    renderQuality: settings.quality,
    frameRate: settings.targetFrameRate,
    enableFoveatedRendering: this.interactions.gazeTracking.foveatedRendering,
  };
};

export default mongoose.models.VRScene || mongoose.model<IVRScene>('VRScene', VRSceneSchema);