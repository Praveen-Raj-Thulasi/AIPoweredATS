import React from 'react';
import {
  FileText,
  GitBranch,
  Code,
  Users,
  Eye,
} from 'lucide-react';
import { CandidateCapability, EvidenceSourceType } from '@ats/shared';
import { Drawer } from '../ui/Drawer';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Button } from '../ui/Button';

interface EvidenceInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  capability: CandidateCapability | null;
}

export const EvidenceInspectorDrawer: React.FC<EvidenceInspectorDrawerProps> = ({
  isOpen,
  onClose,
  capability,
}) => {
  if (!capability) return null;

  const items = capability.evidenceItems || [];

  const getSourceIcon = (type: EvidenceSourceType) => {
    switch (type) {
      case 'resume':
        return <FileText className="w-4 h-4 text-zinc-400" />;
      case 'github_project':
      case 'project':
        return <GitBranch className="w-4 h-4 text-zinc-300" />;
      case 'coding_task':
      case 'assessment':
        return <Code className="w-4 h-4 text-zinc-300" />;
      case 'interview':
        return <Users className="w-4 h-4 text-zinc-300" />;
      default:
        return <Eye className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={capability.capabilityName}
      subtitle={`Verification State: ${capability.verificationState} • Confidence: ${capability.confidenceScore}%`}
      width="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400 space-y-2 bg-black/40 rounded-2xl border border-zinc-800/80">
            <p>No verified evidence items recorded yet for this capability.</p>
            <p className="text-[11px] text-zinc-500 font-mono">
              Only an unverified resume keyword claim exists.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    {getSourceIcon(item.sourceType)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white">{item.title}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase">
                      Source: {item.sourceType.replace(/_/g, ' ')} • Stage: {item.stageRecorded}
                    </span>
                  </div>
                </div>

                <StatusIndicator status={item.state} size="sm" />
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-850/60">
                {item.summary}
              </p>

              {item.rawContent && (
                <div className="text-[11px] text-zinc-300 font-mono bg-zinc-900/60 p-3 rounded-xl overflow-x-auto max-h-36 border border-zinc-850/60">
                  {item.rawContent}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-850/60 font-mono">
                <div className="flex items-center gap-3">
                  <span>Trust: <strong className="text-zinc-200">{(item.reliabilityWeight * 100).toFixed(0)}%</strong></span>
                  {item.sourceScore !== undefined && (
                    <span>Score: <strong className="text-zinc-200">{item.sourceScore}/100</strong></span>
                  )}
                  {item.authorName && (
                    <span>By: <strong className="text-zinc-300 font-sans">{item.authorName}</strong></span>
                  )}
                </div>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
};


