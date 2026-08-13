import React, { useState } from 'react';
import {
  FileCode,
  FolderGit2,
  Cpu,
  FileText,
  HelpCircle,
  Clock,
  AlertCircle,
  Send,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

interface RequestEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName?: string;
  jobId: string;
  defaultCapabilityName?: string;
  availableCapabilities?: string[];
  onSuccess?: () => void;
}

export const RequestEvidenceModal: React.FC<RequestEvidenceModalProps> = ({
  isOpen,
  onClose,
  candidateId,
  candidateName = 'Candidate',
  jobId,
  defaultCapabilityName = '',
  availableCapabilities = [],
  onSuccess,
}) => {
  const [capabilityName, setCapabilityName] = useState(defaultCapabilityName || availableCapabilities[0] || '');
  const [requestType, setRequestType] = useState<
    'coding_challenge' | 'take_home_project' | 'transfer_test' | 'written_explanation' | 'custom_probe'
  >('transfer_test');
  const [instructions, setInstructions] = useState(
    'Please provide specific implementation examples or complete the attached transfer challenge demonstrating conceptual mastery and error-handling resilience.'
  );
  const [dueInDays, setDueInDays] = useState(5);
  const [urgency, setUrgency] = useState<'normal' | 'high'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestTypeOptions = [
    {
      id: 'transfer_test',
      label: 'Concept Transfer Test',
      icon: Cpu,
      desc: 'Verify conceptual adaptability and cross-paradigm knowledge transfer.',
    },
    {
      id: 'coding_challenge',
      label: 'Coding Challenge',
      icon: FileCode,
      desc: 'Sandbox coding task with automated unit tests & performance fixtures.',
    },
    {
      id: 'take_home_project',
      label: 'Take-Home Project',
      icon: FolderGit2,
      desc: 'Scoped real-world repository task or architecture design specification.',
    },
    {
      id: 'written_explanation',
      label: 'Written Explanation',
      icon: FileText,
      desc: 'Deep technical reasoning on architectural tradeoffs and failure modes.',
    },
    {
      id: 'custom_probe',
      label: 'Custom Probe',
      icon: HelpCircle,
      desc: 'Targeted technical inquiry formulated by the recruiter or panel.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capabilityName.trim()) {
      setError('Please select or specify a target capability');
      return;
    }
    if (!instructions.trim()) {
      setError('Please provide instructions for the candidate');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.requestCandidateEvidence(candidateId, {
        jobId,
        capabilityName: capabilityName.trim(),
        requestType,
        instructions: instructions.trim(),
        dueInDays,
        urgency,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit evidence request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Targeted Evidence"
      subtitle={`Issue targeted verification request to ${candidateName}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Target Capability */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Target Capability to Verify *
          </label>
          {availableCapabilities.length > 0 ? (
            <select
              value={capabilityName}
              onChange={(e) => setCapabilityName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              {availableCapabilities.map((cap) => (
                <option key={cap} value={cap}>
                  {cap}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={capabilityName}
              onChange={(e) => setCapabilityName(e.target.value)}
              placeholder="e.g. Distributed Systems & API Design"
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          )}
        </div>

        {/* Request Type Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300">
            Verification Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requestTypeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = requestType === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setRequestType(opt.id as any)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-100 text-black border-white shadow-sm font-semibold'
                      : 'bg-black/40 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold">
                      {opt.label}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-zinc-700' : 'text-zinc-400'}`}>{opt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Verification Instructions & Scope *
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 leading-relaxed resize-none transition-colors"
            placeholder="Specify challenge prompt, expected deliverables, or targeted concepts..."
          />
        </div>

        {/* Timing & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Due In (Days)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={dueInDays}
                onChange={(e) => setDueInDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Priority Urgency
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="normal">Normal (Standard SLA)</option>
              <option value="high">High Priority (Next-Stage Gate)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
          <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Dispatch Request
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


