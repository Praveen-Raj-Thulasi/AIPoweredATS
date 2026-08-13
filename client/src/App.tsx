import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Layout } from './components/layout/Layout';
import { NavTab } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { JobList } from './components/jobs/JobList';
import { CreateJobModal } from './components/jobs/CreateJobModal';
import { KanbanPipeline } from './components/pipeline/KanbanPipeline';
import { CandidateList } from './components/candidates/CandidateList';
import { CandidateScorecardModal } from './components/candidates/CandidateScorecardModal';
import { ResumeUploadModal } from './components/candidates/ResumeUploadModal';
import { SemanticSearch } from './components/talent-search/SemanticSearch';
import { EmailComposerModal } from './components/email/EmailComposerModal';
import { EmailCenter } from './components/email/EmailCenter';
import { CandidatePortal } from './components/candidate-portal/CandidatePortal';
import { AdminPortal } from './components/admin-portal/AdminPortal';
import { InterviewManager } from './components/interviews/InterviewManager';
import { ScheduleInterviewModal } from './components/interviews/ScheduleInterviewModal';
import { OfferManager } from './components/offers/OfferManager';
import { CreateOfferModal } from './components/offers/CreateOfferModal';
import { JobCapabilityManager } from './components/capabilities/JobCapabilityManager';
import { RecruiterDecisionWorkspace } from './components/decision/RecruiterDecisionWorkspace';
import { RecruitmentIntelligenceDashboard } from './components/analytics/RecruitmentIntelligenceDashboard';
import { api } from './services/api';
import { VerityLineageBanner } from './components/layout/VerityLineageBanner';
import { Toast, ToastMessage } from './components/ui/Toast';
import { Job, Candidate, Application, DashboardMetrics, ApplicationStage, Interview } from '@ats/shared';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | undefined>(undefined);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedCapabilityJob, setSelectedCapabilityJob] = useState<Job | null>(null);

  // Modals state
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isResumeUploadOpen, setIsResumeUploadOpen] = useState(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [activeModalApplication, setActiveModalApplication] = useState<Application | null>(null);

  const [emailComposerDefaults, setEmailComposerDefaults] = useState({
    email: '',
    name: '',
    jobTitle: '',
  });

  // Set default tab on user change
  useEffect(() => {
    if (user?.role === 'candidate') {
      setCurrentTab('candidate_portal');
    } else if (user?.role === 'admin') {
      setCurrentTab('workspace');
    } else if (user?.role === 'recruiter') {
      setCurrentTab('workspace');
    }
  }, [user]);

  const loadAllData = async () => {
    if (!isAuthenticated || !user) return;
    try {
      if (user.role === 'candidate') {
        const [fetchedApps, fetchedJobs] = await Promise.all([
          api.getApplications(),
          api.getPublicJobs(),
        ]);
        setApplications(fetchedApps);
        setJobs(fetchedJobs);
      } else {
        const [fetchedMetrics, fetchedJobs, fetchedCandidates, fetchedApps, fetchedInterviews] = await Promise.all([
          api.getDashboardAnalytics(),
          api.getJobs(),
          api.getCandidates(),
          api.getApplications(),
          api.getInterviews(),
        ]);
        setMetrics(fetchedMetrics);
        setJobs(fetchedJobs);
        setCandidates(fetchedCandidates);
        setApplications(fetchedApps);
        setInterviews(fetchedInterviews);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (authView === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthView('register')} />;
  }

  const handleSelectApplication = async (appId: string) => {
    try {
      const app = await api.getApplicationById(appId);
      setSelectedApplication(app);
      setIsScorecardOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStage = async (appId: string, stage: ApplicationStage) => {
    try {
      await api.updateStage(appId, stage, `${user.firstName} ${user.lastName}`);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEmailComposer = (email: string, name: string, jobTitle: string) => {
    setEmailComposerDefaults({ email, name, jobTitle });
    setIsEmailComposerOpen(true);
  };

  const handleOpenScheduleInterview = (app: Application) => {
    setActiveModalApplication(app);
    setIsScheduleInterviewOpen(true);
  };

  const handleOpenCreateOffer = (app: Application) => {
    setActiveModalApplication(app);
    setIsCreateOfferOpen(true);
  };

  return (
    <Layout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      activeApplicationsCount={applications.filter((a) => a.status === 'active').length}
      onOpenCreateJob={() => setIsCreateJobOpen(true)}
      onOpenResumeUpload={() => setIsResumeUploadOpen(true)}
    >
      {/* Central Lineage Banner for Recruiter / Admin Mode */}
      {user.role !== 'candidate' && (
        <VerityLineageBanner currentTab={currentTab} onNavigate={setCurrentTab} />
      )}

      {/* Candidate Portal */}
      {currentTab === 'candidate_portal' && user.role === 'candidate' && (
        <CandidatePortal
          user={user}
          applications={applications}
          jobs={jobs}
          onOpenResumeUpload={() => setIsResumeUploadOpen(true)}
        />
      )}

      {/* Admin Portal */}
      {currentTab === 'admin' && user.role === 'admin' && <AdminPortal />}

      {/* Recruiter / Admin Views */}
      {(currentTab === 'workspace' || currentTab === 'decision_workspace') && user.role !== 'candidate' && (
        <RecruiterDecisionWorkspace
          onOpenScheduleInterview={handleOpenScheduleInterview}
          onOpenCreateOffer={handleOpenCreateOffer}
        />
      )}

      {currentTab === 'analytics' && user.role !== 'candidate' && (
        <RecruitmentIntelligenceDashboard onNavigateToTab={setCurrentTab} />
      )}

      {currentTab === 'dashboard' && user.role !== 'candidate' && (
        <OverviewDashboard
          metrics={metrics}
          onSelectApplication={handleSelectApplication}
          onOpenUploadResume={() => setIsResumeUploadOpen(true)}
          onNavigateToTab={setCurrentTab}
        />
      )}

      {currentTab === 'pipeline' && user.role !== 'candidate' && (
        <KanbanPipeline
          applications={applications}
          jobs={jobs}
          onSelectApplication={handleSelectApplication}
          onUpdateStage={handleUpdateStage}
          onOpenEmailComposer={handleOpenEmailComposer}
          onOpenScheduleInterview={handleOpenScheduleInterview}
          onOpenCreateOffer={handleOpenCreateOffer}
        />
      )}

      {(currentTab === 'jobs' || currentTab === 'capabilities') && user.role !== 'candidate' && (
        selectedCapabilityJob ? (
          <JobCapabilityManager
            job={selectedCapabilityJob}
            onBack={() => setSelectedCapabilityJob(null)}
          />
        ) : (
          <JobList
            jobs={jobs}
            onSelectJob={(job) => setSelectedCapabilityJob(job)}
            onOpenCreateJob={() => setIsCreateJobOpen(true)}
            onViewPipelineForJob={() => setCurrentTab('pipeline')}
            onRefreshJobs={loadAllData}
          />
        )
      )}

      {currentTab === 'candidates' && user.role !== 'candidate' && (
        <CandidateList
          candidates={candidates}
          onOpenResumeUpload={() => setIsResumeUploadOpen(true)}
          onOpenEmailComposer={handleOpenEmailComposer}
        />
      )}

      {currentTab === 'interviews' && user.role !== 'candidate' && (
        <InterviewManager
          interviews={interviews}
          onOpenScheduleModal={() => setIsScheduleInterviewOpen(true)}
          onRefreshInterviews={loadAllData}
        />
      )}

      {currentTab === 'offers' && user.role !== 'candidate' && <OfferManager />}

      {currentTab === 'search' && user.role !== 'candidate' && (
        <SemanticSearch
          onSelectCandidate={() => {}}
          onOpenEmailComposer={handleOpenEmailComposer}
        />
      )}

      {currentTab === 'emails' && user.role !== 'candidate' && (
        <EmailCenter onOpenComposer={() => setIsEmailComposerOpen(true)} />
      )}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>

      {/* Modals */}
      <CreateJobModal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onJobCreated={loadAllData}
      />

      <ResumeUploadModal
        isOpen={isResumeUploadOpen}
        onClose={() => setIsResumeUploadOpen(false)}
        jobs={jobs}
        onUploadSuccess={loadAllData}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => setIsScheduleInterviewOpen(false)}
        application={activeModalApplication}
        onScheduled={loadAllData}
      />

      <CreateOfferModal
        isOpen={isCreateOfferOpen}
        onClose={() => setIsCreateOfferOpen(false)}
        application={activeModalApplication}
        onOfferCreated={loadAllData}
      />

      <CandidateScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        application={selectedApplication}
        onUpdateStage={handleUpdateStage}
        onOpenEmailComposer={handleOpenEmailComposer}
        onRefreshData={loadAllData}
      />

      <EmailComposerModal
        isOpen={isEmailComposerOpen}
        onClose={() => setIsEmailComposerOpen(false)}
        defaultEmail={emailComposerDefaults.email}
        defaultCandidateName={emailComposerDefaults.name}
        defaultJobTitle={emailComposerDefaults.jobTitle}
      />
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
