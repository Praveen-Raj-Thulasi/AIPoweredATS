import React from 'react';
import { Bot, Shield, Briefcase, User, Sparkles, CheckCircle, BarChart3, Clock, Lock, ArrowRight, Activity, Terminal } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToRegister }) => {
  const { login } = useAuth();

  const handleQuickRecruiterDemo = async () => {
    try {
      await login('recruiter@innovatecorp.com', 'Recruiter@2026');
    } catch (err) {
      console.error('Quick Demo login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white relative overflow-hidden">
      {/* Background Soft Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none z-0 bg-gradient-to-b from-sky-100/30 via-slate-50 to-transparent" />
      <div className="absolute -top-[250px] -right-[150px] w-[500px] h-[500px] rounded-full bg-sky-200/20 blur-3xl pointer-events-none" />

      {/* Header / Navbar */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl px-6 md:px-12 py-4 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-mono font-bold text-sm tracking-tighter shadow-glow-blue">
            V
          </div>
          <div className="flex flex-col text-left leading-none">
            <span className="font-semibold text-sm tracking-tight text-slate-900 font-mono">VERITY</span>
            <span className="text-[9px] text-sky-600 font-bold uppercase tracking-wider mt-0.5">Talent Operations</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#role-portals" className="hover:text-sky-600 transition-colors">Role Portals</a>
          <a href="#capabilities" className="hover:text-sky-600 transition-colors">Capabilities</a>
          <a href="#workflow" className="hover:text-sky-600 transition-colors">Workflow</a>
          <a href="#faq" className="hover:text-sky-600 transition-colors">FAQ</a>
        </nav>

        {/* Header Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleQuickRecruiterDemo}
            className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl border border-sky-200 hover:border-sky-300 bg-sky-50/50 hover:bg-sky-50 text-xs font-semibold text-sky-700 transition-all active:scale-[0.97]"
          >
            Quick Recruiter Demo
          </button>
          <button
            onClick={onNavigateToLogin}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-xs font-semibold shadow-md active:scale-[0.97] transition-all"
          >
            Sign In / Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-12 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 relative">
        {/* Left Side Copy */}
        <div className="lg:col-span-7 space-y-6 md:space-y-8 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-700 font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Recruitment Suite
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08] font-sans">
            Safe, Intelligent & <br />
            <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">Real-Time Talent Operations</span>
          </h1>

          <p className="text-sm md:text-base text-slate-500 max-w-xl leading-relaxed">
            A unified operations platform empowering School Administrators, Recruiters, and Candidates with live adaptive challenges, biometric identity verification, and fully audited decision intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onNavigateToLogin}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold border-sky-500 shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Explore Live Portals
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleQuickRecruiterDemo}
              className="border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm hover:-translate-y-0.5 active:scale-[0.97]"
            >
              <Terminal className="w-4 h-4 mr-1.5 text-slate-500" />
              View Recruiter Dashboard
            </Button>
          </div>
        </div>

        {/* Right Side Telemetry Card Mockup */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-white border border-slate-250 rounded-3xl p-6 shadow-xl relative backdrop-blur-md">
            {/* Upper Telemetry Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-100 to-sky-200 flex items-center justify-center text-sm font-semibold text-sky-800">
                  ER
                </div>
                <div className="text-left leading-none">
                  <h3 className="font-bold text-sm text-slate-800">Candidate #CAN-101</h3>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Senior Full-Stack Route</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                VERIFIED
              </span>
            </div>

            {/* Telemetry Metric Grid */}
            <div className="grid grid-cols-2 gap-3.5 py-5">
              <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 text-left space-y-1">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block font-mono">Match Rating</span>
                <span className="text-lg font-bold text-slate-800 block leading-none font-mono">92.4%</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Verified Skills</span>
                <span className="text-lg font-bold text-slate-800 block leading-none font-mono">12 / 15</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Telemetry Check</span>
                <span className="text-lg font-bold text-slate-800 block leading-none font-mono">On-Route</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 text-left space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block font-mono">Decision Fit</span>
                <span className="text-lg font-bold text-emerald-600 block leading-none font-mono">Strong Hire</span>
              </div>
            </div>

            {/* Pipeline progress steps */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Route Progress</span>
                <span className="text-sky-600 font-bold">Stage 3 of 5 (Screened)</span>
              </div>
              {/* Custom Yellow/Blue Progress Bar */}
              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full" style={{ width: '60%' }} />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>Applied</span>
                <span>Screened</span>
                <span className="text-sky-600 font-bold">Verified</span>
                <span>Interview</span>
                <span>Offer</span>
              </div>
            </div>

            {/* Footer Badge matching reference design */}
            <div className="mt-5 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Biometric Face & Skill Verified
            </div>
          </div>
        </div>
      </main>

      {/* Key Features Banner */}
      <footer className="w-full border-t border-slate-200 bg-white/70 py-8 z-10 relative">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 grid grid-cols-3 gap-6 text-center divide-x divide-slate-200">
          <div className="space-y-1">
            <span className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent font-mono">98.2%</span>
            <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-semibold font-mono">Assessment Accuracy</p>
          </div>
          <div className="space-y-1">
            <span className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent font-mono">10x</span>
            <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-semibold font-mono">Reduction in Time-to-Hire</p>
          </div>
          <div className="space-y-1">
            <span className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent font-mono">100%</span>
            <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-semibold font-mono">Auditable Trust & Isolation</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
