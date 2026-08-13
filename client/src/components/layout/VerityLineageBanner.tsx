import React, { useState } from 'react';
import {
  Briefcase,
  Layers,
  FileText,
  CheckCircle2,
  Cpu,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface LineageStep {
  id: string;
  number: number;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  targetTab?: NavTab;
}

const LINEAGE_STEPS: LineageStep[] = [
  {
    id: 'job',
    number: 1,
    label: 'Requisition',
    shortDesc: 'Requirements & skills',
    icon: Briefcase,
    targetTab: 'jobs',
  },
  {
    id: 'capability_model',
    number: 2,
    label: 'Capability Model',
    shortDesc: 'Bloom taxonomy L1-L6',
    icon: Layers,
    targetTab: 'jobs',
  },
  {
    id: 'candidate_claims',
    number: 3,
    label: 'Candidate Claims',
    shortDesc: 'Extracted resume claims',
    icon: FileText,
    targetTab: 'candidates',
  },
  {
    id: 'evidence',
    number: 4,
    label: 'Evidence Stream',
    shortDesc: 'Multi-source validation',
    icon: CheckCircle2,
    targetTab: 'pipeline',
  },
  {
    id: 'adaptive_evaluation',
    number: 5,
    label: 'Adaptive Evaluation',
    shortDesc: 'Uncertainty reduction tests',
    icon: Cpu,
    targetTab: 'interviews',
  },
  {
    id: 'confidence',
    number: 6,
    label: 'Confidence Matrix',
    shortDesc: 'Corroboration scores',
    icon: TrendingUp,
    targetTab: 'workspace',
  },
  {
    id: 'decision_readiness',
    number: 7,
    label: 'Decision Readiness',
    shortDesc: 'Readiness criteria audit',
    icon: ShieldCheck,
    targetTab: 'workspace',
  },
  {
    id: 'human_decision',
    number: 8,
    label: 'Human Decision',
    shortDesc: 'Audited recruiter action',
    icon: UserCheck,
    targetTab: 'workspace',
  },
];

interface VerityLineageBannerProps {
  currentTab?: NavTab;
  onNavigate?: (tab: NavTab) => void;
}

export const VerityLineageBanner: React.FC<VerityLineageBannerProps> = ({
  currentTab,
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActiveStepIndex = () => {
    switch (currentTab) {
      case 'jobs':
      case 'capabilities':
        return 0;
      case 'candidates':
        return 2;
      case 'pipeline':
        return 3;
      case 'interviews':
        return 4;
      case 'fingerprint':
        return 5;
      case 'workspace':
      case 'decision_workspace':
        return 6;
      default:
        return -1;
    }
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0c0c0e]/80 p-4 shadow-sm">
      {/* Banner Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono tracking-tight">
            VERITY Evidence Lineage Pipeline
          </span>
          <span className="text-xs text-zinc-400 hidden md:inline">
            — Continuous proof-of-ability traceability from requisition to human decision
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-lg hover:bg-zinc-850/60 transition-colors"
        >
          <span>{isExpanded ? 'Hide Steps' : 'Inspect Lineage'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Progressive Disclosure: Horizontal Stepper */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 animate-fade-in">
          {LINEAGE_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = activeIndex === idx;
            const isPassed = activeIndex > idx;

            return (
              <div
                key={step.id}
                onClick={() => step.targetTab && onNavigate && onNavigate(step.targetTab)}
                className={`relative flex flex-col p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-zinc-100 text-black border-white shadow-sm'
                    : isPassed
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    : 'bg-[#09090b]/60 border-zinc-850/80 text-zinc-400 hover:border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-semibold ${
                      isActive
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <StepIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-mono font-medium ${isActive ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    0{step.number}
                  </span>
                </div>

                <h4 className={`text-xs font-semibold tracking-tight truncate ${
                  isActive ? 'text-black' : 'text-zinc-200'
                }`}>
                  {step.label}
                </h4>
                <p className={`text-[10px] line-clamp-1 mt-0.5 leading-tight ${
                  isActive ? 'text-zinc-700' : 'text-zinc-400'
                }`}>
                  {step.shortDesc}
                </p>

                {idx < LINEAGE_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-zinc-700">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


