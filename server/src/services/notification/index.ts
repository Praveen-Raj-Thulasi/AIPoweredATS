import { INotificationService } from './notification.interface';
import { EmailTemplatePayload, Interview, Offer } from '@ats/shared';
import { emailService } from '../email.service';
import { logger } from '../../utils/logger';

export class EmailNotificationService implements INotificationService {
  async sendCandidateEmail(payload: EmailTemplatePayload): Promise<{ success: boolean; messageId: string }> {
    const record = await emailService.sendCandidateEmail(payload);
    return { success: true, messageId: record.id };
  }

  async sendInterviewScheduledNotification(interview: Interview): Promise<void> {
    if (interview.candidateEmail) {
      await this.sendCandidateEmail({
        to: interview.candidateEmail,
        candidateName: interview.candidateName || 'Candidate',
        jobTitle: interview.jobTitle || 'Role',
        companyName: 'InnovateCorp Technologies',
        templateType: 'interview_invite',
        interviewDetails: {
          date: new Date(interview.scheduledAt).toLocaleDateString(),
          time: new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          interviewerName: interview.interviewerNames.join(', '),
          meetingLink: interview.meetingLink,
        },
      });
      logger.info(`[Notification] Dispatched interview schedule email to ${interview.candidateEmail}`);
    }
  }

  async sendOfferNotification(offer: Offer): Promise<void> {
    if (offer.candidateEmail) {
      await this.sendCandidateEmail({
        to: offer.candidateEmail,
        candidateName: offer.candidateName || 'Candidate',
        jobTitle: offer.jobTitle || 'Role',
        companyName: 'InnovateCorp Technologies',
        templateType: 'job_offer',
        customMessage: `We are pleased to extend an offer with a starting base salary of ${offer.currency} ${offer.baseSalary.toLocaleString()} / year. Anticipated start date: ${new Date(offer.startDate).toLocaleDateString()}.`,
      });
      logger.info(`[Notification] Dispatched official offer letter notification to ${offer.candidateEmail}`);
    }
  }
}

export const notificationService: INotificationService = new EmailNotificationService();
