import { EmailTemplatePayload } from '@ats/shared';
import { sesMailerService } from './notification/ses.mailer.service';
import { logger } from '../utils/logger';

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  bodyHtml: string;
  templateType: string;
  sentAt: string;
  status: 'sent' | 'queued' | 'failed';
}

export class EmailService {
  private emailHistory: SentEmailRecord[] = [];

  async sendCandidateEmail(payload: EmailTemplatePayload): Promise<SentEmailRecord> {
    const { to, candidateName, jobTitle, companyName, templateType, customMessage, interviewDetails } = payload;
    let subject = '';
    let bodyHtml = '';

    switch (templateType) {
      case 'application_received':
        subject = `Application Received: ${jobTitle} at ${companyName}`;
        bodyHtml = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
            <h2>Hi ${candidateName},</h2>
            <p>Thank you for your interest in joining <strong>${companyName}</strong> as a <strong>${jobTitle}</strong>.</p>
            <p>We have successfully received your application. Our recruiting team and AI screening assistant are actively reviewing your qualifications against our role requirements.</p>
            <p>You can expect to hear back from us regarding next steps soon.</p>
            <p>Best regards,<br/>The Talent Acquisition Team at ${companyName}</p>
          </div>
        `;
        break;

      case 'interview_invite':
        subject = `Interview Invitation: ${jobTitle} at ${companyName}`;
        bodyHtml = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
            <h2>Hi ${candidateName},</h2>
            <p>Great news! We were impressed by your background and would love to invite you for an interview for the <strong>${jobTitle}</strong> position.</p>
            ${
              interviewDetails
                ? `<div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>📅 Date:</strong> ${interviewDetails.date}</p>
                    <p><strong>⏰ Time:</strong> ${interviewDetails.time}</p>
                    <p><strong>👤 Interviewer:</strong> ${interviewDetails.interviewerName}</p>
                    ${interviewDetails.meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${interviewDetails.meetingLink}">${interviewDetails.meetingLink}</a></p>` : ''}
                   </div>`
                : ''
            }
            ${customMessage ? `<p>${customMessage}</p>` : ''}
            <p>Please let us know if this time works for you.</p>
            <p>Best regards,<br/>The Talent Acquisition Team at ${companyName}</p>
          </div>
        `;
        break;

      case 'job_offer':
        subject = `Job Offer: ${jobTitle} at ${companyName}! 🎉`;
        bodyHtml = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
            <h2>Congratulations ${candidateName}!</h2>
            <p>We are thrilled to offer you the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>!</p>
            <p>The team was thoroughly impressed with your technical expertise, leadership, and cultural alignment throughout the interview process.</p>
            ${customMessage ? `<p>${customMessage}</p>` : ''}
            <p>We look forward to welcoming you aboard!</p>
            <p>Warmest congratulations,<br/>The Leadership Team at ${companyName}</p>
          </div>
        `;
        break;

      case 'rejection':
        subject = `Update on your application for ${jobTitle} at ${companyName}`;
        bodyHtml = `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
            <h2>Hi ${candidateName},</h2>
            <p>Thank you for taking the time to speak with our team regarding the <strong>${jobTitle}</strong> opportunity at ${companyName}.</p>
            <p>While we were impressed with your credentials, we have decided to move forward with other candidates whose experience more closely matches our immediate technical requirements.</p>
            <p>We truly appreciate your interest and wish you the very best in your job search and future endeavors.</p>
            <p>Sincerely,<br/>The Talent Acquisition Team at ${companyName}</p>
          </div>
        `;
        break;
    }

    const dispatchRes = await sesMailerService.sendEmail({
      to,
      subject,
      htmlBody: bodyHtml,
      category: templateType as any,
    });

    const record: SentEmailRecord = {
      id: dispatchRes.messageId,
      to,
      subject,
      bodyHtml,
      templateType,
      sentAt: dispatchRes.timestamp,
      status: dispatchRes.status === 'sent' || dispatchRes.status === 'mock_delivered' ? 'sent' : 'queued',
    };

    this.emailHistory.unshift(record);
    return record;
  }

  async getEmailHistory(): Promise<SentEmailRecord[]> {
    return this.emailHistory;
  }
}

export const emailService = new EmailService();

