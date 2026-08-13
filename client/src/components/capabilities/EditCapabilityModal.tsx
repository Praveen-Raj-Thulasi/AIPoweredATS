import React, { useState, useEffect } from 'react';
import { Capability, CapabilityCategory, CapabilityImportance, ProficiencyLevel, EvaluationMethod } from '@ats/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface EditCapabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  capability: Capability | null;
  onSave: (updated: Capability) => void;
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

export const EditCapabilityModal: React.FC<EditCapabilityModalProps> = ({
  isOpen,
  onClose,
  capability,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CapabilityCategory>('languages_frameworks');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<CapabilityImportance>('high');
  const [expectedProficiency, setExpectedProficiency] = useState<ProficiencyLevel>('advanced');
  const [evaluationMethods, setEvaluationMethods] = useState<EvaluationMethod[]>([]);
  const [dependencies, setDependencies] = useState('');
  const [transferableConcepts, setTransferableConcepts] = useState('');
  const [evidenceRequirements, setEvidenceRequirements] = useState('');
  const [freshnessRequirements, setFreshnessRequirements] = useState('');

  useEffect(() => {
    if (capability) {
      setName(capability.name);
      setCategory(capability.category);
      setDescription(capability.description);
      setImportance(capability.importance);
      setExpectedProficiency(capability.expectedProficiency);
      setEvaluationMethods(capability.evaluationMethods || []);
      setDependencies(capability.dependencies?.join(', ') || '');
      setTransferableConcepts(capability.transferableConcepts?.join(', ') || '');
      setEvidenceRequirements(capability.evidenceRequirements?.join('\n') || '');
      setFreshnessRequirements(capability.freshnessRequirements || '');
    }
  }, [capability]);

  if (!capability) return null;

  const toggleEvalMethod = (m: EvaluationMethod) => {
    if (evaluationMethods.includes(m)) {
      setEvaluationMethods(evaluationMethods.filter((x) => x !== m));
    } else {
      setEvaluationMethods([...evaluationMethods, m]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...capability,
      name,
      category,
      description,
      importance,
      expectedProficiency,
      evaluationMethods,
      dependencies: dependencies ? dependencies.split(',').map((s) => s.trim()) : [],
      transferableConcepts: transferableConcepts
        ? transferableConcepts.split(',').map((s) => s.trim())
        : [],
      evidenceRequirements: evidenceRequirements
        ? evidenceRequirements.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      freshnessRequirements,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Job Capability Requirement"
      subtitle="Recruiters can modify importance, expected proficiency, and evaluation methods"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Capability Name *</label>
            <input
              type="text"
              required
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
              placeholder="e.g. C# / .NET, Kotlin, JVM Internals"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Freshness Constraint</label>
            <input
              type="text"
              value={freshnessRequirements}
              onChange={(e) => setFreshnessRequirements(e.target.value)}
              placeholder="e.g. Active usage within past 12-24 months"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Apply Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

