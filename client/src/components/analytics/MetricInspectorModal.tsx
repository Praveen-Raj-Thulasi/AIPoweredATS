import React from 'react';
import {
  ShieldCheck,
  Database,
  Calendar,
  Filter,
  Calculator,
  FileText,
} from 'lucide-react';
import { MetricMetadata } from '@ats/shared';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MetricInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric?: MetricMetadata | null;
}

export const MetricInspectorModal: React.FC<MetricInspectorModalProps> = ({
  isOpen,
  onClose,
  metric,
}) => {
  if (!metric) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={metric.name}
      subtitle="Audited Metric Specification & Data Lineage"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Top Category Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <Badge variant="default" size="sm" className="font-mono">
            {metric.category.replace(/_/g, ' ').toUpperCase()} METRIC
          </Badge>
          <span className="flex items-center gap-1 text-[11px] text-white font-semibold font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Audit-Grade Ground Truth
          </span>
        </div>

        {/* Definition */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider font-mono">
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>Metric Definition</span>
          </div>
          <p className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 leading-relaxed font-medium">
            {metric.definition}
          </p>
        </div>

        {/* Calculation Formula */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider font-mono">
            <Calculator className="w-3.5 h-3.5 text-white" />
            <span>Calculation Formula & Logic</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px] leading-relaxed">
            {metric.calculationFormula}
          </div>
        </div>

        {/* Underlying Data Sources */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider font-mono">
            <Database className="w-3.5 h-3.5 text-white" />
            <span>Underlying Data Source</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
            {metric.source}
          </div>
        </div>

        {/* Applied Filters & Time Range */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1 text-zinc-400 font-semibold uppercase text-[10px] font-mono">
              <Calendar className="w-3 h-3 text-white" />
              <span>Time Horizon</span>
            </div>
            <p className="font-bold text-white text-xs font-mono">{metric.timeRange}</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1 text-zinc-400 font-semibold uppercase text-[10px] font-mono">
              <Filter className="w-3 h-3 text-white" />
              <span>Active Scope</span>
            </div>
            <p className="font-bold text-white text-xs">
              {metric.filtersApplied.jobId && metric.filtersApplied.jobId !== 'all'
                ? `Job: ${metric.filtersApplied.jobId}`
                : 'All Requisitions'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose} className="text-xs">
            Close Inspector
          </Button>
        </div>
      </div>
    </Modal>
  );
};

