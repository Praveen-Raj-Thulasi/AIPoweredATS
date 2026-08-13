import React, { useState, useEffect } from 'react';
import { Clock, Plus, Mail } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { api } from '../../services/api';

interface EmailCenterProps {
  onOpenComposer: () => void;
}

export const EmailCenter: React.FC<EmailCenterProps> = ({ onOpenComposer }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEmailHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        title="Email Communications"
        description="Outbound candidate correspondence audit logs and delivery history via AWS SES."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            AWS SES ACTIVE
          </span>
        }
        actions={
          <Button variant="primary" size="sm" onClick={onOpenComposer}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Compose Email
          </Button>
        }
      />

      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850/60 pb-3">
          <h3 className="font-semibold text-white text-xs font-mono uppercase tracking-wider">
            Dispatched Email Audit Logs ({history.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">Loading email logs...</div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No emails dispatched yet"
            description="Click 'Compose Email' to send an interview invitation, offer letter, or custom candidate update."
            actionLabel="Compose First Email"
            onAction={onOpenComposer}
          />
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2 hover:border-zinc-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{item.to}</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase">
                      {item.templateType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(item.sentAt).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 font-medium">{item.subject}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};


