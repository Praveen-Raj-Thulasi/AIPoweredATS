import React, { useState, useEffect } from 'react';
import { Send, Award } from 'lucide-react';
import { Offer } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { api } from '../../services/api';

export const OfferManager: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);

  const loadOffers = async () => {
    try {
      const data = await api.getOffers();
      setOffers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleSendOffer = async (id: string) => {
    try {
      await api.sendOffer(id);
      loadOffers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        title="Offer Management"
        description="Generate, dispatch, and track candidate job offer packages and compensation terms."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            {offers.length} OFFERS
          </span>
        }
      />

      {offers.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No job offers generated yet"
          description="Advance a candidate to the Offer stage in the hiring pipeline to compile and dispatch an offer package."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white text-base leading-snug">{offer.candidateName}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{offer.jobTitle}</p>
                  </div>
                  <StatusIndicator status={offer.status} size="sm" showIcon={false} />
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Base Salary:</span>
                    <span className="font-bold text-white text-sm font-mono">
                      {offer.currency} {offer.baseSalary.toLocaleString()} / yr
                    </span>
                  </div>
                  {offer.equity && (
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-400">Equity:</span>
                      <span className="text-zinc-200">{offer.equity}</span>
                    </div>
                  )}
                  {offer.bonus && (
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-400">Bonus:</span>
                      <span className="text-zinc-200">{offer.bonus}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] pt-2 border-t border-zinc-850/60 text-zinc-400 font-mono">
                    <span>Start: {new Date(offer.startDate).toLocaleDateString()}</span>
                    <span>Expires: {new Date(offer.expirationDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {offer.customTerms && (
                  <p className="text-[11px] text-zinc-400 italic bg-zinc-900/40 p-3 rounded-xl border border-zinc-850/60 leading-relaxed">
                    "{offer.customTerms}"
                  </p>
                )}
              </div>

              <div className="pt-3.5 border-t border-zinc-800/80 flex justify-end">
                {offer.status === 'draft' ? (
                  <Button variant="primary" size="sm" onClick={() => handleSendOffer(offer.id)}>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Dispatch Offer
                  </Button>
                ) : (
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {offer.status === 'accepted'
                      ? '✓ Accepted by Candidate'
                      : `Dispatched ${new Date(offer.sentAt || offer.createdAt).toLocaleDateString()}`}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


