import React from 'react';
import {
  ShieldCheck,
  ExternalLink,
  Code,
  Calendar,
  User,
} from 'lucide-react';
import { EvidenceEvent, EvidenceItem, CandidateCapability } from '@ats/shared';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Drawer } from '../ui/Drawer';

interface EvidenceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event?: EvidenceEvent | null;
  item?: EvidenceItem | null;
  capability?: CandidateCapability | null;
}

export const EvidenceDetailDrawer: React.FC<EvidenceDetailDrawerProps> = ({
  isOpen,
  onClose,
  event,
  item,
  capability,
}) => {
  const title = event?.title || item?.title || capability?.capabilityName || 'Evidence Inspection';
  const capabilityName = event?.capabilityName || item?.capabilityName || capability?.capabilityName || '';
  const sourceType = event?.sourceType || item?.sourceType || 'recruiter_observation';
  const score = event?.score ?? item?.sourceScore ?? capability?.confidenceScore;
  const reliability = event?.reliabilityWeight ?? item?.reliabilityWeight ?? 0.85;
  const timestamp = event?.timestamp || item?.createdAt || capability?.updatedAt || new Date().toISOString();
  const actorName = event?.actorName || item?.authorName || 'System Verified';
  const actorRole = event?.actorRole || 'Evaluator';
  const description = event?.description || item?.summary || 'No description available.';
  const details = event?.details || {};

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`Target: ${capabilityName} • Source: ${sourceType.replace(/_/g, ' ')}`}
      width="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-xs">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block font-mono">
              Recorded Timestamp
            </span>
            <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{new Date(timestamp).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block font-mono">
              Trust Reliability
            </span>
            <div className="flex items-center gap-1.5 text-zinc-200 font-medium font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{Math.round(reliability * 100)}% Corroborated</span>
            </div>
          </div>
        </div>

        {/* Evaluator Info */}
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 font-semibold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">{actorName}</p>
              <span className="text-[10px] text-zinc-400 uppercase font-mono">
                Role: {actorRole}
              </span>
            </div>
          </div>

          {item?.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <span>View Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Evidence Description */}
        <div className="space-y-2">
          <span className="font-semibold text-zinc-400 uppercase text-[10px] tracking-wider block font-mono">
            Evidence Summary & Extracted Claims
          </span>
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-zinc-300 leading-relaxed font-sans text-xs">
            {description}
          </div>
        </div>

        {/* Detailed Rubrics */}
        {Object.keys(details).length > 0 && (
          <div className="space-y-2">
            <span className="font-semibold text-zinc-400 uppercase text-[10px] tracking-wider block font-mono">
              Verification Rubrics & Context
            </span>
            <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2.5">
              {Object.entries(details).map(([key, val]) => (
                <div key={key} className="flex items-start justify-between gap-4 py-1 border-b border-zinc-850/60 last:border-0 text-xs">
                  <span className="text-zinc-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <span className="font-medium text-white text-right max-w-xs break-words font-mono">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Code if present */}
        {item?.rawContent && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider font-mono">
              <Code className="w-3.5 h-3.5 text-zinc-300" />
              <span>Raw Execution Payload</span>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-zinc-800/80 text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {item.rawContent}
            </pre>
          </div>
        )}
      </div>
    </Drawer>
  );
};


