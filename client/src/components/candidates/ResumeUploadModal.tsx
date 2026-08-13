import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Job, Candidate, Application } from '@ats/shared';
import { api } from '../../services/api';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  onUploadSuccess: (candidate: Candidate, application?: Application) => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  jobs,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ candidate: Candidate; application?: Application } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndScreen = async () => {
    if (!file) {
      setError('Please select a resume file (PDF, DOCX, or TXT).');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const data = await api.uploadResume(file, selectedJobId || undefined);
      setResult(data);
      onUploadSuccess(data.candidate, data.application);
    } catch (err: any) {
      setError(err.message || 'Resume upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Ingest & Screen Candidate Resume"
      subtitle="Automated resume parsing, competency extraction, and capability screening."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {!result ? (
          <div className="space-y-6">
            {/* Target Job Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Target Role for Instant AI Screening
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="">Do not screen against specific role (Ingest only)</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                file
                  ? 'border-zinc-500 bg-zinc-900/50'
                  : 'border-zinc-800 hover:border-zinc-600 bg-black/30 hover:bg-zinc-900/30'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-3.5 rounded-xl bg-zinc-100 text-black font-semibold shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm text-white">{file.name}</p>
                  <p className="text-xs text-zinc-400 font-mono">{(file.size / 1024).toFixed(1)} KB • Ready to Ingest</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs text-zinc-400 hover:text-white underline mt-1 transition-colors"
                  >
                    Select different file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">
                      Drop candidate resume here or <span className="underline text-zinc-200">browse</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">PDF, DOCX, or TXT up to 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!file}
                isLoading={isUploading}
                onClick={handleUploadAndScreen}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Ingest & Screen
              </Button>
            </div>
          </div>
        ) : (
          /* Result View */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-white">
                  Resume Ingested & Evaluated
                </h4>
                <p className="text-xs text-zinc-300 mt-1">
                  Candidate profile compiled for{' '}
                  <strong className="text-white">
                    {result.candidate.firstName} {result.candidate.lastName}
                  </strong>{' '}
                  ({result.candidate.email}).
                </p>
              </div>
            </div>

            {result.application?.aiScoreCard && (
              <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Overall Capability Fit</span>
                  <span className="text-base font-semibold text-white font-mono">
                    {result.application.aiScoreCard.overallScore}%
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{result.application.aiScoreCard.summary}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
              <Button
                variant="secondary"
                onClick={() => {
                  resetForm();
                }}
              >
                Upload Another
              </Button>
              <Button variant="primary" onClick={onClose}>
                Done & View
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};


