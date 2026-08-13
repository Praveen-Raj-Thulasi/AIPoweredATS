import React from 'react';
import {
  Layers,
  Clock,
  Edit2,
  Trash2,
  Cpu,
  Database,
  Cloud,
  Code,
  Users,
} from 'lucide-react';
import { Capability } from '@ats/shared';
import { Card } from '../ui/Card';

interface CapabilityCardProps {
  capability: Capability;
  onEdit: (cap: Capability) => void;
  onDelete: (id: string) => void;
}

export const CapabilityCard: React.FC<CapabilityCardProps> = ({ capability, onEdit, onDelete }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'languages_frameworks':
        return <Code className="w-4 h-4 text-white" />;
      case 'systems_architecture':
        return <Cpu className="w-4 h-4 text-white" />;
      case 'data_storage':
        return <Database className="w-4 h-4 text-white" />;
      case 'cloud_devops':
        return <Cloud className="w-4 h-4 text-white" />;
      case 'soft_skills':
        return <Users className="w-4 h-4 text-white" />;
      default:
        return <Layers className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-white text-black border-white font-bold';
      case 'high':
        return 'bg-zinc-900 text-white border-zinc-600 font-semibold';
      case 'medium':
        return 'bg-zinc-900 text-zinc-300 border-zinc-750 font-medium';
      default:
        return 'bg-black text-zinc-400 border-zinc-800';
    }
  };

  const getProficiencyWidth = (prof: string) => {
    switch (prof) {
      case 'expert':
        return 'w-full bg-white';
      case 'advanced':
        return 'w-3/4 bg-zinc-200';
      case 'intermediate':
        return 'w-1/2 bg-zinc-400';
      default:
        return 'w-1/4 bg-zinc-600';
    }
  };

  return (
    <Card className="flex flex-col justify-between p-5 space-y-4 hover:border-zinc-500 transition-all group bg-zinc-950 border-zinc-800">
      <div className="space-y-3.5">
        {/* Header: Category & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              {getCategoryIcon(capability.category)}
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                {capability.category.replace('_', ' ')}
              </span>
              <h3 className="font-bold text-white text-base leading-tight group-hover:text-zinc-200 transition-colors">
                {capability.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(capability)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Edit Capability"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(capability.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Remove Capability"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Importance & Proficiency Row */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold font-mono">Importance</span>
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] uppercase ${getImportanceColor(
                  capability.importance
                )}`}
              >
                {capability.importance}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-semibold">
              <span className="uppercase font-mono">Proficiency</span>
              <span className="text-white capitalize">{capability.expectedProficiency}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black overflow-hidden border border-zinc-800">
              <div className={`h-full rounded-full ${getProficiencyWidth(capability.expectedProficiency)}`} />
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-300 leading-relaxed">{capability.description}</p>

        {/* Evaluation Methods */}
        {capability.evaluationMethods && capability.evaluationMethods.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Verification & Assessment Methods:
            </span>
            <div className="flex flex-wrap gap-1">
              {capability.evaluationMethods.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-750 text-[10px] font-medium text-zinc-300 capitalize"
                >
                  {m.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Transferable Concepts */}
        {capability.transferableConcepts && capability.transferableConcepts.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Transferable Skills:
            </span>
            <div className="flex flex-wrap gap-1">
              {capability.transferableConcepts.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] text-zinc-300 border border-zinc-750"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {capability.dependencies && capability.dependencies.length > 0 && (
          <div className="text-[11px] text-zinc-400 pt-1">
            <span className="font-semibold text-zinc-500">Prerequisites:</span>{' '}
            <span className="text-zinc-300">{capability.dependencies.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Freshness & Evidence footer */}
      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-zinc-400" />
          {capability.freshnessRequirements || 'Active in past 24m'}
        </span>
        {capability.confidenceScore && (
          <span className="text-white font-bold font-mono">
            AI Confidence: {Math.round(capability.confidenceScore * 100)}%
          </span>
        )}
      </div>
    </Card>
  );
};

