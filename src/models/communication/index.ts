// Communication Models Index
export { default as Meeting } from './Meeting';
export { default as Translation } from './Translation';
export { default as CustomerServiceTicket } from './CustomerService';
export { default as CommunicationAnalytics } from './CommunicationAnalytics';
export {
  InternalCommunicationMessage,
  InternalCommunicationThread,
  InternalCommunicationTemplate,
  InternalCommunicationKnowledgeBase,
  InternalCommunicationAnalytics
} from './InternalCommunication';

// Re-export interfaces for easier access
export type { IMeeting, IMeetingParticipant, IMeetingActionItem, IMeetingTranscript, IMeetingSummary } from './Meeting';
export type {
  ITranslation,
  ITranslationSegment,
  ITranslationSession,
  ISignLanguageTranslation,
  ICulturalAdaptation
} from './Translation';
export type {
  ICustomerServiceTicket,
  ICustomerServiceChannel,
  ICustomerServiceIntent,
  ICustomerServiceMessage,
  ICustomerServiceEscalation,
  ICustomerServiceResolution,
  ICustomerServiceConversation
} from './CustomerService';
export type {
  IInternalCommunicationMessage,
  IInternalCommunicationThread,
  IInternalCommunicationTemplate,
  IInternalCommunicationKnowledgeBase,
  IInternalCommunicationAnalytics
} from './InternalCommunication';
export type { ICommunicationAnalytics, ICommunicationMetrics } from './CommunicationAnalytics';