import { z } from 'zod';

// Configuration schemas for validation
export const MeetingConfigSchema = z.object({
  // Real-time transcription settings
  transcription: z.object({
    enabled: z.boolean().default(true),
    provider: z.enum(['openai', 'google', 'azure', 'aws']).default('openai'),
    language: z.string().default('en-US'),
    maxSpeakers: z.number().min(1).max(20).default(10),
    interimResults: z.boolean().default(true),
    punctuate: z.boolean().default(true),
    smartFormat: z.boolean().default(true),
  }),

  // Speaker diarization settings
  diarization: z.object({
    enabled: z.boolean().default(true),
    minSpeakers: z.number().min(1).default(1),
    maxSpeakers: z.number().min(1).max(20).default(10),
    sensitivity: z.number().min(0).max(1).default(0.5),
  }),

  // Action item extraction settings
  actionItems: z.object({
    enabled: z.boolean().default(true),
    minConfidence: z.number().min(0).max(1).default(0.7),
    maxItems: z.number().min(1).max(50).default(20),
    includeContext: z.boolean().default(true),
  }),

  // Meeting summarization settings
  summarization: z.object({
    enabled: z.boolean().default(true),
    method: z.enum(['extractive', 'abstractive', 'hybrid']).default('hybrid'),
    maxLength: z.number().min(100).max(5000).default(1000),
    includeKeyPoints: z.boolean().default(true),
    includeDecisions: z.boolean().default(true),
  }),

  // Sentiment analysis settings
  sentiment: z.object({
    enabled: z.boolean().default(true),
    model: z.enum(['openai', 'google', 'huggingface']).default('openai'),
    emotions: z.boolean().default(true),
    granularity: z.enum(['sentence', 'paragraph', 'speaker']).default('speaker'),
  }),

  // Follow-up automation settings
  followUp: z.object({
    enabled: z.boolean().default(true),
    autoCreateTasks: z.boolean().default(true),
    autoSendEmails: z.boolean().default(false),
    reminderHours: z.number().min(1).max(168).default(24),
    includeSummary: z.boolean().default(true),
  }),
});

export const TranslationConfigSchema = z.object({
  // Real-time translation settings
  realTime: z.object({
    enabled: z.boolean().default(true),
    maxLatency: z.number().min(100).max(5000).default(500), // milliseconds
    bufferSize: z.number().min(100).max(10000).default(1000), // characters
    simultaneousInterpretation: z.boolean().default(true),
  }),

  // Context-aware localization settings
  localization: z.object({
    enabled: z.boolean().default(true),
    culturalAdaptation: z.boolean().default(true),
    formalityDetection: z.boolean().default(true),
    domainSpecific: z.boolean().default(true),
  }),

  // Cultural adaptation settings
  culturalAdaptation: z.object({
    enabled: z.boolean().default(true),
    idiomHandling: z.boolean().default(true),
    culturalReferences: z.boolean().default(true),
    humorAdaptation: z.boolean().default(true),
    sensitivity: z.number().min(0).max(1).default(0.8),
  }),

  // Sign language translation settings
  signLanguage: z.object({
    enabled: z.boolean().default(false),
    targetLanguages: z.array(z.string()).default(['asl', 'bsl']),
    videoProcessing: z.boolean().default(true),
    gestureRecognition: z.boolean().default(true),
    facialExpressionAnalysis: z.boolean().default(true),
  }),

  // Dialect support settings
  dialectSupport: z.object({
    enabled: z.boolean().default(true),
    acousticModeling: z.boolean().default(true),
    regionalVariations: z.boolean().default(true),
    autoDetection: z.boolean().default(true),
  }),
});

export const CustomerServiceConfigSchema = z.object({
  // Omnichannel support settings
  omnichannel: z.object({
    enabled: z.boolean().default(true),
    channels: z.array(z.enum(['email', 'chat', 'phone', 'social', 'sms', 'web'])).default(['email', 'chat']),
    unifiedInbox: z.boolean().default(true),
    messageRouting: z.boolean().default(true),
  }),

  // Intent recognition settings
  intentRecognition: z.object({
    enabled: z.boolean().default(true),
    hierarchicalClassification: z.boolean().default(true),
    confidenceThreshold: z.number().min(0).max(1).default(0.7),
    maxIntents: z.number().min(1).max(10).default(3),
    entityExtraction: z.boolean().default(true),
  }),

  // Escalation prediction settings
  escalationPrediction: z.object({
    enabled: z.boolean().default(true),
    churnModeling: z.boolean().default(true),
    predictionThreshold: z.number().min(0).max(1).default(0.6),
    factors: z.array(z.string()).default(['sentiment', 'complexity', 'urgency', 'history']),
    autoEscalation: z.boolean().default(false),
  }),

  // Resolution automation settings
  resolutionAutomation: z.object({
    enabled: z.boolean().default(true),
    botHandoff: z.boolean().default(true),
    handoffThreshold: z.number().min(0).max(1).default(0.3),
    autoResponse: z.boolean().default(true),
    knowledgeBaseIntegration: z.boolean().default(true),
  }),

  // Satisfaction prediction settings
  satisfactionPrediction: z.object({
    enabled: z.boolean().default(true),
    sentimentTracking: z.boolean().default(true),
    realTimeAnalysis: z.boolean().default(true),
    feedbackCollection: z.boolean().default(true),
    predictionModel: z.enum(['sentiment', 'behavioral', 'hybrid']).default('hybrid'),
  }),
});

export const InternalCommunicationConfigSchema = z.object({
  // Smart routing settings
  smartRouting: z.object({
    enabled: z.boolean().default(true),
    priorityScoring: z.boolean().default(true),
    urgencyAnalysis: z.boolean().default(true),
    recipientOptimization: z.boolean().default(true),
    channelSuggestion: z.boolean().default(true),
  }),

  // Priority detection settings
  priorityDetection: z.object({
    enabled: z.boolean().default(true),
    keywords: z.array(z.string()).default(['urgent', 'asap', 'critical', 'important']),
    sentimentWeight: z.number().min(0).max(1).default(0.3),
    contextWeight: z.number().min(0).max(1).default(0.4),
    deadlineWeight: z.number().min(0).max(1).default(0.3),
  }),

  // Response suggestions settings
  responseSuggestions: z.object({
    enabled: z.boolean().default(true),
    templateMatching: z.boolean().default(true),
    contextAwareness: z.boolean().default(true),
    personalization: z.boolean().default(true),
    maxSuggestions: z.number().min(1).max(10).default(5),
  }),

  // Knowledge base integration settings
  knowledgeBase: z.object({
    enabled: z.boolean().default(true),
    semanticSearch: z.boolean().default(true),
    autoSuggestions: z.boolean().default(true),
    relevanceThreshold: z.number().min(0).max(1).default(0.7),
    maxResults: z.number().min(1).max(20).default(10),
  }),

  // Compliance monitoring settings
  compliance: z.object({
    enabled: z.boolean().default(true),
    contentFiltering: z.boolean().default(true),
    sensitivityDetection: z.boolean().default(true),
    approvalWorkflow: z.boolean().default(false),
    auditLogging: z.boolean().default(true),
  }),
});

// Main communication configuration interface
export interface ICommunicationConfig {
  meeting: z.infer<typeof MeetingConfigSchema>;
  translation: z.infer<typeof TranslationConfigSchema>;
  customerService: z.infer<typeof CustomerServiceConfigSchema>;
  internalCommunication: z.infer<typeof InternalCommunicationConfigSchema>;

  // Global settings
  global: {
    enabled: boolean;
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    caching: {
      enabled: boolean;
      ttl: number; // seconds
      maxSize: number; // MB
    };
    monitoring: {
      enabled: boolean;
      metricsCollection: boolean;
      healthChecks: boolean;
      alerting: boolean;
    };
  };
}

// Default configuration
export const defaultCommunicationConfig: ICommunicationConfig = {
  meeting: {
    transcription: {
      enabled: true,
      provider: 'openai',
      language: 'en-US',
      maxSpeakers: 10,
      interimResults: true,
      punctuate: true,
      smartFormat: true,
    },
    diarization: {
      enabled: true,
      minSpeakers: 1,
      maxSpeakers: 10,
      sensitivity: 0.5,
    },
    actionItems: {
      enabled: true,
      minConfidence: 0.7,
      maxItems: 20,
      includeContext: true,
    },
    summarization: {
      enabled: true,
      method: 'hybrid',
      maxLength: 1000,
      includeKeyPoints: true,
      includeDecisions: true,
    },
    sentiment: {
      enabled: true,
      model: 'openai',
      emotions: true,
      granularity: 'speaker',
    },
    followUp: {
      enabled: true,
      autoCreateTasks: true,
      autoSendEmails: false,
      reminderHours: 24,
      includeSummary: true,
    },
  },

  translation: {
    realTime: {
      enabled: true,
      maxLatency: 500,
      bufferSize: 1000,
      simultaneousInterpretation: true,
    },
    localization: {
      enabled: true,
      culturalAdaptation: true,
      formalityDetection: true,
      domainSpecific: true,
    },
    culturalAdaptation: {
      enabled: true,
      idiomHandling: true,
      culturalReferences: true,
      humorAdaptation: true,
      sensitivity: 0.8,
    },
    signLanguage: {
      enabled: false,
      targetLanguages: ['asl', 'bsl'],
      videoProcessing: true,
      gestureRecognition: true,
      facialExpressionAnalysis: true,
    },
    dialectSupport: {
      enabled: true,
      acousticModeling: true,
      regionalVariations: true,
      autoDetection: true,
    },
  },

  customerService: {
    omnichannel: {
      enabled: true,
      channels: ['email', 'chat'],
      unifiedInbox: true,
      messageRouting: true,
    },
    intentRecognition: {
      enabled: true,
      hierarchicalClassification: true,
      confidenceThreshold: 0.7,
      maxIntents: 3,
      entityExtraction: true,
    },
    escalationPrediction: {
      enabled: true,
      churnModeling: true,
      predictionThreshold: 0.6,
      factors: ['sentiment', 'complexity', 'urgency', 'history'],
      autoEscalation: false,
    },
    resolutionAutomation: {
      enabled: true,
      botHandoff: true,
      handoffThreshold: 0.3,
      autoResponse: true,
      knowledgeBaseIntegration: true,
    },
    satisfactionPrediction: {
      enabled: true,
      sentimentTracking: true,
      realTimeAnalysis: true,
      feedbackCollection: true,
      predictionModel: 'hybrid',
    },
  },

  internalCommunication: {
    smartRouting: {
      enabled: true,
      priorityScoring: true,
      urgencyAnalysis: true,
      recipientOptimization: true,
      channelSuggestion: true,
    },
    priorityDetection: {
      enabled: true,
      keywords: ['urgent', 'asap', 'critical', 'important'],
      sentimentWeight: 0.3,
      contextWeight: 0.4,
      deadlineWeight: 0.3,
    },
    responseSuggestions: {
      enabled: true,
      templateMatching: true,
      contextAwareness: true,
      personalization: true,
      maxSuggestions: 5,
    },
    knowledgeBase: {
      enabled: true,
      semanticSearch: true,
      autoSuggestions: true,
      relevanceThreshold: 0.7,
      maxResults: 10,
    },
    compliance: {
      enabled: true,
      contentFiltering: true,
      sensitivityDetection: true,
      approvalWorkflow: false,
      auditLogging: true,
    },
  },

  global: {
    enabled: true,
    debugMode: false,
    logLevel: 'info',
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,
      requestsPerHour: 1000,
    },
    caching: {
      enabled: true,
      ttl: 300, // 5 minutes
      maxSize: 100, // 100 MB
    },
    monitoring: {
      enabled: true,
      metricsCollection: true,
      healthChecks: true,
      alerting: true,
    },
  },
};

// Configuration validation function
export function validateCommunicationConfig(config: Partial<ICommunicationConfig>): ICommunicationConfig {
  try {
    return {
      meeting: MeetingConfigSchema.parse(config.meeting || {}),
      translation: TranslationConfigSchema.parse(config.translation || {}),
      customerService: CustomerServiceConfigSchema.parse(config.customerService || {}),
      internalCommunication: InternalCommunicationConfigSchema.parse(config.internalCommunication || {}),
      global: {
        enabled: config.global?.enabled ?? defaultCommunicationConfig.global.enabled,
        debugMode: config.global?.debugMode ?? defaultCommunicationConfig.global.debugMode,
        logLevel: config.global?.logLevel ?? defaultCommunicationConfig.global.logLevel,
        rateLimiting: {
          enabled: config.global?.rateLimiting?.enabled ?? defaultCommunicationConfig.global.rateLimiting.enabled,
          requestsPerMinute: config.global?.rateLimiting?.requestsPerMinute ?? defaultCommunicationConfig.global.rateLimiting.requestsPerMinute,
          requestsPerHour: config.global?.rateLimiting?.requestsPerHour ?? defaultCommunicationConfig.global.rateLimiting.requestsPerHour,
        },
        caching: {
          enabled: config.global?.caching?.enabled ?? defaultCommunicationConfig.global.caching.enabled,
          ttl: config.global?.caching?.ttl ?? defaultCommunicationConfig.global.caching.ttl,
          maxSize: config.global?.caching?.maxSize ?? defaultCommunicationConfig.global.caching.maxSize,
        },
        monitoring: {
          enabled: config.global?.monitoring?.enabled ?? defaultCommunicationConfig.global.monitoring.enabled,
          metricsCollection: config.global?.monitoring?.metricsCollection ?? defaultCommunicationConfig.global.monitoring.metricsCollection,
          healthChecks: config.global?.monitoring?.healthChecks ?? defaultCommunicationConfig.global.monitoring.healthChecks,
          alerting: config.global?.monitoring?.alerting ?? defaultCommunicationConfig.global.monitoring.alerting,
        },
      },
    };
  } catch (error) {
    console.error('Invalid communication configuration:', error);
    return defaultCommunicationConfig;
  }
}

// Load configuration from environment variables
export function loadCommunicationConfigFromEnv(): ICommunicationConfig {
  return validateCommunicationConfig({
    meeting: {
      transcription: {
        enabled: process.env.COMMUNICATION_MEETING_TRANSCRIPTION_ENABLED === 'true',
        provider: (process.env.COMMUNICATION_MEETING_TRANSCRIPTION_PROVIDER as any) || 'openai',
        language: process.env.COMMUNICATION_MEETING_TRANSCRIPTION_LANGUAGE || 'en-US',
        maxSpeakers: parseInt(process.env.COMMUNICATION_MEETING_TRANSCRIPTION_MAX_SPEAKERS || '10'),
        interimResults: process.env.COMMUNICATION_MEETING_TRANSCRIPTION_INTERIM_RESULTS !== 'false',
        punctuate: process.env.COMMUNICATION_MEETING_TRANSCRIPTION_PUNCTUATE !== 'false',
        smartFormat: process.env.COMMUNICATION_MEETING_TRANSCRIPTION_SMART_FORMAT !== 'false',
      },
      diarization: {
        enabled: process.env.COMMUNICATION_MEETING_DIARIZATION_ENABLED !== 'false',
        minSpeakers: parseInt(process.env.COMMUNICATION_MEETING_DIARIZATION_MIN_SPEAKERS || '1'),
        maxSpeakers: parseInt(process.env.COMMUNICATION_MEETING_DIARIZATION_MAX_SPEAKERS || '10'),
        sensitivity: parseFloat(process.env.COMMUNICATION_MEETING_DIARIZATION_SENSITIVITY || '0.5'),
      },
      actionItems: {
        enabled: process.env.COMMUNICATION_MEETING_ACTION_ITEMS_ENABLED !== 'false',
        minConfidence: parseFloat(process.env.COMMUNICATION_MEETING_ACTION_ITEMS_MIN_CONFIDENCE || '0.7'),
        maxItems: parseInt(process.env.COMMUNICATION_MEETING_ACTION_ITEMS_MAX_ITEMS || '20'),
        includeContext: process.env.COMMUNICATION_MEETING_ACTION_ITEMS_INCLUDE_CONTEXT !== 'false',
      },
      summarization: {
        enabled: process.env.COMMUNICATION_MEETING_SUMMARIZATION_ENABLED !== 'false',
        method: (process.env.COMMUNICATION_MEETING_SUMMARIZATION_METHOD as any) || 'hybrid',
        maxLength: parseInt(process.env.COMMUNICATION_MEETING_SUMMARIZATION_MAX_LENGTH || '1000'),
        includeKeyPoints: process.env.COMMUNICATION_MEETING_SUMMARIZATION_INCLUDE_KEY_POINTS !== 'false',
        includeDecisions: process.env.COMMUNICATION_MEETING_SUMMARIZATION_INCLUDE_DECISIONS !== 'false',
      },
      sentiment: {
        enabled: process.env.COMMUNICATION_MEETING_SENTIMENT_ENABLED !== 'false',
        model: (process.env.COMMUNICATION_MEETING_SENTIMENT_MODEL as any) || 'openai',
        emotions: process.env.COMMUNICATION_MEETING_SENTIMENT_EMOTIONS !== 'false',
        granularity: (process.env.COMMUNICATION_MEETING_SENTIMENT_GRANULARITY as any) || 'speaker',
      },
      followUp: {
        enabled: process.env.COMMUNICATION_MEETING_FOLLOW_UP_ENABLED !== 'false',
        autoCreateTasks: process.env.COMMUNICATION_MEETING_FOLLOW_UP_AUTO_CREATE_TASKS !== 'false',
        autoSendEmails: process.env.COMMUNICATION_MEETING_FOLLOW_UP_AUTO_SEND_EMAILS === 'true',
        reminderHours: parseInt(process.env.COMMUNICATION_MEETING_FOLLOW_UP_REMINDER_HOURS || '24'),
        includeSummary: process.env.COMMUNICATION_MEETING_FOLLOW_UP_INCLUDE_SUMMARY !== 'false',
      },
    },
    translation: {
      realTime: {
        enabled: process.env.COMMUNICATION_TRANSLATION_REAL_TIME_ENABLED !== 'false',
        maxLatency: parseInt(process.env.COMMUNICATION_TRANSLATION_REAL_TIME_MAX_LATENCY || '500'),
        bufferSize: parseInt(process.env.COMMUNICATION_TRANSLATION_REAL_TIME_BUFFER_SIZE || '1000'),
        simultaneousInterpretation: process.env.COMMUNICATION_TRANSLATION_REAL_TIME_SIMULTANEOUS !== 'false',
      },
      localization: {
        enabled: process.env.COMMUNICATION_TRANSLATION_LOCALIZATION_ENABLED !== 'false',
        culturalAdaptation: process.env.COMMUNICATION_TRANSLATION_LOCALIZATION_CULTURAL !== 'false',
        formalityDetection: process.env.COMMUNICATION_TRANSLATION_LOCALIZATION_FORMALITY !== 'false',
        domainSpecific: process.env.COMMUNICATION_TRANSLATION_LOCALIZATION_DOMAIN_SPECIFIC !== 'false',
      },
      culturalAdaptation: {
        enabled: process.env.COMMUNICATION_TRANSLATION_CULTURAL_ADAPTATION_ENABLED !== 'false',
        idiomHandling: process.env.COMMUNICATION_TRANSLATION_CULTURAL_ADAPTATION_IDIOM !== 'false',
        culturalReferences: process.env.COMMUNICATION_TRANSLATION_CULTURAL_ADAPTATION_REFERENCES !== 'false',
        humorAdaptation: process.env.COMMUNICATION_TRANSLATION_CULTURAL_ADAPTATION_HUMOR !== 'false',
        sensitivity: parseFloat(process.env.COMMUNICATION_TRANSLATION_CULTURAL_ADAPTATION_SENSITIVITY || '0.8'),
      },
      signLanguage: {
        enabled: process.env.COMMUNICATION_TRANSLATION_SIGN_LANGUAGE_ENABLED === 'true',
        targetLanguages: (process.env.COMMUNICATION_TRANSLATION_SIGN_LANGUAGE_TARGETS || 'asl,bsl').split(','),
        videoProcessing: process.env.COMMUNICATION_TRANSLATION_SIGN_LANGUAGE_VIDEO !== 'false',
        gestureRecognition: process.env.COMMUNICATION_TRANSLATION_SIGN_LANGUAGE_GESTURE !== 'false',
        facialExpressionAnalysis: process.env.COMMUNICATION_TRANSLATION_SIGN_LANGUAGE_FACIAL !== 'false',
      },
      dialectSupport: {
        enabled: process.env.COMMUNICATION_TRANSLATION_DIALECT_SUPPORT_ENABLED !== 'false',
        acousticModeling: process.env.COMMUNICATION_TRANSLATION_DIALECT_SUPPORT_ACOUSTIC !== 'false',
        regionalVariations: process.env.COMMUNICATION_TRANSLATION_DIALECT_SUPPORT_REGIONAL !== 'false',
        autoDetection: process.env.COMMUNICATION_TRANSLATION_DIALECT_SUPPORT_AUTO_DETECTION !== 'false',
      },
    },
    customerService: {
      omnichannel: {
        enabled: process.env.COMMUNICATION_CUSTOMER_SERVICE_OMNICHANNEL_ENABLED !== 'false',
        channels: (process.env.COMMUNICATION_CUSTOMER_SERVICE_OMNICHANNEL_CHANNELS || 'email,chat').split(',') as any,
        unifiedInbox: process.env.COMMUNICATION_CUSTOMER_SERVICE_OMNICHANNEL_UNIFIED !== 'false',
        messageRouting: process.env.COMMUNICATION_CUSTOMER_SERVICE_OMNICHANNEL_ROUTING !== 'false',
      },
      intentRecognition: {
        enabled: process.env.COMMUNICATION_CUSTOMER_SERVICE_INTENT_RECOGNITION_ENABLED !== 'false',
        hierarchicalClassification: process.env.COMMUNICATION_CUSTOMER_SERVICE_INTENT_HIERARCHICAL !== 'false',
        confidenceThreshold: parseFloat(process.env.COMMUNICATION_CUSTOMER_SERVICE_INTENT_CONFIDENCE || '0.7'),
        maxIntents: parseInt(process.env.COMMUNICATION_CUSTOMER_SERVICE_INTENT_MAX_INTENTS || '3'),
        entityExtraction: process.env.COMMUNICATION_CUSTOMER_SERVICE_INTENT_ENTITY_EXTRACTION !== 'false',
      },
      escalationPrediction: {
        enabled: process.env.COMMUNICATION_CUSTOMER_SERVICE_ESCALATION_PREDICTION_ENABLED !== 'false',
        churnModeling: process.env.COMMUNICATION_CUSTOMER_SERVICE_ESCALATION_CHURN !== 'false',
        predictionThreshold: parseFloat(process.env.COMMUNICATION_CUSTOMER_SERVICE_ESCALATION_THRESHOLD || '0.6'),
        factors: (process.env.COMMUNICATION_CUSTOMER_SERVICE_ESCALATION_FACTORS || 'sentiment,complexity,urgency,history').split(','),
        autoEscalation: process.env.COMMUNICATION_CUSTOMER_SERVICE_ESCALATION_AUTO === 'true',
      },
      resolutionAutomation: {
        enabled: process.env.COMMUNICATION_CUSTOMER_SERVICE_RESOLUTION_AUTOMATION_ENABLED !== 'false',
        botHandoff: process.env.COMMUNICATION_CUSTOMER_SERVICE_RESOLUTION_BOT_HANDOFF !== 'false',
        handoffThreshold: parseFloat(process.env.COMMUNICATION_CUSTOMER_SERVICE_RESOLUTION_HANDOFF_THRESHOLD || '0.3'),
        autoResponse: process.env.COMMUNICATION_CUSTOMER_SERVICE_RESOLUTION_AUTO_RESPONSE !== 'false',
        knowledgeBaseIntegration: process.env.COMMUNICATION_CUSTOMER_SERVICE_RESOLUTION_KB_INTEGRATION !== 'false',
      },
      satisfactionPrediction: {
        enabled: process.env.COMMUNICATION_CUSTOMER_SERVICE_SATISFACTION_PREDICTION_ENABLED !== 'false',
        sentimentTracking: process.env.COMMUNICATION_CUSTOMER_SERVICE_SATISFACTION_SENTIMENT !== 'false',
        realTimeAnalysis: process.env.COMMUNICATION_CUSTOMER_SERVICE_SATISFACTION_REAL_TIME !== 'false',
        feedbackCollection: process.env.COMMUNICATION_CUSTOMER_SERVICE_SATISFACTION_FEEDBACK !== 'false',
        predictionModel: (process.env.COMMUNICATION_CUSTOMER_SERVICE_SATISFACTION_MODEL as any) || 'hybrid',
      },
    },
    internalCommunication: {
      smartRouting: {
        enabled: process.env.COMMUNICATION_INTERNAL_COMM_SMART_ROUTING_ENABLED !== 'false',
        priorityScoring: process.env.COMMUNICATION_INTERNAL_COMM_SMART_ROUTING_PRIORITY !== 'false',
        urgencyAnalysis: process.env.COMMUNICATION_INTERNAL_COMM_SMART_ROUTING_URGENCY !== 'false',
        recipientOptimization: process.env.COMMUNICATION_INTERNAL_COMM_SMART_ROUTING_RECIPIENT !== 'false',
        channelSuggestion: process.env.COMMUNICATION_INTERNAL_COMM_SMART_ROUTING_CHANNEL !== 'false',
      },
      priorityDetection: {
        enabled: process.env.COMMUNICATION_INTERNAL_COMM_PRIORITY_DETECTION_ENABLED !== 'false',
        keywords: (process.env.COMMUNICATION_INTERNAL_COMM_PRIORITY_KEYWORDS || 'urgent,asap,critical,important').split(','),
        sentimentWeight: parseFloat(process.env.COMMUNICATION_INTERNAL_COMM_PRIORITY_SENTIMENT_WEIGHT || '0.3'),
        contextWeight: parseFloat(process.env.COMMUNICATION_INTERNAL_COMM_PRIORITY_CONTEXT_WEIGHT || '0.4'),
        deadlineWeight: parseFloat(process.env.COMMUNICATION_INTERNAL_COMM_PRIORITY_DEADLINE_WEIGHT || '0.3'),
      },
      responseSuggestions: {
        enabled: process.env.COMMUNICATION_INTERNAL_COMM_RESPONSE_SUGGESTIONS_ENABLED !== 'false',
        templateMatching: process.env.COMMUNICATION_INTERNAL_COMM_RESPONSE_TEMPLATE_MATCHING !== 'false',
        contextAwareness: process.env.COMMUNICATION_INTERNAL_COMM_RESPONSE_CONTEXT_AWARENESS !== 'false',
        personalization: process.env.COMMUNICATION_INTERNAL_COMM_RESPONSE_PERSONALIZATION !== 'false',
        maxSuggestions: parseInt(process.env.COMMUNICATION_INTERNAL_COMM_RESPONSE_MAX_SUGGESTIONS || '5'),
      },
      knowledgeBase: {
        enabled: process.env.COMMUNICATION_INTERNAL_COMM_KNOWLEDGE_BASE_ENABLED !== 'false',
        semanticSearch: process.env.COMMUNICATION_INTERNAL_COMM_KNOWLEDGE_BASE_SEMANTIC !== 'false',
        autoSuggestions: process.env.COMMUNICATION_INTERNAL_COMM_KNOWLEDGE_BASE_AUTO_SUGGESTIONS !== 'false',
        relevanceThreshold: parseFloat(process.env.COMMUNICATION_INTERNAL_COMM_KNOWLEDGE_BASE_RELEVANCE_THRESHOLD || '0.7'),
        maxResults: parseInt(process.env.COMMUNICATION_INTERNAL_COMM_KNOWLEDGE_BASE_MAX_RESULTS || '10'),
      },
      compliance: {
        enabled: process.env.COMMUNICATION_INTERNAL_COMM_COMPLIANCE_ENABLED !== 'false',
        contentFiltering: process.env.COMMUNICATION_INTERNAL_COMM_COMPLIANCE_CONTENT_FILTERING !== 'false',
        sensitivityDetection: process.env.COMMUNICATION_INTERNAL_COMM_COMPLIANCE_SENSITIVITY_DETECTION !== 'false',
        approvalWorkflow: process.env.COMMUNICATION_INTERNAL_COMM_COMPLIANCE_APPROVAL_WORKFLOW === 'true',
        auditLogging: process.env.COMMUNICATION_INTERNAL_COMM_COMPLIANCE_AUDIT_LOGGING !== 'false',
      },
    },
    global: {
      enabled: process.env.COMMUNICATION_GLOBAL_ENABLED !== 'false',
      debugMode: process.env.COMMUNICATION_GLOBAL_DEBUG_MODE === 'true',
      logLevel: (process.env.COMMUNICATION_GLOBAL_LOG_LEVEL as any) || 'info',
      rateLimiting: {
        enabled: process.env.COMMUNICATION_GLOBAL_RATE_LIMITING_ENABLED !== 'false',
        requestsPerMinute: parseInt(process.env.COMMUNICATION_GLOBAL_RATE_LIMITING_RPM || '100'),
        requestsPerHour: parseInt(process.env.COMMUNICATION_GLOBAL_RATE_LIMITING_RPH || '1000'),
      },
      caching: {
        enabled: process.env.COMMUNICATION_GLOBAL_CACHING_ENABLED !== 'false',
        ttl: parseInt(process.env.COMMUNICATION_GLOBAL_CACHING_TTL || '300'),
        maxSize: parseInt(process.env.COMMUNICATION_GLOBAL_CACHING_MAX_SIZE || '100'),
      },
      monitoring: {
        enabled: process.env.COMMUNICATION_GLOBAL_MONITORING_ENABLED !== 'false',
        metricsCollection: process.env.COMMUNICATION_GLOBAL_MONITORING_METRICS !== 'false',
        healthChecks: process.env.COMMUNICATION_GLOBAL_MONITORING_HEALTH_CHECKS !== 'false',
        alerting: process.env.COMMUNICATION_GLOBAL_MONITORING_ALERTING !== 'false',
      },
    },
  });
}