import React from 'react';
import {
  Briefcase,
  Users,
  Search,
  Mail,
  Shield,
  Calendar,
  Award,
  User as UserIcon,
  BrainCircuit,
  BarChart3,
  GitFork,
  FileText,
  Sliders,
  Settings,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export type NavTab =
  | 'workspace'
  | 'analytics'
  | 'dashboard'
  | 'jobs'
  | 'capabilities'
  | 'pipeline'
  | 'candidates'
  | 'interviews'
  | 'offers'
  | 'search'
  | 'emails'
  | 'fingerprint'
  | 'decision_workspace'
  | 'candidate_portal'
  | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeApplicationsCount?: number;
}

interface NavGroup {
  title: string;
  items: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, activeApplicationsCount = 0 }) => {
  const { user } = useAuth();

  let navGroups: NavGroup[] = [];

  if (user?.role === 'candidate') {
    navGroups = [
      {
        title: 'CANDIDATE WORKSPACE',
        items: [
          { id: 'candidate_portal', label: 'Applications & Passport', icon: UserIcon },
        ],
      },
    ];
  } else {
    // Recruiter & Admin
    navGroups = [
      {
        title: 'HIRE',
        items: [
          { id: 'jobs', label: 'Job Requisitions', icon: Briefcase },
          { id: 'candidates', label: 'Candidate Pool', icon: Users },
          { id: 'interviews', label: 'Interviews', icon: Calendar },
          { id: 'offers', label: 'Offers', icon: Award },
        ],
      },
      {
        title: 'INTELLIGENCE',
        items: [
          { id: 'workspace', label: 'Decision Workspace', icon: BrainCircuit },
          { id: 'analytics', label: 'Intelligence & Insights', icon: BarChart3 },
          { id: 'search', label: 'Talent Search', icon: Search },
          { id: 'fingerprint', label: 'Skill Graph Explorer', icon: GitFork },
        ],
      },
      {
        title: 'COMMUNICATIONS',
        items: [
          { id: 'emails', label: 'Email Center', icon: Mail },
          { id: 'pipeline', label: 'Notifications', icon: Bell, badge: 3 },
        ],
      },
      {
        title: 'SETTINGS',
        items: [
          { id: 'admin', label: 'Templates', icon: FileText },
          { id: 'admin', label: 'Integrations', icon: Sliders },
          { id: 'admin', label: 'Team & Roles', icon: Settings },
          { id: 'admin', label: 'Audits', icon: Shield },
        ],
      },
    ];
  }

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">
              {group.title}
            </p>
            <nav className="space-y-0.5" aria-label={group.title}>
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                
                // Specific visual neon highlights matching prompt screenshot
                let activeStyle = 'bg-sky-500 text-white font-semibold shadow-sm';
                let iconStyle = isActive ? 'text-white stroke-[2.2]' : 'text-slate-500 stroke-[1.75]';
                
                if (isActive) {
                  if (item.id === 'workspace') {
                    activeStyle = 'border border-sky-500/70 bg-sky-500/10 text-sky-700 font-semibold shadow-glow-blue/10';
                    iconStyle = 'text-sky-500 stroke-[2.2]';
                  } else {
                    activeStyle = 'border border-slate-350 bg-slate-100 text-slate-900 font-semibold shadow-sm';
                    iconStyle = 'text-slate-900 stroke-[2.2]';
                  }
                }

                return (
                  <button
                    key={item.id + '-' + idx}
                    onClick={() => onTabChange(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? activeStyle
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${iconStyle}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-sky-500 text-white' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Pro Plan Card Widget matching visual specifications */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        {user?.role !== 'candidate' && (
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-800">Pro Plan</p>
                <p className="text-[10px] text-slate-400 font-mono">48 days left</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <Button variant="gradient-action" size="sm" className="w-full text-xs py-1.5 rounded-xl">
              Upgrade Plan
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between px-3 text-[10px] text-zinc-500 font-mono">
          <span>VERITY ENTERPRISE</span>
          <span>v2.5</span>
        </div>
      </div>
    </aside>
  );
};



