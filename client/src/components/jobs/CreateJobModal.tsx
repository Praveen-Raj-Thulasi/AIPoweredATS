import React, { useState } from 'react';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { Job, ExperienceLevel, JobType } from '@ats/shared';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: Job) => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Core Engineering');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid / Remote)');
  const [type, setType] = useState<JobType>('full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('senior');
  const [minYearsExperience, setMinYearsExperience] = useState(4);
  const [salaryMin, setSalaryMin] = useState(140000);
  const [salaryMax, setSalaryMax] = useState(185000);
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('TypeScript, React, Node.js, AWS');
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAI = async () => {
    if (!title) {
      setError('Please provide at least a Job Title first to generate with AI.');
      return;
    }
    setError(null);
    setIsGeneratingAI(true);
    try {
      const skillsArray = skillsInput.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      const res = await api.generateJobDescription({
        title,
        department,
        experienceLevel,
        keySkills: skillsArray,
      });

      setDescription(res.description);
      setResponsibilities(res.responsibilities);
      setRequirements(res.requirements);
      if (res.requiredSkills) setSkillsInput(res.requiredSkills.join(', '));
      if (res.preferredSkills) setPreferredSkills(res.preferredSkills);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Job Description');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !department || !description) {
      setError('Title, Department, and Description are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const requiredSkills = skillsInput.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      const created = await api.createJob({
        title,
        department,
        location,
        type,
        experienceLevel,
        minYearsExperience: Number(minYearsExperience),
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        description,
        responsibilities,
        requirements,
        requiredSkills,
        preferredSkills,
        status: 'published',
        openingsCount: 1,
      });
      onJobCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create job posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Job Requisition"
      subtitle="Publish an open role and compile automated screening criteria"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Full-Stack Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Department *</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            >
              <option value="Core Engineering">Core Engineering</option>
              <option value="Applied AI Research">Applied AI Research</option>
              <option value="Platform Operations">Platform Operations</option>
              <option value="Product & Design">Product & Design</option>
              <option value="Data & Analytics">Data & Analytics</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead / Staff</option>
                <option value="director">Director</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Min Yrs Experience</label>
              <input
                type="number"
                min={0}
                max={20}
                value={minYearsExperience}
                onChange={(e) => setMinYearsExperience(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Key Skills & AI Generator */}
        <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-white" />
                AI Job Specification Generator
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Enter tech stack skills below to automatically draft responsibilities and requirements.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isGeneratingAI}
              onClick={handleGenerateAI}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Generate Specs
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Tech Stack & Skills (Comma-separated)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. TypeScript, React, Node.js, Express, AWS, PostgreSQL"
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Role Overview & Description *</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the mission, impact, and core responsibilities for this role..."
            className="w-full p-4 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y transition-colors leading-relaxed"
          />
        </div>

        {/* Responsibilities */}
        {responsibilities.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Generated Responsibilities ({responsibilities.length})</label>
            <div className="space-y-1.5 bg-black/40 p-4 rounded-xl border border-zinc-800/80">
              {responsibilities.map((resp, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        {requirements.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Generated Requirements ({requirements.length})</label>
            <div className="space-y-1.5 bg-black/40 p-4 rounded-xl border border-zinc-800/80">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salary Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Min Annual Salary (USD)</label>
            <input
              type="number"
              step={5000}
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Max Annual Salary (USD)</label>
            <input
              type="number"
              step={5000}
              value={salaryMax}
              onChange={(e) => setSalaryMax(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Publish Job Requisition
          </Button>
        </div>
      </form>
    </Modal>
  );
};


