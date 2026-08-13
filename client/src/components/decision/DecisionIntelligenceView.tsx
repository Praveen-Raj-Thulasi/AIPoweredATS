import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Compass,
  Award,
} from 'lucide-react';
import {
  DecisionReadinessEvaluation,
  HumanDecisionRecord,
} from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { SectionHeader } from '../ui/PageHeader';
import { RecordDecisionModal } from './RecordDecisionModal';
import { api } from '../../services/api';

interface DecisionIntelligenceViewProps {
  candidateId: string;
  jobId: string;
  onRefreshParent?: () => void;
}

export const DecisionIntelligenceView: React.FC<DecisionIntelligenceViewProps> = ({
  candidateId,
  jobId,
  onRefreshParent,
}) => {
  const [evaluation, setEvaluation] = useState<DecisionReadinessEvaluation | null>(null);
  const [history, setHistory] = useState<HumanDecisionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [evalData, histData] = await Promise.all([
        api.getDecisionReadiness(candidateId, jobId),
        api.getCandidateDecisionHistory(candidateId),
      ]);
      setEvaluation(evalData);
      setHistory(histData);
    } catch (err) {
      console.error('Error loading decision intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [candidateId, jobId]);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400">
        Job requisition capability model not compiled.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner: Decision Readiness Gauge */}
      <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-3">
            <StatusIndicator status={evaluation.readinessState} />
            <span className="text-xs text-zinc-400 font-mono">
              Score: {evaluation.readinessScore}%
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {evaluation.explanation}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDecisionModalOpen(true)}
          >
            <Award className="w-4 h-4 mr-1.5" />
            Record Decision
          </Button>
        </div>
      </div>

      {/* Next-Best Actions Section */}
      {evaluation.nextBestActions && evaluation.nextBestActions.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            title="Recommended Next Actions"
            description="High information-gain steps to reduce uncertainty."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {evaluation.nextBestActions.map((action) => (
              <Card key={action.id} className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      {action.actionType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">
                      +{action.estimatedInformationGain}% Info Gain
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-white leading-snug">{action.title}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{action.rationale}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
                  <Button variant="outline" size="sm" className="w-full justify-center">
                    Target {action.targetCapability}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Stage Consistency Matrix */}
      <div className="space-y-4">
        <SectionHeader
          title="Cross-Stage Evidence Consistency"
          description="Corroboration alignment across resume, project sandbox, and interview stages."
          badge={
            <span className="text-xs text-zinc-400 font-mono">
              {evaluation.verifiedCount} Verified • {evaluation.unsupportedCount} Partial
            </span>
          }
        />

        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#0c0c0e]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/40 border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Capability</th>
                  <th className="py-3.5 px-4">Consistency State</th>
                  <th className="py-3.5 px-4">Corroborated Stages</th>
                  <th className="py-3.5 px-5">Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60">
                {evaluation.consistencyItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-semibold text-white text-xs">{item.capabilityName}</p>
                      <span className="text-[11px] text-zinc-400 capitalize">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusIndicator status={item.consistencyStatus} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full ${item.sourcesBreakdown.resume ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 bg-zinc-900/40'}`}>Resume</span>
                        <span className={`px-2 py-0.5 rounded-full ${item.sourcesBreakdown.projects ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 bg-zinc-900/40'}`}>Project</span>
                        <span className={`px-2 py-0.5 rounded-full ${item.sourcesBreakdown.assessments ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 bg-zinc-900/40'}`}>Assess</span>
                        <span className={`px-2 py-0.5 rounded-full ${item.sourcesBreakdown.interviews ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 bg-zinc-900/40'}`}>Interview</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-zinc-300 max-w-sm leading-relaxed text-xs">
                      {item.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Decision Audit History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            title="Decision Audit Log"
            description="Documented human deliberations."
          />

          <div className="space-y-3">
            {history.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-[#0c0c0e] border border-zinc-800/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white font-mono">
                      {rec.action.toUpperCase()}
                    </span>
                    <span className="text-zinc-400">by {rec.recruiterEmail}</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {new Date(rec.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-zinc-300 italic">"{rec.reason}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Decision Modal */}
      {isDecisionModalOpen && (
        <RecordDecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          candidateId={candidateId}
          jobId={jobId}
          evaluation={evaluation}
          onSuccess={() => {
            loadData();
            if (onRefreshParent) onRefreshParent();
          }}
        />
      )}
    </div>
  );
};


