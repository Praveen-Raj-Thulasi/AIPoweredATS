import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Filter,
  Calendar,
  Award,
  Mail,
} from 'lucide-react';
import { Application, ApplicationStage, Job, DEFAULT_PIPELINE_STAGES } from '@ats/shared';
import { PageHeader } from '../ui/PageHeader';

interface KanbanPipelineProps {
  applications: Application[];
  jobs: Job[];
  onSelectApplication: (appId: string) => void;
  onUpdateStage: (appId: string, stage: ApplicationStage) => void;
  onOpenEmailComposer: (candidateEmail: string, candidateName: string, jobTitle: string) => void;
  onOpenScheduleInterview?: (application: Application) => void;
  onOpenCreateOffer?: (application: Application) => void;
}

export const KanbanPipeline: React.FC<KanbanPipelineProps> = ({
  applications,
  jobs,
  onSelectApplication,
  onUpdateStage,
  onOpenEmailComposer,
  onOpenScheduleInterview,
  onOpenCreateOffer,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>('all');

  const filteredApps = applications.filter((app) => {
    return selectedJobId === 'all' || app.jobId === selectedJobId;
  });

  const getNextStage = (current: ApplicationStage): ApplicationStage | null => {
    const stageSequence = DEFAULT_PIPELINE_STAGES.map((s) => s.id);
    const idx = stageSequence.indexOf(current);
    return idx >= 0 && idx < stageSequence.length - 2 ? stageSequence[idx + 1] : null;
  };

  const getPrevStage = (current: ApplicationStage): ApplicationStage | null => {
    const stageSequence = DEFAULT_PIPELINE_STAGES.map((s) => s.id);
    const idx = stageSequence.indexOf(current);
    return idx > 0 ? stageSequence[idx - 1] : null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        title="Hiring Pipeline"
        description="End-to-end recruitment Kanban workflow across configurable hiring stages."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            {filteredApps.length} CANDIDATES
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0c0c0e] border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="all">All Roles ({applications.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({applications.filter((a) => a.jobId === j.id).length})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Kanban Board Horizontal Columns */}
      <div className="flex gap-5 overflow-x-auto pb-6 pt-1">
        {DEFAULT_PIPELINE_STAGES.map((col) => {
          const colApps = filteredApps.filter((a) => a.stage === col.id);

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-80 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 flex flex-col max-h-[calc(100vh-230px)]"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span className="font-semibold text-xs text-white">{col.label}</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/40 border border-zinc-800 text-zinc-400">
                  {colApps.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1">
                {colApps.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-600">Empty stage</div>
                ) : (
                  colApps.map((app) => {
                    const score = app.aiScoreCard?.overallScore;
                    const nextStage = getNextStage(app.stage);
                    const prevStage = getPrevStage(app.stage);

                    return (
                      <div
                        key={app.id}
                        onClick={() => onSelectApplication(app.id)}
                        className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-all space-y-3 group"
                      >
                        {/* Top: Candidate info & score badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h4 className="font-medium text-xs text-white group-hover:text-zinc-200 transition-colors">
                              {app.candidate?.firstName} {app.candidate?.lastName}
                            </h4>
                            <p className="text-[11px] text-zinc-400 truncate max-w-[170px]">
                              {app.jobTitle}
                            </p>
                          </div>

                          {score !== undefined && (
                            <div className="text-right">
                              <span className="text-xs font-semibold text-white font-mono">
                                {score}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Candidate tags */}
                        {app.candidate?.tags && app.candidate.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {app.candidate.tags.slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bottom Actions Toolbar */}
                        <div className="pt-2.5 border-t border-zinc-850/60 flex items-center justify-between text-xs text-zinc-400">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (app.candidate) {
                                  onOpenEmailComposer(
                                    app.candidate.email,
                                    `${app.candidate.firstName} ${app.candidate.lastName}`,
                                    app.jobTitle || 'Role'
                                  );
                                }
                              }}
                              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                              title="Send Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            {onOpenScheduleInterview && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenScheduleInterview(app);
                                }}
                                className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                                title="Schedule Interview"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onOpenCreateOffer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenCreateOffer(app);
                                }}
                                className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                                title="Generate Offer"
                              >
                                <Award className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {prevStage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStage(app.id, prevStage);
                                }}
                                className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                title={`Move to ${prevStage}`}
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {nextStage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStage(app.id, nextStage);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-white text-black text-[10px] font-medium transition-all shadow-sm"
                              >
                                <span>Advance</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


