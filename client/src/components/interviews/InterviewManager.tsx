import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { Interview, InterviewStatus, InterviewSessionState } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { PageHeader } from '../ui/PageHeader';
import { InterviewWorkspace } from './InterviewWorkspace';
import { api } from '../../services/api';

interface InterviewManagerProps {
  interviews: Interview[];
  onOpenScheduleModal: () => void;
  onRefreshInterviews: () => void;
}

export const InterviewManager: React.FC<InterviewManagerProps> = ({
  interviews,
  onOpenScheduleModal,
  onRefreshInterviews,
}) => {
  const [activeTab, setActiveTab] = useState<InterviewStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [activeSession, setActiveSession] = useState<InterviewSessionState | null>(null);
  const [isLaunchingSession, setIsLaunchingSession] = useState<string | null>(null);

  const filteredInterviews = interviews.filter((int) => {
    const matchesTab = activeTab === 'all' || int.status === activeTab;
    const matchesSearch =
      (int.candidateName?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (int.jobTitle?.toLowerCase().includes(search.toLowerCase()) || false);
    return matchesTab && matchesSearch;
  });

  const handleLaunchAdaptiveInterview = async (interview: Interview) => {
    setIsLaunchingSession(interview.id);
    try {
      const session = await api.startInterviewSession(
        interview.candidateId,
        interview.jobId,
        'ai_assisted',
        interview.id
      );
      setActiveSession(session);
    } catch (err: any) {
      alert(err.message || 'Failed to start adaptive interview session');
    } finally {
      setIsLaunchingSession(null);
    }
  };

  if (activeSession) {
    return (
      <InterviewWorkspace
        session={activeSession}
        onComplete={() => {
          setActiveSession(null);
          onRefreshInterviews();
        }}
        onExit={() => {
          setActiveSession(null);
          onRefreshInterviews();
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        title="Adaptive Interview Console"
        description="Conduct capability-driven interviews with real-time claim detection and automated probe assistance."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            {interviews.length} INTERVIEWS
          </span>
        }
        actions={
          <Button variant="primary" size="sm" onClick={onOpenScheduleModal}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Schedule Interview
          </Button>
        }
      />

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search candidate name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0c0c0e] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div className="flex rounded-xl bg-[#0c0c0e] p-1 border border-zinc-800 self-start sm:self-auto font-mono text-xs">
          {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                activeTab === status
                  ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Interviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterviews.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500 text-xs bg-[#0c0c0e] rounded-2xl border border-zinc-800/80">
            No interviews found matching criteria.
          </div>
        ) : (
          filteredInterviews.map((int) => (
            <Card key={int.id} className="flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all">
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                      {int.interviewType}
                    </span>
                    <h3 className="font-semibold text-white text-base leading-snug">
                      {int.candidateName || 'Candidate'}
                    </h3>
                    <p className="text-xs text-zinc-400">{int.jobTitle}</p>
                  </div>
                  <StatusIndicator status={int.status} size="sm" showIcon={false} />
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 text-xs text-zinc-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      {new Date(int.scheduledAt).toLocaleDateString()} at{' '}
                      {new Date(int.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{int.durationMinutes} Minutes</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-850/60 font-mono">
                    Panel: <strong className="text-zinc-200 font-sans font-normal">{int.interviewerNames.join(', ')}</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLaunchAdaptiveInterview(int)}
                  isLoading={isLaunchingSession === int.id}
                  className="flex-1 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Launch Workspace
                </Button>

                {int.meetingLink && (
                  <a
                    href={int.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-black/40 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                    title="Open Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </a>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};


