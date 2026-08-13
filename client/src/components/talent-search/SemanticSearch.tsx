import React, { useState } from 'react';
import { Search, Sparkles, Mail } from 'lucide-react';
import { Candidate } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/PageHeader';
import { api } from '../../services/api';

interface SemanticSearchProps {
  onSelectCandidate: (candidateId: string) => void;
  onOpenEmailComposer: (candidateEmail: string, candidateName: string, jobTitle: string) => void;
}

export const SemanticSearch: React.FC<SemanticSearchProps> = ({
  onOpenEmailComposer,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ candidate: Candidate; score: number; matchReasons: string[] }[]>([]);
  const [searched, setSearched] = useState(false);

  const sampleQueries = [
    'Senior React and TypeScript engineers with high-scale microservices',
    'Lead AI Engineer with AWS Bedrock, LLMs, and Python expertise',
    'DevOps Architect skilled in Kubernetes, Terraform, and multi-region AWS',
    'Full-stack developer with experience in Tailwind and UI component design',
  ];

  const handleSearch = async (textToSearch?: string) => {
    const q = textToSearch || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setSearched(true);
    try {
      const data = await api.semanticSearch(q);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        title="AI Talent Search"
        description="Query your applicant talent pool using natural language, capability concepts, or deep technical proficiencies."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            EMBEDDINGS SEARCH
          </span>
        }
      />

      {/* Search Input Box */}
      <Card className="space-y-4" variant="glass">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Find senior candidates with strong AWS Bedrock, distributed systems, and React..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50 focus:shadow-glow-purple/20 transition-all font-mono"
            />
          </div>
          <Button type="submit" variant="gradient-action" size="md" isLoading={isSearching}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Semantic Search
          </Button>
        </form>

        {/* Suggested Queries */}
        <div className="space-y-2 pt-2 border-t border-zinc-850/60">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Suggested search prompts:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  handleSearch(sq);
                }}
                className="text-left px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-850 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/80 transition-all font-mono"
              >
                "{sq}"
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Search Results */}
      <div className="space-y-4">
        {searched && (
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
              Ranked Talent Matches ({results.length})
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Ranked by Semantic Embeddings</span>
          </div>
        )}

        {results.length === 0 && searched && !isSearching && (
          <div className="p-12 text-center text-zinc-500 text-xs bg-[#0c0c0e]/80 rounded-2xl border border-zinc-800/80 font-mono">
            No candidates matched your search criteria. Try a broader search term.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {results.map(({ candidate, score, matchReasons }, idx) => (
            <Card
              key={candidate.id}
              className="hover:border-zinc-750 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              variant="glass"
              hoverable
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-500 text-xs font-mono">#{idx + 1}</span>
                  <h4 className="font-bold text-base text-white">
                    {candidate.firstName} {candidate.lastName}
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-brand-emerald/10 border border-brand-emerald/30 text-xs font-mono text-brand-emerald shadow-glow-emerald/10 font-bold">
                    {score}% Match
                  </span>
                </div>

                <p className="text-xs text-zinc-300 font-medium">{candidate.headline}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {candidate.skills.slice(0, 6).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-850 text-[11px] text-zinc-300 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {matchReasons.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-500 font-mono">
                    <span className="text-zinc-650">Matched:</span>
                    {matchReasons.slice(0, 3).map((r, i) => (
                      <span key={i} className="text-zinc-300 font-sans font-medium">
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onOpenEmailComposer(
                      candidate.email,
                      `${candidate.firstName} ${candidate.lastName}`,
                      candidate.headline || 'General Opportunity'
                    )
                  }
                  className="border-zinc-800 bg-black/35 font-semibold"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Email Candidate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};



