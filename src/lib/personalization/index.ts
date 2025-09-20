// Personalization Engine Services
export * from './BasePersonalizationService';
export * from './BehavioralAnalysisService';
export * from './PreferenceLearningService';
export * from './RecommendationEngine';
export * from './PersonalizationService';

// Main service exports
export { PersonalizationService as default } from './PersonalizationService';
export { BehavioralAnalysisService } from './BehavioralAnalysisService';
export { PreferenceLearningService } from './PreferenceLearningService';

// Type exports
export type {
  PersonalizationConfig,
  UserProfileData,
  AnalysisResult,
} from './BasePersonalizationService';

export type {
  BehavioralPattern,
  UserBehaviorSequence,
} from './BehavioralAnalysisService';

export type {
  UserPreferenceProfile,
  CollaborativeFilteringResult,
} from './PreferenceLearningService';

export type {
  PersonalizationResult,
  PersonalizationUpdate,
} from './PersonalizationService';

// Re-export models for convenience
export * from '@/models/personalization';