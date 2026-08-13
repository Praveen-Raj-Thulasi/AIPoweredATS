import React from 'react';
import {
  Briefcase,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { DashboardMetrics } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { PageHeader, SectionHeader } from '../ui/PageHeader';
import { SkeletonLoader } from '../ui/SkeletonLoader';

interface DashboardProps {
  metrics?: DashboardMetrics;
  onSelectApplication: (appId: string) => void;
  onOpenUploadResume: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const OverviewDashboard: React.FC<DashboardProps> = ({
  metrics,
  onSelectApplication,
  onOpenUploadResume,
  onNavigateToTab,
}) => {
  if (!metrics) {
    return (
      <div className="space-y-8">
        <SkeletonLoader variant="card" className="h-36" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SkeletonLoader variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonLoader variant="card" className="lg:col-span-2 h-72" />
          <SkeletonLoader variant="card" className="h-72" />
        </div>
      </div>
    );
  }

  const STAGE_COLORS: Record<string, string> = {
    applied: '#7C3AED',
    screening: '#3B82F6',
    assessment: '#06B6D4',
    technical_interview: '#10B981',
    evaluation: '#F59E0B',
    offer: '#EC4899',
    hired: '#ffffff',
    rejected: '#27272a',
  };

  const funnelData = metrics.stageDistribution.map((s) => ({
    name: s.label,
    count: s.count,
    color: STAGE_COLORS[s.stage] || '#ffffff',
  }));

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* Page Header */}
      <PageHeader
        title="Overview & Intelligence"
        description="Active requisition pipelines, candidate progression, and AI capability matching."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            LIVE PIPELINE
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => onNavigateToTab('pipeline')} className="border-zinc-800 bg-black/30 font-semibold">
              View Kanban Board
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <Button variant="gradient-action" size="sm" onClick={onOpenUploadResume}>
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              Screen Resumes
            </Button>
          </div>
        }
      />

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex items-center gap-4 transition-all duration-300 hover:shadow-glow-purple/5" variant="glass">
          <div className="p-3 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple shrink-0 shadow-glow-purple/10">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">Active Requisitions</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">{metrics.activeJobs}</span>
              <span className="text-xs text-zinc-450 font-mono">/ {metrics.totalJobs} roles</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 transition-all duration-300 hover:shadow-glow-blue/5" variant="glass">
          <div className="p-3 rounded-xl bg-brand-blue/10 border border-brand-blue/20 text-brand-blue shrink-0 shadow-glow-blue/10">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">Candidate Pool</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">{metrics.totalCandidates}</span>
              <span className="text-xs text-zinc-455 font-mono">Parsed profiles</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 transition-all duration-300 hover:shadow-glow-emerald/5" variant="glass">
          <div className="p-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald shrink-0 shadow-glow-emerald/10">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">Avg Capability Match</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">{metrics.averageAiScore}%</span>
              <span className="text-xs text-zinc-455 font-mono">Fit index</span>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 transition-all duration-300 hover:shadow-glow-magenta/5" variant="glass">
          <div className="p-3 rounded-xl bg-brand-magenta/10 border border-brand-magenta/20 text-brand-magenta shrink-0 shadow-glow-magenta/10">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">In Pipeline</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white tracking-tight">{metrics.totalApplications}</span>
              <span className="text-xs text-zinc-455 font-mono">Active submissions</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Progression Chart */}
        <Card className="lg:col-span-2 space-y-4" variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-base">Hiring Pipeline Funnel</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Active candidates across evaluation stages</p>
            </div>
            <button
              onClick={() => onNavigateToTab('pipeline')}
              className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-semibold font-mono"
            >
              Pipeline View <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontFamily="monospace" interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#52525b" fontSize={10} fontFamily="monospace" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0c0e',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fafafa',
                    fontSize: '11px',
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Evaluated Candidates */}
        <Card className="space-y-4" variant="glass">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-base">Top Evaluated Candidates</h3>
            <span className="text-[11px] text-zinc-400 font-mono">Ranked</span>
          </div>

          <div className="space-y-2.5">
            {metrics.topScoringCandidates.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center font-mono">No evaluated candidates yet.</p>
            ) : (
              metrics.topScoringCandidates.map((c, i) => (
                <div
                  key={c.applicationId}
                  onClick={() => onSelectApplication(c.applicationId)}
                  className="p-3 rounded-xl bg-black/40 border border-zinc-850 hover:border-zinc-700 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">#{i + 1}</span>
                      <p className="text-xs font-semibold text-white group-hover:text-zinc-200 transition-colors">
                        {c.candidateName}
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-450 truncate max-w-[160px]">{c.jobTitle}</p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-white font-mono">
                      {c.overallScore}%
                    </span>
                    <StatusIndicator status={c.recommendation} size="sm" showIcon={false} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Applications Table */}
      <div className="space-y-4">
        <SectionHeader
          title="Recent Applications"
          description="Latest candidate submissions screened by VERITY."
          actions={
            <Button variant="outline" size="sm" onClick={() => onNavigateToTab('candidates')} className="border-zinc-800 bg-black/30 font-semibold">
              View All Candidates
            </Button>
          }
        />

        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#0c0c0e]/85 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/40 border-b border-zinc-800/80 text-zinc-500 uppercase tracking-wider font-bold text-[10px] font-mono">
                <tr>
                  <th className="py-4 px-5">Candidate</th>
                  <th className="py-4 px-4">Target Job</th>
                  <th className="py-4 px-4">Pipeline Stage</th>
                  <th className="py-4 px-4">Fit Score</th>
                  <th className="py-4 px-4">Evaluation State</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60 font-sans">
                {metrics.recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-900/35 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-white text-xs">
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{app.candidate?.email}</div>
                    </td>
                    <td className="py-4 px-4 text-zinc-300 font-medium">{app.jobTitle}</td>
                    <td className="py-4 px-4">
                      <span className="text-xs text-zinc-400 capitalize font-medium">
                        {app.stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold">
                      {app.aiScoreCard ? (
                        <span className="text-white">
                          {app.aiScoreCard.overallScore}%
                        </span>
                      ) : (
                        <span className="text-zinc-650">Pending</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {app.aiScoreCard ? (
                        <StatusIndicator status={app.aiScoreCard.recommendation} />
                      ) : (
                        <span className="text-zinc-650 text-xs font-mono">Evaluating</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => onSelectApplication(app.id)}
                        className="text-xs text-zinc-350 hover:text-white px-2.5 py-1 rounded-lg border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all font-semibold"
                      >
                        Inspect Scorecard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};



