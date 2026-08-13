import React, { useState } from 'react';
import { Mail, Search, Plus, MapPin, Sparkles } from 'lucide-react';
import { Candidate } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';

interface CandidateListProps {
  candidates: Candidate[];
  onOpenResumeUpload: () => void;
  onOpenEmailComposer: (email: string, name: string, jobTitle: string) => void;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  onOpenResumeUpload,
  onOpenEmailComposer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = candidates.filter((c) => {
    const full = `${c.firstName} ${c.lastName} ${c.email} ${c.headline || ''} ${c.skills.join(' ')}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        title="Candidate Directory"
        description="Comprehensive talent repository with automated resume parsing and skills taxonomy."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            {candidates.length} PROFILES
          </span>
        }
        actions={
          <Button variant="gradient-action" size="sm" onClick={onOpenResumeUpload}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Ingest New Resumes
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter candidates by name, email, role, or technical skills..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-black border border-zinc-850 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50 focus:shadow-glow-purple/20 transition-all font-mono"
        />
      </div>

      {/* Candidate Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No candidates found"
          description={
            searchTerm
              ? `No candidates match the search query "${searchTerm}". Try a different filter term.`
              : "No candidates ingested into the system yet. Upload candidate resumes to build the directory."
          }
          actionLabel={searchTerm ? "Clear Search" : "Ingest First Resume"}
          onAction={searchTerm ? () => setSearchTerm('') : onOpenResumeUpload}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((candidate) => (
            <Card key={candidate.id} className="flex flex-col justify-between hover:border-zinc-750 transition-all group" variant="glass" hoverable>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-white text-base group-hover:text-zinc-200 transition-colors leading-snug">
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{candidate.email}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-purple/35 to-brand-blue/35 border border-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-200">
                    {candidate.firstName[0]}
                    {candidate.lastName[0]}
                  </div>
                </div>

                {candidate.headline && (
                  <p className="text-xs text-zinc-300 font-medium line-clamp-2 leading-relaxed">
                    {candidate.headline}
                  </p>
                )}

                {candidate.location && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{candidate.location}</span>
                  </div>
                )}

                {/* Skills Taxonomy */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {candidate.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-850 text-[11px] text-zinc-350 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 5 && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900/30 text-[10px] text-zinc-500 font-mono">
                      +{candidate.skills.length - 5}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-mono">
                  Ingested {new Date(candidate.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onOpenEmailComposer(
                      candidate.email,
                      `${candidate.firstName} ${candidate.lastName}`,
                      candidate.headline || 'Position'
                    )
                  }
                  className="border-zinc-805 bg-black/40 font-semibold"
                >
                  <Mail className="w-3.5 h-3.5 mr-1" />
                  Contact
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};


