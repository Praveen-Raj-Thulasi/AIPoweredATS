import React, { useState } from 'react';
import { Bot, Shield, Briefcase, User, AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onNavigateToLanding }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('recruiter@innovatecorp.com');
  const [password, setPassword] = useState('Recruiter@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoRole = (role: 'admin' | 'recruiter' | 'candidate') => {
    setError(null);
    if (role === 'admin') {
      setEmail('admin@verity.ai');
      setPassword('VerityAdmin@2026');
    } else if (role === 'recruiter') {
      setEmail('recruiter@innovatecorp.com');
      setPassword('Recruiter@2026');
    } else if (role === 'candidate') {
      setEmail('candidate@elena.dev');
      setPassword('Candidate@2026');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Background Soft Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none z-0 bg-gradient-to-b from-sky-100/30 via-slate-50 to-transparent" />

      <div className="w-full max-w-md space-y-6 z-10 relative">
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
            Enterprise AI-Powered Talent & Recruitment Intelligence
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <p className="text-[11px] font-semibold text-slate-500 text-center">
            Quick Select Demo Account:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectDemoRole('recruiter')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                email.includes('recruiter')
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Recruiter
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemoRole('admin')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                email.includes('admin')
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemoRole('candidate')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                email.includes('candidate')
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Candidate
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 bg-sky-500 hover:bg-sky-600 border-sky-500 text-white shadow-md active:scale-[0.97]"
            >
              Sign In to VERITY
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-sky-600 hover:text-sky-700 hover:underline font-semibold"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

