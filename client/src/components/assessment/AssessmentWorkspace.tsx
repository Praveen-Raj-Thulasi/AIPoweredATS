import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Terminal,
} from 'lucide-react';
import {
  AssessmentSession,
  AssessmentChallenge,
  AssessmentAttempt,
} from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';

interface AssessmentWorkspaceProps {
  session: AssessmentSession;
  onSessionComplete: (session: AssessmentSession) => void;
  onExit: () => void;
}

export const AssessmentWorkspace: React.FC<AssessmentWorkspaceProps> = ({
  session: initialSession,
  onSessionComplete,
  onExit,
}) => {
  const [session, setSession] = useState<AssessmentSession>(initialSession);
  const [currentChallenge, setCurrentChallenge] = useState<AssessmentChallenge | undefined>(
    initialSession.currentChallenge
  );

  // Form State
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [codeContent, setCodeContent] = useState<string>('');
  const [writtenAnswer, setWrittenAnswer] = useState<string>('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    initialSession.currentChallenge?.timeLimitSeconds || 300
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<AssessmentAttempt | null>(null);
  const [showAttemptFeedback, setShowAttemptFeedback] = useState(false);

  useEffect(() => {
    if (session.currentChallenge) {
      setCurrentChallenge(session.currentChallenge);
      setCodeContent(session.currentChallenge.starterCode || '');
      setSelectedOptionId('');
      setWrittenAnswer('');
      setTimeLeftSeconds(session.currentChallenge.timeLimitSeconds || 300);
    }
  }, [session.currentChallengeIndex, session.currentChallenge]);

  // Countdown timer
  useEffect(() => {
    if (timeLeftSeconds <= 0 || showAttemptFeedback) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds, showAttemptFeedback]);

  const handleSubmit = async () => {
    if (!currentChallenge) return;
    setIsSubmitting(true);
    try {
      let answerPayload = '';
      if (currentChallenge.type === 'mcq') {
        answerPayload = selectedOptionId;
      } else if (currentChallenge.type === 'coding' || currentChallenge.type === 'debugging') {
        answerPayload = codeContent;
      } else {
        answerPayload = writtenAnswer;
      }

      const result = await api.submitAssessmentAttempt(session.id, {
        answer: answerPayload,
        code: currentChallenge.type === 'coding' || currentChallenge.type === 'debugging' ? codeContent : undefined,
        timeSpentSeconds: (currentChallenge.timeLimitSeconds || 300) - timeLeftSeconds,
      });

      setLastAttempt(result.attempt);
      setShowAttemptFeedback(true);
      setSession(result.session);

      if (result.isSessionComplete) {
        setTimeout(() => {
          onSessionComplete(result.session);
        }, 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextChallenge = () => {
    setShowAttemptFeedback(false);
    setLastAttempt(null);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (!currentChallenge && session.status === 'completed') {
    return (
      <Card className="max-w-2xl mx-auto p-12 text-center space-y-6 bg-zinc-950 border-zinc-800">
        <div className="inline-flex p-4 rounded-3xl bg-zinc-900 border border-zinc-750 text-white">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Assessment Completed!</h2>
          <p className="text-sm text-zinc-400">
            Your Proof-of-Skill evidence model and capability confidence scores have been dynamically updated.
          </p>
        </div>
        <Button variant="primary" onClick={onExit}>
          Return to Portal
        </Button>
      </Card>
    );
  }

  if (!currentChallenge) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-900 text-white border border-zinc-800">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm" className="font-mono">
                Level {currentChallenge.level}: {currentChallenge.levelName}
              </Badge>
              <Badge variant="default" size="sm" className="font-mono">
                Challenge {session.currentChallengeIndex} of {session.totalChallengesCount}
              </Badge>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Evaluating: {currentChallenge.capabilityName}
            </h2>
          </div>
        </div>

        {/* Live Timer & Progress */}
        <div className="flex items-center gap-4">
          <div
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-sm font-bold ${
              timeLeftSeconds <= 60
                ? 'bg-zinc-900 border-white text-white animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={onExit}
            className="text-xs text-zinc-400 hover:text-white transition-colors font-mono"
          >
            Exit Assessment
          </button>
        </div>
      </div>

      {/* Attempt Feedback Overlay */}
      {showAttemptFeedback && lastAttempt ? (
        <Card className="p-8 text-center space-y-6 border-zinc-700 bg-zinc-950">
          <div className="inline-flex p-3 rounded-2xl border bg-zinc-900 border-zinc-750 text-white">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-white">
              {lastAttempt.isPassed ? 'Competency Substantiated!' : 'Evaluation Recorded'}
            </h3>
            <p className="text-sm text-zinc-300">{lastAttempt.feedback}</p>
            <p className="text-xs text-zinc-400 font-semibold font-mono">
              Score: {lastAttempt.score}/100 • Evaluated on Level {lastAttempt.level} Rubric
            </p>
          </div>

          {session.status === 'completed' ? (
            <p className="text-xs text-zinc-300 font-semibold font-mono animate-pulse">
              Finalizing adaptive session and updating capability graph...
            </p>
          ) : (
            <Button variant="primary" onClick={handleNextChallenge}>
              Proceed to Next Adaptive Challenge
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </Card>
      ) : (
        /* Active Challenge Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Challenge Prompt & Scenario */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 space-y-4 bg-zinc-950 border-zinc-800">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  {currentChallenge.type.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold text-white">{currentChallenge.title}</h3>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-2">
                <p className="font-semibold text-white font-mono">Problem Description:</p>
                <p className="whitespace-pre-wrap">{currentChallenge.prompt}</p>
              </div>

              {currentChallenge.transferConcept && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-white">
                    <span>Transfer Concept</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Applying demonstrated knowledge to: {currentChallenge.transferConcept}
                  </p>
                </div>
              )}

              {/* Evaluation Rubric preview */}
              <div className="space-y-2 pt-2 border-t border-zinc-850">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Evaluation Criteria:
                </span>
                <div className="space-y-1.5">
                  {currentChallenge.evaluationRubric.map((r, i) => (
                    <div key={i} className="text-[11px] text-zinc-400 flex justify-between font-mono">
                      <span>• {r.criteria}</span>
                      <strong className="text-zinc-300">{r.maxPoints} pts</strong>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Interactive Submission Workspace */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-6 space-y-5 bg-zinc-950 border-zinc-800">
              {/* Type 1: Multiple Choice Options */}
              {currentChallenge.type === 'mcq' && currentChallenge.options && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-zinc-300 font-mono">
                    Select the Most Accurate Architectural Concept:
                  </label>
                  <div className="space-y-2.5">
                    {currentChallenge.options.map((opt) => (
                      <label
                        key={opt.id}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          selectedOptionId === opt.id
                            ? 'bg-zinc-900 border-white text-white shadow-lg'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="mcq_option"
                          checked={selectedOptionId === opt.id}
                          onChange={() => setSelectedOptionId(opt.id)}
                          className="mt-0.5 accent-white focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs leading-relaxed">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Type 2: Code Editor for Coding & Debugging */}
              {(currentChallenge.type === 'coding' || currentChallenge.type === 'debugging') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                      <Terminal className="w-3.5 h-3.5 text-white" />
                      Implementation Editor ({currentChallenge.capabilityName})
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">TypeScript / JavaScript</span>
                  </div>

                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <textarea
                      rows={14}
                      value={codeContent}
                      onChange={(e) => setCodeContent(e.target.value)}
                      placeholder="// Write clean, production-ready code..."
                      className="w-full p-4 font-mono text-xs text-white bg-transparent focus:outline-none resize-y"
                      spellCheck={false}
                    />
                  </div>

                  {currentChallenge.testCases && currentChallenge.testCases.length > 0 && (
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Sample Test Cases:
                      </span>
                      {currentChallenge.testCases.slice(0, 2).map((tc, idx) => (
                        <div key={idx} className="font-mono text-[11px] text-zinc-400 flex gap-2">
                          <span className="text-zinc-300">Input:</span> {tc.input} ➔{' '}
                          <span className="text-white font-bold">Expected:</span> {tc.expectedOutput}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Type 3: Scenario & Transfer Written Explanation */}
              {(currentChallenge.type === 'scenario' ||
                currentChallenge.type === 'architecture' ||
                currentChallenge.type === 'written_explanation' ||
                currentChallenge.type === 'transfer_challenge') && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-zinc-300 font-mono">
                    Architectural Solution & Justification:
                  </label>
                  <textarea
                    rows={12}
                    value={writtenAnswer}
                    onChange={(e) => setWrittenAnswer(e.target.value)}
                    placeholder="Provide clear technical rationale, data models, failure handling strategies, and latency/consistency trade-offs..."
                    className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white resize-y"
                  />
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">
                  Submissions are graded against standard production rubrics.
                </span>

                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={
                    (currentChallenge.type === 'mcq' && !selectedOptionId) ||
                    ((currentChallenge.type === 'coding' || currentChallenge.type === 'debugging') && !codeContent) ||
                    ((currentChallenge.type === 'scenario' || currentChallenge.type === 'transfer_challenge') && !writtenAnswer)
                  }
                >
                  Submit Challenge
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

