import React from 'react';
import { LogOut, Plus, UploadCloud, Building, Search, Bell, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenCreateJob: () => void;
  onOpenResumeUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateJob, onOpenResumeUpload }) => {
  const { user, organization, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-6 md:px-8 py-3 flex items-center justify-between">
      {/* Brand & Organization Title */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 text-white font-mono font-bold text-xs tracking-tighter shadow-glow-blue">
            V
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-sm tracking-tight text-slate-800 font-mono">VERITY</span>
            <span className="text-slate-300 text-xs">/</span>
            {organization ? (
              <button className="text-xs text-slate-600 font-medium flex items-center gap-1 hover:text-slate-900 transition-colors">
                <span>{organization.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <span className="text-xs text-slate-500 font-medium">Talent Intelligence</span>
            )}
          </div>
        </div>
      </div>

      {/* Center Search Console matching prompt visual */}
      <div className="relative hidden md:block w-96 max-w-md">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search candidates, jobs, skills..."
          className="w-full pl-9 pr-12 py-1.5 rounded-xl bg-slate-100/50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/50 focus:shadow-glow-blue/20 transition-all font-mono"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[9px] font-mono text-slate-400">
          <span>⌘</span><span>K</span>
        </div>
      </div>

      {/* Actions & User Menu */}
      <div className="flex items-center gap-4">
        {user?.role === 'recruiter' && (
          <>
            <Button variant="outline" size="sm" onClick={onOpenResumeUpload} className="hidden sm:inline-flex border-zinc-800 hover:border-zinc-700">
              <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
              Screen Resumes
            </Button>
            <Button variant="gradient-action" size="sm" onClick={onOpenCreateJob}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Post Job
            </Button>
          </>
        )}

        {user?.role === 'candidate' && (
          <Button variant="gradient-action" size="sm" onClick={onOpenResumeUpload}>
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Upload Resume
          </Button>
        )}

        {/* Notifications and profile area */}
        <div className="flex items-center gap-3">
          <button className="relative p-1.5 rounded-xl bg-slate-100/60 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-coral rounded-full shadow-glow-coral" />
          </button>

          <div className="h-4 w-px bg-slate-200/80" />

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400/20 to-sky-600/20 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-brand-emerald rounded-full border border-white shadow-glow-emerald" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-700 leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[9px] text-slate-500 capitalize mt-0.5 font-mono">{user.role}</p>
              </div>

              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};



