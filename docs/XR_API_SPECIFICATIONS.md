# XR Platform API Specifications

## Overview
This document defines the REST API specifications for the Extended Reality (XR) Platform, providing comprehensive endpoints for managing XR sessions, content, devices, and analytics.

## Base URL
```
https://api.shin-ai.com/api/xr/v1
```

## Authentication
All XR API endpoints require authentication using JWT tokens:
```
Authorization: Bearer <jwt_token>
```

## Core Endpoints

### 1. XR Sessions

#### Create XR Session
**POST** `/sessions`

Creates a new XR session with specified configuration.

**Request Body:**
```json
{
  "type": "vr|ar|mr|holographic|collaborative",
  "configuration": {
    "hardware": {
      "headset": "oculus_quest_3",
      "controllers": ["left_controller", "right_controller"],
      "trackingSystem": "inside_out",
      "hapticDevices": ["haptic_glove_left", "haptic_vest"]
    },
    "environment": {
      "sceneId": "scene_123",
      "spaceId": "space_456",
      "customSettings": {
        "quality": "high",
        "frameRate": 90
      }
    },
    "participants": [
      {
        "userId": "user_123",
        "role": "host",
        "permissions": ["manage_session", "invite_users"]
      }
    ]
  },
  "recording": {
    "enabled": true,
    "quality": "high",
    "includeAudio": true
  }
}
```

**Response:**
```json
{
  "sessionId": "session_abc123",
  "status": "initializing",
  "connectionInfo": {
    "websocketUrl": "wss://xr.shin-ai.com/session_abc123",
    "sessionToken": "session_token_456",
    "expiresAt": "2025-09-20T14:00:00Z"
  },
  "createdAt": "2025-09-20T13:46:41Z"
}
```

#### Get Session Status
**GET** `/sessions/{sessionId}`

Retrieves current session status and real-time data.

**Response:**
```json
{
  "sessionId": "session_abc123",
  "status": "active",
  "participants": [
    {
      "userId": "user_123",
      "status": "connected",
      "position": { "x": 1.2, "y": 0.5, "z": -0.8 },
      "lastActivity": "2025-09-20T13:50:00Z"
    }
  ],
  "realtime": {
    "performance": {
      "frameRate": 89,
      "latency": 12,
      "quality": "high"
    },
    "activeUsers": 3
  },
  "analytics": {
    "duration": 240,
    "comfortScore": 8.5,
    "interactions": 45
  }
}
```

#### Update Session
**PATCH** `/sessions/{sessionId}`

Updates session configuration or participant settings.

**Request Body:**
```json
{
  "configuration": {
    "environment": {
      "customSettings": {
        "quality": "ultra",
        "frameRate": 120
      }
    }
  },
  "participants": {
    "add": [
      {
        "userId": "user_456",
        "role": "participant",
        "permissions": ["view_content"]
      }
    ],
    "remove": ["user_789"]
  }
}
```

#### End Session
**DELETE** `/sessions/{sessionId}`

Gracefully ends an XR session and saves final analytics.

**Response:**
```json
{
  "sessionId": "session_abc123",
  "finalStatus": "ended",
  "summary": {
    "duration": 1800,
    "participants": 4,
    "interactions": 127,
    "averageComfortScore": 8.2,
    "recordingUrl": "https://storage.shin-ai.com/recordings/session_abc123.mp4"
  }
}
```

### 2. Holographic Content

#### Create Hologram
**POST** `/holograms`

Creates a new holographic display with volumetric content.

**Request Body:**
```json
{
  "name": "Product Demo Hologram",
  "description": "Interactive 3D product demonstration",
  "content": {
    "type": "volumetric",
    "source": {
      "url": "https://storage.shin-ai.com/holograms/product_demo.vol",
      "format": "volumetric_video",
      "resolution": { "width": 1024, "height": 768, "depth": 512 },
      "frameRate": 30
    },
    "rendering": {
      "technique": "neural",
      "quality": "photorealistic",
      "lighting": "realistic"
    }
  },
  "spatial": {
    "position": { "x": 0, "y": 1, "z": 2 },
    "rotation": { "x": 0, "y": 0, "z": 0, "w": 1 },
    "scale": { "x": 1, "y": 1, "z": 1 },
    "bounds": { "width": 2, "height": 1.5, "depth": 1 },
    "anchor": {
      "type": "surface",
      "referenceId": "table_surface_1"
    }
  },
  "interactions": {
    "gaze": {
      "enabled": true,
      "triggerDistance": 2.0,
      "actions": [
        {
          "type": "activate",
          "conditions": { "gazeDuration": 2.0 }
        }
      ]
    },
    "gesture": {
      "enabled": true,
      "supportedGestures": ["point", "pinch", "grab"],
      "sensitivity": 0.8
    },
    "voice": {
      "enabled": true,
      "wakeWords": ["hey hologram", "show me"],
      "commands": [
        {
          "phrase": "rotate",
          "action": "rotate_hologram",
          "parameters": { "axis": "y", "speed": 1.0 }
        }
      ]
    }
  }
}
```

#### Get Hologram
**GET** `/holograms/{hologramId}`

Retrieves hologram details and current state.

**Response:**
```json
{
  "hologramId": "hologram_123",
  "name": "Product Demo Hologram",
  "status": "active",
  "content": {
    "type": "volumetric",
    "rendering": {
      "currentQuality": "high",
      "frameRate": 30,
      "latency": 8
    }
  },
  "spatial": {
    "position": { "x": 0, "y": 1, "z": 2 },
    "rotation": { "x": 0, "y": 45, "z": 0, "w": 1 }
  },
  "interactions": {
    "totalViews": 45,
    "averageViewTime": 120,
    "popularActions": ["activate", "rotate"]
  },
  "analytics": {
    "views": 45,
    "interactions": 23,
    "averageViewTime": 120,
    "popularityScore": 8.7
  }
}
```

#### Update Hologram
**PATCH** `/holograms/{hologramId}`

Updates hologram properties or content.

**Request Body:**
```json
{
  "spatial": {
    "position": { "x": 1, "y": 1.2, "z": 2.5 },
    "scale": { "x": 1.2, "y": 1.2, "z": 1.2 }
  },
  "interactions": {
    "voice": {
      "commands": [
        {
          "phrase": "zoom in",
          "action": "scale_hologram",
          "parameters": { "factor": 1.5 }
        }
      ]
    }
  }
}
```

### 3. Haptic Feedback

#### Register Haptic Device
**POST** `/haptic/devices`

Registers a new haptic device with the platform.

**Request Body:**
```json
{
  "name": "Haptic Glove Pro",
  "type": "glove",
  "capabilities": {
    "forceFeedback": {
      "enabled": true,
      "maxForce": 10,
      "precision": 0.1,
      "actuators": [
        {
          "id": "thumb_actuator",
          "position": "thumb",
          "maxForce": 5,
          "frequencyRange": { "min": 50, "max": 300 }
        }
      ]
    },
    "vibration": {
      "enabled": true,
      "motors": [
        {
          "id": "palm_motor",
          "position": "palm",
          "maxAmplitude": 1.0,
          "frequencyRange": { "min": 50, "max": 500 }
        }
      ]
    },
    "temperature": {
      "enabled": true,
      "peltierElements": [
        {
          "id": "index_temp",
          "position": "index_finger",
          "tempRange": { "min": 5, "max": 40 },
          "responseTime": 2
        }
      ]
    }
  },
  "calibration": {
    "accuracy": 0.95,
    "driftCompensation": true,
    "sensorOffsets": {
      "force_sensor_1": 0.02,
      "temp_sensor_1": -0.5
    }
  }
}
```

#### Send Haptic Command
**POST** `/haptic/sessions/{sessionId}/commands`

Sends haptic feedback commands to devices in a session.

**Request Body:**
```json
{
  "devices": ["haptic_glove_left", "haptic_vest"],
  "commands": [
    {
      "device": "haptic_glove_left",
      "type": "force",
      "actuator": "index_finger",
      "intensity": 0.7,
      "duration": 500,
      "position": { "x": 0.1, "y": 0.2, "z": 0.05 }
    },
    {
      "device": "haptic_vest",
      "type": "vibration",
      "motor": "chest_motor",
      "amplitude": 0.5,
      "frequency": 200,
      "duration": 1000
    }
  ],
  "synchronization": {
    "mode": "simultaneous",
    "tolerance": 10
  }
}
```

#### Get Haptic Analytics
**GET** `/haptic/analytics/{sessionId}`

Retrieves haptic feedback analytics for a session.

**Response:**
```json
{
  "sessionId": "session_abc123",
  "totalCommands": 156,
  "deviceUsage": {
    "haptic_glove_left": {
      "commands": 89,
      "averageIntensity": 0.6,
      "totalDuration": 45000
    },
    "haptic_vest": {
      "commands": 67,
      "averageIntensity": 0.4,
      "totalDuration": 32000
    }
  },
  "userFeedback": {
    "comfortScore": 8.2,
    "immersionScore": 9.1,
    "suggestions": ["Reduce vibration intensity", "Add temperature feedback"]
  },
  "performance": {
    "averageLatency": 8,
    "successRate": 0.98,
    "errorCount": 3
  }
}
```

### 4. Digital Humans

#### Create Digital Human
**POST** `/digital-humans`

Creates a new digital human with specified characteristics.

**Request Body:**
```json
{
  "name": "Dr. Sarah Chen",
  "description": "AI research assistant and mentor",
  "neuralRendering": {
    "appearance": {
      "photorealistic": true,
      "age": 35,
      "ethnicity": "asian",
      "gender": "female",
      "height": 1.65,
      "build": "average"
    },
    "expressions": {
      "blendshapes": {
        "smile": 0.8,
        "eyebrow_raise": 0.3
      },
      "microExpressions": true,
      "facialRig": {
        "bones": 64,
        "controls": 128,
        "animationLayers": 8
      }
    }
  },
  "emotionalAI": {
    "personality": {
      "openness": 0.9,
      "conscientiousness": 0.8,
      "extraversion": 0.7,
      "agreeableness": 0.9,
      "neuroticism": 0.2
    },
    "empathy": {
      "level": 0.85,
      "cognitiveEmpathy": true,
      "emotionalEmpathy": true
    }
  },
  "nlp": {
    "conversation": {
      "model": "gpt-4",
      "contextWindow": 32,
      "personality": "professional_mentor",
      "knowledgeDomains": ["ai_research", "machine_learning", "ethics"]
    },
    "voice": {
      "synthesis": {
        "model": "elevenlabs",
        "voiceId": "sarah_chen_voice",
        "pitch": 1.0,
        "speed": 1.0,
        "accent": "american"
      },
      "recognition": {
        "model": "whisper",
        "language": "en",
        "continuous": true,
        "wakeWords": ["hey sarah", "dr. chen"]
      }
    }
  },
  "animation": {
    "motionCapture": {
      "enabled": true,
      "source": "procedural",
      "quality": "professional"
    },
    "gestures": {
      "frequency": 0.6,
      "naturalness": 0.9
    }
  }
}
```

#### Interact with Digital Human
**POST** `/digital-humans/{humanId}/interact`

Sends interaction data to a digital human.

**Request Body:**
```json
{
  "type": "conversation|gesture|emotional|instructional",
  "content": {
    "text": "Can you explain neural networks?",
    "context": {
      "userMood": "curious",
      "sessionType": "learning",
      "previousTopics": ["machine_learning_basics"]
    }
  },
  "responseFormat": {
    "verbal": true,
    "gestural": true,
    "emotional": true,
    "detailed": true
  }
}
```

**Response:**
```json
{
  "interactionId": "interaction_123",
  "response": {
    "verbal": {
      "text": "Neural networks are computational models inspired by biological neural networks...",
      "audioUrl": "https://storage.shin-ai.com/audio/response_123.wav",
      "confidence": 0.95
    },
    "gestural": {
      "gestures": ["explanatory_hands", "pointing"],
      "intensity": 0.7
    },
    "emotional": {
      "mood": "enthusiastic",
      "expressions": {
        "smile": 0.6,
        "eyebrow_raise": 0.4
      }
    }
  },
  "followUp": {
    "suggestedQuestions": [
      "How do they learn?",
      "What are the different types?",
      "Can you show me an example?"
    ],
    "relatedTopics": ["deep_learning", "backpropagation"]
  }
}
```

### 5. Collaborative Spaces

#### Create Collaborative Space
**POST** `/collaborative-spaces`

Creates a new multi-user XR collaborative environment.

**Request Body:**
```json
{
  "name": "AI Research Lab",
  "description": "Collaborative space for AI research teams",
  "configuration": {
    "maxParticipants": 20,
    "environmentType": "workshop",
    "privacy": "organization",
    "persistence": true
  },
  "permissions": {
    "access": "invite_only",
    "roles": [
      {
        "name": "researcher",
        "permissions": ["present", "collaborate", "moderate"],
        "maxUsers": 15
      },
      {
        "name": "observer",
        "permissions": ["view", "listen"],
        "maxUsers": 5
      }
    ]
  },
  "features": {
    "voiceChat": {
      "enabled": true,
      "quality": "high"
    },
    "spatialAudio": {
      "enabled": true,
      "range": 10,
      "falloff": 0.8
    },
    "sharedContent": {
      "enabled": true,
      "maxItems": 50
    }
  }
}
```

#### Join Collaborative Space
**POST** `/collaborative-spaces/{spaceId}/join`

Joins a user to a collaborative space.

**Request Body:**
```json
{
  "userId": "user_123",
  "role": "researcher",
  "avatarId": "avatar_456",
  "preferences": {
    "audioQuality": "high",
    "videoQuality": "medium",
    "notifications": true
  }
}
```

**Response:**
```json
{
  "participantId": "participant_789",
  "connectionInfo": {
    "websocketUrl": "wss://xr.shin-ai.com/space_123/user_123",
    "sessionToken": "space_token_456",
    "expiresAt": "2025-09-20T15:00:00Z"
  },
  "initialState": {
    "participants": [
      {
        "userId": "user_456",
        "position": { "x": 2.1, "y": 0, "z": 1.5 },
        "status": "presenting"
      }
    ],
    "sharedContent": [
      {
        "id": "content_123",
        "type": "presentation",
        "position": { "x": 0, "y": 1, "z": 3 }
      }
    ]
  }
}
```

### 6. Analytics and Monitoring

#### Get Session Analytics
**GET** `/analytics/sessions/{sessionId}`

Retrieves comprehensive analytics for an XR session.

**Query Parameters:**
- `startTime`: ISO 8601 timestamp
- `endTime`: ISO 8601 timestamp
- `metrics`: comma-separated list of metrics
- `granularity`: minute|hour|day

**Response:**
```json
{
  "sessionId": "session_abc123",
  "timeRange": {
    "start": "2025-09-20T13:00:00Z",
    "end": "2025-09-20T14:00:00Z"
  },
  "performance": {
    "averageFrameRate": 88.5,
    "averageLatency": 12.3,
    "qualityDistribution": {
      "high": 0.85,
      "medium": 0.12,
      "low": 0.03
    }
  },
  "engagement": {
    "averageSessionTime": 1800,
    "interactionRate": 0.75,
    "comfortScore": 8.2,
    "immersionScore": 9.1
  },
  "haptic": {
    "totalCommands": 234,
    "averageIntensity": 0.6,
    "userFeedback": {
      "positive": 0.8,
      "neutral": 0.15,
      "negative": 0.05
    }
  },
  "social": {
    "participants": 6,
    "interactions": 45,
    "collaborationScore": 0.9
  }
}
```

#### Get Platform Health
**GET** `/monitoring/health`

Retrieves overall platform health and performance metrics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-20T13:46:41Z",
  "services": {
    "xr_core": {
      "status": "healthy",
      "uptime": 99.9,
      "responseTime": 45
    },
    "haptic_system": {
      "status": "healthy",
      "uptime": 99.8,
      "responseTime": 12
    },
    "neural_rendering": {
      "status": "degraded",
      "uptime": 95.2,
      "responseTime": 180,
      "issues": ["High GPU utilization"]
    }
  },
  "infrastructure": {
    "servers": {
      "total": 12,
      "healthy": 11,
      "utilization": 0.67
    },
    "network": {
      "latency": 23,
      "bandwidth": 0.45,
      "packetLoss": 0.001
    }
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "XR_SESSION_NOT_FOUND",
    "message": "The specified XR session could not be found",
    "details": {
      "sessionId": "session_abc123",
      "requestedBy": "user_456"
    }
  },
  "timestamp": "2025-09-20T13:46:41Z",
  "requestId": "req_789"
}
```

### Common Error Codes
- `XR_SESSION_NOT_FOUND`: Session ID not found
- `XR_ACCESS_DENIED`: Insufficient permissions
- `XR_DEVICE_UNAVAILABLE`: Haptic device not connected
- `XR_CONTENT_INVALID`: Invalid hologram content
- `XR_RATE_LIMITED`: Too many requests
- `XR_SERVER_ERROR`: Internal server error

## Rate Limiting
- Standard tier: 100 requests per minute
- Pro tier: 1000 requests per minute
- Enterprise tier: 10000 requests per minute

## WebSocket Events

### Real-time Session Updates
```json
{
  "type": "session_update",
  "sessionId": "session_abc123",
  "data": {
    "participantJoined": {
      "userId": "user_456",
      "position": { "x": 1.5, "y": 0, "z": -1.2 }
    }
  }
}
```

### Haptic Feedback Events
```json
{
  "type": "haptic_feedback",
  "deviceId": "haptic_glove_left",
  "command": {
    "type": "force",
    "intensity": 0.8,
    "duration": 300
  }
}
```

This API specification provides comprehensive coverage of all XR platform functionality while maintaining consistency with existing API patterns and supporting real-time capabilities through WebSocket connections.