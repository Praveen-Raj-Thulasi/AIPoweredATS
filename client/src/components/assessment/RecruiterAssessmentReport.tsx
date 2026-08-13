import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
} from 'lucide-react';
import { UncertaintyMetrics, ASSESSMENT_LEVEL_LABELS } from '@ats/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

interface RecruiterAssessmentReportProps {
  candidateId: string;
  jobId: string;
  onTriggerAssessment?: () => void;
}

export const RecruiterAssessmentReport: React.FC<RecruiterAssessmentReportProps> = ({
  candidateId,
  jobId,
  onTriggerAssessment,
}) => {
  const [metrics, setMetrics] = useState<UncertaintyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUncertainty = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCandidateUncertainty(candidateId, jobId);
      setMetrics(data);
    } catch (err) {
      console.error('Error loading uncertainty metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUncertainty();
  }, [candidateId, jobId]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800">
        No assessment uncertainty data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm" className="font-mono">Information Gain Engine</Badge>
            <span className="text-xs font-bold text-zinc-300 font-mono">
              Remaining Statistical Uncertainty: <strong className="text-white">{metrics.overallUncertaintyScore}%</strong>
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">
            Competency Uncertainty & Adaptive Gap Analysis
          </h3>
        </div>

        {onTriggerAssessment && (
          <Button variant="primary" size="sm" onClick={onTriggerAssessment} className="text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Launch Adaptive Challenge Session
          </Button>
        )}
      </div>

      {/* Competencies Uncertainty Heatmap */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
          Competency Priority Matrix (Sorted by Information Value):
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.competencies.map((comp, idx) => (
            <Card key={idx} className="p-4 space-y-3 bg-zinc-950 border-zinc-800">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                    {comp.importance.toUpperCase()} IMPORTANCE
                  </span>
                  <h4 className="font-bold text-sm text-white">{comp.capabilityName}</h4>
                </div>

                <Badge
                  variant="default"
                  size="sm"
                  className="font-mono"
                >
                  {comp.uncertaintyScore}% Uncertainty
                </Badge>
              </div>

              {/* Confidence vs Uncertainty Bar */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Current Confidence: <strong className="text-white">{comp.confidenceScore}%</strong></span>
                  <span>Priority Weight: <strong className="text-white">{comp.priorityScore} pts</strong></span>
                </div>

                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden flex border border-zinc-800">
                  <div
                    className="h-full bg-white"
                    style={{ width: `${comp.confidenceScore}%` }}
                    title={`Verified Confidence: ${comp.confidenceScore}%`}
                  />
                  <div
                    className="h-full bg-zinc-600"
                    style={{ width: `${comp.uncertaintyScore}%` }}
                    title={`Remaining Uncertainty: ${comp.uncertaintyScore}%`}
                  />
                </div>
              </div>

              {/* Recommended Cognitive Level */}
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-mono">
                  <Cpu className="w-3.5 h-3.5 text-white" />
                  <span>Target Cognitive Level:</span>
                </div>
                <Badge variant="default" size="sm" className="font-mono">
                  Level {comp.recommendedLevel}: {ASSESSMENT_LEVEL_LABELS[comp.recommendedLevel]}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

