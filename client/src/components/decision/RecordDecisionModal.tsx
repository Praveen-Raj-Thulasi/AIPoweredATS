import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  HelpCircle,
  Award,
  Send,
} from 'lucide-react';
import {
  RecruiterDecisionAction,
  DecisionReadinessEvaluation,
} from '@ats/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { api } from '../../services/api';

interface RecordDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  jobId: string;
  evaluation: DecisionReadinessEvaluation;
  onSuccess: () => void;
}

export const RecordDecisionModal: React.FC<RecordDecisionModalProps> = ({
  isOpen,
  onClose,
  candidateId,
  jobId,
  evaluation,
  onSuccess,
}) => {
  const [action, setAction] = useState<RecruiterDecisionAction>('advance');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await api.recordCandidateDecision(candidateId, {
        jobId,
        action,
        reason: reason.trim(),
        aiAdvisoryState: evaluation.readinessState,
        evidenceStateSnapshot: {
          overallVerificationRate: evaluation.readinessScore,
          verifiedCount: evaluation.verifiedCount,
          readinessScore: evaluation.readinessScore,
        },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to record decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionOptions: { id: RecruiterDecisionAction; label: string; icon: any }[] = [
    { id: 'make_offer', label: 'Make Job Offer', icon: Award },
    { id: 'advance', label: 'Advance Stage', icon: UserCheck },
    { id: 'move_to_interview', label: 'Schedule Interview', icon: UserCheck },
    { id: 'request_more_evidence', label: 'Request Verification Task', icon: HelpCircle },
    { id: 'reject', label: 'Reject Application', icon: UserX },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Audited Hiring Decision"
      subtitle="AI recommendation is strictly advisory. All human recruiter decisions require documented justification."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Advisory Snapshot */}
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase font-mono mb-0.5">
              Decision Readiness Evaluation
            </span>
            <strong className="text-white font-medium capitalize">
              {evaluation.readinessState.replace(/_/g, ' ')}
            </strong>
          </div>
          <StatusIndicator status={evaluation.readinessState} label={`${evaluation.readinessScore}% Score`} />
        </div>

        {/* Action Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Select Action *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {actionOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAction(opt.id)}
                  className={`p-3.5 rounded-xl border text-left text-xs flex items-center gap-3 transition-all ${
                    action === opt.id
                      ? 'bg-zinc-100 text-black border-white shadow-sm font-semibold'
                      : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mandatory Justification */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Deliberation Justification & Notes *
            </label>
            <span className="text-[10px] text-zinc-400 font-mono">Immutable audit trail</span>
          </div>
          <textarea
            rows={4}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Document your rationale for this decision..."
            className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={!reason.trim()}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Submit Decision
          </Button>
        </div>
      </form>
    </Modal>
  );
};


