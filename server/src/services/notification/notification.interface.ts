import { EmailTemplatePayload, Interview, Offer } from '@ats/shared';

export interface INotificationService {
  sendCandidateEmail(payload: EmailTemplatePayload): Promise<{ success: boolean; messageId: string }>;
  sendInterviewScheduledNotification(interview: Interview): Promise<void>;
  sendOfferNotification(offer: Offer): Promise<void>;
}
