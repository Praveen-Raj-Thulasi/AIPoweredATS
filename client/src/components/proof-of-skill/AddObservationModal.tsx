import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { CandidateCapability, EvidenceSourceType } from '@ats/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  capability: CandidateCapability | null;
  onSubmitObservation: (data: {
    sourceType: EvidenceSourceType;
    title: string;
    summary: string;
    sourceScore?: number;
    state: 'supports' | 'partially_supports' | 'contradicts';
    isPrivateRecruiterNote: boolean;
  }) => void;
}

export const AddObservationModal: React.FC<AddObservationModalProps> = ({
  isOpen,
  onClose,
  capability,
  onSubmitObservation,
}) => {
  const [sourceType, setSourceType] = useState<EvidenceSourceType>('recruiter_observation');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [sourceScore, setSourceScore] = useState<number | undefined>(undefined);
  const [state, setState] = useState<'supports' | 'partially_supports' | 'contradicts'>('supports');
  const [isPrivateRecruiterNote, setIsPrivateRecruiterNote] = useState(false);

  if (!capability) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitObservation({
      sourceType,
      title: title || `Recruiter Observation on ${capability.capabilityName}`,
      summary,
      sourceScore,
      state,
      isPrivateRecruiterNote,
    });
    onClose();
    setTitle('');
    setSummary('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Verification Observation"
      subtitle={`Document panel evaluation, challenge result, or interview findings for ${capability.capabilityName}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Evidence Source Type *</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as EvidenceSourceType)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="recruiter_observation">Recruiter / Interviewer Observation</option>
              <option value="coding_task">Practical Coding Task</option>
              <option value="github_project">Verified GitHub / Open Source PR</option>
              <option value="assessment">Technical Assessment</option>
              <option value="transfer_test">Capability Transfer Test</option>
              <option value="interview">Technical Panel Interview</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Evidence State *</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="supports">Supports Proficiency (Positive signal)</option>
              <option value="partially_supports">Partially Supports (Mixed / Minor gaps)</option>
              <option value="contradicts">Contradicts Claim (Failed / Incompetency)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Evidence Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Caching Architecture Deep Dive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Score / Rating (Optional 0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="e.g. 92"
              value={sourceScore !== undefined ? sourceScore : ''}
              onChange={(e) => setSourceScore(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Detailed Observation & Evidence Description *</label>
          <textarea
            rows={4}
            required
            placeholder="Explain specifically what the candidate demonstrated or failed to demonstrate..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y transition-colors leading-relaxed"
          />
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            <Lock className="w-4 h-4 text-zinc-300" />
            <div>
              <p className="font-medium text-white">Private Recruiter Note</p>
              <p className="text-[11px] text-zinc-400">
                If enabled, candidate will not see this observation text on their portal.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isPrivateRecruiterNote}
            onChange={(e) => setIsPrivateRecruiterNote(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 accent-white cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Record Evidence Item
          </Button>
        </div>
      </form>
    </Modal>
  );
};


