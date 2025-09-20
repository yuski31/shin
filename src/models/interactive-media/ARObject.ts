import mongoose, { Document, Schema } from 'mongoose';

export interface IARPlane {
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
  size: {
    width: number;
    height: number;
  };
  confidence: number;
  type: 'horizontal' | 'vertical' | 'inclined';
  boundary: Array<{
    x: number;
    y: number;
    z: number;
  }>;
}

export interface IARMarker {
  id: string;
  type: 'qr_code' | 'barcode' | 'image' | 'object';
  data: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  size: {
    width: number;
    height: number;
  };
  confidence: number;
  metadata: Record<string, any>;
}

export interface IAROcclusionMesh {
  vertices: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  triangles: number[];
  normals: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  timestamp: Date;
  confidence: number;
}

export interface IARLightEstimation {
  ambientIntensity: number;
  ambientColor: {
    r: number;
    g: number;
    b: number;
  };
  directionalLight: {
    intensity: number;
    color: {
      r: number;
      g: number;
      b: number;
    };
    direction: {
      x: number;
      y: number;
      z: number;
    };
  };
  sphericalHarmonics: number[];
  timestamp: Date;
}

export interface IARObject extends Document {
  title: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  type: '3d_model' | 'image' | 'video' | 'text' | 'interactive' | 'animated';
  content: {
    modelUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    text?: string;
    interactive?: {
      type: 'button' | 'slider' | 'input' | 'webview';
      parameters: Record<string, any>;
    };
    animation?: {
      url: string;
      duration: number;
      loop: boolean;
      autoPlay: boolean;
    };
  };
  placement: {
    method: 'plane_detection' | 'marker_based' | 'manual' | 'gps';
    constraints: {
      planes: IARPlane[];
      markers: IARMarker[];
      manualPosition?: {
        x: number;
        y: number;
        z: number;
      };
      gpsCoordinates?: {
        latitude: number;
        longitude: number;
        altitude: number;
      };
    };
    alignment: 'gravity' | 'camera' | 'surface' | 'world';
    scale: {
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
  };
  interactions: {
    tap: {
      enabled: boolean;
      action: string;
      parameters: Record<string, any>;
    };
    pinch: {
      enabled: boolean;
      scaleEnabled: boolean;
      rotationEnabled: boolean;
      minScale: number;
      maxScale: number;
    };
    drag: {
      enabled: boolean;
      translationEnabled: boolean;
      constraints: {
        x: boolean;
        y: boolean;
        z: boolean;
      };
    };
    proximity: {
      enabled: boolean;
      radius: number;
      action: string;
      parameters: Record<string, any>;
    };
  };
  physics: {
    enabled: boolean;
    mass: number;
    drag: number;
    angularDrag: number;
    useGravity: boolean;
    isKinematic: boolean;
    collisionDetection: boolean;
    restitution: number;
    friction: number;
  };
  computerVision: {
    occlusion: {
      enabled: boolean;
      mesh: IAROcclusionMesh;
      depthEstimation: boolean;
      alphaBlending: boolean;
    };
    lighting: {
      enabled: boolean;
      estimation: IARLightEstimation;
      photometricCalibration: boolean;
      shadowCasting: boolean;
      shadowReceiving: boolean;
    };
    tracking: {
      type: 'continuous' | 'discrete';
      stability: number;
      quality: number;
      lostTrackingCount: number;
    };
  };
  realWorldMapping: {
    lidar: {
      enabled: boolean;
      pointCloud: Array<{
        x: number;
        y: number;
        z: number;
        intensity: number;
        timestamp: Date;
      }>;
      meshReconstruction: boolean;
      semanticSegmentation: boolean;
    };
    environment: {
      type: 'indoor' | 'outdoor' | 'mixed';
      weatherConditions: string[];
      timeOfDay: string;
      lightingConditions: string;
    };
  };
  settings: {
    isPersistent: boolean;
    isShared: boolean;
    maxDistance: number;
    cullDistance: number;
    renderQuality: 'low' | 'medium' | 'high' | 'ultra';
    updateRate: number;
  };
  metadata: {
    version: string;
    fileSize: number;
    thumbnailUrl: string;
    tags: string[];
    category: string;
    license: string;
    lastUpdated: Date;
    accessCount: number;
    averageRating: number;
    totalRatings: number;
  };
  analytics: {
    totalPlacements: number;
    uniqueUsers: number;
    averageSessionTime: number;
    interactionHeatmap: Array<{
      position: { x: number; y: number; z: number };
      interactionCount: number;
      timestamp: Date;
    }>;
    trackingData: Array<{
      timestamp: Date;
      trackingQuality: number;
      stability: number;
      position: { x: number; y: number; z: number };
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ARPlaneSchema = new Schema({
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
  size: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  confidence: { type: Number, default: 1.0 },
  type: {
    type: String,
    enum: ['horizontal', 'vertical', 'inclined'],
    default: 'horizontal',
  },
  boundary: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  }],
});

const ARMarkerSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['qr_code', 'barcode', 'image', 'object'],
    required: true,
  },
  data: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  size: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  confidence: { type: Number, default: 1.0 },
  metadata: { type: Schema.Types.Mixed, default: {} },
});

const AROcclusionMeshSchema = new Schema({
  vertices: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  }],
  triangles: [{ type: Number }],
  normals: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  }],
  timestamp: { type: Date, default: Date.now },
  confidence: { type: Number, default: 1.0 },
});

const ARLightEstimationSchema = new Schema({
  ambientIntensity: { type: Number, default: 1.0 },
  ambientColor: {
    r: { type: Number, default: 1.0 },
    g: { type: Number, default: 1.0 },
    b: { type: Number, default: 1.0 },
  },
  directionalLight: {
    intensity: { type: Number, default: 1.0 },
    color: {
      r: { type: Number, default: 1.0 },
      g: { type: Number, default: 1.0 },
      b: { type: Number, default: 1.0 },
    },
    direction: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: -1 },
      z: { type: Number, default: 0 },
    },
  },
  sphericalHarmonics: [{ type: Number }],
  timestamp: { type: Date, default: Date.now },
});

const ARObjectSchema: Schema = new Schema({
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
    enum: ['3d_model', 'image', 'video', 'text', 'interactive', 'animated'],
    required: true,
  },
  content: {
    modelUrl: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    text: { type: String },
    interactive: {
      type: {
        type: String,
        enum: ['button', 'slider', 'input', 'webview'],
      },
      parameters: { type: Schema.Types.Mixed, default: {} },
    },
    animation: {
      url: { type: String },
      duration: { type: Number },
      loop: { type: Boolean, default: false },
      autoPlay: { type: Boolean, default: false },
    },
  },
  placement: {
    method: {
      type: String,
      enum: ['plane_detection', 'marker_based', 'manual', 'gps'],
      default: 'plane_detection',
    },
    constraints: {
      planes: [ARPlaneSchema],
      markers: [ARMarkerSchema],
      manualPosition: {
        x: { type: Number },
        y: { type: Number },
        z: { type: Number },
      },
      gpsCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
        altitude: { type: Number },
      },
    },
    alignment: {
      type: String,
      enum: ['gravity', 'camera', 'surface', 'world'],
      default: 'gravity',
    },
    scale: {
      x: { type: Number, default: 1.0 },
      y: { type: Number, default: 1.0 },
      z: { type: Number, default: 1.0 },
    },
    rotation: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
      w: { type: Number, default: 1.0 },
    },
  },
  interactions: {
    tap: {
      enabled: { type: Boolean, default: true },
      action: { type: String },
      parameters: { type: Schema.Types.Mixed, default: {} },
    },
    pinch: {
      enabled: { type: Boolean, default: true },
      scaleEnabled: { type: Boolean, default: true },
      rotationEnabled: { type: Boolean, default: true },
      minScale: { type: Number, default: 0.1 },
      maxScale: { type: Number, default: 10.0 },
    },
    drag: {
      enabled: { type: Boolean, default: true },
      translationEnabled: { type: Boolean, default: true },
      constraints: {
        x: { type: Boolean, default: true },
        y: { type: Boolean, default: true },
        z: { type: Boolean, default: true },
      },
    },
    proximity: {
      enabled: { type: Boolean, default: false },
      radius: { type: Number, default: 1.0 },
      action: { type: String },
      parameters: { type: Schema.Types.Mixed, default: {} },
    },
  },
  physics: {
    enabled: { type: Boolean, default: false },
    mass: { type: Number, default: 1.0 },
    drag: { type: Number, default: 0 },
    angularDrag: { type: Number, default: 0.05 },
    useGravity: { type: Boolean, default: true },
    isKinematic: { type: Boolean, default: false },
    collisionDetection: { type: Boolean, default: true },
    restitution: { type: Number, default: 0.5 },
    friction: { type: Number, default: 0.5 },
  },
  computerVision: {
    occlusion: {
      enabled: { type: Boolean, default: false },
      mesh: AROcclusionMeshSchema,
      depthEstimation: { type: Boolean, default: false },
      alphaBlending: { type: Boolean, default: true },
    },
    lighting: {
      enabled: { type: Boolean, default: true },
      estimation: ARLightEstimationSchema,
      photometricCalibration: { type: Boolean, default: false },
      shadowCasting: { type: Boolean, default: true },
      shadowReceiving: { type: Boolean, default: true },
    },
    tracking: {
      type: {
        type: String,
        enum: ['continuous', 'discrete'],
        default: 'continuous',
      },
      stability: { type: Number, default: 1.0 },
      quality: { type: Number, default: 1.0 },
      lostTrackingCount: { type: Number, default: 0 },
    },
  },
  realWorldMapping: {
    lidar: {
      enabled: { type: Boolean, default: false },
      pointCloud: [{
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true },
        intensity: { type: Number, default: 1.0 },
        timestamp: { type: Date, default: Date.now },
      }],
      meshReconstruction: { type: Boolean, default: false },
      semanticSegmentation: { type: Boolean, default: false },
    },
    environment: {
      type: {
        type: String,
        enum: ['indoor', 'outdoor', 'mixed'],
        default: 'mixed',
      },
      weatherConditions: [{ type: String }],
      timeOfDay: { type: String },
      lightingConditions: { type: String },
    },
  },
  settings: {
    isPersistent: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false },
    maxDistance: { type: Number, default: 100 },
    cullDistance: { type: Number, default: 50 },
    renderQuality: {
      type: String,
      enum: ['low', 'medium', 'high', 'ultra'],
      default: 'high',
    },
    updateRate: { type: Number, default: 30 },
  },
  metadata: {
    version: { type: String, default: '1.0.0' },
    fileSize: { type: Number, default: 0 },
    thumbnailUrl: { type: String },
    tags: [{ type: String }],
    category: { type: String },
    license: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    accessCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
  },
  analytics: {
    totalPlacements: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    averageSessionTime: { type: Number, default: 0 },
    interactionHeatmap: [{
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true },
      },
      interactionCount: { type: Number, default: 0 },
      timestamp: { type: Date, default: Date.now },
    }],
    trackingData: [{
      timestamp: { type: Date, default: Date.now },
      trackingQuality: { type: Number, default: 1.0 },
      stability: { type: Number, default: 1.0 },
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true },
      },
    }],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ARObjectSchema.index({ organizationId: 1 });
ARObjectSchema.index({ creatorId: 1 });
ARObjectSchema.index({ title: 'text', description: 'text' });
ARObjectSchema.index({ type: 1 });
ARObjectSchema.index({ 'metadata.tags': 1 });
ARObjectSchema.index({ 'metadata.category': 1 });
ARObjectSchema.index({ 'metadata.averageRating': -1 });
ARObjectSchema.index({ 'analytics.totalPlacements': -1 });
ARObjectSchema.index({ createdAt: -1 });

// Method to update tracking data
ARObjectSchema.methods.updateTrackingData = function(
  trackingQuality: number,
  stability: number,
  position: { x: number; y: number; z: number }
): void {
  this.computerVision.tracking.trackingQuality = trackingQuality;
  this.computerVision.tracking.stability = stability;
  this.computerVision.tracking.lostTrackingCount += trackingQuality < 0.5 ? 1 : 0;

  this.analytics.trackingData.push({
    timestamp: new Date(),
    trackingQuality,
    stability,
    position,
  });

  // Keep only last 100 tracking data points
  if (this.analytics.trackingData.length > 100) {
    this.analytics.trackingData = this.analytics.trackingData.slice(-100);
  }
};

// Method to add interaction to heatmap
ARObjectSchema.methods.addInteractionToHeatmap = function(
  position: { x: number; y: number; z: number }
): void {
  const existingPoint = this.analytics.interactionHeatmap.find(
    (point: any) =>
      Math.abs(point.position.x - position.x) < 0.1 &&
      Math.abs(point.position.y - position.y) < 0.1 &&
      Math.abs(point.position.z - position.z) < 0.1
  );

  if (existingPoint) {
    existingPoint.interactionCount += 1;
    existingPoint.timestamp = new Date();
  } else {
    this.analytics.interactionHeatmap.push({
      position,
      interactionCount: 1,
      timestamp: new Date(),
    });
  }
};

// Method to update light estimation
ARObjectSchema.methods.updateLightEstimation = function(estimation: Partial<IARLightEstimation>): void {
  if (estimation.ambientIntensity !== undefined) {
    this.computerVision.lighting.estimation.ambientIntensity = estimation.ambientIntensity;
  }
  if (estimation.ambientColor) {
    Object.assign(this.computerVision.lighting.estimation.ambientColor, estimation.ambientColor);
  }
  if (estimation.directionalLight) {
    Object.assign(this.computerVision.lighting.estimation.directionalLight, estimation.directionalLight);
  }
  if (estimation.sphericalHarmonics) {
    this.computerVision.lighting.estimation.sphericalHarmonics = estimation.sphericalHarmonics;
  }
  this.computerVision.lighting.estimation.timestamp = new Date();
};

// Method to get placement constraints
ARObjectSchema.methods.getPlacementConstraints = function(): {
  planes: IARPlane[];
  markers: IARMarker[];
  manualPosition?: { x: number; y: number; z: number };
  gpsCoordinates?: { latitude: number; longitude: number; altitude: number };
} {
  return this.placement.constraints;
};

export default mongoose.models.ARObject || mongoose.model<IARObject>('ARObject', ARObjectSchema);