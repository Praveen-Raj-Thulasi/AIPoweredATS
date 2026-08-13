import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Clock,
  Lock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Sliders,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Fingerprint,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  CandidatePassport,
  CandidateConsentSettings,
  EvidenceReuseAnalysis,
  Job,
} from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { SectionHeader } from '../ui/PageHeader';
import { api } from '../../services/api';

interface LivingCapabilityPassportProps {
  candidateId: string;
  isCandidate?: boolean;
  availableJobs?: Job[];
}

export const LivingCapabilityPassport: React.FC<LivingCapabilityPassportProps> = ({
  candidateId,
  isCandidate = true,
  availableJobs = [],
}) => {
  const [passport, setPassport] = useState<CandidatePassport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'verified' | 'demonstrated' | 'claimed' | 'reverification'>('all');
  const [expandedCapId, setExpandedCapId] = useState<string | null>(null);

  // Consent Modal State
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentSettings, setConsentSettings] = useState<CandidateConsentSettings | null>(null);
  const [isSavingConsent, setIsSavingConsent] = useState(false);
  const [consentSaveSuccess, setConsentSaveSuccess] = useState(false);

  // Evidence Reuse Simulator State
  const [selectedReuseJobId, setSelectedReuseJobId] = useState<string>('');
  const [reuseAnalysis, setReuseAnalysis] = useState<EvidenceReuseAnalysis | null>(null);
  const [isAnalyzingReuse, setIsAnalyzingReuse] = useState(false);

  // Copied share state
  const [copiedHash, setCopiedHash] = useState(false);

  const loadPassportData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCandidatePassport(candidateId);
      setPassport(data);
      setConsentSettings(data.consent);
    } catch (err) {
      console.error('Failed to load candidate passport:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPassportData();
  }, [candidateId]);

  // Handle Reuse simulation
  const handleSimulateReuse = async (jobId: string) => {
    if (!jobId) {
      setReuseAnalysis(null);
      return;
    }
    setSelectedReuseJobId(jobId);
    setIsAnalyzingReuse(true);
    try {
      const analysis = await api.checkEvidenceReuse(candidateId, jobId);
      setReuseAnalysis(analysis);
    } catch (err) {
      console.error('Failed to analyze evidence reuse:', err);
    } finally {
      setIsAnalyzingReuse(false);
    }
  };

  // Handle Consent update
  const handleSaveConsent = async () => {
    if (!consentSettings) return;
    setIsSavingConsent(true);
    try {
      const updated = await api.updateCandidateConsentSettings(candidateId, {
        allowCrossJobReuse: consentSettings.allowCrossJobReuse,
        allowCrossOrgSharing: consentSettings.allowCrossOrgSharing,
        excludedOrganizations: consentSettings.excludedOrganizations,
        allowedCapabilities: consentSettings.allowedCapabilities,
      });
      setConsentSettings(updated);
      setConsentSaveSuccess(true);
      setTimeout(() => {
        setConsentSaveSuccess(false);
        setIsConsentModalOpen(false);
      }, 1200);
      loadPassportData();
    } catch (err) {
      console.error('Failed to update consent settings:', err);
    } finally {
      setIsSavingConsent(false);
    }
  };

  const handleCopyVerification = () => {
    if (!passport) return;
    navigator.clipboard.writeText(
      `VERITY CAPABILITY PASSPORT: ID=${passport.passportId} | HASH=${passport.verificationHash} | Candidate=${passport.candidateName}`
    );
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center space-y-3 bg-[#0c0c0e] rounded-2xl border border-zinc-800/80">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
        <p className="text-sm font-medium text-zinc-300">Compiling Living Capability Passport...</p>
        <p className="text-xs text-zinc-500 font-mono">Evaluating freshness decay and evidence transfers</p>
      </div>
    );
  }

  if (!passport) {
    return (
      <Card className="p-12 text-center text-zinc-400 space-y-2">
        <AlertTriangle className="w-8 h-8 text-zinc-300 mx-auto" />
        <p className="text-sm font-medium">Passport profile not found or initialized.</p>
      </Card>
    );
  }

  const allCapabilities = [
    ...passport.verifiedCapabilities,
    ...passport.demonstratedCapabilities,
    ...passport.claimedCapabilities,
    ...passport.unknownCapabilities,
  ];

  const filteredCapabilities = allCapabilities.filter((c) => {
    if (selectedFilter === 'verified') return c.status === 'VERIFIED';
    if (selectedFilter === 'demonstrated') return c.status === 'DEMONSTRATED';
    if (selectedFilter === 'claimed') return c.status === 'CLAIMED';
    if (selectedFilter === 'reverification') return c.freshness.isReverificationRecommended;
    return true;
  });

  const reverificationCount = allCapabilities.filter((c) => c.freshness.isReverificationRecommended).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Passport Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {passport.candidateName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/60">
                    {passport.passportId}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{passport.headline}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Candidate-owned, continuous evidence profile. Every competency is backed by objective challenge traces, verified repository contributions, and freshness decay tracking.
            </p>
          </div>

          {/* Verification Seal & Action Buttons */}
          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-black/40 border border-zinc-800/80 px-3.5 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-[11px] font-mono">
                <span className="text-zinc-400">SIG: </span>
                <span className="text-white font-medium">{passport.verificationHash}</span>
              </div>
              <button
                onClick={handleCopyVerification}
                className="ml-1 text-zinc-400 hover:text-white transition-colors"
                title="Copy Verification Seal"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isCandidate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConsentModalOpen(true)}
              >
                <Sliders className="w-3.5 h-3.5 mr-1.5" />
                Consent & Privacy
              </Button>
            )}
          </div>
        </div>

        {/* 4 Stat Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-zinc-850/60 font-mono">
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>VERIFIED</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {passport.totalVerifiedCount}
            </p>
            <span className="text-[10px] text-zinc-500">Substantiated proof</span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>DEMONSTRATED</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {passport.totalDemonstratedCount}
            </p>
            <span className="text-[10px] text-zinc-500">Project challenges</span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>CLAIMED</span>
              <FileCheck className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {passport.totalClaimedCount}
            </p>
            <span className="text-[10px] text-zinc-500">Self-declared in resume</span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>AVG CONFIDENCE</span>
              <TrendingUp className="w-4 h-4 text-zinc-300" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {passport.averageConfidence}%
            </p>
            <span className="text-[10px] text-zinc-500">Aggregate fit weight</span>
          </div>
        </div>
      </div>

      {/* Evidence Reuse & Cross-Job Exemption Simulator */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-white" />
              <h4 className="font-semibold text-sm text-white">
                Cross-Job Evidence Exemption Simulator
              </h4>
            </div>
            <p className="text-xs text-zinc-400">
              Apply valid, verified evidence across job requisitions to skip repetitive assessments.
            </p>
          </div>

          {availableJobs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 shrink-0 font-mono">Target Role:</span>
              <select
                value={selectedReuseJobId}
                onChange={(e) => handleSimulateReuse(e.target.value)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="">Select a role to simulate...</option>
                {availableJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isAnalyzingReuse && (
          <div className="py-4 text-center text-xs text-zinc-300 flex items-center justify-center gap-2 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            Matching verified capabilities against role requirements...
          </div>
        )}

        {reuseAnalysis && !isAnalyzingReuse && (
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-850/60 pb-3">
              <div>
                <span className="text-xs font-semibold text-white">
                  Transfer Match for: {reuseAnalysis.targetJobTitle}
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">{reuseAnalysis.explanation}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-mono">
                  Saves ~{reuseAnalysis.assessmentTimeSavedMinutes} mins testing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Reusable Competencies */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-300 font-medium font-mono text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exempt from Testing (Reused Evidence):</span>
                </div>
                {reuseAnalysis.reusableCapabilities.length === 0 ? (
                  <p className="text-zinc-500 italic">No matching competencies reused.</p>
                ) : (
                  <div className="space-y-1.5">
                    {reuseAnalysis.reusableCapabilities.map((rc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-zinc-200"
                      >
                        <span className="font-medium text-white">{rc.capabilityName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {rc.confidence}% Conf
                          </span>
                          <StatusIndicator status={rc.freshnessStatus} size="sm" showIcon={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Required New Assessments */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-zinc-300 font-medium font-mono text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Targeted Gap Assessments Required:</span>
                </div>
                {reuseAnalysis.requiredNewAssessments.length === 0 ? (
                  <p className="text-zinc-400 italic">100% of capabilities already verified!</p>
                ) : (
                  <div className="space-y-1.5">
                    {reuseAnalysis.requiredNewAssessments.map((na, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{na.capabilityName}</span>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">
                            {na.importance}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">{na.rationale}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedFilter === 'all'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'bg-black/40 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            All Competencies ({allCapabilities.length})
          </button>
          <button
            onClick={() => setSelectedFilter('verified')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedFilter === 'verified'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'bg-black/40 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified ({passport.totalVerifiedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('demonstrated')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedFilter === 'demonstrated'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'bg-black/40 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Demonstrated ({passport.totalDemonstratedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('claimed')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              selectedFilter === 'claimed'
                ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                : 'bg-black/40 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Claimed ({passport.totalClaimedCount})
          </button>
          {reverificationCount > 0 && (
            <button
              onClick={() => setSelectedFilter('reverification')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedFilter === 'reverification'
                  ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                  : 'bg-black/40 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Aging ({reverificationCount})
            </button>
          )}
        </div>

        <div className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated: {new Date(passport.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Capability Passport Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCapabilities.map((cap) => {
          const isExpanded = expandedCapId === cap.id;

          return (
            <Card key={cap.id} className="space-y-4 hover:border-zinc-700 transition-all">
              {/* Capability Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-semibold text-base text-white">{cap.name}</span>
                    <StatusIndicator status={cap.status} />
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
                      {cap.category.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>
                      Claimed: <strong className="text-zinc-300 font-mono">{cap.claimedProficiency}</strong>
                    </span>
                    {cap.demonstratedProficiency && (
                      <span>
                        • Demonstrated:{' '}
                        <strong className="text-white font-mono">{cap.demonstratedProficiency}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Freshness Meter & Confidence */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[11px] text-zinc-400 font-mono">Freshness:</span>
                      <span className="text-xs font-semibold text-white font-mono">
                        {cap.freshness.status} ({cap.freshness.ageInMonths}m old)
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {cap.freshness.volatility.toUpperCase()} • {cap.freshness.freshnessWindowMonths}m SLA
                    </span>
                  </div>

                  {/* Confidence Score Pill */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80 text-center min-w-[70px]">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block">Score</span>
                    <p className="text-base font-semibold text-white font-mono">
                      {cap.confidenceScore}%
                    </p>
                  </div>

                  <button
                    onClick={() => setExpandedCapId(isExpanded ? null : cap.id)}
                    className="p-2 rounded-lg bg-black/40 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Re-verification alert if aging/stale */}
              {cap.freshness.isReverificationRecommended && (
                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-300">
                  <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white font-mono">Re-Verification Recommended:</span>
                    <p className="text-zinc-400">{cap.freshness.recommendationReason}</p>
                  </div>
                </div>
              )}

              {/* Expanded Details: Evidence Traces & Transfer Evidence */}
              {isExpanded && (
                <div className="pt-4 border-t border-zinc-850/60 space-y-4">
                  {/* Evidence Items Section */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                      <FileCheck className="w-3.5 h-3.5 text-white" />
                      Recorded Objective Evidence Traces ({cap.evidenceList.length})
                    </span>

                    {cap.evidenceList.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No direct challenge artifacts recorded yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cap.evidenceList.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white truncate">{ev.title}</span>
                              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                                {ev.sourceType.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-zinc-300 text-[11px] leading-relaxed">{ev.summary}</p>
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-850/60 font-mono">
                              <span>Date: {new Date(ev.dateRecorded).toLocaleDateString()}</span>
                              {ev.score !== undefined && (
                                <span className="text-white font-semibold">
                                  Score: {ev.score}/100
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Transfer Evidence Section */}
                  {cap.transferEvidenceList.length > 0 && (
                    <div className="space-y-2.5 pt-3 border-t border-zinc-850/60">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5 font-mono">
                        <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                        Cross-Stack Transferability Demonstrations ({cap.transferEvidenceList.length})
                      </span>

                      <div className="space-y-2">
                        {cap.transferEvidenceList.map((tr) => (
                          <div
                            key={tr.id}
                            className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-zinc-200">
                                {cap.name} → {tr.targetCapability}
                              </span>
                              <span className="text-[11px] text-emerald-400 font-mono">
                                Strength: {tr.transferStrength}%
                              </span>
                            </div>
                            <p className="text-zinc-300 text-[11px]">
                              <strong className="text-white font-mono">Concept:</strong> {tr.transferConcept}
                            </p>
                            <p className="text-zinc-400 text-[11px]">{tr.evidenceSummary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Candidate Consent Management Modal */}
      {isConsentModalOpen && consentSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0c0c0e] border border-zinc-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-lg text-white">Evidence Privacy & Consent</h3>
              </div>
              <button
                onClick={() => setIsConsentModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Control how your verified evidence is shared and reused across jobs and employers.
            </p>

            <div className="space-y-4">
              {/* Option 1: Cross Job Reuse */}
              <div className="flex items-start justify-between p-4 rounded-xl bg-black/40 border border-zinc-800/80 gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-white">Cross-Job Evidence Reuse</span>
                  <p className="text-xs text-zinc-400">
                    Automatically apply verified competencies when applying to new roles to skip repeating assessments.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consentSettings.allowCrossJobReuse}
                  onChange={(e) =>
                    setConsentSettings({
                      ...consentSettings,
                      allowCrossJobReuse: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-white rounded cursor-pointer mt-1"
                />
              </div>

              {/* Option 2: Cross Org Sharing */}
              <div className="flex items-start justify-between p-4 rounded-xl bg-black/40 border border-zinc-800/80 gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-white">Cross-Organization Sharing</span>
                  <p className="text-xs text-zinc-400">
                    Make your verified passport transferable across different hiring organizations.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consentSettings.allowCrossOrgSharing}
                  onChange={(e) =>
                    setConsentSettings({
                      ...consentSettings,
                      allowCrossOrgSharing: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-white rounded cursor-pointer mt-1"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-zinc-300 shrink-0" />
                <span>
                  Private recruiter notes, internal panel deliberations, and hiring decisions are never shared.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConsentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveConsent}
                isLoading={isSavingConsent}
              >
                {consentSaveSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-white" />
                    Saved!
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


