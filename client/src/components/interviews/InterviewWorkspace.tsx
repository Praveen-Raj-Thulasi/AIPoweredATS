import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Send,
  PlusCircle,
  SkipForward,
  Cpu,
  Award,
} from 'lucide-react';
import {
  InterviewSessionState,
} from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { api } from '../../services/api';

interface InterviewWorkspaceProps {
  session: InterviewSessionState;
  onComplete: (session: InterviewSessionState) => void;
  onExit: () => void;
}

export const InterviewWorkspace: React.FC<InterviewWorkspaceProps> = ({
  session: initialSession,
  onComplete,
  onExit,
}) => {
  const [session, setSession] = useState<InterviewSessionState>(initialSession);
  const [candidateInput, setCandidateInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewerNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Custom / Edit Question state
  const [isCustomQuestionOpen, setIsCustomQuestionOpen] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customCapability, setCustomCapability] = useState(
    session.plan.plannedCompetencies[0]?.capabilityName || 'General Architecture'
  );

  const activeTurn = session.turns[session.turns.length - 1];

  const handleRecordResponse = async () => {
    if (!candidateInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await api.recordInterviewResponse(session.id, candidateInput.trim());
      setSession(result.session);
      setCandidateInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to analyze candidate response');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptFollowUp = async (questionText: string, capabilityName: string) => {
    try {
      const updated = await api.acceptOrAddInterviewFollowUp(session.id, {
        questionText,
        capabilityName,
        questionType: 'follow_up',
      });
      setSession(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to advance turn');
    }
  };

  const handleAddCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestionText.trim()) return;
    try {
      const updated = await api.acceptOrAddInterviewFollowUp(session.id, {
        questionText: customQuestionText.trim(),
        capabilityName: customCapability,
        questionType: 'recruiter_custom',
      });
      setSession(updated);
      setCustomQuestionText('');
      setIsCustomQuestionOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add custom question');
    }
  };

  const handleNextPlannedCompetency = async () => {
    const planned = session.plan.plannedCompetencies;
    const evaluatedCaps = session.turns.map((t) => t.capabilityName.toLowerCase());
    const nextComp = planned.find((p) => !evaluatedCaps.includes(p.capabilityName.toLowerCase())) || planned[0];

    try {
      const updated = await api.acceptOrAddInterviewFollowUp(session.id, {
        questionText: nextComp.keyProbeQuestions[0] || `Can you explain your experience with ${nextComp.capabilityName}?`,
        capabilityName: nextComp.capabilityName,
        questionType: 'primary',
      });
      setSession(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to advance competency');
    }
  };

  const handleCompleteInterview = async () => {
    setIsCompleting(true);
    try {
      const completed = await api.completeInterviewSession(session.id, interviewerNotes);
      setSession(completed);
      onComplete(completed);
    } catch (err: any) {
      alert(err.message || 'Failed to finalize interview');
    } finally {
      setIsCompleting(false);
    }
  };

  if (session.status === 'completed') {
    return (
      <Card className="max-w-2xl mx-auto p-8 space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Interview Session Completed</h2>
          <p className="text-xs text-zinc-400">
            Observations, extracted claims, and verification scores have been linked to the Candidate Capability Model.
          </p>
        </div>

        {session.combinedEvaluation && (
          <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-4">
            <h3 className="font-semibold text-xs text-zinc-300 font-mono uppercase tracking-wider">Evaluation Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Reasoning</span>
                <p className="text-lg font-bold text-white mt-0.5">{session.combinedEvaluation.technicalReasoning}%</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Depth</span>
                <p className="text-lg font-bold text-white mt-0.5">{session.combinedEvaluation.explanationQuality}%</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Consistency</span>
                <p className="text-lg font-bold text-white mt-0.5">{session.combinedEvaluation.consistency}%</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-850/60 text-xs space-y-1">
              <p className="font-medium text-zinc-200 font-mono text-[11px]">Debrief Summary:</p>
              <p className="text-zinc-400 leading-relaxed text-[11px]">{session.combinedEvaluation.summary}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="primary" onClick={onExit}>
            Exit to Console
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Header Bar */}
      <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-900 text-white border border-zinc-800">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {session.mode.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-zinc-500">
                Turn {session.currentTurnIndex} of {session.turns.length}
              </span>
            </div>
            <h2 className="text-base font-semibold text-white mt-0.5">
              Active Capability: {activeTurn?.capabilityName || 'General Architecture'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomQuestionOpen(true)}
            className="text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Add Custom Question
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleCompleteInterview}
            isLoading={isCompleting}
            className="text-xs"
          >
            Finalize Interview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Turn Conversation Transcript */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-6 max-h-[68vh] overflow-y-auto pr-2">
            <h3 className="font-semibold text-sm text-white">Interview Transcript & Turns</h3>

            <div className="space-y-5">
              {session.turns.map((turn, idx) => (
                <div key={turn.id || idx} className="space-y-3">
                  {/* Interviewer Question */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-zinc-300 font-mono">
                        Interviewer • {turn.questionType.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-zinc-800 text-zinc-400 font-mono text-[10px]">
                        {turn.capabilityName}
                      </span>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-medium">
                      {turn.questionText}
                    </p>
                  </div>

                  {/* Candidate Response (if answered) */}
                  {turn.candidateResponse && (
                    <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-2 ml-4">
                      <span className="text-[11px] font-semibold text-zinc-400 font-mono">Candidate Response:</span>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {turn.candidateResponse}
                      </p>

                      {/* Turn Evaluation Badge */}
                      {turn.turnEvaluation && (
                        <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-850/60 flex items-center justify-between text-[11px] text-zinc-400 mt-2 font-mono">
                          <span>
                            Reasoning: <strong className="text-zinc-200">{turn.turnEvaluation.technicalReasoningScore}%</strong>
                          </span>
                          <span>
                            Depth: <strong className="text-zinc-200">{turn.turnEvaluation.explanationDepthScore}%</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Candidate Response Input (for Active Turn) */}
            {activeTurn && !activeTurn.candidateResponse && (
              <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                <label className="text-xs font-semibold text-zinc-300">
                  Record Candidate Response (or Speech Transcript):
                </label>
                <textarea
                  rows={4}
                  value={candidateInput}
                  onChange={(e) => setCandidateInput(e.target.value)}
                  placeholder="Type or paste candidate verbal response..."
                  className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y transition-colors leading-relaxed"
                />
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRecordResponse}
                    isLoading={isAnalyzing}
                    disabled={!candidateInput.trim()}
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Submit & Analyze
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: AI Claim Detector & Follow-Up Intelligence */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Turn Claims & Evidence */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <h3 className="font-semibold text-sm text-white">Live Claim & Evidence Detector</h3>
            </div>

            {activeTurn?.detectedClaims && activeTurn.detectedClaims.length > 0 ? (
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Extracted Technical Claims:
                </span>
                <div className="space-y-2">
                  {activeTurn.detectedClaims.map((claim, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="font-medium text-white">{claim.claim}</span>
                        <p className="text-[10px] text-zinc-400 capitalize">{claim.category.replace(/_/g, ' ')}</p>
                      </div>
                      <StatusIndicator status={claim.verificationSignal} size="sm" />
                    </div>
                  ))}
                </div>

                {activeTurn.uncertaintyIdentified && (
                  <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 text-xs text-zinc-300 space-y-1">
                    <p className="font-medium text-white font-mono text-[11px]">Uncertainty Gap Detected:</p>
                    <p className="text-[11px] text-zinc-400">{activeTurn.uncertaintyIdentified}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500 bg-black/40 rounded-xl border border-zinc-800/80">
                Submit a response to extract claims and detect uncertainty gaps in real time.
              </div>
            )}
          </Card>

          {/* Follow-Up Recommendation Bar */}
          {activeTurn?.followUpRecommendations && activeTurn.followUpRecommendations.length > 0 && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-white" />
                  <h3 className="font-semibold text-sm text-white">Recommended Follow-Ups</h3>
                </div>
                <button
                  onClick={handleNextPlannedCompetency}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Next Skill
                </button>
              </div>

              <div className="space-y-3">
                {activeTurn.followUpRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2 hover:border-zinc-700 transition-colors"
                  >
                    <p className="text-xs font-medium text-white leading-relaxed">
                      "{rec.question}"
                    </p>
                    <p className="text-[11px] text-zinc-400 italic">
                      Rationale: {rec.rationale}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptFollowUp(rec.question, activeTurn.capabilityName)}
                        className="text-xs"
                      >
                        Accept Probe
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Custom Question Modal */}
      {isCustomQuestionOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4">
            <h3 className="font-semibold text-base text-white">Add Custom Probe Question</h3>
            <form onSubmit={handleAddCustomQuestion} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Target Capability</label>
                <select
                  value={customCapability}
                  onChange={(e) => setCustomCapability(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  {session.plan.plannedCompetencies.map((p, i) => (
                    <option key={i} value={p.capabilityName}>
                      {p.capabilityName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Question Text *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter your custom probe question..."
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y transition-colors leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800/80">
                <Button variant="secondary" size="sm" onClick={() => setIsCustomQuestionOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Insert Turn
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};


