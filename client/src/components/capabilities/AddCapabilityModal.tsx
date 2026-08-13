import React, { useState } from 'react';
import { Capability, CapabilityCategory, CapabilityImportance, ProficiencyLevel, EvaluationMethod } from '@ats/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AddCapabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newCap: Capability) => void;
}

const EVAL_METHODS: { id: EvaluationMethod; label: string }[] = [
  { id: 'coding_challenge', label: 'Coding Challenge' },
  { id: 'technical_qa', label: 'Technical Q&A' },
  { id: 'debugging_scenario', label: 'Debugging Scenario' },
  { id: 'system_design', label: 'System Design' },
  { id: 'transfer_test', label: 'Transfer Test' },
  { id: 'code_review', label: 'Code Review' },
  { id: 'behavioral_interview', label: 'Behavioral Interview' },
];

export const AddCapabilityModal: React.FC<AddCapabilityModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CapabilityCategory>('languages_frameworks');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<CapabilityImportance>('high');
  const [expectedProficiency, setExpectedProficiency] = useState<ProficiencyLevel>('advanced');
  const [evaluationMethods, setEvaluationMethods] = useState<EvaluationMethod[]>(['technical_qa', 'coding_challenge']);
  const [transferableConcepts, setTransferableConcepts] = useState('');
  const [freshnessRequirements, setFreshnessRequirements] = useState('Active within past 18 months');

  const toggleEvalMethod = (m: EvaluationMethod) => {
    if (evaluationMethods.includes(m)) {
      setEvaluationMethods(evaluationMethods.filter((x) => x !== m));
    } else {
      setEvaluationMethods([...evaluationMethods, m]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: `cap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      category,
      description,
      importance,
      expectedProficiency,
      evaluationMethods,
      dependencies: [],
      transferableConcepts: transferableConcepts
        ? transferableConcepts.split(',').map((s) => s.trim())
        : [],
      evidenceRequirements: ['Demonstrated production implementation experience'],
      freshnessRequirements,
      confidenceScore: 1.0,
    });
    onClose();
    // Reset form
    setName('');
    setDescription('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Custom Capability Requirement"
      subtitle="Define a new competency, evaluation criteria, and proficiency benchmark"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Capability Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. GraphQL Federation Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CapabilityCategory)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white transition-colors"
            >
              <option value="languages_frameworks">Languages & Frameworks</option>
              <option value="systems_architecture">Systems & Architecture</option>
              <option value="data_storage">Data Storage & Databases</option>
              <option value="cloud_devops">Cloud & DevOps</option>
              <option value="testing_quality">Testing & QA</option>
              <option value="domain_knowledge">Domain Knowledge / AI</option>
              <option value="soft_skills">Soft Skills & Leadership</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Importance *</label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as CapabilityImportance)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white transition-colors"
            >
              <option value="critical">Critical (Must-have dealbreaker)</option>
              <option value="high">High (Strong preference)</option>
              <option value="medium">Medium (Valuable asset)</option>
              <option value="low">Low (Bonus)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Expected Proficiency Level *</label>
            <select
              value={expectedProficiency}
              onChange={(e) => setExpectedProficiency(e.target.value as ProficiencyLevel)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white transition-colors"
            >
              <option value="foundational">Foundational</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Description & Competency Expectation *</label>
          <textarea
            rows={3}
            required
            placeholder="Describe what true capability looks like for this role..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white resize-y transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Verification & Assessment Methods</label>
          <div className="flex flex-wrap gap-2">
            {EVAL_METHODS.map((m) => {
              const selected = evaluationMethods.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => toggleEvalMethod(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selected
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Transferable Concepts (Comma-separated)</label>
            <input
              type="text"
              value={transferableConcepts}
              onChange={(e) => setTransferableConcepts(e.target.value)}
              placeholder="e.g. gRPC, REST Architecture, Protocol Buffers"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Freshness Constraint</label>
            <input
              type="text"
              value={freshnessRequirements}
              onChange={(e) => setFreshnessRequirements(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Capability to Model
          </Button>
        </div>
      </form>
    </Modal>
  );
};

