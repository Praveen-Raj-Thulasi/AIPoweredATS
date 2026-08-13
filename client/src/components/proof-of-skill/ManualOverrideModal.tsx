import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CandidateCapability, VerificationState } from '@ats/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ManualOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  capability: CandidateCapability | null;
  onConfirmOverride: (verificationState: VerificationState, reason: string) => void;
}

export const ManualOverrideModal: React.FC<ManualOverrideModalProps> = ({
  isOpen,
  onClose,
  capability,
  onConfirmOverride,
}) => {
  const [targetState, setTargetState] = useState<VerificationState>('VERIFIED');
  const [reason, setReason] = useState('');

  if (!capability) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmOverride(targetState, reason);
    onClose();
    setReason('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Verification Override"
      subtitle={`Override algorithmic evidence state for ${capability.capabilityName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-zinc-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span className="leading-relaxed">
            Every manual override is permanently logged to the system audit trail with your recruiter credentials and timestamp.
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Target Verification State *</label>
          <select
            value={targetState}
            onChange={(e) => setTargetState(e.target.value as VerificationState)}
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="VERIFIED">VERIFIED (Full Proof Substantiated)</option>
            <option value="PARTIALLY_VERIFIED">PARTIALLY VERIFIED (Partial Substantiation)</option>
            <option value="INSUFFICIENT_EVIDENCE">INSUFFICIENT EVIDENCE (Pending Proof)</option>
            <option value="CONTRADICTED">CONTRADICTED (Failed Proof / Misrepresentation)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Mandatory Override Justification *</label>
          <textarea
            rows={4}
            required
            placeholder="Explain why you are overriding the calculated evidence status (e.g. verified live system demo, external open-source PRs, panel consensus)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y transition-colors leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Apply & Audit Override
          </Button>
        </div>
      </form>
    </Modal>
  );
};


