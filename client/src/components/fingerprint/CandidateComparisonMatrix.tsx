import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { CandidateComparisonReport, DecisionReadiness } from '@ats/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

interface CandidateComparisonMatrixProps {
  jobId: string;
  candidateIds: string[];
  onBack: () => void;
}

export const CandidateComparisonMatrix: React.FC<CandidateComparisonMatrixProps> = ({
  jobId,
  candidateIds,
  onBack,
}) => {
  const [report, setReport] = useState<CandidateComparisonReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const data = await api.compareCandidatesForJob(jobId, candidateIds);
      setReport(data);
    } catch (err) {
      console.error('Error loading comparison report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (candidateIds.length > 0) {
      loadComparison();
    }
  }, [jobId, candidateIds]);

  const getDecisionReadinessBadge = (readiness: DecisionReadiness) => {
    switch (readiness) {
      case 'ready_for_offer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white border border-zinc-700 text-xs font-bold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready for Offer
          </span>
        );
      case 'needs_targeted_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-750 text-xs font-bold font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            Needs Verification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 text-xs font-bold font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            Insufficient Evidence
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
      </div>
    );
  }

  if (!report || report.candidates.length === 0) {
    return (
      <Card className="p-12 text-center text-xs text-zinc-500 space-y-3 bg-zinc-950 border-zinc-800">
        <p>No candidates available to compare.</p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Return to Pipeline
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm" className="font-mono">Structured Talent Analytics</Badge>
            <span className="text-xs text-zinc-400 font-mono">Side-by-Side Comparative Matrix</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Candidate Comparison: {report.jobTitle}
          </h2>
        </div>

        <Button variant="secondary" size="sm" onClick={onBack} className="text-xs">
          Back to Pipeline
        </Button>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {report.candidates.map((cand) => (
          <Card key={cand.candidateId} className="p-6 space-y-5 flex flex-col justify-between border-zinc-800 bg-zinc-950">
            <div className="space-y-4">
              {/* Header: Name & Readiness */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-white">{cand.candidateName}</h3>
                  <p className="text-xs text-zinc-400 font-mono">ID: {cand.candidateId}</p>
                </div>
                <div>{getDecisionReadinessBadge(cand.decisionReadiness)}</div>
              </div>

              {/* Core Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Match</span>
                  <strong className="text-sm text-white">{cand.overallMatchScore}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Confidence</span>
                  <strong className="text-sm text-white">{cand.averageConfidence}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Growth</span>
                  <strong className="text-sm text-white">{cand.overallGrowthPotential}%</strong>
                </div>
              </div>

              {/* Dimension Scores Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Dimension Mastery:
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">Technical Execution:</span>
                    <strong className="text-zinc-200">{cand.dimensionScores.technical_capability || 70}%</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">Problem Solving:</span>
                    <strong className="text-zinc-200">{cand.dimensionScores.problem_solving || 70}%</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">System Design:</span>
                    <strong className="text-zinc-200">{cand.dimensionScores.system_design || 70}%</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">Adaptability & Transfer:</span>
                    <strong className="text-zinc-200">{cand.dimensionScores.transferability || 75}%</strong>
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="space-y-3 pt-2 border-t border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-1 font-mono">
                    Key Strengths:
                  </span>
                  <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px]">
                    {cand.keyStrengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1 font-mono">
                    Critical Verification Gaps:
                  </span>
                  <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-[11px]">
                    {cand.criticalGaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

