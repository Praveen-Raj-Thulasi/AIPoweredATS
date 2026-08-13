import React, { useState } from 'react';
import { Award, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { Application } from '@ats/shared';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onOfferCreated: () => void;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  isOpen,
  onClose,
  application,
  onOfferCreated,
}) => {
  const [baseSalary, setBaseSalary] = useState(175000);
  const [currency, setCurrency] = useState('USD');
  const [equity, setEquity] = useState('0.15% ISO Stock Options');
  const [bonus, setBonus] = useState('15% Annual Target Performance');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [expirationDate, setExpirationDate] = useState('2026-08-30');
  const [customTerms, setCustomTerms] = useState('Standard comprehensive benefits, health, 401(k) matching, and remote home office stipend.');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!application) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.createOffer({
        applicationId: application.id,
        baseSalary: Number(baseSalary),
        currency,
        equity,
        bonus,
        startDate: new Date(startDate).toISOString(),
        expirationDate: new Date(expirationDate).toISOString(),
        customTerms,
      });

      onOfferCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create offer package');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Job Offer Package"
      subtitle={`Candidate: ${application.candidate?.firstName} ${application.candidate?.lastName} • Position: ${application.jobTitle}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Base Annual Salary *</label>
            <input
              type="number"
              step={1000}
              required
              value={baseSalary}
              onChange={(e) => setBaseSalary(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Equity Grant</label>
            <input
              type="text"
              value={equity}
              onChange={(e) => setEquity(e.target.value)}
              placeholder="e.g. 0.15% Stock Options"
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Bonus Structure</label>
            <input
              type="text"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder="e.g. 15% Annual Target"
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Anticipated Start Date *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Offer Expiration Date *</label>
            <input
              type="date"
              required
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Custom Terms & Benefits</label>
          <textarea
            rows={3}
            value={customTerms}
            onChange={(e) => setCustomTerms(e.target.value)}
            className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y transition-colors leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Create Offer Package
          </Button>
        </div>
      </form>
    </Modal>
  );
};


