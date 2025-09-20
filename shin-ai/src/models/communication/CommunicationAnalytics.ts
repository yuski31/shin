import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunicationMetrics {
  // Core metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;

  // Service-specific metrics
  meetingMetrics?: {
    totalMeetings: number;
    averageMeetingDuration: number;
    transcriptionAccuracy: number;
    actionItemExtractionRate: number;
    summaryQualityScore: number;
    sentimentAnalysisAccuracy: number;
  };

  translationMetrics?: {
    totalTranslations: number;
    averageTranslationTime: number;
    translationAccuracy: number;
    culturalAdaptationRate: number;
    signLanguageProcessingRate: number;
    dialectSupportCoverage: number;
  };

  customerServiceMetrics?: {
    totalTickets: number;
    averageResolutionTime: number;
    firstResponseTime: number;
    resolutionRate: number;
    escalationRate: number;
    customerSatisfactionScore: number;
    churnPredictionAccuracy: number;
  };

  internalCommMetrics?: {
    totalMessages: number;
    averageResponseTime: number;
    routingAccuracy: number;
    templateUsageRate: number;
    knowledgeBaseHitRate: number;
    complianceDetectionAccuracy: number;
  };

  // Quality metrics
  qualityScores: {
    accuracy: number;
    reliability: number;
    performance: number;
    userSatisfaction: number;
    overallScore: number;
  };

  // Cost metrics
  costMetrics: {
    totalCost: number;
    averageCostPerRequest: number;
    costPerService: {
      meeting: number;
      translation: number;
      customerService: number;
      internalComm: number;
    };
    currency: string;
  };

  // Error metrics
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    topErrors: {
      errorCode: string;
      count: number;
      percentage: number;
    }[];
    averageErrorRecoveryTime: number;
  };
}

export interface ICommunicationAnalytics extends Document {
  id: string;
  organizationId: mongoose.Types.ObjectId;
  service: 'meeting' | 'translation' | 'customer_service' | 'internal_comm' | 'all';
  period: {
    start: Date;
    end: Date;
    type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    timezone: string;
  };

  // Time-based metrics
  metrics: ICommunicationMetrics;

  // Trend analysis
  trends: {
    requestVolume: {
      timestamp: Date;
      count: number;
    }[];
    responseTime: {
      timestamp: Date;
      average: number;
      median: number;
    }[];
    errorRate: {
      timestamp: Date;
      rate: number;
    }[];
    qualityScore: {
      timestamp: Date;
      score: number;
    }[];
    cost: {
      timestamp: Date;
      amount: number;
    }[];
  };

  // Comparative analysis
  comparisons: {
    periodOverPeriod: {
      previousPeriod: ICommunicationMetrics;
      changePercentage: number;
      significantChanges: {
        metric: string;
        change: number;
        significance: 'low' | 'medium' | 'high';
      }[];
    };
    serviceComparison: {
      service: string;
      metrics: ICommunicationMetrics;
      rank: number;
    }[];
  };

  // Predictive analytics
  predictions: {
    nextPeriod: {
      expectedRequests: number;
      expectedResponseTime: number;
      expectedErrorRate: number;
      confidence: number;
    };
    anomalies: {
      timestamp: Date;
      metric: string;
      actualValue: number;
      expectedValue: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }[];
  };

  // User engagement metrics
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    userSatisfaction: {
      averageRating: number;
      totalRatings: number;
      ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
      };
    };
    featureUsage: {
      feature: string;
      usageCount: number;
      uniqueUsers: number;
      averageSessionDuration: number;
    }[];
  };

  // Performance benchmarks
  benchmarks: {
    industryAverages: ICommunicationMetrics;
    competitors: {
      name: string;
      metrics: ICommunicationMetrics;
      lastUpdated: Date;
    }[];
    targetMetrics: ICommunicationMetrics;
    achievementPercentage: number;
  };

  // Alerts and notifications
  alerts: {
    id: string;
    type: 'performance' | 'quality' | 'cost' | 'error' | 'anomaly';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    triggeredAt: Date;
    resolvedAt?: Date;
    acknowledgedBy?: mongoose.Types.ObjectId;
    acknowledgedAt?: Date;
  }[];

  // Metadata
  metadata: {
    dataCompleteness: number; // 0-1
    lastUpdated: Date;
    generatedBy: string; // AI model or process name
    version: string;
    schemaVersion: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const CommunicationMetricsSchema = new Schema({
  totalRequests: Number,
  successfulRequests: Number,
  failedRequests: Number,
  averageResponseTime: Number,
  medianResponseTime: Number,
  p95ResponseTime: Number,
  p99ResponseTime: Number,

  meetingMetrics: {
    totalMeetings: Number,
    averageMeetingDuration: Number,
    transcriptionAccuracy: Number,
    actionItemExtractionRate: Number,
    summaryQualityScore: Number,
    sentimentAnalysisAccuracy: Number,
  },

  translationMetrics: {
    totalTranslations: Number,
    averageTranslationTime: Number,
    translationAccuracy: Number,
    culturalAdaptationRate: Number,
    signLanguageProcessingRate: Number,
    dialectSupportCoverage: Number,
  },

  customerServiceMetrics: {
    totalTickets: Number,
    averageResolutionTime: Number,
    firstResponseTime: Number,
    resolutionRate: Number,
    escalationRate: Number,
    customerSatisfactionScore: Number,
    churnPredictionAccuracy: Number,
  },

  internalCommMetrics: {
    totalMessages: Number,
    averageResponseTime: Number,
    routingAccuracy: Number,
    templateUsageRate: Number,
    knowledgeBaseHitRate: Number,
    complianceDetectionAccuracy: Number,
  },

  qualityScores: {
    accuracy: Number,
    reliability: Number,
    performance: Number,
    userSatisfaction: Number,
    overallScore: Number,
  },

  costMetrics: {
    totalCost: Number,
    averageCostPerRequest: Number,
    costPerService: {
      meeting: Number,
      translation: Number,
      customerService: Number,
      internalComm: Number,
    },
    currency: String,
  },

  errorMetrics: {
    totalErrors: Number,
    errorRate: Number,
    topErrors: [{
      errorCode: String,
      count: Number,
      percentage: Number,
    }],
    averageErrorRecoveryTime: Number,
  },
}, { _id: false });

const CommunicationAnalyticsSchema: Schema = new Schema({
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
  service: {
    type: String,
    enum: ['meeting', 'translation', 'customer_service', 'internal_comm', 'all'],
    default: 'all',
  },
  period: {
    start: Date,
    end: Date,
    type: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    },
    timezone: String,
  },

  metrics: CommunicationMetricsSchema,

  trends: {
    requestVolume: [{
      timestamp: Date,
      count: Number,
    }],
    responseTime: [{
      timestamp: Date,
      average: Number,
      median: Number,
    }],
    errorRate: [{
      timestamp: Date,
      rate: Number,
    }],
    qualityScore: [{
      timestamp: Date,
      score: Number,
    }],
    cost: [{
      timestamp: Date,
      amount: Number,
    }],
  },

  comparisons: {
    periodOverPeriod: {
      previousPeriod: CommunicationMetricsSchema,
      changePercentage: Number,
      significantChanges: [{
        metric: String,
        change: Number,
        significance: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
      }],
    },
    serviceComparison: [{
      service: String,
      metrics: CommunicationMetricsSchema,
      rank: Number,
    }],
  },

  predictions: {
    nextPeriod: {
      expectedRequests: Number,
      expectedResponseTime: Number,
      expectedErrorRate: Number,
      confidence: Number,
    },
    anomalies: [{
      timestamp: Date,
      metric: String,
      actualValue: Number,
      expectedValue: Number,
      deviation: Number,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
    }],
  },

  userMetrics: {
    totalUsers: Number,
    activeUsers: Number,
    newUsers: Number,
    returningUsers: Number,
    userSatisfaction: {
      averageRating: Number,
      totalRatings: Number,
      ratingDistribution: {
        1: Number,
        2: Number,
        3: Number,
        4: Number,
        5: Number,
      },
    },
    featureUsage: [{
      feature: String,
      usageCount: Number,
      uniqueUsers: Number,
      averageSessionDuration: Number,
    }],
  },

  benchmarks: {
    industryAverages: CommunicationMetricsSchema,
    competitors: [{
      name: String,
      metrics: CommunicationMetricsSchema,
      lastUpdated: Date,
    }],
    targetMetrics: CommunicationMetricsSchema,
    achievementPercentage: Number,
  },

  alerts: [{
    id: String,
    type: {
      type: String,
      enum: ['performance', 'quality', 'cost', 'error', 'anomaly'],
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
    },
    message: String,
    triggeredAt: Date,
    resolvedAt: Date,
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: Date,
  }],

  metadata: {
    dataCompleteness: Number,
    lastUpdated: Date,
    generatedBy: String,
    version: String,
    schemaVersion: String,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CommunicationAnalyticsSchema.index({ organizationId: 1, service: 1, 'period.start': -1 });
CommunicationAnalyticsSchema.index({ 'period.type': 1, 'period.start': -1 });
CommunicationAnalyticsSchema.index({ 'alerts.severity': 1, 'alerts.triggeredAt': -1 });
CommunicationAnalyticsSchema.index({ 'predictions.anomalies.severity': 1 });
CommunicationAnalyticsSchema.index({ 'benchmarks.achievementPercentage': -1 });

export default mongoose.models.CommunicationAnalytics || mongoose.model<ICommunicationAnalytics>('CommunicationAnalytics', CommunicationAnalyticsSchema);