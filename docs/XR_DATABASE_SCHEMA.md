# XR Platform Database Schema

## Overview
This document defines the database schema for the Extended Reality (XR) Platform, building upon the existing interactive media models (VRScene, Avatar, VirtualSpace) to provide comprehensive XR capabilities.

## Core XR Models

### XRSession
**Purpose**: Manages individual XR sessions with tracking and analytics.

```typescript
interface IXRSession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  type: 'vr' | 'ar' | 'mr' | 'holographic' | 'collaborative';
  status: 'initializing' | 'active' | 'paused' | 'ended' | 'error';

  // Session Configuration
  configuration: {
    hardware: {
      headset: string;
      controllers: string[];
      trackingSystem: string;
      hapticDevices: string[];
    };
    environment: {
      sceneId?: string;
      spaceId?: string;
      customSettings: Record<string, any>;
    };
    participants: Array<{
      userId: mongoose.Types.ObjectId;
      role: 'host' | 'participant' | 'observer';
      joinedAt: Date;
      permissions: string[];
    }>;
  };

  // Real-time Data
  realtime: {
    currentPosition: { x: number; y: number; z: number };
    headRotation: { x: number; y: number; z: number; w: number };
    handPositions: {
      left: { x: number; y: number; z: number };
      right: { x: number; y: number; z: number };
    };
    gazeData: Array<{
      timestamp: Date;
      position: { x: number; y: number; z: number };
      direction: { x: number; y: number; z: number };
      confidence: number;
    }>;
    performance: {
      frameRate: number;
      latency: number;
      quality: 'low' | 'medium' | 'high' | 'ultra';
    };
  };

  // Haptic Feedback Log
  hapticEvents: Array<{
    timestamp: Date;
    device: string;
    type: 'force' | 'vibration' | 'temperature' | 'texture';
    intensity: number;
    duration: number;
    position: { x: number; y: number; z: number };
  }>;

  // Interaction Log
  interactions: Array<{
    timestamp: Date;
    type: 'gesture' | 'voice' | 'gaze' | 'haptic' | 'object';
    action: string;
    target?: string;
    parameters: Record<string, any>;
    outcome: 'success' | 'failed' | 'partial';
  }>;

  // Analytics
  analytics: {
    duration: number;
    comfortScore: number;
    immersionLevel: number;
    taskCompletion: number;
    errorCount: number;
    satisfaction: number;
  };

  // Session Metadata
  metadata: {
    startTime: Date;
    endTime?: Date;
    lastActivity: Date;
    recordingUrl?: string;
    thumbnailUrl?: string;
    tags: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### XRHologram
**Purpose**: Manages holographic displays and volumetric content.

```typescript
interface IXRHologram extends Document {
  hologramId: string;
  name: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;

  // Content Definition
  content: {
    type: 'volumetric' | 'light_field' | 'holographic_video' | 'procedural';
    source: {
      url: string;
      format: string;
      resolution: { width: number; height: number; depth: number };
      frameRate: number;
    };
    rendering: {
      technique: 'ray_marching' | 'voxel' | 'point_cloud' | 'neural';
      quality: 'draft' | 'standard' | 'high' | 'photorealistic';
      lighting: 'realistic' | 'stylized' | 'emissive';
    };
  };

  // Spatial Properties
  spatial: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    scale: { x: number; y: number; z: number };
    bounds: {
      width: number;
      height: number;
      depth: number;
    };
    anchor: {
      type: 'world' | 'surface' | 'object' | 'user';
      referenceId?: string;
    };
  };

  // Interaction Properties
  interactions: {
    gaze: {
      enabled: boolean;
      triggerDistance: number;
      actions: Array<{
        type: 'activate' | 'deactivate' | 'transform' | 'animate';
        conditions: Record<string, any>;
      }>;
    };
    gesture: {
      enabled: boolean;
      supportedGestures: string[];
      sensitivity: number;
    };
    voice: {
      enabled: boolean;
      wakeWords: string[];
      commands: Array<{
        phrase: string;
        action: string;
        parameters: Record<string, any>;
      }>;
    };
  };

  // Physics and Behavior
  physics: {
    enabled: boolean;
    mass: number;
    collisionShape: 'box' | 'sphere' | 'mesh' | 'none';
    affectedByGravity: boolean;
    behaviors: Array<{
      type: 'floating' | 'orbiting' | 'following' | 'reactive';
      parameters: Record<string, any>;
    }>;
  };

  // Performance Settings
  performance: {
    maxRenderDistance: number;
    lodLevels: Array<{
      distance: number;
      quality: string;
      polygonCount: number;
    }>;
    culling: {
      enabled: boolean;
      angle: number;
      distance: number;
    };
  };

  // Analytics
  analytics: {
    views: number;
    interactions: number;
    averageViewTime: number;
    popularityScore: number;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### XRHapticDevice
**Purpose**: Manages haptic feedback devices and their capabilities.

```typescript
interface IXRHapticDevice extends Document {
  deviceId: string;
  name: string;
  type: 'glove' | 'vest' | 'controller' | 'full_body' | 'custom';
  organizationId: mongoose.Types.ObjectId;

  // Device Capabilities
  capabilities: {
    forceFeedback: {
      enabled: boolean;
      maxForce: number;
      precision: number;
      actuators: Array<{
        id: string;
        position: string;
        maxForce: number;
        frequencyRange: { min: number; max: number };
      }>;
    };
    vibration: {
      enabled: boolean;
      motors: Array<{
        id: string;
        position: string;
        maxAmplitude: number;
        frequencyRange: { min: number; max: number };
      }>;
    };
    temperature: {
      enabled: boolean;
      peltierElements: Array<{
        id: string;
        position: string;
        tempRange: { min: number; max: number };
        responseTime: number;
      }>;
    };
    texture: {
      enabled: boolean;
      resolution: number;
      materials: string[];
    };
  };

  // Spatial Audio
  audio: {
    enabled: boolean;
    channels: number;
    hrtfSupport: boolean;
    spatialAudio: {
      maxDistance: number;
      falloffCurve: 'linear' | 'exponential' | 'custom';
    };
  };

  // Calibration Data
  calibration: {
    lastCalibration: Date;
    accuracy: number;
    driftCompensation: boolean;
    sensorOffsets: Record<string, number>;
  };

  // Current Status
  status: {
    connected: boolean;
    batteryLevel: number;
    temperature: number;
    lastSeen: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### XRDigitalHuman
**Purpose**: Advanced digital human model with neural rendering and emotional intelligence.

```typescript
interface IXRDigitalHuman extends Document {
  humanId: string;
  name: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;

  // Neural Rendering
  neuralRendering: {
    model: {
      type: 'neural_radiance_field' | 'gaussian_splatting' | 'neural_mesh';
      version: string;
      parameters: Record<string, any>;
    };
    appearance: {
      photorealistic: boolean;
      age: number;
      ethnicity: string;
      gender: string;
      height: number;
      build: 'slim' | 'average' | 'athletic' | 'heavy';
    };
    expressions: {
      blendshapes: Record<string, number>;
      microExpressions: boolean;
      facialRig: {
        bones: number;
        controls: number;
        animationLayers: number;
      };
    };
  };

  // Emotional Intelligence
  emotionalAI: {
    currentMood: 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'anxious' | 'neutral';
    emotionalState: {
      valence: number; // -1 to 1
      arousal: number; // -1 to 1
      dominance: number; // -1 to 1
    };
    personality: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    empathy: {
      level: number;
      cognitiveEmpathy: boolean;
      emotionalEmpathy: boolean;
    };
  };

  // Natural Language Processing
  nlp: {
    conversation: {
      model: string;
      contextWindow: number;
      personality: string;
      knowledgeDomains: string[];
    };
    voice: {
      synthesis: {
        model: string;
        voiceId: string;
        pitch: number;
        speed: number;
        accent: string;
      };
      recognition: {
        model: string;
        language: string;
        continuous: boolean;
        wakeWords: string[];
      };
    };
  };

  // Body Language and Animation
  animation: {
    motionCapture: {
      enabled: boolean;
      source: 'live' | 'recorded' | 'procedural';
      quality: 'basic' | 'intermediate' | 'advanced' | 'professional';
    };
    gestures: {
      library: string[];
      frequency: number;
      naturalness: number;
    };
    locomotion: {
      walkSpeed: number;
      runSpeed: number;
      jumpHeight: number;
      canFly: boolean;
      canSwim: boolean;
    };
  };

  // Social Behavior
  social: {
    relationships: Array<{
      targetHumanId: string;
      relationshipType: 'friend' | 'colleague' | 'mentor' | 'family';
      strength: number;
      history: Array<{
        interaction: string;
        timestamp: Date;
        emotionalImpact: number;
      }>;
    }>;
    groupBehavior: {
      leadership: number;
      cooperation: number;
      socialAwareness: number;
    };
  };

  // Learning and Memory
  learning: {
    enabled: boolean;
    learningRate: number;
    memoryCapacity: number;
    adaptation: {
      enabled: boolean;
      rate: number;
      domains: string[];
    };
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### XRCollaborativeSpace
**Purpose**: Manages multi-user collaborative XR environments.

```typescript
interface IXRCollaborativeSpace extends Document {
  spaceId: string;
  name: string;
  description: string;
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;

  // Space Configuration
  configuration: {
    maxParticipants: number;
    environmentType: 'meeting_room' | 'auditorium' | 'workshop' | 'social' | 'custom';
    privacy: 'public' | 'organization' | 'invite_only' | 'private';
    persistence: boolean;
  };

  // Participants
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'host' | 'presenter' | 'participant' | 'observer';
    status: 'connected' | 'disconnected' | 'away';
    joinedAt: Date;
    lastActivity: Date;
    permissions: string[];
    avatarId?: string;
  }>;

  // Shared Content
  sharedContent: Array<{
    id: string;
    type: 'document' | 'presentation' | '3d_model' | 'video' | 'hologram';
    ownerId: mongoose.Types.ObjectId;
    url: string;
    position: { x: number; y: number; z: number };
    permissions: {
      view: string[];
      edit: string[];
      delete: string[];
    };
    metadata: Record<string, any>;
  }>;

  // Real-time State
  realtimeState: {
    voiceChat: {
      enabled: boolean;
      participants: string[];
      quality: 'low' | 'medium' | 'high';
    };
    spatialAudio: {
      enabled: boolean;
      range: number;
      falloff: number;
    };
    sharedCursor: {
      enabled: boolean;
      positions: Record<string, { x: number; y: number; z: number }>;
    };
  };

  // Session Recording
  recording: {
    enabled: boolean;
    startTime?: Date;
    endTime?: Date;
    participants: string[];
    quality: 'low' | 'medium' | 'high';
    storageUrl?: string;
  };

  // Analytics
  analytics: {
    totalSessions: number;
    totalParticipants: number;
    averageDuration: number;
    satisfactionScore: number;
    engagementMetrics: {
      interactionRate: number;
      collaborationScore: number;
      contentSharing: number;
    };
  };

  createdAt: Date;
  updatedAt: Date;
}
```

## Extended Existing Models

### Enhanced VRScene
**Additions for XR Platform**:

```typescript
interface IVRScene {
  // ... existing fields ...

  // XR Enhancements
  xr: {
    mixedReality: {
      enabled: boolean;
      passthrough: boolean;
      occlusion: boolean;
      depthEstimation: boolean;
    };
    collaborative: {
      enabled: boolean;
      maxParticipants: number;
      synchronization: 'real_time' | 'periodic' | 'on_demand';
    };
    streaming: {
      enabled: boolean;
      quality: 'low' | 'medium' | 'high' | 'ultra';
      platform: 'internal' | 'youtube' | 'twitch' | 'custom';
    };
  };

  // Holographic Support
  holograms: mongoose.Types.ObjectId[]; // References to XRHologram

  // Advanced Physics
  physics: {
    windSimulation: boolean;
    fluidDynamics: boolean;
    particleSystems: boolean;
    softBodyPhysics: boolean;
  };
}
```

### Enhanced Avatar
**Additions for XR Platform**:

```typescript
interface IAvatar {
  // ... existing fields ...

  // XR Enhancements
  xr: {
    neuralRendering: {
      enabled: boolean;
      quality: 'standard' | 'high' | 'photorealistic';
      realTime: boolean;
    };
    hapticFeedback: {
      enabled: boolean;
      devices: string[];
      sensitivity: number;
    };
    spatialPresence: {
      enabled: boolean;
      tracking: 'full_body' | 'upper_body' | 'hands_only';
      accuracy: number;
    };
  };

  // Digital Human Features
  digitalHuman: {
    emotionalAI: boolean;
    naturalLanguage: boolean;
    bodyLanguage: boolean;
    learning: boolean;
  };
}
```

## Indexes and Performance

### XRSession Indexes
```javascript
// Core session queries
XRSessionSchema.index({ userId: 1, createdAt: -1 });
XRSessionSchema.index({ organizationId: 1, status: 1 });
XRSessionSchema.index({ sessionId: 1 }, { unique: true });

// Real-time queries
XRSessionSchema.index({ 'realtime.performance.frameRate': -1 });
XRSessionSchema.index({ 'analytics.comfortScore': -1 });

// Analytics queries
XRSessionSchema.index({ 'metadata.startTime': -1 });
XRSessionSchema.index({ 'metadata.tags': 1 });
```

### XRHologram Indexes
```javascript
XRHologramSchema.index({ organizationId: 1 });
XRHologramSchema.index({ 'spatial.anchor.type': 1 });
XRHologramSchema.index({ 'content.type': 1 });
XRHologramSchema.index({ 'analytics.popularityScore': -1 });
```

### XRDigitalHuman Indexes
```javascript
XRDigitalHumanSchema.index({ organizationId: 1 });
XRDigitalHumanSchema.index({ 'emotionalAI.currentMood': 1 });
XRDigitalHumanSchema.index({ 'nlp.conversation.model': 1 });
```

## Data Relationships

### User Sessions
- User -> XRSession (1:many)
- User -> XRHologram (1:many)
- User -> XRDigitalHuman (1:many)

### Organization Content
- Organization -> XRSession (1:many)
- Organization -> XRHologram (1:many)
- Organization -> XRDigitalHuman (1:many)
- Organization -> XRCollaborativeSpace (1:many)

### Session Components
- XRSession -> XRHologram (many:many)
- XRSession -> XRDigitalHuman (many:many)
- XRSession -> XRHapticDevice (many:many)

## Analytics and Reporting

### Session Analytics
- Real-time performance monitoring
- User comfort and satisfaction tracking
- Hardware utilization metrics
- Content engagement analysis

### Content Analytics
- Hologram view counts and interaction rates
- Digital human conversation metrics
- Collaborative space usage patterns
- Cross-platform compatibility metrics

### Performance Analytics
- Frame rate and latency monitoring
- Hardware optimization recommendations
- Network bandwidth usage
- Error rate and crash reporting

This schema provides a comprehensive foundation for the XR Platform while maintaining compatibility with existing models and supporting all specified requirements.
