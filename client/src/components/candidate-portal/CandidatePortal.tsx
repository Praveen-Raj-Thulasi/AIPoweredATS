import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Award,
  Video,
  Check,
  X,
  ShieldCheck,
  Code2,
  Fingerprint,
} from 'lucide-react';
import { Application, Job, User, Interview, Offer, ProofOfSkillEvaluation, CandidateCapability, AssessmentSession } from '@ats/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/PageHeader';
import { CandidateCapabilityScorecard } from '../proof-of-skill/CandidateCapabilityScorecard';
import { EvidenceInspectorDrawer } from '../proof-of-skill/EvidenceInspectorDrawer';
import { AssessmentWorkspace } from '../assessment/AssessmentWorkspace';
import { LivingCapabilityPassport } from '../passport/LivingCapabilityPassport';
import { EmptyState } from '../ui/EmptyState';
import { api } from '../../services/api';

interface CandidatePortalProps {
  user: User;
  applications: Application[];
  jobs: Job[];
  onOpenResumeUpload: () => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  user,
  applications,
  jobs,
  onOpenResumeUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'passport' | 'applications' | 'capabilities' | 'interviews' | 'offers' | 'browse'>('passport');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [capabilityEvaluation, setCapabilityEvaluation] = useState<ProofOfSkillEvaluation | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<CandidateCapability | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Active Assessment Session
  const [activeSession, setActiveSession] = useState<AssessmentSession | null>(null);
  const [isStartingAssessment, setIsStartingAssessment] = useState(false);

  const loadCandidateData = async () => {
    try {
      const [intList, offList] = await Promise.all([
        api.getInterviews(),
        api.getOffers(),
      ]);
      setInterviews(intList);
      setOffers(offList);

      if (user.candidateProfileId) {
        const evalData = await api.getCandidateCapabilities(user.candidateProfileId);
        setCapabilityEvaluation(evalData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCandidateData();
  }, [user]);

  const handleStartAdaptiveAssessment = async (jobId: string) => {
    setIsStartingAssessment(true);
    try {
      const session = await api.startAssessmentSession(jobId);
      setActiveSession(session);
    } catch (err: any) {
      alert(err.message || 'Failed to start assessment session');
    } finally {
      setIsStartingAssessment(false);
    }
  };

  const handleRespondOffer = async (offerId: string, decision: 'accepted' | 'rejected') => {
    try {
      await api.respondToOffer(offerId, decision);
      loadCandidateData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInspect = (cap: CandidateCapability) => {
    setSelectedCapability(cap);
    setIsInspectorOpen(true);
  };

  if (activeSession) {
    return (
      <AssessmentWorkspace
        session={activeSession}
        onSessionComplete={() => {
          setActiveSession(null);
          loadCandidateData();
        }}
        onExit={() => {
          setActiveSession(null);
          loadCandidateData();
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Welcome Banner / Header */}
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description="Track your applications, verified capability profile, interview schedule, and formal offers."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            CANDIDATE PORTAL
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            {applications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartAdaptiveAssessment(applications[0].jobId)}
                isLoading={isStartingAssessment}
                className="border-zinc-800 bg-black/40"
              >
                <Code2 className="w-3.5 h-3.5 mr-1.5" />
                Adaptive Assessment
              </Button>
            )}
            <Button variant="gradient-action" size="sm" onClick={onOpenResumeUpload}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Apply with Resume
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-zinc-850 gap-6 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('passport')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 relative ${
            activeTab === 'passport'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5" />
          Capability Passport
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 transition-colors shrink-0 relative ${
            activeTab === 'applications'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          My Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('capabilities')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 relative ${
            activeTab === 'capabilities'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-550 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />

          Proof-of-Skill Breakdown {capabilityEvaluation && `(${capabilityEvaluation.verifiedCount})`}
        </button>
        <button
          onClick={() => setActiveTab('interviews')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 relative ${
            activeTab === 'interviews'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Interviews ({interviews.length})
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-1.5 relative ${
            activeTab === 'offers'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Offers ({offers.length})
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-3 transition-colors shrink-0 relative ${
            activeTab === 'browse'
              ? 'text-white active-tab-underline font-semibold'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Explore Roles ({jobs.length})
        </button>
      </div>


      {/* Living Capability Passport Tab */}
      {activeTab === 'passport' && user.candidateProfileId && (
        <LivingCapabilityPassport
          candidateId={user.candidateProfileId}
          isCandidate={true}
          availableJobs={jobs}
        />
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No Applications Submitted Yet"
              description="Explore open engineering positions and apply with your resume to start building your verified capability profile."
              actionLabel="Explore Open Roles"
              onAction={() => setActiveTab('browse')}
            />
          ) : (
            applications.map((app) => (
              <Card key={app.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base text-white">{app.jobTitle}</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                      {app.stage.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {app.aiScoreCard && (
                      <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-white">
                        {app.aiScoreCard.overallScore}% AI Fit
                      </span>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartAdaptiveAssessment(app.jobId)}
                      className="text-xs ml-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      Take Assessment
                    </Button>
                  </div>
                </div>

                {app.aiScoreCard && (
                  <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-xs space-y-1.5">
                    <p className="font-semibold text-white font-mono">Screening Summary:</p>
                    <p className="text-zinc-300 leading-relaxed">{app.aiScoreCard.summary}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Capabilities Tab */}
      {activeTab === 'capabilities' && (
        <div className="space-y-6">
          {!capabilityEvaluation ? (
            <Card className="p-12 text-center text-xs text-zinc-500">
              Submit your resume to build your verified capability model.
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-xs">
                  <span className="text-zinc-400 font-mono">Overall Verified</span>
                  <p className="text-xl font-bold text-white mt-1 font-mono">
                    {capabilityEvaluation.overallVerificationRate}%
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-xs">
                  <span className="text-zinc-400 font-mono">Verified Proof</span>
                  <p className="text-xl font-bold text-white mt-1 font-mono">
                    {capabilityEvaluation.verifiedCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-xs">
                  <span className="text-zinc-400 font-mono">Partially Verified</span>
                  <p className="text-xl font-bold text-zinc-300 mt-1 font-mono">
                    {capabilityEvaluation.partiallyVerifiedCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-xs">
                  <span className="text-zinc-400 font-mono">Pending Evidence</span>
                  <p className="text-xl font-bold text-zinc-400 mt-1 font-mono">
                    {capabilityEvaluation.insufficientCount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {capabilityEvaluation.capabilities.map((cap) => (
                  <CandidateCapabilityScorecard
                    key={cap.id}
                    capability={cap}
                    onInspectEvidence={handleInspect}
                    isRecruiter={false}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Interviews Tab */}
      {activeTab === 'interviews' && (
        <div className="space-y-4">
          {interviews.length === 0 ? (
            <Card className="p-12 text-center text-xs text-zinc-500">
              No interviews scheduled currently.
            </Card>
          ) : (
            interviews.map((int) => (
              <Card key={int.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base text-white">{int.jobTitle}</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{int.interviewType.toUpperCase()} ROUND</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 uppercase">
                    {int.status}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Date: {new Date(int.scheduledAt).toLocaleDateString()} at {new Date(int.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Duration: {int.durationMinutes} Minutes</span>
                  </div>
                  <div>
                    <strong className="text-zinc-400 font-mono">Panel:</strong> {int.interviewerNames.join(', ')}
                  </div>
                  {int.notes && <p className="text-zinc-400 pt-2 border-t border-zinc-800/80 italic">Notes: {int.notes}</p>}
                </div>

                {int.meetingLink && (
                  <div className="flex justify-end">
                    <a
                      href={int.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Video Meeting
                    </a>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          {offers.length === 0 ? (
            <Card className="p-12 text-center text-xs text-zinc-500">
              No active job offers received at this time.
            </Card>
          ) : (
            offers.map((offer) => (
              <Card key={offer.id} className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">Official Offer Package</span>
                    <h3 className="font-semibold text-lg text-white">{offer.jobTitle}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-white uppercase">
                    {offer.status}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Starting Base Salary:</span>
                    <span className="font-bold text-white font-mono">
                      {offer.currency} {offer.baseSalary.toLocaleString()} / year
                    </span>
                  </div>
                  {offer.equity && (
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-zinc-400">Equity Grant:</span>
                      <span className="text-white">{offer.equity}</span>
                    </div>
                  )}
                  {offer.bonus && (
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-zinc-400">Bonus Plan:</span>
                      <span className="text-white">{offer.bonus}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-500 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                    <span>Start Date: {new Date(offer.startDate).toLocaleDateString()}</span>
                    <span>Valid until: {new Date(offer.expirationDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {offer.status === 'sent' && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRespondOffer(offer.id, 'rejected')}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Decline Offer
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRespondOffer(offer.id, 'accepted')}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Accept Job Offer
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Browse Jobs Tab */}
      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                      {job.department}
                    </span>
                    <h3 className="font-semibold text-white text-base">{job.title}</h3>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{job.location}</span>
                  </div>
                  {job.salaryMin && job.salaryMax && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-mono">
                        ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{job.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-850/60 flex justify-end">
                <Button variant="primary" size="sm" onClick={onOpenResumeUpload}>
                  Apply to this Position
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Evidence Inspector Drawer */}
      <EvidenceInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        capability={selectedCapability}
      />
    </div>
  );
};


