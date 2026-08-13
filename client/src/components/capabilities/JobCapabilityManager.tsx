import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  GitFork,
  Plus,
  ArrowLeft,
  Layers,
  Cpu,
  History,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Job, JobCapabilityModel, Capability } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { EmptyState } from '../ui/EmptyState';
import { CapabilityCard } from './CapabilityCard';
import { CapabilityGraphView } from './CapabilityGraphView';
import { EditCapabilityModal } from './EditCapabilityModal';
import { AddCapabilityModal } from './AddCapabilityModal';
import { api } from '../../services/api';

interface JobCapabilityManagerProps {
  job: Job;
  onBack: () => void;
}

export const JobCapabilityManager: React.FC<JobCapabilityManagerProps> = ({ job, onBack }) => {
  const [model, setModel] = useState<JobCapabilityModel | null>(null);
  const [activeView, setActiveView] = useState<'cards' | 'graph' | 'audit'>('cards');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [editingCapability, setEditingCapability] = useState<Capability | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadCapabilityModel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getJobCapabilities(job.id);
      setModel(data);
    } catch (err: any) {
      // Model not compiled yet
      setModel(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCapabilityModel();
  }, [job.id]);

  const handleCompile = async () => {
    setIsCompiling(true);
    setError(null);
    try {
      const compiled = await api.compileJobCapabilities(job.id);
      setModel(compiled);
    } catch (err: any) {
      setError(err.message || 'Failed to compile capability model with AI');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleApprove = async () => {
    if (!model) return;
    try {
      const approved = await api.approveJobCapabilities(job.id);
      setModel(approved);
    } catch (err: any) {
      setError(err.message || 'Failed to approve capability model');
    }
  };

  const handleSaveEditedCapability = async (updatedCap: Capability) => {
    if (!model) return;
    const newCapabilities = model.capabilities.map((c) => (c.id === updatedCap.id ? updatedCap : c));
    try {
      const updated = await api.updateJobCapabilities(
        job.id,
        newCapabilities,
        model.relationships,
        `Recruiter updated capability: ${updatedCap.name}`
      );
      setModel(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update capability');
    }
  };

  const handleAddCapability = async (newCap: Capability) => {
    if (!model) return;
    const newCapabilities = [...model.capabilities, newCap];
    try {
      const updated = await api.updateJobCapabilities(
        job.id,
        newCapabilities,
        model.relationships,
        `Recruiter added custom capability: ${newCap.name}`
      );
      setModel(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to add capability');
    }
  };

  const handleDeleteCapability = async (capId: string) => {
    if (!model) return;
    const target = model.capabilities.find((c) => c.id === capId);
    const newCapabilities = model.capabilities.filter((c) => c.id !== capId);
    try {
      const updated = await api.updateJobCapabilities(
        job.id,
        newCapabilities,
        model.relationships,
        `Recruiter removed capability: ${target?.name || capId}`
      );
      setModel(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to delete capability');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">Proof-of-Ability Engine</Badge>
              {model && (
                <Badge
                  variant="default"
                  size="sm"
                >
                  {model.status.toUpperCase()} • v{model.version}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Capability Model: {job.title}
            </h2>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompile}
            isLoading={isCompiling}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {model ? 'Re-compile with AI' : 'Compile with AI'}
          </Button>

          {model && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Capability
              </Button>

              {model.status !== 'approved' && (
                <Button variant="primary" size="sm" onClick={handleApprove} className="text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Approve for Screening
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          <span>{error}</span>
        </div>
      )}

      {/* Model State Display */}
      {isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="card" className="h-20" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonLoader variant="card" count={6} />
          </div>
        </div>
      ) : !model ? (
        /* Empty / Not Compiled State */
        <EmptyState
          icon={Cpu}
          title="No Capability Model Compiled Yet"
          description="Transform this job requisition into a multi-dimensional capability graph with Bloom taxonomy levels, dependency edges, and verification requirements."
          actionLabel="Compile Job with AI (Bedrock)"
          onAction={handleCompile}
          className="my-8"
        />
      ) : (
        /* Compiled Model View */
        <div className="space-y-6">
          {/* Metadata Banner */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-zinc-400">
              <span>
                <strong className="text-white">{model.capabilities.length}</strong> Capabilities
              </span>
              <span>•</span>
              <span>
                <strong className="text-white">{model.relationships.length}</strong> Graph Edges
              </span>
              <span>•</span>
              <span>
                Engine: <strong className="text-white">{model.aiProviderUsed}</strong>
              </span>
            </div>

            {/* View Switcher */}
            <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 self-start sm:self-auto">
              <button
                onClick={() => setActiveView('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'cards' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Capabilities ({model.capabilities.length})
              </button>
              <button
                onClick={() => setActiveView('graph')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'graph' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                Graph & Dependencies ({model.relationships.length})
              </button>
              <button
                onClick={() => setActiveView('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'audit' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Audit Trail ({model.modifications.length})
              </button>
            </div>
          </div>

          {/* Cards View */}
          {activeView === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {model.capabilities.map((cap) => (
                <CapabilityCard
                  key={cap.id}
                  capability={cap}
                  onEdit={setEditingCapability}
                  onDelete={handleDeleteCapability}
                />
              ))}
            </div>
          )}

          {/* Graph View */}
          {activeView === 'graph' && (
            <CapabilityGraphView
              capabilities={model.capabilities}
              relationships={model.relationships}
            />
          )}

          {/* Audit Trail View */}
          {activeView === 'audit' && (
            <Card className="p-5 space-y-4 bg-zinc-950 border-zinc-800">
              <h3 className="font-bold text-sm text-white">Capability Model Evolution & Modification Audit Log</h3>
              <div className="space-y-3">
                {model.modifications.map((mod, idx) => (
                  <div
                    key={mod.id || idx}
                    className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white">{mod.details}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        Actor: {mod.modifiedBy} • {new Date(mod.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="default" size="sm">
                      {mod.action.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Edit Capability Modal */}
      <EditCapabilityModal
        isOpen={!!editingCapability}
        onClose={() => setEditingCapability(null)}
        capability={editingCapability}
        onSave={handleSaveEditedCapability}
      />

      {/* Add Capability Modal */}
      <AddCapabilityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCapability}
      />
    </div>
  );
};

