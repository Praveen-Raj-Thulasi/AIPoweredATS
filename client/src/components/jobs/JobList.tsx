import React, { useState } from 'react';
import { MapPin, DollarSign, Users, Plus, Copy, Archive, Search, Cpu, Briefcase } from 'lucide-react';
import { Job } from '@ats/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { api } from '../../services/api';

interface JobListProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onOpenCreateJob: () => void;
  onViewPipelineForJob: (jobId: string) => void;
  onRefreshJobs?: () => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onSelectJob,
  onOpenCreateJob,
  onViewPipelineForJob,
  onRefreshJobs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = selectedDept === 'all' || j.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(jobs.map((j) => j.department)));

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.duplicateJob(id);
      if (onRefreshJobs) onRefreshJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.archiveJob(id);
      if (onRefreshJobs) onRefreshJobs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        title="Job Requisitions"
        description="Create, publish, and inspect capability models for engineering and product roles."
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/40">
            {jobs.length} REQUISITIONS
          </span>
        }
        actions={
          <Button variant="primary" size="sm" onClick={onOpenCreateJob}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create New Role
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, department, or required skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0c0c0e] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#0c0c0e] border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job requisitions found"
          description={
            searchTerm
              ? `No roles match "${searchTerm}". Clear search to view all openings.`
              : "No open job requisitions created yet. Create a role to start screening candidates."
          }
          actionLabel={searchTerm ? "Clear Search" : "Create First Role"}
          onAction={searchTerm ? () => setSearchTerm('') : onOpenCreateJob}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="flex flex-col justify-between hover:border-zinc-700 cursor-pointer group transition-all"
              onClick={() => onSelectJob(job)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                      {job.department}
                    </span>
                    <h3 className="font-semibold text-white text-base group-hover:text-zinc-200 transition-colors leading-snug">
                      {job.title}
                    </h3>
                  </div>
                  <StatusIndicator status={job.status} size="sm" showIcon={false} />
                </div>

                <div className="space-y-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{job.location}</span>
                  </div>
                  {job.salaryMin && job.salaryMax && (
                    <div className="flex items-center gap-2 font-mono">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k / year
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-mono">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{job.applicationsCount || 0} active applicants</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.requiredSkills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewPipelineForJob(job.id);
                  }}
                  className="text-xs"
                >
                  Pipeline ({job.applicationsCount || 0})
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectJob(job);
                    }}
                    className="text-xs flex items-center gap-1"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Model
                  </Button>

                  <button
                    onClick={(e) => handleDuplicate(e, job.id)}
                    title="Duplicate Requisition"
                    className="p-2 rounded-lg bg-black/40 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {job.status !== 'archived' && (
                    <button
                      onClick={(e) => handleArchive(e, job.id)}
                      title="Archive Job"
                      className="p-2 rounded-lg bg-black/40 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


