import React, { useState } from 'react';
import { Bot, User, Briefcase, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [headline, setHeadline] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLengthValid = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = isLengthValid && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please fulfill all password requirements.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        role,
        organizationName: role === 'recruiter' ? organizationName : undefined,
        headline: role === 'candidate' ? headline : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-black text-white">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black font-bold mb-2 shadow-glow-white border border-white">
            <Bot className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white font-mono">VERITY</h1>
          <p className="text-xs text-zinc-400 font-sans">
            Create your account to start screening or applying with AI
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
          <button
            type="button"
            onClick={() => setRole('candidate')}
            className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              role === 'candidate'
                ? 'bg-white text-black shadow-md border border-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setRole('recruiter')}
            className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              role === 'recruiter'
                ? 'bg-white text-black shadow-md border border-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Recruiter / Company
          </button>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Elena"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Rostova"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {role === 'recruiter' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Organization / Company Name *</label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. InnovateCorp AI"
                  className="w-full px-3.5 py-2 rounded-xl bg-black border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            )}

            {role === 'candidate' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Professional Headline (Optional)</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full px-3.5 py-2 rounded-xl bg-black border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-black border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
              />

              {/* Password complexity checklist */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <span className={`flex items-center gap-1 ${isLengthValid ? 'text-white font-medium' : 'text-zinc-500'}`}>
                  <Check className="w-3 h-3" /> Min 8 characters
                </span>
                <span className={`flex items-center gap-1 ${hasUpper ? 'text-white font-medium' : 'text-zinc-500'}`}>
                  <Check className="w-3 h-3" /> Uppercase letter
                </span>
                <span className={`flex items-center gap-1 ${hasLower ? 'text-white font-medium' : 'text-zinc-500'}`}>
                  <Check className="w-3 h-3" /> Lowercase letter
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? 'text-white font-medium' : 'text-zinc-500'}`}>
                  <Check className="w-3 h-3" /> Number (0-9)
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-3"
            >
              Complete Registration
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-800 text-xs text-zinc-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-white hover:underline font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

