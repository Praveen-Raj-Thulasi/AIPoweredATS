import React from 'react';
import {
  FileText,
  GitBranch,
  Code,
  Users,
  Eye,
  PlusCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { CandidateCapability, EvidenceSourceType } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';

interface CandidateCapabilityScorecardProps {
  capability: CandidateCapability;
  onInspectEvidence: (cap: CandidateCapability) => void;
  onAddObservation?: (cap: CandidateCapability) => void;
  onManualOverride?: (cap: CandidateCapability) => void;
  isRecruiter?: boolean;
}

export const CandidateCapabilityScorecard: React.FC<CandidateCapabilityScorecardProps> = ({
  capability,
  onInspectEvidence,
  onAddObservation,
  onManualOverride,
  isRecruiter = true,
}) => {
  const getSourceIcon = (type: EvidenceSourceType) => {
    switch (type) {
      case 'resume':
        return <FileText className="w-3.5 h-3.5" />;
      case 'github_project':
      case 'project':
        return <GitBranch className="w-3.5 h-3.5" />;
      case 'coding_task':
      case 'assessment':
        return <Code className="w-3.5 h-3.5" />;
      case 'interview':
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <Eye className="w-3.5 h-3.5" />;
    }
  };

  return (
    <Card className="flex flex-col justify-between space-y-5 hover:border-zinc-700 transition-all group">
      <div className="space-y-4">
        {/* Header: Title & Verification State */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider font-mono">
              {capability.category.replace(/_/g, ' ')}
            </span>
            <h3 className="font-semibold text-white text-base leading-snug group-hover:text-zinc-200 transition-colors">
              {capability.capabilityName}
            </h3>
          </div>
          <StatusIndicator status={capability.verificationState} />
        </div>

        {/* Confidence & Quality Metrics */}
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-medium">Corroborated Confidence</span>
            <span className="font-semibold text-sm text-white font-mono">
              {capability.confidenceScore}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-zinc-100"
              style={{ width: `${Math.max(5, capability.confidenceScore)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-850/60 font-mono">
            <span>Quality: <strong className="text-zinc-200">{capability.evidenceQualityScore}%</strong></span>
            <span>Diversity: <strong className="text-zinc-200">{capability.evidenceDiversityScore}%</strong></span>
          </div>
        </div>

        {/* Multi-Stage Breakdown */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
            Stage Evidence
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {capability.evidenceBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-black/40 border border-zinc-800/80 text-[11px] flex items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-1.5 truncate text-zinc-300">
                  {getSourceIcon(item.sourceType)}
                  <span className="truncate">{item.label}</span>
                </div>
                <span className="font-semibold text-[10px] font-mono">
                  {item.status === 'verified'
                    ? '✓'
                    : item.status === 'partial'
                    ? '⚠'
                    : item.status === 'contradicted'
                    ? '✕'
                    : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Recommendation */}
        {capability.recommendedAction && (
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
            <span className="text-zinc-400 font-mono text-[10px] uppercase block mb-0.5">Recommendation</span>
            {capability.recommendedAction}
          </div>
        )}

        {/* Manual Override Indicator */}
        {capability.isManualOverride && isRecruiter && (
          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 text-xs text-zinc-300 space-y-0.5">
            <span className="font-semibold text-white font-mono text-[10px] uppercase">Recruiter Override</span>
            <p className="italic text-zinc-400">"{capability.overrideReason}"</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onInspectEvidence(capability)}
          className="text-xs flex items-center gap-1.5 flex-1 justify-center"
        >
          <Eye className="w-3.5 h-3.5" />
          Inspect Evidence ({capability.evidenceCount})
        </Button>

        {isRecruiter && (
          <div className="flex items-center gap-1.5">
            {onAddObservation && (
              <button
                onClick={() => onAddObservation(capability)}
                title="Add Observation"
                className="p-2 rounded-lg bg-black/40 hover:bg-zinc-850 text-zinc-300 hover:text-white transition-colors border border-zinc-800"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            )}

            {onManualOverride && (
              <button
                onClick={() => onManualOverride(capability)}
                title="Manual Override"
                className="p-2 rounded-lg bg-black/40 hover:bg-zinc-850 text-zinc-300 hover:text-white transition-colors border border-zinc-800"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};


