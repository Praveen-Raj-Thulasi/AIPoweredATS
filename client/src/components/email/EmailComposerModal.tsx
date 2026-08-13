import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultCandidateName?: string;
  defaultJobTitle?: string;
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  defaultCandidateName = 'Candidate',
  defaultJobTitle = 'Open Position',
}) => {
  const [to, setTo] = useState(defaultEmail);
  const [candidateName, setCandidateName] = useState(defaultCandidateName);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [templateType, setTemplateType] = useState<'interview_invite' | 'job_offer' | 'application_received' | 'rejection'>('interview_invite');
  const [customMessage, setCustomMessage] = useState('');
  const [interviewDate, setInterviewDate] = useState('2026-08-15');
  const [interviewTime, setInterviewTime] = useState('10:00 AM PST');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/ats-demo-meet');

  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync props when opening
  React.useEffect(() => {
    if (defaultEmail) setTo(defaultEmail);
    if (defaultCandidateName) setCandidateName(defaultCandidateName);
    if (defaultJobTitle) setJobTitle(defaultJobTitle);
    setSentSuccess(false);
  }, [defaultEmail, defaultCandidateName, defaultJobTitle, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to) {
      setError('Recipient email is required.');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      await api.sendEmail({
        to,
        candidateName,
        jobTitle,
        companyName: 'InnovateCorp Technologies',
        templateType,
        customMessage: customMessage || undefined,
        interviewDetails:
          templateType === 'interview_invite'
            ? {
                date: interviewDate,
                time: interviewTime,
                interviewerName: 'Sarah Jenkins (Senior Recruiter)',
                meetingLink,
              }
            : undefined,
      });

      setSentSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidate Email Communication"
      subtitle="Dispatch automated or personalized candidate messages via AWS SES"
      maxWidth="2xl"
    >
      {sentSuccess ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Email Dispatched Successfully</h4>
            <p className="text-xs text-zinc-400 mt-1">
              Message successfully routed to <strong>{to}</strong>.
            </p>
          </div>
          <Button variant="primary" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Recipient Email *</label>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Candidate Full Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Role / Position</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Email Template Preset</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="interview_invite">Interview Invitation</option>
                <option value="job_offer">Official Job Offer Letter</option>
                <option value="application_received">Application Confirmation</option>
                <option value="rejection">Respectful Feedback / Rejection</option>
              </select>
            </div>
          </div>

          {/* Conditional Interview details */}
          {templateType === 'interview_invite' && (
            <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-3">
              <p className="text-xs font-semibold text-white font-mono">Interview Scheduling Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Time</label>
                  <input
                    type="text"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Meeting Link</label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom Message Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Custom Message / Note (Optional)
            </label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. We were particularly impressed with your distributed systems background..."
              className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y transition-colors leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSending}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Send Email
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};


