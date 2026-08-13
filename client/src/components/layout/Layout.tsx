import React from 'react';
import { Header } from './Header';
import { Sidebar, NavTab } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeApplicationsCount?: number;
  onOpenCreateJob: () => void;
  onOpenResumeUpload: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  activeApplicationsCount,
  onOpenCreateJob,
  onOpenResumeUpload,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-white selection:text-black">
      <Header onOpenCreateJob={onOpenCreateJob} onOpenResumeUpload={onOpenResumeUpload} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onTabChange={onTabChange}
          activeApplicationsCount={activeApplicationsCount}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-10 bg-[#09090b]">
          <div className="max-w-[1440px] mx-auto space-y-10 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};


