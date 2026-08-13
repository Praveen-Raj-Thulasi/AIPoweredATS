import React, { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { Application, InterviewType } from '@ats/shared';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onScheduled: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  application,
  onScheduled,
}) => {
  const [scheduledDate, setScheduledDate] = useState('2026-08-15');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [interviewType, setInterviewType] = useState<InterviewType>('technical');
  const [interviewerNames, setInterviewerNames] = useState('Sarah Jenkins, Alex Thorne');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/verity-panel');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!application) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00Z`).toISOString();
      await api.scheduleInterview({
        applicationId: application.id,
        candidateId: application.candidateId,
        jobId: application.jobId,
        scheduledAt,
        durationMinutes: Number(durationMinutes),
        interviewType,
        interviewerNames: interviewerNames.split(',').map((s) => s.trim()),
        meetingLink,
        notes,
      });

      onScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Candidate Interview"
      subtitle={`For ${application.candidate?.firstName} ${application.candidate?.lastName} • ${application.jobTitle}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Interview Type *</label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value as InterviewType)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="screening">Initial Screening (30m)</option>
              <option value="technical">Technical Panel / Coding (60m)</option>
              <option value="behavioral">Behavioral & Past Projects (45m)</option>
              <option value="culture_fit">Culture Fit & Values (45m)</option>
              <option value="executive">Executive & Leadership (45m)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Duration (Minutes)</label>
            <input
              type="number"
              step={15}
              min={15}
              max={180}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Date *</label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Time (UTC / Local) *</label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Assigned Interviewers (Comma-separated)</label>
          <input
            type="text"
            value={interviewerNames}
            onChange={(e) => setInterviewerNames(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Video Meeting Link</label>
          <input
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Preparation Notes for Candidate & Panel</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Focus areas, system design topics, or specific code repository questions..."
            className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y transition-colors leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Schedule Interview
          </Button>
        </div>
      </form>
    </Modal>
  );
};


