import {
  Job,
  Candidate,
  Application,
  DashboardMetrics,
  ApplicationStage,
  EmailTemplatePayload,
  User,
  Organization,
  AuditLog,
  AuthUserResponse,
  Interview,
  Offer,
  JobCapabilityModel,
  Capability,
  CapabilityRelationship,
  CandidateCapability,
  ProofOfSkillEvaluation,
  EvidenceItem,
  EvidenceEvent,
  VerificationState,
  AssessmentSession,
  AssessmentAttempt,
  UncertaintyMetrics,
  InterviewSessionState,
  InterviewTurn,
  InterviewMode,
  CapabilityFingerprint,
  CandidateComparisonReport,
  DecisionReadinessEvaluation,
  HumanDecisionRecord,
  RecruiterDecisionAction,
  CandidatePassport,
  CandidateConsentSettings,
  EvidenceReuseAnalysis,
  FreshnessEvaluation,
  PaginatedResult,
  RecruitmentIntelligenceMetrics,
  AnalyticsFilterParams,
} from '@ats/shared';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api/v1';
console.log('VERITY: API_BASE is set to:', API_BASE);

let authToken: string | null = localStorage.getItem('verity_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('verity_token', token);
  } else {
    localStorage.removeItem('verity_token');
  }
};

export const getAuthToken = () => authToken;

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.error?.message || errorData.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  const json = await res.json();
  return json.data;
}

export const api = {
  // Auth
  register: (payload: any) =>
    fetchApi<AuthUserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    fetchApi<AuthUserResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => fetchApi<{ user: User; organization: Organization | null }>('/auth/me'),
  logout: () =>
    fetchApi('/auth/logout', {
      method: 'POST',
    }),

  // Users & Organization
  getUserProfile: () => fetchApi<User>('/users/profile'),
  updateUserProfile: (data: Partial<User>) =>
    fetchApi<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getOrganizationMembers: () => fetchApi<User[]>('/users/organization-members'),
  getCurrentOrganization: () => fetchApi<Organization>('/organizations/current'),
  updateCurrentOrganization: (data: Partial<Organization>) =>
    fetchApi<Organization>('/organizations/current', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Admin
  getAdminOverview: () => fetchApi<any>('/admin/overview'),
  getAdminUsers: () => fetchApi<User[]>('/admin/users'),
  getAdminOrganizations: () => fetchApi<Organization[]>('/admin/organizations'),
  updateUserStatus: (id: string, status: string) =>
    fetchApi<User>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAuditLogs: (orgId?: string) =>
    fetchApi<AuditLog[]>(`/admin/audit-logs${orgId ? `?organizationId=${orgId}` : ''}`),

  // Jobs
  getJobs: (params?: { status?: string; department?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.department) q.append('department', params.department);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetchApi<Job[]>(`/jobs?${q.toString()}`);
  },
  getPublicJobs: () => fetchApi<Job[]>('/jobs/public'),
  getJobById: (id: string) => fetchApi<Job>(`/jobs/${id}`),
  createJob: (jobData: Partial<Job>) =>
    fetchApi<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),
  updateJob: (id: string, updates: Partial<Job>) =>
    fetchApi<Job>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  duplicateJob: (id: string) =>
    fetchApi<Job>(`/jobs/${id}/duplicate`, {
      method: 'POST',
    }),
  archiveJob: (id: string) =>
    fetchApi<Job>(`/jobs/${id}/archive`, {
      method: 'POST',
    }),

  // Capability Compiler (Phase 3)
  compileJobCapabilities: (jobId: string) =>
    fetchApi<JobCapabilityModel>(`/jobs/${jobId}/capabilities/compile`, {
      method: 'POST',
    }),
  getJobCapabilities: (jobId: string) =>
    fetchApi<JobCapabilityModel>(`/jobs/${jobId}/capabilities`),
  updateJobCapabilities: (
    jobId: string,
    capabilities: Capability[],
    relationships?: CapabilityRelationship[],
    modificationSummary?: string
  ) =>
    fetchApi<JobCapabilityModel>(`/jobs/${jobId}/capabilities`, {
      method: 'PUT',
      body: JSON.stringify({ capabilities, relationships, modificationSummary }),
    }),
  approveJobCapabilities: (jobId: string) =>
    fetchApi<JobCapabilityModel>(`/jobs/${jobId}/capabilities/approve`, {
      method: 'POST',
    }),

  // Candidates & Proof of Skill (Phase 4, 7, 8)
  getCandidates: (params?: { search?: string; tag?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.tag) q.append('tag', params.tag);
    if (params?.status) q.append('status', params.status);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetchApi<Candidate[]>(`/candidates?${q.toString()}`);
  },
  getCandidateById: (id: string) => fetchApi<Candidate>(`/candidates/${id}`),
  getCandidateCapabilities: (candidateId: string, jobId?: string) =>
    fetchApi<ProofOfSkillEvaluation>(`/candidates/${candidateId}/capabilities${jobId ? `?jobId=${jobId}` : ''}`),
  getCandidateFingerprint: (candidateId: string, jobId?: string) =>
    fetchApi<CapabilityFingerprint>(`/candidates/${candidateId}/fingerprint${jobId ? `?jobId=${jobId}` : ''}`),
  getDecisionReadiness: (candidateId: string, jobId: string) =>
    fetchApi<DecisionReadinessEvaluation>(`/candidates/${candidateId}/decision-readiness?jobId=${jobId}`),
  recordCandidateDecision: (
    candidateId: string,
    payload: {
      jobId: string;
      action: RecruiterDecisionAction;
      reason: string;
      aiAdvisoryState?: string;
      evidenceStateSnapshot?: any;
    }
  ) =>
    fetchApi<HumanDecisionRecord>(`/candidates/${candidateId}/decisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCandidateDecisionHistory: (candidateId: string) =>
    fetchApi<HumanDecisionRecord[]>(`/candidates/${candidateId}/decisions/history`),
  compareCandidatesForJob: (jobId: string, candidateIds: string[]) =>
    fetchApi<CandidateComparisonReport>(`/jobs/${jobId}/compare-candidates`, {
      method: 'POST',
      body: JSON.stringify({ candidateIds }),
    }),
  extractCandidateClaims: (candidateId: string) =>
    fetchApi<any>(`/candidates/${candidateId}/claims/extract`, {
      method: 'POST',
    }),
  addCandidateEvidence: (candidateId: string, payload: Partial<EvidenceItem>) =>
    fetchApi<EvidenceItem>(`/candidates/${candidateId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  overrideCandidateCapability: (
    candidateId: string,
    payload: { capabilityName: string; verificationState: VerificationState; overrideReason: string }
  ) =>
    fetchApi<CandidateCapability>(`/candidates/${candidateId}/capabilities/override`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCandidateEvidenceTimeline: (candidateId: string) =>
    fetchApi<EvidenceEvent[]>(`/candidates/${candidateId}/evidence/timeline`),
  requestCandidateEvidence: (candidateId: string, payload: any) =>
    fetchApi<EvidenceEvent>(`/candidates/${candidateId}/evidence-request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadResume: async (file: File, jobId?: string): Promise<{ candidate: Candidate; application?: Application }> => {
    const formData = new FormData();
    formData.append('resume', file);
    if (jobId) formData.append('jobId', jobId);

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${API_BASE}/candidates/upload-resume`, {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to upload resume');
    }

    const json = await res.json();
    return json.data;
  },
  addCandidateComment: (candidateId: string, content: string) =>
    fetchApi<Candidate>(`/candidates/${candidateId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateCandidateTags: (candidateId: string, tags: string[]) =>
    fetchApi<Candidate>(`/candidates/${candidateId}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tags }),
    }),

  // Adaptive Assessments (Phase 5)
  startAssessmentSession: (jobId: string, candidateId?: string) =>
    fetchApi<AssessmentSession>('/assessments/sessions', {
      method: 'POST',
      body: JSON.stringify({ jobId, candidateId }),
    }),
  getAssessmentSession: (sessionId: string) =>
    fetchApi<AssessmentSession>(`/assessments/sessions/${sessionId}`),
  submitAssessmentAttempt: (
    sessionId: string,
    submission: { answer: string; code?: string; timeSpentSeconds: number }
  ) =>
    fetchApi<{ session: AssessmentSession; attempt: AssessmentAttempt; isSessionComplete: boolean }>(
      `/assessments/sessions/${sessionId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(submission),
      }
    ),
  getCandidateUncertainty: (candidateId: string, jobId: string) =>
    fetchApi<UncertaintyMetrics>(`/candidates/${candidateId}/assessments/uncertainty?jobId=${jobId}`),

  // Adaptive AI Interviews (Phase 6)
  startInterviewSession: (candidateId: string, jobId: string, mode?: InterviewMode, interviewId?: string) =>
    fetchApi<InterviewSessionState>('/interviews/sessions', {
      method: 'POST',
      body: JSON.stringify({ candidateId, jobId, mode, interviewId }),
    }),
  getInterviewSession: (sessionId: string) =>
    fetchApi<InterviewSessionState>(`/interviews/sessions/${sessionId}`),
  recordInterviewResponse: (sessionId: string, candidateResponse: string) =>
    fetchApi<{ session: InterviewSessionState; latestTurn: InterviewTurn }>(
      `/interviews/sessions/${sessionId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify({ candidateResponse }),
      }
    ),
  acceptOrAddInterviewFollowUp: (
    sessionId: string,
    payload: { questionText: string; capabilityName: string; questionType?: string }
  ) =>
    fetchApi<InterviewSessionState>(`/interviews/sessions/${sessionId}/accept-followup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  completeInterviewSession: (sessionId: string, interviewerNotes?: string) =>
    fetchApi<InterviewSessionState>(`/interviews/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ interviewerNotes }),
    }),

  // Applications
  getApplications: (jobId?: string) =>
    fetchApi<Application[]>(`/applications${jobId ? `?jobId=${jobId}` : ''}`),
  getApplicationById: (id: string) => fetchApi<Application>(`/applications/${id}`),
  updateStage: (id: string, stage: ApplicationStage, actorName?: string) =>
    fetchApi<Application>(`/applications/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, actorName }),
    }),
  addNote: (id: string, note: { authorName: string; authorRole: string; content: string }) =>
    fetchApi<Application>(`/applications/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    }),
  reEvaluateApplication: (id: string) =>
    fetchApi<{ application: Application; aiScoreCard: any }>(`/applications/${id}/re-evaluate`, {
      method: 'POST',
    }),

  // Interviews
  getInterviews: (params?: { applicationId?: string; candidateId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.applicationId) q.append('applicationId', params.applicationId);
    if (params?.candidateId) q.append('candidateId', params.candidateId);
    if (params?.status) q.append('status', params.status);
    return fetchApi<Interview[]>(`/interviews?${q.toString()}`);
  },
  scheduleInterview: (data: Partial<Interview>) =>
    fetchApi<Interview>('/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInterview: (id: string, updates: Partial<Interview>) =>
    fetchApi<Interview>(`/interviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  submitInterviewFeedback: (id: string, feedback: { rating: number; recommendation: string; summary: string }) =>
    fetchApi<Interview>(`/interviews/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    }),

  // Offers
  getOffers: (params?: { applicationId?: string; candidateId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.applicationId) q.append('applicationId', params.applicationId);
    if (params?.candidateId) q.append('candidateId', params.candidateId);
    if (params?.status) q.append('status', params.status);
    return fetchApi<Offer[]>(`/offers?${q.toString()}`);
  },
  createOffer: (data: Partial<Offer>) =>
    fetchApi<Offer>('/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendOffer: (id: string) =>
    fetchApi<Offer>(`/offers/${id}/send`, {
      method: 'POST',
    }),
  respondToOffer: (id: string, decision: 'accepted' | 'rejected') =>
    fetchApi<Offer>(`/offers/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),

  // AI Bedrock Features
  generateJobDescription: (params: { title: string; department: string; experienceLevel: string; keySkills?: string[] }) =>
    fetchApi<{
      description: string;
      responsibilities: string[];
      requirements: string[];
      requiredSkills: string[];
      preferredSkills: string[];
    }>('/ai/generate-job-description', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  semanticSearch: (query: string) =>
    fetchApi<{ candidate: Candidate; score: number; matchReasons: string[] }[]>('/ai/semantic-talent-search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  sendEmail: (payload: EmailTemplatePayload) =>
    fetchApi('/ai/send-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getEmailHistory: () => fetchApi<any[]>('/ai/email-history'),

  // Analytics
  getDashboardAnalytics: () => fetchApi<DashboardMetrics>('/analytics/dashboard'),
  getRecruitmentIntelligence: (filters?: AnalyticsFilterParams) => {
    const q = new URLSearchParams();
    if (filters?.timeRange) q.append('timeRange', filters.timeRange);
    if (filters?.startDate) q.append('startDate', filters.startDate);
    if (filters?.endDate) q.append('endDate', filters.endDate);
    if (filters?.jobId) q.append('jobId', filters.jobId);
    if (filters?.recruiterId) q.append('recruiterId', filters.recruiterId);
    if (filters?.department) q.append('department', filters.department);
    return fetchApi<RecruitmentIntelligenceMetrics>(`/analytics/recruitment-intelligence?${q.toString()}`);
  },

  // Living Capability Passport & Evidence Reuse (Phase 9)
  getCandidatePassport: (candidateId: string) =>
    fetchApi<CandidatePassport>(`/candidates/${candidateId}/passport`),
  getCandidateConsentSettings: (candidateId: string) =>
    fetchApi<CandidateConsentSettings>(`/candidates/${candidateId}/passport/consent`),
  updateCandidateConsentSettings: (candidateId: string, updates: Partial<CandidateConsentSettings>) =>
    fetchApi<CandidateConsentSettings>(`/candidates/${candidateId}/passport/consent`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  checkEvidenceReuse: (candidateId: string, targetJobId: string) =>
    fetchApi<EvidenceReuseAnalysis>(`/candidates/${candidateId}/passport/reuse-check`, {
      method: 'POST',
      body: JSON.stringify({ targetJobId }),
    }),
  evaluateFreshness: (capabilityName: string, evidenceDate?: string) =>
    fetchApi<FreshnessEvaluation>(`/candidates/0/passport/freshness-check`, {
      method: 'POST',
      body: JSON.stringify({ capabilityName, evidenceDate }),
    }),
};

