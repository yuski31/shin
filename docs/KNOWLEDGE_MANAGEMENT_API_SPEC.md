# Knowledge Management System API Specification

## Overview
This document provides comprehensive API specifications for the Knowledge Management System (Phase 15.3) implemented in the Shin AI Platform.

## Base URL
```
https://api.shin-ai.com/api
```

## Authentication
All API endpoints require authentication using NextAuth.js sessions. Include the session token in the Authorization header:

```
Authorization: Bearer <session_token>
```

## Knowledge Extraction APIs

### 1. Extract Knowledge from Documents
**POST** `/api/knowledge/extract`

Extract knowledge, concepts, topics, and insights from uploaded documents.

**Request Body:**
```json
{
  "title": "Document Title",
  "content": "Document content text",
  "type": "pdf|docx|txt|html|markdown|url|code",
  "source": "document_source_url_or_path",
  "metadata": {
    "author": "Author Name",
    "createdAt": "2024-01-01T00:00:00Z",
    "tags": ["tag1", "tag2"]
  },
  "organizationId": "org_id",
  "providerConfig": {
    "baseUrl": "https://api.openai.com",
    "apiKey": "sk-...",
    "model": "gpt-4"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_id",
      "title": "Document Title",
      "type": "pdf",
      "processingStatus": "completed",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "concepts": [
      {
        "name": "Machine Learning",
        "description": "AI subset focused on algorithms",
        "confidence": 0.95,
        "domain": "artificial-intelligence"
      }
    ],
    "topics": [
      {
        "name": "Neural Networks",
        "description": "Deep learning architecture",
        "confidence": 0.88,
        "keywords": ["neural", "deep learning", "AI"]
      }
    ],
    "insights": [
      {
        "id": "insight_id",
        "title": "Key Finding",
        "type": "pattern",
        "confidence": 0.92,
        "impact": "high"
      }
    ],
    "processingTime": 2500,
    "metadata": {
      "textLength": 5000,
      "conceptCount": 15,
      "topicCount": 3,
      "insightCount": 5
    }
  }
}
```

### 2. Get Knowledge Documents
**GET** `/api/knowledge/extract`

Retrieve processed knowledge documents with filtering options.

**Query Parameters:**
- `organizationId` (required): Organization ID
- `status`: Filter by processing status (pending|processing|completed|failed)
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_id",
        "title": "Document Title",
        "type": "pdf",
        "source": "source_url",
        "processingStatus": "completed",
        "uploadedBy": {
          "name": "User Name",
          "email": "user@example.com"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "conceptCount": 15,
        "topicCount": 3,
        "insightCount": 5
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Semantic Search APIs

### 3. Semantic Search
**POST** `/api/search/semantic`

Perform natural language search across knowledge base with semantic understanding.

**Request Body:**
```json
{
  "query": "machine learning algorithms for natural language processing",
  "organizationId": "org_id",
  "domain": "artificial-intelligence",
  "limit": 20,
  "threshold": 0.7,
  "includeDocuments": true,
  "includeConcepts": true,
  "includeInsights": true,
  "providerConfig": {
    "baseUrl": "https://api.openai.com",
    "apiKey": "sk-...",
    "model": "text-embedding-ada-002"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_id",
        "title": "Advanced NLP Techniques",
        "content": "Content preview...",
        "type": "pdf",
        "relevance": 0.95,
        "uploadedBy": { "name": "Expert User" },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "concepts": [
      {
        "id": "concept_id",
        "name": "Natural Language Processing",
        "description": "AI field for text analysis",
        "domain": "artificial-intelligence",
        "confidence": 0.98,
        "relevance": 0.92
      }
    ],
    "insights": [
      {
        "id": "insight_id",
        "title": "NLP Algorithm Trends",
        "content": "Key insights about...",
        "type": "trend",
        "confidence": 0.85,
        "impact": "high",
        "relevance": 0.88
      }
    ],
    "totalResults": 45,
    "processingTime": 1200
  }
}
```

## Learning Management APIs

### 4. Get Learning Paths
**GET** `/api/learning/paths`

Retrieve personalized learning paths for users.

**Query Parameters:**
- `userId`: User ID (defaults to current user)
- `organizationId` (required): Organization ID
- `status`: Filter by status (active|completed|paused|abandoned)
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "paths": [
      {
        "id": "path_id",
        "title": "Machine Learning Fundamentals",
        "description": "Complete guide to ML basics",
        "progress": 65,
        "status": "active",
        "competencies": [
          {
            "name": "Machine Learning",
            "description": "ML algorithms and techniques",
            "domain": "artificial-intelligence"
          }
        ],
        "contentItems": [
          {
            "id": "content_id",
            "title": "Introduction to ML",
            "type": "course",
            "difficulty": "beginner",
            "duration": 60,
            "order": 1,
            "isCompleted": true,
            "completedAt": "2024-01-01T00:00:00Z",
            "timeSpent": 45,
            "score": 85
          }
        ],
        "metadata": {
          "estimatedDuration": 300,
          "difficulty": "intermediate",
          "learningStyle": "mixed",
          "createdBy": "ai",
          "adaptive": true,
          "lastActivity": "2024-01-15T10:30:00Z"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 5. Create Learning Path
**POST** `/api/learning/paths`

Generate and create a personalized learning path based on user goals and skill gaps.

**Request Body:**
```json
{
  "title": "Custom Learning Path",
  "description": "Personalized path description",
  "organizationId": "org_id",
  "competencies": ["comp_id_1", "comp_id_2"],
  "skillGaps": [
    {
      "competencyId": "comp_id",
      "gapLevel": 75,
      "priority": "high"
    }
  ],
  "providerConfig": {
    "baseUrl": "https://api.openai.com",
    "apiKey": "sk-...",
    "model": "gpt-4"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "path_id",
    "title": "Machine Learning Mastery",
    "description": "Comprehensive ML learning path",
    "progress": 0,
    "status": "active",
    "contentItems": [
      {
        "contentId": "content_id_1",
        "order": 1,
        "isCompleted": false,
        "timeSpent": 0,
        "estimatedTime": 60
      }
    ],
    "competencies": ["comp_id_1", "comp_id_2"],
    "skillGaps": [...],
    "metadata": {
      "estimatedDuration": 480,
      "difficulty": "intermediate",
      "learningStyle": "mixed",
      "createdBy": "ai",
      "adaptive": true,
      "lastActivity": "2024-01-01T00:00:00Z"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 6. Update Learning Progress
**PUT** `/api/learning/paths/{pathId}/progress`

Update progress on a specific learning path item.

**Request Body:**
```json
{
  "contentItemId": "content_item_id",
  "isCompleted": true,
  "timeSpent": 45,
  "score": 88,
  "notes": "Great content, very helpful!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pathId": "path_id",
    "progress": 75,
    "completedItems": 3,
    "totalItems": 4,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Expert Identification APIs

### 7. Find Experts
**GET** `/api/knowledge/experts`

Identify subject matter experts based on knowledge contributions.

**Query Parameters:**
- `domain` (required): Knowledge domain
- `organizationId` (required): Organization ID
- `limit`: Number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "experts": [
      {
        "userId": "user_id",
        "name": "Dr. Jane Smith",
        "expertise": ["machine-learning", "deep-learning"],
        "confidence": 0.95,
        "documentCount": 25,
        "conceptCount": 150,
        "reputation": 175
      }
    ]
  }
}
```

## Trend Analysis APIs

### 8. Analyze Knowledge Trends
**GET** `/api/knowledge/trends`

Analyze trends in knowledge evolution over time.

**Query Parameters:**
- `topic` (required): Topic to analyze
- `organizationId` (required): Organization ID
- `timeframe`: Time range (e.g., "30d", "90d", "1y")

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "Machine Learning",
    "trend": "rising",
    "confidence": 0.85,
    "dataPoints": [
      {
        "date": "2024-01-01",
        "value": 15,
        "source": "document_count"
      }
    ],
    "prediction": {
      "futureValue": 25,
      "confidence": 0.78,
      "timeframe": "next_30_days"
    }
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (invalid/missing authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `429`: Rate Limited (too many requests)
- `500`: Internal Server Error

## Rate Limiting
- Standard tier: 100 requests per minute
- Pro tier: 1000 requests per minute
- Enterprise tier: 5000 requests per minute

## WebSocket Events

### Real-time Updates
The system supports real-time updates via WebSocket for:
- Knowledge processing progress
- Learning path updates
- Expert identification results
- Trend analysis updates

**Connection URL:**
```
wss://api.shin-ai.com/socket.io/?token=<session_token>
```

**Supported Events:**
- `knowledge:processed`: Document processing completed
- `learning:progress`: Learning progress updated
- `search:results`: New search results available
- `expert:identified`: New expert identified
- `trend:updated`: Knowledge trends updated

## Data Models

### KnowledgeDocument
```typescript
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'docx' | 'txt' | 'html' | 'markdown' | 'url' | 'code';
  source: string;
  metadata: {
    author?: string;
    createdAt?: Date;
    tags?: string[];
  };
  organizationId: string;
  uploadedBy: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedConcepts: string[];
  topics: string[];
  insights: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### LearningPath
```typescript
interface LearningPath {
  id: string;
  title: string;
  description: string;
  userId: string;
  organizationId: string;
  contentItems: Array<{
    contentId: string;
    order: number;
    isCompleted: boolean;
    completedAt?: Date;
    timeSpent: number;
    score?: number;
    notes?: string;
  }>;
  competencies: string[];
  skillGaps: Array<{
    competencyId: string;
    gapLevel: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  progress: number;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  metadata: {
    estimatedDuration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
    createdBy: 'user' | 'system' | 'ai' | 'expert';
    adaptive: boolean;
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

This API specification provides comprehensive access to all Knowledge Management System features, enabling seamless integration with frontend applications and external systems.