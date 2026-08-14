import React, { useState } from 'react';
import { Bot, User, Briefcase, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateToLanding: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onNavigateToLanding }) => {
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Background Soft Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none z-0 bg-gradient-to-b from-sky-100/30 via-slate-50 to-transparent" />

      <div className="w-full max-w-lg space-y-6 z-10 relative">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <button
            onClick={onNavigateToLanding}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-bold mb-2 shadow-glow-blue border-none hover:-translate-y-0.5 transition-all active:scale-[0.97]"
          >
            <Bot className="w-7 h-7" />
          </button>
          <h1 
            onClick={onNavigateToLanding}
            className="text-2xl font-bold tracking-wider text-slate-900 font-mono cursor-pointer hover:text-sky-600 transition-colors"
          >
            VERITY
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Create your account to start screening or applying with AI
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setRole('candidate')}
            className={`py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              role === 'candidate'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
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
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Recruiter / Company
          </button>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Elena"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Rostova"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-slate-600">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
              />
            </div>

            {role === 'recruiter' && (
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-600">Organization / Company Name *</label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. InnovateCorp AI"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
                />
              </div>
            )}

            {role === 'candidate' && (
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-600">Professional Headline (Optional)</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-600">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
              />

              {/* Password complexity checklist */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <span className={`flex items-center gap-1 ${isLengthValid ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                  <Check className={`w-3 h-3 ${isLengthValid ? 'text-sky-500' : 'text-slate-400'}`} /> Min 8 characters
                </span>
                <span className={`flex items-center gap-1 ${hasUpper ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                  <Check className={`w-3 h-3 ${hasUpper ? 'text-sky-500' : 'text-slate-400'}`} /> Uppercase letter
                </span>
                <span className={`flex items-center gap-1 ${hasLower ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                  <Check className={`w-3 h-3 ${hasLower ? 'text-sky-500' : 'text-slate-400'}`} /> Lowercase letter
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                  <Check className={`w-3 h-3 ${hasNumber ? 'text-sky-500' : 'text-slate-400'}`} /> Number (0-9)
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-3 bg-sky-500 hover:bg-sky-600 border-sky-500 text-white shadow-md active:scale-[0.97]"
            >
              Complete Registration
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-sky-600 hover:text-sky-700 hover:underline font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

