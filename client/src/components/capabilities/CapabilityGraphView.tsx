import React from 'react';
import { ArrowRight, GitFork } from 'lucide-react';
import { Capability, CapabilityRelationship } from '@ats/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface CapabilityGraphViewProps {
  capabilities: Capability[];
  relationships: CapabilityRelationship[];
}

export const CapabilityGraphView: React.FC<CapabilityGraphViewProps> = ({
  relationships,
}) => {
  return (
    <div className="space-y-6">
      {/* Relationships Graph List */}
      <Card className="p-6 space-y-4 border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2">
          <GitFork className="w-5 h-5 text-white" />
          <h3 className="font-bold text-base text-white">Capability Graph Relationships & Dependency Edges</h3>
        </div>
        <p className="text-xs text-zinc-400">
          The competency graph models semantic prerequisites, conceptual transferability, and technology pairings rather than flat keyword matches.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {relationships.map((rel, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5 hover:border-zinc-500 transition-all shadow-sm"
            >
              {/* Edge Node mapping */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white flex-1 min-w-0 font-mono">
                  <span className="truncate bg-black px-2 py-1 rounded-lg border border-zinc-800">
                    {rel.sourceName}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate bg-black px-2 py-1 rounded-lg border border-zinc-800">
                    {rel.targetName}
                  </span>
                </div>

                <Badge variant="default" size="sm">
                  {rel.relationshipType.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Edge semantic explanation */}
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                "{rel.explanation}"
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

