import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ShieldCheck,
  Clock,
  Sparkles,
  BrainCircuit,
  Cpu,
  RefreshCw,
  Info,
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
import {
  RecruitmentIntelligenceMetrics,
  AnalyticsTimeRange,
  MetricMetadata,
  Job,
  User,
} from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader, SectionHeader } from '../ui/PageHeader';
import { MetricInspectorModal } from './MetricInspectorModal';
import { api } from '../../services/api';

interface RecruitmentIntelligenceDashboardProps {
  onNavigateToTab?: (tab: any) => void;
}

export const RecruitmentIntelligenceDashboard: React.FC<RecruitmentIntelligenceDashboardProps> = ({
  onNavigateToTab,
}) => {
  const [metrics, setMetrics] = useState<RecruitmentIntelligenceMetrics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recruiters, setRecruiters] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters State
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Active Metric Inspection Modal
  const [inspectedMetric, setInspectedMetric] = useState<MetricMetadata | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedJobs, fetchedMembers, fetchedMetrics] = await Promise.all([
        api.getJobs().catch(() => []),
        api.getOrganizationMembers().catch(() => []),
        api.getRecruitmentIntelligence({
          timeRange,
          jobId: selectedJobId,
          recruiterId: selectedRecruiterId,
          department: selectedDepartment,
        }).catch(() => null),
      ]);

      setJobs(fetchedJobs);
      setRecruiters(fetchedMembers.filter((m) => m.role === 'recruiter' || m.role === 'admin'));
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.error('Error loading recruitment intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange, selectedJobId, selectedRecruiterId, selectedDepartment]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const openMetricInspector = (metricKey: string) => {
    if (metrics?.metadata && metrics.metadata[metricKey]) {
      setInspectedMetric(metrics.metadata[metricKey]);
    }
  };

  const departments = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)));

  const MONO_COLORS = ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a', '#52525b', '#3f3f46'];

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* 1. HEADER */}
      <PageHeader
        title="Recruitment Intelligence & Analytics"
        description="Aggregated evidence verification depth, hiring funnel conversion, and deliberation speed metrics."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            INTELLIGENCE AUDIT
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onNavigateToTab && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateToTab('workspace')}
                className="text-xs"
              >
                <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />
                Decision Workspace
              </Button>
            )}
          </div>
        }
      />

      {/* 2. FILTER BAR CONSOLE */}
      <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Time Horizon */}
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
            Time Horizon
          </label>
          <div className="flex items-center rounded-xl bg-black/40 p-1 border border-zinc-800 text-xs font-mono">
            {(['7d', '30d', '90d', '1y', 'all'] as AnalyticsTimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-center uppercase transition-all text-[11px] ${
                  timeRange === t
                    ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All' : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Job Requisition Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
            Role Scope
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3.5 py-1.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="all">All Requisitions ({jobs.length} Jobs)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
            Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-3.5 py-1.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Recruiter Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
            Recruiter
          </label>
          <select
            value={selectedRecruiterId}
            onChange={(e) => setSelectedRecruiterId(e.target.value)}
            className="w-full px-3.5 py-1.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="all">All Recruiters</option>
            {recruiters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.firstName} {r.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>


      {isLoading || !metrics ? (
        <div className="py-20 text-center space-y-3 bg-[#0c0c0e] rounded-2xl border border-zinc-800/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
          <p className="text-xs text-zinc-400 font-medium font-mono">Aggregating Intelligence & Funnel Analytics...</p>
        </div>
      ) : (
        <>
          {/* 3. EXECUTIVE KPI CARDS GRID */}
          <div className="space-y-4">
            <SectionHeader
              title="Core Recruitment & Capability Health Indicators"
              description="Audited cross-stage evidence metrics and decision velocity"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Capability Verification Rate */}
              <Card className="space-y-3 hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => openMetricInspector('capability_verification_rate')}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                    title="Inspect Metric Definition & Lineage"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block font-mono">
                    Verification Rate
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <strong className="text-2xl font-bold text-white font-mono">
                      {metrics.proofOfAbilityMetrics.overallVerificationRate}%
                    </strong>
                    <span className="text-[11px] text-zinc-400 font-mono">Multi-Source</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${metrics.proofOfAbilityMetrics.overallVerificationRate}%` }}
                  />
                </div>
              </Card>

              {/* Card 2: Average Evidence Sufficiency */}
              <Card className="space-y-3 hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => openMetricInspector('evidence_sufficiency')}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                    title="Inspect Metric Definition & Lineage"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block font-mono">
                    Avg Evidence Sufficiency
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <strong className="text-2xl font-bold text-white font-mono">
                      {metrics.proofOfAbilityMetrics.evidenceSufficiencyAverage}%
                    </strong>
                    <span className="text-[11px] text-zinc-400 font-mono">High Trust</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-300 rounded-full"
                    style={{ width: `${metrics.proofOfAbilityMetrics.evidenceSufficiencyAverage}%` }}
                  />
                </div>
              </Card>

              {/* Card 3: Transfer Test Success Rate */}
              <Card className="space-y-3 hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => openMetricInspector('transfer_test_success')}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                    title="Inspect Metric Definition & Lineage"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block font-mono">
                    Transfer Adaptability
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <strong className="text-2xl font-bold text-white font-mono">
                      {metrics.proofOfAbilityMetrics.transferTestSuccessRate}%
                    </strong>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {metrics.proofOfAbilityMetrics.transferTestsAttempted} Attempts
                    </span>
                  </div>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${metrics.proofOfAbilityMetrics.transferTestSuccessRate}%` }}
                  />
                </div>
              </Card>

              {/* Card 4: Recruiter Time to Decision */}
              <Card className="space-y-3 hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => openMetricInspector('time_to_decision')}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                    title="Inspect Metric Definition & Lineage"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block font-mono">
                    Avg Deliberation Speed
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <strong className="text-2xl font-bold text-white font-mono">
                      {metrics.recruiterMetrics.averageTimeToDecisionDays}d
                    </strong>
                    <span className="text-[11px] text-zinc-400 font-mono">Audited</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-400 rounded-full" style={{ width: '85%' }} />
                </div>
              </Card>
            </div>
          </div>

          {/* 4. HIRING FUNNEL & TIME IN STAGE PROGRESSION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-white tracking-tight">
                  Hiring Pipeline Funnel & Dwell Time
                </h3>
                <p className="text-xs text-zinc-400">
                  Step-by-step conversion drop-offs and average dwell time per pipeline stage.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-black/40 text-zinc-300 border border-zinc-800">
                  Overall Conversion: <strong className="text-white">{metrics.atsMetrics.overallFunnelConversionRate}%</strong>
                </span>
                <button
                  onClick={() => openMetricInspector('time_in_stage')}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {metrics.atsMetrics.funnel.map((stage, idx) => (
                <div
                  key={stage.stage}
                  className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">
                        S{idx + 1}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                        {stage.conversionFromPreviousRate}%
                      </span>
                    </div>
                    <h4 className="font-medium text-xs text-white leading-tight">{stage.label}</h4>
                    <p className="text-lg font-bold text-white font-mono">{stage.count} <span className="text-[10px] text-zinc-500 font-normal">cands</span></p>
                  </div>

                  <div className="pt-2 border-t border-zinc-850/60 space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Dwell:</span>
                      <strong className="text-zinc-200">{stage.averageTimeInStageDays}d</strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                      <span>Drop:</span>
                      <span>{stage.dropOffCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. CAPABILITY CATEGORY & EVIDENCE DISTRIBUTION CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Capability Category Verification Matrix */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">Capability Verification by Domain</h3>
                  <p className="text-xs text-zinc-400">Verified vs partial vs insufficient capabilities</p>
                </div>
                <button
                  onClick={() => openMetricInspector('capability_verification_rate')}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {metrics.proofOfAbilityMetrics.capabilityCategoryDistribution.map((cat) => {
                  const total = cat.verified + cat.partial + cat.insufficient + cat.conflicting;
                  const verifiedPct = Math.round((cat.verified / total) * 100);
                  const partialPct = Math.round((cat.partial / total) * 100);
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-200">{cat.label}</span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {cat.verified} Verified • {cat.partial} Partial • {cat.insufficient} Gaps
                        </span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
                        <div className="bg-white h-full" style={{ width: `${verifiedPct}%` }} />
                        <div className="bg-zinc-500 h-full" style={{ width: `${partialPct}%` }} />
                        <div
                          className="bg-zinc-800 h-full"
                          style={{ width: `${100 - verifiedPct - partialPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white" /> Verified
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" /> Partially Verified
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-800" /> Insufficient
                </span>
              </div>
            </Card>

            {/* Right: Evidence Breakdown by Source Type */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">Evidence Contribution by Source</h3>
                  <p className="text-xs text-zinc-400">Multi-stage provenance distribution</p>
                </div>
                <button
                  onClick={() => openMetricInspector('evidence_sufficiency')}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.proofOfAbilityMetrics.evidenceBySourceType}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#52525b" fontSize={10} />
                    <YAxis dataKey="label" type="category" stroke="#71717a" fontSize={10} width={130} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c0c0e',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="count" fill="#ffffff" radius={[0, 4, 4, 0]}>
                      {metrics.proofOfAbilityMetrics.evidenceBySourceType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={MONO_COLORS[index % MONO_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* 6. ADAPTIVE ASSESSMENT DEPTH & DECISION READINESS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloom Depth Level Distribution */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">Assessment Depth (Bloom Levels 1 - 6)</h3>
                  <p className="text-xs text-zinc-400">Cognitive complexity challenge distribution</p>
                </div>
                <button
                  onClick={() => openMetricInspector('adaptive_depth')}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {metrics.proofOfAbilityMetrics.adaptiveDepthDistribution.map((depth) => (
                  <div
                    key={depth.level}
                    className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        L{depth.level}: {depth.levelName}
                      </span>
                      <span className="text-[10px] font-bold text-white font-mono">{depth.percentage}%</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-white font-mono">{depth.count}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">tests</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono">Avg Score: {depth.averageScore}%</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Decision Readiness State Breakdown */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">Candidate Decision Readiness</h3>
                  <p className="text-xs text-zinc-400">Audit-backed readiness distribution</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
                  Reuse: {metrics.proofOfAbilityMetrics.evidenceReuseRate}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    Ready for Offer
                  </span>
                  <div className="text-2xl font-bold text-white font-mono">
                    {metrics.proofOfAbilityMetrics.decisionReadinessDistribution.READY}
                  </div>
                  <p className="text-[10px] text-zinc-400">All competencies verified</p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    Mostly Ready
                  </span>
                  <div className="text-2xl font-bold text-white font-mono">
                    {metrics.proofOfAbilityMetrics.decisionReadinessDistribution.MOSTLY_READY}
                  </div>
                  <p className="text-[10px] text-zinc-400">Minor verification needed</p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    Insufficient Evidence
                  </span>
                  <div className="text-2xl font-bold text-white font-mono">
                    {metrics.proofOfAbilityMetrics.decisionReadinessDistribution.INSUFFICIENT_EVIDENCE}
                  </div>
                  <p className="text-[10px] text-zinc-400">Requires targeted evidence</p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    Requires Review
                  </span>
                  <div className="text-2xl font-bold text-white font-mono">
                    {metrics.proofOfAbilityMetrics.decisionReadinessDistribution.REQUIRES_REVIEW}
                  </div>
                  <p className="text-[10px] text-zinc-400">Conflicting signals</p>
                </div>
              </div>
            </Card>
          </div>

          {/* 7. JOB INTELLIGENCE: HARDEST CAPABILITIES TO VERIFY & RECURRING SKILL GAPS */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-base text-white tracking-tight">
                Hardest Capabilities to Verify & Skill Gaps
              </h3>
              <p className="text-xs text-zinc-400">
                Verification bottleneck analysis with actionable remediation strategies.
              </p>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-900/40 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800/80">
                    <tr>
                      <th className="py-3 px-5 font-semibold">Capability</th>
                      <th className="py-3 px-5 font-semibold text-center">Verification Rate</th>
                      <th className="py-3 px-5 font-semibold text-center">Avg Evidence</th>
                      <th className="py-3 px-5 font-semibold">Primary Bottleneck</th>
                      <th className="py-3 px-5 font-semibold">Remedy Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/60">
                    {metrics.jobAnalytics.hardestCapabilitiesToVerify.map((cap, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="py-4 px-5 font-semibold text-white whitespace-nowrap">
                          {cap.capabilityName}
                          <span className="block text-[10px] text-zinc-500 font-normal capitalize">
                            {cap.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center whitespace-nowrap">
                          <span className="font-semibold px-2 py-0.5 rounded text-xs bg-zinc-900 border border-zinc-800 text-white font-mono">
                            {cap.verificationRate}%
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center font-medium text-zinc-300 whitespace-nowrap font-mono">
                          {cap.averageEvidenceSources}
                        </td>
                        <td className="py-4 px-5 text-zinc-300 text-[11px] max-w-xs leading-relaxed">
                          {cap.primaryBottleneck}
                        </td>
                        <td className="py-4 px-5 text-zinc-400 text-[11px] max-w-sm leading-relaxed">
                          {cap.recommendedRemedy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* 8. RECRUITER DELIBERATION SPEED */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-white tracking-tight">
                  Recruiter Deliberation Velocity & Audit Compliance
                </h3>
                <p className="text-xs text-zinc-400">
                  Review volume, decision speed, and immutable audit trail adherence.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#0c0c0e] border border-zinc-800/80 text-zinc-300 text-xs font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Audit Compliance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.recruiterMetrics.recruiters.map((rec) => (
                <Card key={rec.recruiterId} className="space-y-3 hover:border-zinc-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-white">{rec.recruiterName}</h4>
                      <span className="text-[11px] text-zinc-400 font-mono">{rec.recruiterEmail}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                      {rec.averageTimeToDecisionDays}d Avg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-850/60 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 block">Reviewed</span>
                      <strong className="text-white text-sm">{rec.candidatesReviewed}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 block">Decisions</span>
                      <strong className="text-white text-sm">{rec.decisionsRecorded}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 block">Pending Queue</span>
                      <strong className="text-white text-sm">{rec.pendingDecisions}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-400 block">Interviews</span>
                      <strong className="text-white text-sm">{rec.interviewsCompleted} / {rec.interviewsScheduled}</strong>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 9. METRIC INTEGRITY INSPECTOR MODAL */}
      {inspectedMetric && (
        <MetricInspectorModal
          isOpen={!!inspectedMetric}
          onClose={() => setInspectedMetric(null)}
          metric={inspectedMetric}
        />
      )}
    </div>
  );
};

