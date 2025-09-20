// Personalization Engine Models
export * from './UserProfile';
export * from './Recommendation';
export * from './Engagement';

// Re-export commonly used models
export { default as UserProfileModels } from './UserProfile';
export { default as RecommendationModels } from './Recommendation';
export { default as EngagementModels } from './Engagement';

// Type exports for convenience
export type {
  IUserBehavior,
  IUserPreferences,
  IUserPsychographics,
  IUserContext,
  IUserProfile,
} from './UserProfile';

export type {
  IContentItem,
  IUserItemInteraction,
  IRecommendation,
  IUserSimilarity,
  IItemEmbedding,
  IExperiment,
} from './Recommendation';

export type {
  IUserTiming,
  IChannelPreference,
  IMessageTemplate,
  IUserFatigue,
  IEngagementCampaign,
} from './Engagement';