import React, { useState, useEffect } from 'react';
import {
  Clock,
  Info,
} from 'lucide-react';
import {
  CapabilityFingerprint,
  CapabilityGrowthMetric,
} from '@ats/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';

interface CapabilityFingerprintViewProps {
  candidateId: string;
  jobId?: string;
}

export const CapabilityFingerprintView: React.FC<CapabilityFingerprintViewProps> = ({
  candidateId,
  jobId,
}) => {
  const [fingerprint, setFingerprint] = useState<CapabilityFingerprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<CapabilityGrowthMetric | null>(null);

  const loadFingerprint = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCandidateFingerprint(candidateId, jobId);
      setFingerprint(data);
    } catch (err) {
      console.error('Error loading fingerprint:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFingerprint();
  }, [candidateId, jobId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
      </div>
    );
  }

  if (!fingerprint) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800">
        No Capability Fingerprint generated yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm" className="font-mono">Multidimensional Fingerprint</Badge>
            <span className="text-xs font-bold text-zinc-400 font-mono">
              Evaluated on {new Date(fingerprint.evaluatedAt).toLocaleDateString()}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Capability Fingerprint & Growth Potential: {fingerprint.candidateName}
          </h2>
        </div>

        <div className="flex items-center gap-4 font-mono">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">AI Growth Potential</span>
            <p className="text-xl font-bold text-white">
              {fingerprint.overallGrowthPotential}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Learning Velocity</span>
            <p className="text-xl font-bold text-white">
              {fingerprint.learningVelocityScore}%
            </p>
          </div>
        </div>
      </div>

      {/* 8-Dimension Visualizer Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">8 Core Competency Dimensions</h3>
          <span className="text-[11px] text-zinc-400 font-mono">Synthesized from multi-stage execution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {fingerprint.dimensions.map((dim) => (
            <Card key={dim.dimension} className="p-4 space-y-2.5 bg-zinc-950 border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-200">{dim.label}</span>
                <span className="font-bold text-sm text-white font-mono">{dim.score}%</span>
              </div>

              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${dim.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-850 font-mono">
                <span>Confidence: <strong className="text-zinc-300">{dim.confidence}%</strong></span>
                <span>{dim.evidenceCount} Evidence Items</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Individual Capability Growth Matrix */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Capability Growth & Freshness Matrix</h3>
          <span className="text-[11px] text-zinc-400 font-mono">Current Capability vs AI-Estimated Growth</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fingerprint.capabilities.map((cap, idx) => (
            <Card
              key={idx}
              className="p-5 flex flex-col justify-between space-y-4 hover:border-zinc-500 transition-all bg-zinc-950 border-zinc-800"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                      {cap.category.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-white text-base leading-tight">
                      {cap.capabilityName}
                    </h4>
                  </div>
                  <Badge
                    variant="default"
                    size="sm"
                    className="font-mono"
                  >
                    {cap.evidenceState.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                {/* Metrics Bars */}
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Current Capability (Observed):</span>
                    <strong className="text-white">{cap.currentCapability}%</strong>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-300"
                      style={{ width: `${cap.currentCapability}%` }}
                    />
                  </div>

                  <div className="flex justify-between pt-1 border-t border-zinc-850">
                    <span className="text-zinc-400">AI Growth Potential:</span>
                    <strong className="text-white">{cap.growthPotential}%</strong>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${cap.growthPotential}%` }}
                    />
                  </div>
                </div>

                {/* Freshness Status */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    Freshness:{' '}
                    <strong className="text-zinc-300">
                      {cap.freshnessStatus.replace(/_/g, ' ')}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Explainability Trigger Button */}
              <div className="pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedMetric(cap)}
                  className="text-xs text-white hover:text-zinc-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  Why this value? (Traces)
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Explainability Modal */}
      {selectedMetric && (
        <Modal
          isOpen={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          title={`Explainability Traces: ${selectedMetric.capabilityName}`}
          subtitle={`Current Capability: ${selectedMetric.currentCapability}% • AI Growth Potential: ${selectedMetric.growthPotential}%`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <span className="font-bold text-white font-mono">AI-Estimated Growth Potential Basis:</span>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-300 text-[11px]">
                {selectedMetric.growthEvidence.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Event Trace Records:
              </span>
              {selectedMetric.traces.length === 0 ? (
                <p className="text-xs text-zinc-500 italic p-4 bg-zinc-950 rounded-xl border border-zinc-800 font-mono">
                  No iterative attempts or transfer challenges logged yet. Score derived from initial baseline evidence.
                </p>
              ) : (
                selectedMetric.traces.map((trace, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{trace.eventTitle}</span>
                      <Badge variant="default" size="sm" className="font-mono">+{trace.scoreImpact}% Growth Factor</Badge>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">{trace.rationale}</p>
                    <span className="text-[10px] text-zinc-500 block pt-1 font-mono">
                      Logged on {new Date(trace.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setSelectedMetric(null)}>
                Close Traces
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

