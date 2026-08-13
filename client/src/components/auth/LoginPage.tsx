import React, { useState } from 'react';
import { Bot, Shield, Briefcase, User, AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-black text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black font-bold mb-2 shadow-glow-white border border-white">
            <Bot className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white font-mono">VERITY</h1>
          <p className="text-xs text-zinc-400 font-sans">
            Enterprise AI-Powered Talent & Recruitment Intelligence
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <p className="text-[11px] font-semibold text-zinc-400 text-center">
            Quick Select Demo Account:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectDemoRole('recruiter')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                email.includes('recruiter')
                  ? 'bg-white text-black shadow-md border border-white'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Recruiter
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemoRole('admin')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                email.includes('admin')
                  ? 'bg-white text-black shadow-md border border-white'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemoRole('candidate')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                email.includes('candidate')
                  ? 'bg-white text-black shadow-md border border-white'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Candidate
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black border border-zinc-750 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Sign In to VERITY
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-800 text-xs text-zinc-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-white hover:underline font-semibold"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

