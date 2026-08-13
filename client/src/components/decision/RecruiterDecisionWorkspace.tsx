import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  History,
  CheckCircle2,
  Compass,
  Award,
  Users,
  BrainCircuit,
  FileCode,
  Calendar,
  RefreshCw,
  Eye,
  Target,
  Mail,
  Github,
  Linkedin,
  MapPin,
  Clock,
  Sparkle,
  Plus,
  BarChart3,
  GitFork,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Candidate,
  Job,
  Application,
  JobCapabilityModel,
  ProofOfSkillEvaluation,
  CapabilityFingerprint,
  DecisionReadinessEvaluation,
  HumanDecisionRecord,
  EvidenceEvent,
  CandidateCapability,
  CandidateComparisonReport,
  ApplicationStage,
} from '@ats/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { PageHeader, SectionHeader } from '../ui/PageHeader';
import { RecordDecisionModal } from './RecordDecisionModal';
import { RequestEvidenceModal } from './RequestEvidenceModal';
import { EvidenceDetailDrawer } from './EvidenceDetailDrawer';
import { api } from '../../services/api';

interface RecruiterDecisionWorkspaceProps {
  initialCandidateId?: string;
  initialJobId?: string;
  onOpenScheduleInterview?: (app: Application) => void;
  onOpenCreateOffer?: (app: Application) => void;
}

export const RecruiterDecisionWorkspace: React.FC<RecruiterDecisionWorkspaceProps> = ({
  initialCandidateId,
  initialJobId,
  onOpenScheduleInterview,
  onOpenCreateOffer,
}) => {
  // Navigation & selection state
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || 'job-1');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(initialCandidateId || 'cand-1');
  const [comparisonCandidateIds, setComparisonCandidateIds] = useState<string[]>(['cand-1', 'cand-3']);
  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Candidate detailed data
  const [evaluation, setEvaluation] = useState<DecisionReadinessEvaluation | null>(null);
  const [fingerprint, setFingerprint] = useState<CapabilityFingerprint | null>(null);
  const [proofEvaluation, setProofEvaluation] = useState<ProofOfSkillEvaluation | null>(null);
  const [capabilityModel, setCapabilityModel] = useState<JobCapabilityModel | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<EvidenceEvent[]>([]);
  const [decisionHistory, setDecisionHistory] = useState<HumanDecisionRecord[]>([]);
  const [comparisonReport, setComparisonReport] = useState<CandidateComparisonReport | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals and Drawers
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [targetEvidenceCapability, setTargetEvidenceCapability] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerEvent, setDrawerEvent] = useState<EvidenceEvent | null>(null);
  const [drawerCapability, setDrawerCapability] = useState<CandidateCapability | null>(null);

  // Load jobs and candidate list
  useEffect(() => {
    const initWorkspace = async () => {
      try {
        const [fetchedJobs, fetchedCandidates, fetchedApps] = await Promise.all([
          api.getJobs(),
          api.getCandidates(),
          api.getApplications(),
        ]);
        setJobs(fetchedJobs);
        setCandidates(fetchedCandidates);
        setApplications(fetchedApps);

        if (!selectedJobId && fetchedJobs.length > 0) {
          setSelectedJobId(fetchedJobs[0].id);
        }
        if (!selectedCandidateId && fetchedCandidates.length > 0) {
          setSelectedCandidateId(fetchedCandidates[0].id);
        }
      } catch (err) {
        console.error('Error initializing workspace:', err);
      }
    };
    initWorkspace();
  }, []);

  // Load detailed single candidate data
  const loadSingleCandidateData = async () => {
    if (!selectedCandidateId || !selectedJobId) return;
    setIsLoading(true);
    try {
      const [evalData, fpData, capData, modelData, timelineData, historyData] = await Promise.all([
        api.getDecisionReadiness(selectedCandidateId, selectedJobId).catch(() => null),
        api.getCandidateFingerprint(selectedCandidateId, selectedJobId).catch(() => null),
        api.getCandidateCapabilities(selectedCandidateId, selectedJobId).catch(() => null),
        api.getJobCapabilities(selectedJobId).catch(() => null),
        api.getCandidateEvidenceTimeline(selectedCandidateId).catch(() => []),
        api.getCandidateDecisionHistory(selectedCandidateId).catch(() => []),
      ]);

      setEvaluation(evalData);
      setFingerprint(fpData);
      setProofEvaluation(capData);
      setCapabilityModel(modelData);
      setTimelineEvents(timelineData || []);
      setDecisionHistory(historyData || []);
    } catch (err) {
      console.error('Error loading candidate workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load multi candidate comparison data
  const loadComparisonData = async () => {
    if (!selectedJobId || comparisonCandidateIds.length === 0) return;
    setIsLoading(true);
    try {
      const report = await api.compareCandidatesForJob(selectedJobId, comparisonCandidateIds);
      setComparisonReport(report);
    } catch (err) {
      console.error('Error loading comparison report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'single') {
      loadSingleCandidateData();
    } else {
      loadComparisonData();
    }
  }, [selectedCandidateId, selectedJobId, viewMode, comparisonCandidateIds]);

  const currentCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
  const currentJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];
  const currentApplication = applications.find(
    (a) => a.candidateId === selectedCandidateId && a.jobId === selectedJobId
  );

  const handleStageChange = async (newStage: ApplicationStage) => {
    if (!currentApplication) return;
    try {
      await api.updateStage(currentApplication.id, newStage, 'Recruiter Action');
      const updatedApps = await api.getApplications();
      setApplications(updatedApps);
      loadSingleCandidateData();
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const openRequestEvidence = (capabilityName?: string) => {
    setTargetEvidenceCapability(capabilityName || '');
    setIsEvidenceModalOpen(true);
  };

  const inspectTimelineEvent = (event: EvidenceEvent) => {
    setDrawerEvent(event);
    setDrawerCapability(null);
    setIsDrawerOpen(true);
  };

  const inspectCapability = (capability: CandidateCapability) => {
    setDrawerCapability(capability);
    setDrawerEvent(null);
    setIsDrawerOpen(true);
  };

  // Static Mock overlay matches visual specs exactly for Elena Rostova cand-1
  const mockCapabilityMatrixRows = [
    {
      name: 'TypeScript & Type Systems',
      category: 'Languages',
      importance: 'critical',
      requiredScore: 90,
      currentScore: 87,
      confidence: 87,
      evidenceCount: 2,
      status: 'VERIFIED',
      trendData: [60, 68, 75, 82, 87],
      candCap: undefined as CandidateCapability | undefined,
    },
    {
      name: 'React Architecture & State Lifecycle',
      category: 'Frameworks',
      importance: 'high',
      requiredScore: 80,
      currentScore: 71,
      confidence: 71,
      evidenceCount: 1,
      status: 'PARTIAL',
      trendData: [50, 58, 63, 68, 71],
      candCap: undefined as CandidateCapability | undefined,
    },
    {
      name: 'Node.js Asynchronous Runtime',
      category: 'Languages',
      importance: 'critical',
      requiredScore: 90,
      currentScore: 74,
      confidence: 74,
      evidenceCount: 1,
      status: 'PARTIAL',
      trendData: [55, 60, 65, 70, 74],
      candCap: undefined as CandidateCapability | undefined,
    },
    {
      name: 'AWS Architecture',
      category: 'Cloud',
      importance: 'high',
      requiredScore: 85,
      currentScore: 45,
      confidence: 46,
      evidenceCount: 0,
      status: 'INSUFFICIENT',
      trendData: [45, 45, 45, 45, 45],
      candCap: undefined as CandidateCapability | undefined,
    },
    {
      name: 'System Design',
      category: 'Architecture',
      importance: 'high',
      requiredScore: 85,
      currentScore: 63,
      confidence: 63,
      evidenceCount: 2,
      status: 'PARTIAL',
      trendData: [40, 48, 55, 60, 63],
      candCap: undefined as CandidateCapability | undefined,
    },
  ];


  // Build Capability Matrix Rows dynamically or fall back to high fidelity mock overlay
  const capabilityMatrixRows = (capabilityModel?.capabilities || []).map((reqCap) => {
    const candCap = proofEvaluation?.capabilities.find(
      (c) => c.capabilityName.toLowerCase() === reqCap.name.toLowerCase()
    );
    const mockRow = mockCapabilityMatrixRows.find((m) => m.name.toLowerCase() === reqCap.name.toLowerCase());
    const requiredScore = reqCap.importance === 'critical' ? 90 : reqCap.importance === 'high' ? 80 : 70;
    const currentScore = candCap?.confidenceScore || mockRow?.currentScore || 0;
    const confidence = candCap ? Math.round(candCap.confidenceScore * 0.95 + 4) : mockRow?.confidence || 40;
    const status = candCap?.verificationState || mockRow?.status || 'INSUFFICIENT_EVIDENCE';
    const evidenceCount = candCap?.evidenceCount || mockRow?.evidenceCount || 0;
    const trendData = mockRow?.trendData || [40, 50, 60, 70, currentScore];

    return {
      name: reqCap.name,
      category: reqCap.category,
      importance: reqCap.importance,
      requiredScore,
      currentScore,
      confidence,
      evidenceCount,
      status,
      trendData,
      candCap,
    };
  });

  const activeRows = capabilityMatrixRows.length > 0 ? capabilityMatrixRows : mockCapabilityMatrixRows;

  // Radar Data
  const radarData = activeRows.map((r) => ({
    subject: r.name.replace('& Type Systems', '').replace('& State Lifecycle', '').replace('Asynchronous Runtime', 'Runtime'),
    value: r.currentScore,
    required: r.requiredScore,
  }));

  // Line Chart Data
  const lineData = [
    { date: 'Apr 15', overall: 61, required: 80 },
    { date: 'Apr 22', overall: 65, required: 82 },
    { date: 'Apr 29', overall: 70, required: 80 },
    { date: 'May 06', overall: 76, required: 85 },
    { date: 'May 13', overall: 82, required: 85 },
  ];

  // Donut Gauge Data
  const readinessVal = evaluation?.readinessScore || 68;
  const donutData = [
    { name: 'Ready', value: readinessVal },
    { name: 'Remaining', value: 100 - readinessVal },
  ];

  const TABS = [
    'Overview',
    'Capability Matrix',
    'Evidence Graph',
    'Assessments',
    'Interviews',
    'Notes & Decisions',
    'Activity Timeline',
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Page Header */}
      <PageHeader
        title="Decision Intelligence Workspace"
        description="Continuous proof-of-ability lineage, capability verification, and audited recruiter decisions."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            AUDIT-BACKED
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="bg-[#0c0c0e]/80 p-1 rounded-xl border border-zinc-800/80 flex items-center gap-1">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'single'
                    ? 'bg-zinc-100 text-black font-semibold shadow-glow-subtle'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Single Candidate
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'compare'
                    ? 'bg-zinc-100 text-black font-semibold shadow-glow-subtle'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Comparison
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true);
                if (viewMode === 'single') loadSingleCandidateData();
                else loadComparisonData();
                setTimeout(() => setIsRefreshing(false), 500);
              }}
              disabled={isRefreshing}
              className="border-zinc-850 bg-black/45"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Target Job & Candidate Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0c0c0e]/85 p-6 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 mb-2 font-mono uppercase tracking-wider">
            Target Job Requisition
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50 transition-all font-mono"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {job.department}
              </option>
            ))}
          </select>
        </div>

        {viewMode === 'single' ? (
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 mb-2 font-mono uppercase tracking-wider">
              Active Candidate
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-xs text-white font-medium focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50 transition-all font-mono"
            >
              {candidates.map((cand) => (
                <option key={cand.id} value={cand.id}>
                  {cand.firstName} {cand.lastName} — {cand.headline || 'Software Engineer'}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 mb-2 font-mono uppercase tracking-wider">
              Select Candidates to Compare
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {candidates.map((cand) => {
                const isSelected = comparisonCandidateIds.includes(cand.id);
                return (
                  <button
                    key={cand.id}
                    onClick={() => {
                      if (isSelected) {
                        if (comparisonCandidateIds.length > 2) {
                          setComparisonCandidateIds(comparisonCandidateIds.filter((id) => id !== cand.id));
                        }
                      } else {
                        if (comparisonCandidateIds.length < 4) {
                          setComparisonCandidateIds([...comparisonCandidateIds, cand.id]);
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-glow-subtle'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-zinc-600'}`} />
                    {cand.firstName} {cand.lastName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'single' && currentApplication && (
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 mb-2 font-mono uppercase tracking-wider">
              Pipeline Stage
            </label>
            <select
              value={currentApplication.stage}
              onChange={(e) => handleStageChange(e.target.value as ApplicationStage)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-xs text-white font-bold uppercase focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50 transition-all font-mono"
            >
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="assessment">Assessment</option>
              <option value="interview">Interview</option>
              <option value="evaluation">Evaluation</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Synthesizing Decision Intelligence & Evidence Traces...</p>
        </div>
      ) : viewMode === 'compare' ? (
        /* ================= CANDIDATE COMPARISON VIEW ================= */
        <div className="space-y-8">
          <SectionHeader
            title={`Comparative Intelligence: ${currentJob?.title}`}
            description="Side-by-side capability coverage, confidence distribution, and explainable differentiators."
            badge={
              <span className="text-xs text-zinc-400 font-mono">
                {comparisonReport?.candidates.length || 0} Candidates
              </span>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparisonReport?.candidates.map((cand) => (
              <Card key={cand.candidateId} className="flex flex-col justify-between space-y-5" variant="glass">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base text-white">{cand.candidateName}</h3>
                      <span className="text-[10px] text-zinc-500 font-mono">ID: {cand.candidateId}</span>
                    </div>
                    <StatusIndicator status={cand.decisionReadiness} />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-zinc-800/80 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/70">
                      <span className="text-[10px] text-zinc-400 block font-mono">Capability Fit</span>
                      <strong className="text-white text-base font-semibold">{cand.overallMatchScore}%</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/70">
                      <span className="text-[10px] text-zinc-400 block font-mono">Confidence</span>
                      <strong className="text-white text-base font-semibold">{cand.averageConfidence}%</strong>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5 font-mono">
                        Key Strengths
                      </span>
                      <ul className="space-y-1">
                        {cand.keyStrengths.slice(0, 2).map((str, idx) => (
                          <li key={idx} className="text-xs text-zinc-300 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                            <span className="truncate">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5 font-mono">
                        Verification Needs
                      </span>
                      <ul className="space-y-1">
                        {cand.criticalGaps.slice(0, 2).map((gap, idx) => (
                          <li key={idx} className="text-xs text-zinc-450 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-brand-amber shrink-0" />
                            <span className="truncate">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                      setSelectedCandidateId(cand.candidateId);
                      setViewMode('single');
                    }}
                  >
                    Open Candidate Workspace
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-[#0c0c0e]/85 border border-zinc-800/80 space-y-3">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2 font-mono">
              <Target className="w-4 h-4 text-zinc-400" />
              EXPLAINABLE DIFFERENCE ANALYSIS
            </h3>
            <p className="text-xs text-zinc-350 leading-relaxed font-sans">
              Elena Rostova demonstrates higher corroborated depth in architecture and resilient systems with multi-stage verification across GitHub and live sandboxes. Devon Sterling shows strong backend performance benchmarks with fewer frontend artifacts.
            </p>
          </div>
        </div>
      ) : (
        /* ================= SINGLE CANDIDATE WORKSPACE ================= */
        <div className="space-y-8 animate-fade-in">
          {/* Candidate Hero Card Grid aligned exactly with visual reference */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#0c0c0e]/85 border border-zinc-800/80 backdrop-blur-md space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Profile section with colored ring avatar */}
              <div className="flex items-start gap-4.5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-purple to-brand-magenta p-0.5 shadow-glow-purple">
                    <div className="w-full h-full rounded-full bg-[#0c0c0e] flex items-center justify-center text-white font-bold text-lg font-mono">
                      {currentCandidate?.firstName[0] || 'E'}
                      {currentCandidate?.lastName[0] || 'R'}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-brand-emerald rounded-full border-2 border-[#0c0c0e] shadow-glow-emerald" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <h2 className="text-xl font-bold text-white tracking-tight font-sans">
                      {currentCandidate?.firstName} {currentCandidate?.lastName}
                    </h2>
                    <StatusIndicator status={evaluation?.readinessState || 'INSUFFICIENT_EVIDENCE'} />
                  </div>
                  
                  <p className="text-xs text-zinc-350 font-medium">
                    {currentCandidate?.headline || 'Senior Full-Stack Architect | React, Node.js & AWS'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1.5 flex-wrap font-mono">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {currentCandidate?.email || 'elena.rostova@example.com'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {currentCandidate?.location || 'San Francisco, CA'}
                    </span>
                    <div className="flex items-center gap-2">
                      <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-3.5 h-3.5" /></a>
                      <a href="#" className="hover:text-white transition-colors"><Github className="w-3.5 h-3.5" /></a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interaction Buttons row */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => openRequestEvidence()} className="border-zinc-800 bg-black/30 hover:bg-zinc-900/60 font-semibold">
                  <FileCode className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                  Request Evidence
                </Button>
                {currentApplication && onOpenScheduleInterview && (
                  <Button variant="outline" size="sm" onClick={() => onOpenScheduleInterview(currentApplication)} className="border-zinc-800 bg-black/30 hover:bg-zinc-900/60 font-semibold">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                    Interview
                  </Button>
                )}
                {currentApplication && onOpenCreateOffer && (
                  <Button variant="outline" size="sm" onClick={() => onOpenCreateOffer(currentApplication)} className="border-zinc-800 bg-black/30 hover:bg-zinc-900/60 font-semibold">
                    <Award className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                    Make Offer
                  </Button>
                )}
                <Button variant="gradient-action" size="sm" onClick={() => setIsDecisionModalOpen(true)}>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Record Decision
                </Button>
              </div>
            </div>

            {/* AI Decision Recommendation Subcard in Hero wrapper */}
            <div className="relative p-5 rounded-xl bg-gradient-to-r from-brand-purple/10 to-brand-blue/5 border border-brand-purple/35 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-brand-purple/15 text-brand-purple border border-brand-purple/20 shrink-0 mt-0.5 shadow-glow-purple/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      AI Decision Recommendation
                    </span>
                    <span className="px-2 py-0.5 rounded bg-brand-emerald/10 border border-brand-emerald/30 text-[9px] text-brand-emerald font-mono font-bold shadow-glow-emerald/10">
                      +88% Info Gain
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans font-medium">
                    Assign Hands-On Coding Task: React Architecture & State Lifecycle — Substantiate core requisition competency with adaptive Level 2/3 challenge.
                  </p>
                </div>
              </div>

              {/* Confidence visual indicator + button */}
              <div className="flex items-center gap-5 shrink-0 self-end sm:self-auto">
                <div className="flex items-center gap-3 bg-black/40 border border-zinc-850 px-3 py-1.5 rounded-xl font-mono">
                  <div>
                    <p className="text-[8px] text-zinc-500 uppercase font-semibold">Confidence</p>
                    <p className="text-[10px] text-zinc-400 font-bold">82%</p>
                  </div>
                  {/* Gauge SVG ring */}
                  <svg className="w-7 h-7 transform -rotate-90">
                    <circle cx="14" cy="14" r="10" stroke="#18181b" strokeWidth="2.5" fill="transparent" />
                    <circle cx="14" cy="14" r="10" stroke="#7C3AED" strokeWidth="2.5" fill="transparent"
                      strokeDasharray="62.8" strokeDashoffset={62.8 * (1 - 0.82)} strokeLinecap="round" className="shadow-glow-purple" />
                  </svg>
                </div>

                <Button
                  variant="gradient-action"
                  size="sm"
                  onClick={() => openRequestEvidence('React Architecture & State Lifecycle')}
                >
                  Execute Action
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs bar */}
          <div className="border-b border-zinc-850/80 flex flex-wrap gap-2 pt-1 font-mono">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-semibold relative transition-colors ${
                    isActive ? 'text-white active-tab-underline' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANES */}

          {/* 1. OVERVIEW TAB: Charts & Visual Intelligence Grid */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Capability Radar Chart Card */}
                <Card className="p-5 space-y-4" variant="glass">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
                      Capability Radar
                    </h3>
                    <Info className="w-4 h-4 text-zinc-600 hover:text-zinc-400 cursor-pointer" />
                  </div>
                  <div className="h-56 w-full flex items-center justify-center font-mono text-[10px]">
                    <ResponsiveContainer width="95%" height="95%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#27272a" />
                        <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#3f3f46" tick={{ fontSize: 8 }} />
                        <Radar name="Candidate" dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.25} />
                        <Radar name="Required" dataKey="required" stroke="#3B82F6" fill="transparent" strokeDasharray="3 3" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Confidence Over Time Area Chart */}
                <Card className="p-5 space-y-4" variant="glass">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
                      Confidence Over Time
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 rounded px-1.5 py-0.5 bg-zinc-950">
                      Last 30 days
                    </span>
                  </div>
                  <div className="h-56 w-full font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="95%">
                      <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                        <XAxis dataKey="date" stroke="#52525b" />
                        <YAxis domain={[0, 100]} stroke="#52525b" />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="overall" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorOverall)" />
                        <Line type="monotone" dataKey="required" stroke="#52525b" strokeDasharray="4 4" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Decision Readiness Semi-Circle Gauge */}
                <Card className="p-5 space-y-4" variant="glass">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
                      Decision Readiness
                    </h3>
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="h-56 w-full relative flex items-center justify-center font-mono">
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="80%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#10B981" className="shadow-glow-emerald" />
                          <Cell fill="rgba(39, 39, 42, 0.4)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Gauge labels */}
                    <div className="absolute bottom-[20%] text-center">
                      <p className="text-2xl font-bold text-white">{readinessVal}%</p>
                      <p className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase mt-0.5">Mostly Ready</p>
                      <p className="text-[9px] text-zinc-650 mt-1">3 of 5 critical verified</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Bottom widgets split row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Insights Bullets */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider px-1">
                    AI Insights
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="p-4 flex gap-3.5" variant="glass">
                      <div className="w-7 h-7 rounded-lg bg-brand-emerald/10 border border-brand-emerald/25 flex items-center justify-center text-brand-emerald shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-zinc-200">Strong in TypeScript</h5>
                        <p className="text-[11px] text-zinc-500 leading-normal">Consistent high performance across evaluations, repository PR history and challenges.</p>
                      </div>
                    </Card>
                    <Card className="p-4 flex gap-3.5" variant="glass">
                      <div className="w-7 h-7 rounded-lg bg-brand-amber/10 border border-brand-amber/25 flex items-center justify-center text-brand-amber shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-zinc-200">Evidence gap in AWS</h5>
                        <p className="text-[11px] text-zinc-500 leading-normal">No practical AWS sandbox evidence found in candidate portfolios. Probing recommended.</p>
                      </div>
                    </Card>
                    <Card className="p-4 flex gap-3.5" variant="glass">
                      <div className="w-7 h-7 rounded-lg bg-brand-blue/10 border border-brand-blue/25 flex items-center justify-center text-brand-blue shrink-0">
                        <Sparkle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-zinc-200">Adaptability is strong</h5>
                        <p className="text-[11px] text-zinc-500 leading-normal">Shows fast learning velocity and positive adjustment across multiple challenge sets.</p>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Next Best Action Widget */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider px-1">
                    Next Best Action
                  </h4>
                  <Card className="p-5 flex flex-col justify-between h-[155px] bg-gradient-to-br from-brand-purple/10 to-zinc-950 border-zinc-800/80 hover:border-brand-purple/50 shadow-glow-purple/5" variant="glass">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-brand-purple font-mono uppercase tracking-wider block">Target Probe</span>
                        <h5 className="text-xs font-bold text-white leading-snug">AWS Architecture Verification</h5>
                        <span className="text-[10px] text-zinc-500 font-mono">Level 3 • 45 min Challenge</span>
                      </div>
                      <Compass className="w-4 h-4 text-brand-purple" />
                    </div>

                    <div className="flex justify-end pt-3 border-t border-zinc-900">
                      <Button variant="gradient-purple" size="sm" onClick={() => openRequestEvidence('AWS Architecture')} className="py-1 px-3 text-xs">
                        Assign
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Recent Activity list */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider px-1">
                  Recent Activity
                </h4>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-[#0c0c0e]/90 border border-zinc-850 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-blue" />
                      <span className="text-zinc-200">Interview completed</span>
                      <span className="text-zinc-650">•</span>
                      <span className="text-zinc-500">Tech Interview • 46 min</span>
                    </div>
                    <span className="text-zinc-500 text-[10px]">2h ago</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0c0c0e]/90 border border-zinc-850 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-purple" />
                      <span className="text-zinc-200">Assessment submitted</span>
                      <span className="text-zinc-500">React Architecture Challenge</span>
                    </div>
                    <span className="text-zinc-500 text-[10px]">5h ago</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0c0c0e]/90 border border-zinc-850 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-amber" />
                      <span className="text-zinc-200">Evidence requested</span>
                      <span className="text-zinc-500">AWS Project Deployment</span>
                    </div>
                    <span className="text-zinc-500 text-[10px]">1d ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CAPABILITY MATRIX TAB */}
          {activeTab === 'Capability Matrix' && (
            <div className="space-y-4">
              <SectionHeader
                title="Role Capability Matrix & Verification Status"
                description="Corroborated capability evidence mapped against requisition requirements."
                badge={
                  <span className="text-xs text-zinc-400 font-mono">
                    {activeRows.length} Capabilities
                  </span>
                }
              />

              <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#0c0c0e]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/40 border-b border-zinc-800/80 text-zinc-500 uppercase tracking-wider font-bold text-[10px] font-mono">
                      <tr>
                        <th className="py-4 px-5">Capability</th>
                        <th className="py-4 px-4 text-center">Required</th>
                        <th className="py-4 px-4 text-center">Current</th>
                        <th className="py-4 px-4 text-center">Confidence</th>
                        <th className="py-4 px-4 text-center">Trend (30D)</th>
                        <th className="py-4 px-4">Evidence</th>
                        <th className="py-4 px-4 text-center">Status</th>
                        <th className="py-4 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 font-sans">
                      {activeRows.map((row, idx) => {
                        // Color styling maps
                        const colors = ['text-brand-purple bg-brand-purple/10 border-brand-purple/20', 'text-brand-blue bg-brand-blue/10 border-brand-blue/20', 'text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20', 'text-brand-amber bg-brand-amber/10 border-brand-amber/20', 'text-brand-pink bg-brand-pink/10 border-brand-pink/20'];
                        const colClass = colors[idx % colors.length];

                        return (
                          <tr key={idx} className="hover:bg-zinc-900/35 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${colClass}`}>
                                  <FileCode className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-white text-xs leading-snug">{row.name}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase">
                                    {row.category} • {row.importance}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center font-semibold text-zinc-400 font-mono">
                              {row.requiredScore}%
                            </td>
                            <td className="py-4 px-4 text-center font-bold text-white font-mono">
                              {row.currentScore}%
                            </td>
                            <td className="py-4 px-4 text-center text-zinc-300 font-mono">
                              {row.confidence}%
                            </td>
                            {/* Trend Sparkline */}
                            <td className="py-4 px-4">
                              <div className="w-16 h-8 mx-auto flex items-center">
                                <svg className="w-full h-full">
                                  <polyline
                                    fill="none"
                                    stroke={row.status === 'VERIFIED' ? '#10B981' : row.status === 'PARTIAL' ? '#F59E0B' : '#EF4444'}
                                    strokeWidth="1.5"
                                    points={row.trendData.map((val, i) => `${(i * 15) + 3},${28 - (val - 40) * 0.4}`).join(' ')}
                                  />
                                  {row.trendData.map((val, i) => (
                                    <circle
                                      key={i}
                                      cx={(i * 15) + 3}
                                      cy={28 - (val - 40) * 0.4}
                                      r="1.5"
                                      fill={row.status === 'VERIFIED' ? '#10B981' : row.status === 'PARTIAL' ? '#F59E0B' : '#EF4444'}
                                    />
                                  ))}
                                </svg>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-mono text-[11px] text-zinc-400">
                              {row.evidenceCount} {row.evidenceCount === 1 ? 'source' : 'sources'}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <StatusIndicator status={row.status} size="sm" />
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => row.candCap && inspectCapability(row.candCap)}
                                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                  title="Inspect Evidence"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openRequestEvidence(row.name)}
                                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                                  title="Probe / Assign Challenge"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. EVIDENCE TIMELINE TAB */}
          {activeTab === 'Activity Timeline' && (
            <div className="space-y-4">
              <SectionHeader
                title="Chronological Evidence Timeline"
                description="Continuous multi-stage progression from resume extraction to structured evaluations."
                badge={
                  <span className="text-xs text-zinc-400 font-mono">
                    {timelineEvents.length} Events
                  </span>
                }
              />

              {timelineEvents.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0c0c0e]/80 border border-zinc-800/80 text-center text-xs text-zinc-500 font-mono">
                  No chronological evidence events recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineEvents.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      className="p-4.5 rounded-xl bg-[#0c0c0e]/85 border border-zinc-850 flex items-center justify-between text-xs hover:border-zinc-750 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase">
                            {ev.stageName || 'Stage'}
                          </span>
                          <span className="text-zinc-700">•</span>
                          <h4 className="font-bold text-white text-xs">{ev.title || 'Evidence Event'}</h4>
                          {ev.score !== undefined && (
                            <span className="text-[11px] text-zinc-400 font-mono ml-1">
                              ({ev.score}% Score)
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 leading-relaxed font-sans max-w-2xl">{ev.description}</p>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-zinc-500 shrink-0 font-mono">
                        <span>{new Date(ev.timestamp).toLocaleDateString()}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => inspectTimelineEvent(ev)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Inspect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. NOTES & DECISIONS TAB */}
          {activeTab === 'Notes & Decisions' && (
            <div className="space-y-4">
              <SectionHeader
                title="Immutable Decision Audit History"
                description="Governed log of recruiter deliberations and action audit records."
              />

              {decisionHistory.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0c0c0e]/80 border border-zinc-800/80 text-center text-xs text-zinc-500 font-mono">
                  No immutable decision audit history recorded.
                </div>
              ) : (
                <div className="space-y-3 font-mono text-[11px]">
                  {decisionHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl bg-[#0c0c0e]/85 border border-zinc-850 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            ACTION: {rec.action.toUpperCase()}
                          </span>
                          <span className="text-zinc-500">by {rec.recruiterEmail}</span>
                        </div>
                        <span className="text-zinc-500">
                          {new Date(rec.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-zinc-350 italic font-sans">"{rec.reason}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. INTERVIEWS TAB */}
          {activeTab === 'Interviews' && (
            <Card className="p-8 text-center space-y-4" variant="glass">
              <Calendar className="w-8 h-8 text-brand-purple mx-auto animate-bounce" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Adaptive Interview Transcript Logs</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Interactive real-time questions, transcript alignment verification, and claims verification flags are available under details.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpenScheduleInterview && currentApplication && onOpenScheduleInterview(currentApplication)}>
                Schedule / Open Transcript
              </Button>
            </Card>
          )}

          {/* 6. ASSESSMENTS TAB */}
          {activeTab === 'Assessments' && (
            <Card className="p-8 text-center space-y-4" variant="glass">
              <Cpu className="w-8 h-8 text-brand-emerald mx-auto animate-pulse" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Code Sandboxes & Assessments</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Audit logs from online assessments, adaptive challenges, and cognitive depth distribution parameters.
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Sandboxes
              </Button>
            </Card>
          )}

          {/* 7. EVIDENCE GRAPH TAB */}
          {activeTab === 'Evidence Graph' && (
            <Card className="p-8 text-center space-y-4" variant="glass">
              <GitFork className="w-8 h-8 text-brand-blue mx-auto" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Skill Graph & Dependency Map</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  A multi-dimensional view of how the candidate's capabilities map to dependencies and Bloom taxonomy levels.
                </p>
              </div>
              <div className="border border-zinc-850 p-6 rounded-xl bg-black/40 h-44 flex items-center justify-center text-xs text-zinc-500 font-mono">
                [ Skill Matrix Dependency Graph Simulation Active ]
              </div>
            </Card>
          )}

          {/* Bottom Design Principles strip footer */}
          <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs text-zinc-500 font-medium">
              💡 Remember: Let data breathe. Prioritize what matters. Use color with purpose. Guide the recruiter's attention.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px]">
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">Clear Hierarchy</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">Better Spacing</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">Meaningful Colors</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">Interactive Elements</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">Data Storytelling</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      {isDecisionModalOpen && evaluation && (
        <RecordDecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          candidateId={selectedCandidateId}
          jobId={selectedJobId}
          evaluation={evaluation}
          onSuccess={() => {
            loadSingleCandidateData();
          }}
        />
      )}

      {isEvidenceModalOpen && (
        <RequestEvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          candidateId={selectedCandidateId}
          candidateName={`${currentCandidate?.firstName} ${currentCandidate?.lastName}`}
          jobId={selectedJobId}
          defaultCapabilityName={targetEvidenceCapability}
          availableCapabilities={(capabilityModel?.capabilities || []).map((c) => c.name)}
          onSuccess={() => {
            loadSingleCandidateData();
          }}
        />
      )}

      {isDrawerOpen && (
        <EvidenceDetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          event={drawerEvent}
          capability={drawerCapability}
        />
      )}
    </div>
  );
};
