import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Mail,
  Fingerprint,
  Cpu,
  FileText,
} from 'lucide-react';
import { Application, ApplicationStage, CandidateCapability, ProofOfSkillEvaluation, VerificationState } from '@ats/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { CandidateCapabilityScorecard } from '../proof-of-skill/CandidateCapabilityScorecard';
import { EvidenceInspectorDrawer } from '../proof-of-skill/EvidenceInspectorDrawer';
import { AddObservationModal } from '../proof-of-skill/AddObservationModal';
import { ManualOverrideModal } from '../proof-of-skill/ManualOverrideModal';
import { RecruiterAssessmentReport } from '../assessment/RecruiterAssessmentReport';
import { CapabilityFingerprintView } from '../fingerprint/CapabilityFingerprintView';
import { DecisionIntelligenceView } from '../decision/DecisionIntelligenceView';
import { LivingCapabilityPassport } from '../passport/LivingCapabilityPassport';
import { api } from '../../services/api';

interface CandidateScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onUpdateStage: (appId: string, stage: ApplicationStage) => void;
  onOpenEmailComposer: (email: string, name: string, jobTitle: string) => void;
  onRefreshData?: () => void;
}

export const CandidateScorecardModal: React.FC<CandidateScorecardModalProps> = ({
  isOpen,
  onClose,
  application,
  onUpdateStage,
  onOpenEmailComposer,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'passport' | 'proof_of_skill' | 'fingerprint' | 'decision_intelligence' | 'uncertainty_report' | 'ai_screening' | 'timeline'>('passport');
  const [evaluation, setEvaluation] = useState<ProofOfSkillEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals for Proof-of-Skill
  const [selectedCapability, setSelectedCapability] = useState<CandidateCapability | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isAddObservationOpen, setIsAddObservationOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  const loadCapabilities = async () => {
    if (!application) return;
    setIsLoading(true);
    try {
      const data = await api.getCandidateCapabilities(application.candidateId, application.jobId);
      setEvaluation(data);
    } catch (err) {
      console.error('Error loading candidate capabilities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && application) {
      loadCapabilities();
    }
  }, [isOpen, application]);

  if (!application) return null;

  const handleInspect = (cap: CandidateCapability) => {
    setSelectedCapability(cap);
    setIsInspectorOpen(true);
  };

  const handleAddObservationOpen = (cap: CandidateCapability) => {
    setSelectedCapability(cap);
    setIsAddObservationOpen(true);
  };

  const handleManualOverrideOpen = (cap: CandidateCapability) => {
    setSelectedCapability(cap);
    setIsOverrideOpen(true);
  };

  const handleSubmitObservation = async (data: any) => {
    if (!selectedCapability || !application) return;
    try {
      await api.addCandidateEvidence(application.candidateId, {
        ...data,
        capabilityName: selectedCapability.capabilityName,
        stageRecorded: application.stage,
      });
      loadCapabilities();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmOverride = async (state: VerificationState, reason: string) => {
    if (!selectedCapability || !application) return;
    try {
      await api.overrideCandidateCapability(application.candidateId, {
        capabilityName: selectedCapability.capabilityName,
        verificationState: state,
        overrideReason: reason,
      });
      loadCapabilities();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const candidateName = application.candidate
    ? `${application.candidate.firstName} ${application.candidate.lastName}`
    : 'Candidate';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={candidateName}
      subtitle={`Application for ${application.jobTitle} • Current Stage: ${application.stage.replace(/_/g, ' ').toUpperCase()}`}
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-semibold text-base text-white">
              {application.candidate?.firstName[0]}
              {application.candidate?.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-white text-base">{candidateName}</h3>
                <StatusIndicator status={application.stage} showIcon={false} size="sm" />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{application.candidate?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {application.candidate?.resumeUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (application.candidate?.resumeUrl) {
                    window.open(application.candidate.resumeUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                View Resume
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (application.candidate) {
                  onOpenEmailComposer(
                    application.candidate.email,
                    candidateName,
                    application.jobTitle || 'Role'
                  );
                }
              }}
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Email Candidate
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 gap-6 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('passport')}
            className={`pb-3 border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'passport'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            Living Capability Passport
          </button>
          <button
            onClick={() => setActiveTab('proof_of_skill')}
            className={`pb-3 border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'proof_of_skill'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Proof-of-Skill {evaluation && `(${evaluation.verifiedCount} Verified)`}
          </button>
          <button
            onClick={() => setActiveTab('fingerprint')}
            className={`pb-3 border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'fingerprint'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Capability Fingerprint
          </button>
          <button
            onClick={() => setActiveTab('decision_intelligence')}
            className={`pb-3 border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'decision_intelligence'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Decision Intelligence
          </button>
          <button
            onClick={() => setActiveTab('uncertainty_report')}
            className={`pb-3 border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'uncertainty_report'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Uncertainty & Gaps
          </button>
          <button
            onClick={() => setActiveTab('ai_screening')}
            className={`pb-3 border-b-2 transition-all shrink-0 flex items-center gap-2 ${
              activeTab === 'ai_screening'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Fit Scorecard ({application.aiScoreCard?.overallScore || 0}%)
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 border-b-2 transition-all shrink-0 ${
              activeTab === 'timeline'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Stage Timeline ({application.timeline?.length || 0})
          </button>
        </div>

        {/* Living Capability Passport Tab */}
        {activeTab === 'passport' && (
          <LivingCapabilityPassport
            candidateId={application.candidateId}
            isCandidate={false}
          />
        )}

        {/* Capability Fingerprint Tab */}
        {activeTab === 'fingerprint' && (
          <CapabilityFingerprintView
            candidateId={application.candidateId}
            jobId={application.jobId}
          />
        )}

        {/* Decision Intelligence Tab */}
        {activeTab === 'decision_intelligence' && (
          <DecisionIntelligenceView
            candidateId={application.candidateId}
            jobId={application.jobId}
            onRefreshParent={onRefreshData}
          />
        )}

        {/* Uncertainty Report Tab */}
        {activeTab === 'uncertainty_report' && (
          <RecruiterAssessmentReport
            candidateId={application.candidateId}
            jobId={application.jobId}
          />
        )}

        {/* Proof of Skill Tab */}
        {activeTab === 'proof_of_skill' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="py-16 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
              </div>
            ) : !evaluation ? (
              <div className="py-16 text-center text-xs text-zinc-400">
                No proof-of-skill evaluation available.
              </div>
            ) : (
              <>
                {/* Proof-of-Skill Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-xs">
                    <span className="text-zinc-400 font-mono text-[11px] uppercase">Verification Rate</span>
                    <p className="text-xl font-semibold text-white mt-1 font-mono">
                      {evaluation.overallVerificationRate}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-xs">
                    <span className="text-zinc-400 font-mono text-[11px] uppercase">Verified</span>
                    <p className="text-xl font-semibold text-emerald-400 mt-1 font-mono">
                      {evaluation.verifiedCount}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-xs">
                    <span className="text-zinc-400 font-mono text-[11px] uppercase">Partial Evidence</span>
                    <p className="text-xl font-semibold text-amber-400 mt-1 font-mono">
                      {evaluation.partiallyVerifiedCount}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-xs">
                    <span className="text-zinc-400 font-mono text-[11px] uppercase">Insufficient</span>
                    <p className="text-xl font-semibold text-zinc-400 mt-1 font-mono">
                      {evaluation.insufficientCount}
                    </p>
                  </div>
                </div>

                {/* Capability Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {evaluation.capabilities.map((cap) => (
                    <CandidateCapabilityScorecard
                      key={cap.id}
                      capability={cap}
                      onInspectEvidence={handleInspect}
                      onAddObservation={handleAddObservationOpen}
                      onManualOverride={handleManualOverrideOpen}
                      isRecruiter={true}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* AI Screening Scorecard Tab */}
        {activeTab === 'ai_screening' && (
          <div className="space-y-4">
            {application.aiScoreCard ? (
              <div className="space-y-5 text-xs">
                <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-2">
                  <span className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
                    Executive Fit Summary
                  </span>
                  <p className="text-zinc-300 leading-relaxed font-sans text-xs">{application.aiScoreCard.summary}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-3">
                    <span className="font-semibold text-xs text-emerald-400 uppercase tracking-wider font-mono">
                      Demonstrated Strengths
                    </span>
                    <ul className="space-y-1.5 text-zinc-300">
                      {application.aiScoreCard.keyStrengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-3">
                    <span className="font-semibold text-xs text-amber-400 uppercase tracking-wider font-mono">
                      Focus Areas & Gaps
                    </span>
                    <ul className="space-y-1.5 text-zinc-300">
                      {application.aiScoreCard.potentialGaps?.map((g, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-zinc-400">
                No AI screening scorecard generated.
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {application.timeline?.map((event, idx) => (
              <div
                key={event.id || idx}
                className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">{event.title}</p>
                  <p className="text-[11px] text-zinc-400">{event.description}</p>
                </div>
                <div className="text-right text-[11px] text-zinc-400 font-mono">
                  <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                  <p className="text-zinc-300 font-sans font-medium">{event.actorName}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drawer & Modals */}
        <EvidenceInspectorDrawer
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          capability={selectedCapability}
        />

        <AddObservationModal
          isOpen={isAddObservationOpen}
          onClose={() => setIsAddObservationOpen(false)}
          capability={selectedCapability}
          onSubmitObservation={handleSubmitObservation}
        />

        <ManualOverrideModal
          isOpen={isOverrideOpen}
          onClose={() => setIsOverrideOpen(false)}
          capability={selectedCapability}
          onConfirmOverride={handleConfirmOverride}
        />
      </div>
    </Modal>
  );
};


