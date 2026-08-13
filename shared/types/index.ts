export type UserRole = 'candidate' | 'recruiter' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'deactivated';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  candidateProfileId?: string;
  status: AccountStatus;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'suspended';
  domain?: string;
  logoUrl?: string;
  settings?: {
    enableAiScreening: boolean;
    defaultCurrency: string;
    autoReplyEmail: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserResponse {
  user: User;
  organization?: Organization | null;
  tokens: AuthTokens;
}

export type JobStatus = 'draft' | 'published' | 'closed' | 'archived';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'director';

export interface Job {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  minYearsExperience: number;
  maxYearsExperience?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  education?: string;
  status: JobStatus;
  openingsCount: number;
  applicationsCount?: number;
  hasCapabilityModel?: boolean;
  capabilityModelId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ================= CAPABILITY COMPILER (PHASE 3) =================
export type CapabilityCategory =
  | 'languages_frameworks'
  | 'systems_architecture'
  | 'data_storage'
  | 'cloud_devops'
  | 'testing_quality'
  | 'domain_knowledge'
  | 'soft_skills';

export type CapabilityImportance = 'critical' | 'high' | 'medium' | 'low';
export type ProficiencyLevel = 'foundational' | 'intermediate' | 'advanced' | 'expert';

export type EvaluationMethod =
  | 'coding_challenge'
  | 'technical_qa'
  | 'debugging_scenario'
  | 'system_design'
  | 'transfer_test'
  | 'code_review'
  | 'behavioral_interview';

export interface Capability {
  id: string;
  name: string;
  category: CapabilityCategory;
  description: string;
  importance: CapabilityImportance;
  expectedProficiency: ProficiencyLevel;
  evaluationMethods: EvaluationMethod[];
  dependencies: string[];
  transferableConcepts: string[];
  evidenceRequirements: string[];
  freshnessRequirements: string;
  confidenceScore?: number;
}

export type RelationshipType =
  | 'prerequisite_for'
  | 'builds_upon'
  | 'transfers_to'
  | 'frequently_paired_with';

export interface CapabilityRelationship {
  id: string;
  sourceName: string;
  targetName: string;
  relationshipType: RelationshipType;
  strength: number;
  explanation: string;
}

export type CapabilityModelStatus = 'draft' | 'pending_review' | 'approved' | 'customized';

export interface RecruiterModification {
  id: string;
  action: 'add_capability' | 'edit_capability' | 'remove_capability' | 'approve';
  targetCapabilityName?: string;
  details: string;
  modifiedBy: string;
  timestamp: string;
}

export interface JobCapabilityModel {
  id: string;
  jobId: string;
  organizationId: string;
  version: number;
  status: CapabilityModelStatus;
  capabilities: Capability[];
  relationships: CapabilityRelationship[];
  originalJdSnapshot: {
    title: string;
    description: string;
    requirements: string[];
    requiredSkills: string[];
    experienceLevel: string;
  };
  aiProviderUsed: string;
  modelName: string;
  compilationDurationMs: number;
  modifications: RecruiterModification[];
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ================= CANDIDATE CAPABILITY & PROOF-OF-SKILL (PHASE 4) =================
export type VerificationState =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE';

export type EvidenceSourceType =
  | 'resume'
  | 'project'
  | 'portfolio'
  | 'github_project'
  | 'certification'
  | 'assessment'
  | 'coding_task'
  | 'interview'
  | 'transfer_test'
  | 'recruiter_observation';

export interface EvidenceItem {
  id: string;
  candidateId: string;
  organizationId?: string;
  capabilityName: string;
  sourceType: EvidenceSourceType;
  title: string;
  summary: string;
  rawContent?: string;
  sourceUrl?: string;
  sourceScore?: number;
  state: 'supports' | 'partially_supports' | 'contradicts' | 'inconclusive';
  reliabilityWeight: number;
  isPrivateRecruiterNote?: boolean;
  authorName?: string;
  stageRecorded: ApplicationStage;
  createdAt: string;
}

export interface CandidateClaim {
  id: string;
  candidateId: string;
  organizationId?: string;
  capabilityName: string;
  claimedProficiency: ProficiencyLevel;
  claimedYearsOfExperience?: number;
  claimSource: string;
  excerpt: string;
  verificationState: VerificationState;
  createdAt: string;
}

export interface CandidateCapability {
  id: string;
  candidateId: string;
  organizationId?: string;
  capabilityName: string;
  category: CapabilityCategory;
  verificationState: VerificationState;
  confidenceScore: number;
  evidenceCount: number;
  evidenceQualityScore: number;
  evidenceDiversityScore: number;
  freshnessDate?: string;
  evidenceBreakdown: {
    sourceType: EvidenceSourceType;
    status: 'verified' | 'partial' | 'contradicted' | 'missing';
    label: string;
    count: number;
  }[];
  evidenceItems?: EvidenceItem[];
  recommendedAction?: string;
  isManualOverride?: boolean;
  overrideReason?: string;
  overrideBy?: string;
  overrideAt?: string;
  updatedAt: string;
}

export interface EvidenceEvent {
  id: string;
  candidateId: string;
  organizationId?: string;
  capabilityName: string;
  eventType:
    | 'claim_extracted'
    | 'evidence_added'
    | 'assessment_completed'
    | 'interview_evaluated'
    | 'manual_override'
    | 'coding_challenge_completed'
    | 'transfer_test_completed'
    | 'project_verified'
    | 'evidence_requested';
  title?: string;
  sourceType?: EvidenceSourceType;
  description: string;
  actorName: string;
  actorRole: string;
  score?: number;
  state?: 'supports' | 'partially_supports' | 'contradicts' | 'inconclusive';
  reliabilityWeight?: number;
  stageName?: 'Resume' | 'Project' | 'Assessment' | 'Coding' | 'Interview' | 'Transfer Test' | 'Observation';
  details?: Record<string, any>;
  timestamp: string;
}

export interface EvidenceRequestPayload {
  candidateId: string;
  jobId: string;
  capabilityName: string;
  requestType: 'coding_challenge' | 'take_home_project' | 'transfer_test' | 'written_explanation' | 'custom_probe';
  instructions: string;
  dueInDays?: number;
  urgency?: 'normal' | 'high';
}

export interface ProofOfSkillEvaluation {
  candidateId: string;
  jobId?: string;
  capabilities: CandidateCapability[];
  overallVerificationRate: number;
  verifiedCount: number;
  partiallyVerifiedCount: number;
  insufficientCount: number;
  contradictedCount: number;
  evaluatedAt: string;
}

// ================= ADAPTIVE ASSESSMENT ENGINE (PHASE 5) =================
export type AssessmentLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const ASSESSMENT_LEVEL_LABELS: Record<AssessmentLevel, string> = {
  1: 'Knowledge',
  2: 'Application',
  3: 'Debugging',
  4: 'Scenario',
  5: 'Transfer',
  6: 'Explanation',
};

export type AssessmentType =
  | 'mcq'
  | 'coding'
  | 'debugging'
  | 'scenario'
  | 'architecture'
  | 'written_explanation'
  | 'transfer_challenge';

export interface AssessmentTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface AssessmentRubricCriterion {
  criteria: string;
  maxPoints: number;
  description: string;
}

export interface AssessmentChallenge {
  id: string;
  capabilityName: string;
  category: CapabilityCategory;
  level: AssessmentLevel;
  levelName: string;
  type: AssessmentType;
  title: string;
  prompt: string;
  contextScenario?: string;
  starterCode?: string;
  testCases?: AssessmentTestCase[];
  options?: { id: string; text: string; isCorrect?: boolean }[];
  evaluationRubric: AssessmentRubricCriterion[];
  timeLimitSeconds: number;
  transferConcept?: string;
}

export interface AssessmentAttempt {
  id: string;
  challengeId: string;
  candidateId: string;
  capabilityName: string;
  level: AssessmentLevel;
  submittedAnswer: string;
  submittedCode?: string;
  timeSpentSeconds: number;
  score: number;
  isPassed: boolean;
  feedback: string;
  rubricScores?: { criteria: string; score: number; maxPoints: number; comment: string }[];
  evaluatedAt: string;
}

export interface AssessmentSession {
  id: string;
  candidateId: string;
  jobId: string;
  organizationId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentChallengeIndex: number;
  totalChallengesCount: number;
  currentChallenge?: AssessmentChallenge;
  attempts: AssessmentAttempt[];
  uncertaintyBefore: number;
  uncertaintyAfter?: number;
  capabilityImpact: {
    capabilityName: string;
    initialConfidence: number;
    updatedConfidence: number;
    state: VerificationState;
  }[];
  startedAt: string;
  completedAt?: string;
}

export interface UncertaintyMetrics {
  candidateId: string;
  overallUncertaintyScore: number;
  competencies: {
    capabilityName: string;
    importance: CapabilityImportance;
    confidenceScore: number;
    uncertaintyScore: number;
    priorityScore: number;
    recommendedLevel: AssessmentLevel;
  }[];
}

// ================= ADAPTIVE AI INTERVIEW ENGINE (PHASE 6) =================
export type InterviewMode =
  | 'structured_recruiter'
  | 'ai_assisted'
  | 'candidate_self_recorded'
  | 'human_interviewer_notes'
  | 'combined_evaluation';

export interface DetectedClaim {
  claim: string;
  category: 'architectural' | 'technical_skill' | 'performance_metric' | 'tradeoff' | 'tooling';
  verificationSignal: 'supported' | 'unsupported' | 'needs_probing';
}

export interface InterviewTurn {
  id: string;
  capabilityName: string;
  questionText: string;
  questionType: 'primary' | 'follow_up' | 'recruiter_custom';
  candidateResponse?: string;
  detectedClaims?: DetectedClaim[];
  detectedEvidence?: string[];
  uncertaintyIdentified?: string;
  followUpRecommendations?: {
    id: string;
    question: string;
    rationale: string;
  }[];
  turnEvaluation?: {
    technicalReasoningScore: number;
    explanationDepthScore: number;
    consistencyScore: number;
    feedback: string;
  };
  timestamp: string;
}

export interface InterviewPlan {
  id: string;
  jobId: string;
  candidateId: string;
  plannedCompetencies: {
    capabilityName: string;
    keyProbeQuestions: string[];
    targetProficiency: ProficiencyLevel;
  }[];
}

export interface CombinedInterviewEvaluation {
  technicalReasoning: number;
  problemSolving: number;
  communication: number;
  explanationQuality: number;
  adaptability: number;
  consistency: number;
  summary: string;
  recommendationNotes: string;
  evaluatedAt: string;
}

export interface InterviewSessionState {
  id: string;
  interviewId?: string;
  applicationId?: string;
  candidateId: string;
  jobId: string;
  organizationId: string;
  mode: InterviewMode;
  status: 'scheduled' | 'in_progress' | 'completed';
  plan: InterviewPlan;
  currentTurnIndex: number;
  turns: InterviewTurn[];
  interviewerNotes?: string;
  combinedEvaluation?: CombinedInterviewEvaluation;
  privacyRetentionDays: number;
  startedAt?: string;
  completedAt?: string;
}

// ================= CAPABILITY FINGERPRINT & GROWTH POTENTIAL (PHASE 7) =================
export type FingerprintDimension =
  | 'technical_capability'
  | 'problem_solving'
  | 'debugging'
  | 'system_design'
  | 'communication'
  | 'adaptability'
  | 'transferability'
  | 'ai_collaboration';

export interface DimensionScore {
  dimension: FingerprintDimension;
  label: string;
  score: number;
  confidence: number;
  evidenceCount: number;
  evidenceSummary: string;
}

export interface ExplainabilityTrace {
  sourceType: string;
  eventTitle: string;
  scoreImpact: number;
  rationale: string;
  timestamp: string;
}

export interface CapabilityGrowthMetric {
  capabilityName: string;
  category: CapabilityCategory;
  currentCapability: number;
  evidenceConfidence: number;
  evidenceState: VerificationState;
  freshnessStatus: 'active_last_30_days' | 'recent_last_6_months' | 'stale_over_1_year';
  freshnessDate: string;
  growthPotential: number;
  growthEvidence: string[];
  traces: ExplainabilityTrace[];
}

export interface CapabilityFingerprint {
  candidateId: string;
  candidateName: string;
  jobId?: string;
  dimensions: DimensionScore[];
  capabilities: CapabilityGrowthMetric[];
  overallGrowthPotential: number;
  learningVelocityScore: number;
  evaluatedAt: string;
}

export type DecisionReadiness =
  | 'ready_for_offer'
  | 'needs_targeted_verification'
  | 'insufficient_evidence'
  | 'not_recommended';

export interface CandidateComparisonItem {
  candidateId: string;
  candidateName: string;
  overallMatchScore: number;
  averageConfidence: number;
  overallGrowthPotential: number;
  decisionReadiness: DecisionReadiness;
  keyStrengths: string[];
  criticalGaps: string[];
  dimensionScores: Record<FingerprintDimension, number>;
  capabilityScores: Record<
    string,
    { current: number; confidence: number; growth: number; state: VerificationState }
  >;
}

export interface CandidateComparisonReport {
  jobId: string;
  jobTitle: string;
  candidates: CandidateComparisonItem[];
  evaluatedAt: string;
}

// ================= CONSISTENCY & DECISION INTELLIGENCE (PHASE 8) =================
export type ConsistencyCategory =
  | 'consistent_evidence'
  | 'unsupported_claim'
  | 'conflicting_evidence'
  | 'missing_evidence'
  | 'stale_evidence';

export type DecisionReadinessState =
  | 'READY'
  | 'MOSTLY_READY'
  | 'INSUFFICIENT_EVIDENCE'
  | 'REQUIRES_REVIEW';

export type NextBestActionType =
  | 'technical_follow_up'
  | 'debugging_challenge'
  | 'architecture_challenge'
  | 'behavioral_interview'
  | 'verification_question'
  | 'transfer_test';

export interface NextBestAction {
  id: string;
  actionType: NextBestActionType;
  title: string;
  targetCapability: string;
  rationale: string;
  estimatedInformationGain: number; // 0-100%
  recommendedStage: ApplicationStage;
}

export interface CapabilityConsistencyItem {
  capabilityName: string;
  category: CapabilityCategory;
  consistencyStatus: ConsistencyCategory;
  sourcesBreakdown: {
    resume: boolean;
    projects: boolean;
    assessments: boolean;
    interviews: boolean;
    observations: boolean;
  };
  confidenceScore: number;
  explanation: string;
  recommendedAction?: NextBestAction;
}

export interface DecisionReadinessEvaluation {
  candidateId: string;
  jobId: string;
  readinessState: DecisionReadinessState;
  readinessScore: number; // 0 - 100%
  explanation: string;
  consistencyItems: CapabilityConsistencyItem[];
  nextBestActions: NextBestAction[];
  verifiedCount: number;
  unsupportedCount: number;
  conflictingCount: number;
  missingCount: number;
  evaluatedAt: string;
}

export type RecruiterDecisionAction =
  | 'advance'
  | 'reject'
  | 'request_more_evidence'
  | 'move_to_interview'
  | 'make_offer';

export interface HumanDecisionRecord {
  id: string;
  candidateId: string;
  jobId: string;
  organizationId: string;
  recruiterId: string;
  recruiterEmail: string;
  action: RecruiterDecisionAction;
  aiAdvisoryState: DecisionReadinessState;
  evidenceStateSnapshot: {
    overallVerificationRate: number;
    verifiedCount: number;
    readinessScore: number;
  };
  reason: string; // Mandatory justification
  timestamp: string;
}

// Configurable 8-Stage Pipeline Definition
export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'assessment'
  | 'interview'
  | 'evaluation'
  | 'offer'
  | 'hired'
  | 'rejected';

export interface PipelineStageConfig {
  id: ApplicationStage;
  label: string;
  order: number;
  color: string;
  isTerminal?: boolean;
}

export const DEFAULT_PIPELINE_STAGES: PipelineStageConfig[] = [
  { id: 'applied', label: 'Applied', order: 1, color: '#64748b' },
  { id: 'screening', label: 'Screening', order: 2, color: '#818cf8' },
  { id: 'assessment', label: 'Assessment', order: 3, color: '#06b6d4' },
  { id: 'interview', label: 'Interview', order: 4, color: '#a855f7' },
  { id: 'evaluation', label: 'Evaluation', order: 5, color: '#ec4899' },
  { id: 'offer', label: 'Offer', order: 6, color: '#3b82f6' },
  { id: 'hired', label: 'Hired 🎉', order: 7, color: '#10b981', isTerminal: true },
  { id: 'rejected', label: 'Rejected', order: 8, color: '#f43f5e', isTerminal: true },
];

export type AIRecommendation = 'strong_hire' | 'hire' | 'consider' | 'unlikely';

export interface AISkillAnalysis {
  skill: string;
  status: 'matched' | 'missing' | 'related';
  proficiencyEstimated?: 'expert' | 'proficient' | 'familiar';
  notes?: string;
}

export interface AIScoreCard {
  overallScore: number;
  recommendation: AIRecommendation;
  summary: string;
  skillMatchPercentage: number;
  skillsAnalysis: AISkillAnalysis[];
  matchedSkills: string[];
  missingSkills: string[];
  experienceScore: number;
  educationScore: number;
  relevanceSummary: string;
  keyStrengths: string[];
  potentialGaps: string[];
  suggestedInterviewQuestions: {
    question: string;
    targetTopic: string;
    expectedInsight: string;
  }[];
  evaluatedAt: string;
  llmModelUsed?: string;
}

export interface CandidateExperience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface CandidateEducation {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  graduationYear?: string | number;
}

export type CandidateStatus = 'active' | 'archived' | 'blacklisted';

export interface CandidateComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  userId?: string;
  organizationId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills: string[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  status: CandidateStatus;
  tags: string[];
  comments: CandidateComment[];
  resumeUrl?: string;
  resumeKey?: string;
  resumeFileName?: string;
  resumeRawText?: string;
  resumeParsingStatus?: 'pending' | 'completed' | 'failed';
  parserMetadata?: Record<string, any>;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationTimelineEvent {
  id: string;
  stage: ApplicationStage;
  title: string;
  description: string;
  timestamp: string;
  actorName: string;
}

export interface ApplicationNote {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface Application {
  id: string;
  organizationId: string;
  jobId: string;
  jobTitle?: string;
  candidateId: string;
  candidate?: Candidate;
  stage: ApplicationStage;
  status: 'active' | 'hired' | 'rejected' | 'withdrawn';
  aiScoreCard?: AIScoreCard;
  notes: ApplicationNote[];
  timeline: ApplicationTimelineEvent[];
  appliedAt: string;
  updatedAt: string;
}

// ================= INTERVIEW MANAGEMENT =================
export type InterviewType = 'screening' | 'technical' | 'behavioral' | 'culture_fit' | 'executive';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface Interview {
  id: string;
  organizationId: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  jobTitle?: string;
  candidateName?: string;
  candidateEmail?: string;
  interviewerNames: string[];
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  location?: string;
  status: InterviewStatus;
  notes?: string;
  feedback?: {
    rating: number;
    recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
    summary: string;
    submittedAt: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================= OFFER MANAGEMENT =================
export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface Offer {
  id: string;
  organizationId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  baseSalary: number;
  currency: string;
  equity?: string;
  bonus?: string;
  startDate: string;
  expirationDate: string;
  customTerms?: string;
  status: OfferStatus;
  sentAt?: string;
  respondedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================= PAGINATION & METRICS =================
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DashboardMetrics {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  totalApplications: number;
  averageAiScore: number;
  upcomingInterviewsCount: number;
  pendingOffersCount: number;
  stageDistribution: {
    stage: ApplicationStage;
    label: string;
    count: number;
    color?: string;
  }[];
  upcomingInterviews: Interview[];
  recentApplications: Application[];
  topScoringCandidates: {
    applicationId: string;
    candidateName: string;
    jobTitle: string;
    overallScore: number;
    recommendation: AIRecommendation;
    stage: ApplicationStage;
  }[];
}

export interface EmailTemplatePayload {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  templateType: 'application_received' | 'interview_invite' | 'job_offer' | 'rejection';
  customMessage?: string;
  interviewDetails?: {
    date: string;
    time: string;
    interviewerName: string;
    meetingLink?: string;
  };
}

export interface TalentSearchParams {
  query: string;
  skills?: string[];
  minExperience?: number;
  location?: string;
  jobId?: string;
}

// ================= LIVING CAPABILITY PASSPORT (PHASE 9) =================
export type PassportCapabilityStatus = 'CLAIMED' | 'DEMONSTRATED' | 'VERIFIED' | 'UNKNOWN';

export type TechnologyVolatility = 'high' | 'medium' | 'low';

export type FreshnessStatus = 'ACTIVE' | 'FRESH' | 'AGING' | 'STALE';

export interface FreshnessEvaluation {
  evidenceDate: string;
  ageInMonths: number;
  volatility: TechnologyVolatility;
  freshnessWindowMonths: number;
  status: FreshnessStatus;
  freshnessScore: number; // 0 - 100
  isReverificationRecommended: boolean;
  recommendationReason?: string;
}

export interface TransferEvidence {
  id: string;
  sourceCapability: string;
  targetCapability: string;
  transferConcept: string;
  transferStrength: number; // 0 - 100
  evidenceSummary: string;
  verifiedAt: string;
}

export interface PassportEvidenceSummary {
  id: string;
  title: string;
  sourceType: EvidenceSourceType;
  summary: string;
  score?: number;
  state: 'supports' | 'partially_supports' | 'contradicts' | 'inconclusive';
  dateRecorded: string;
}

export interface PassportCapabilityItem {
  id: string;
  name: string;
  category: CapabilityCategory;
  status: PassportCapabilityStatus;
  confidenceScore: number; // 0 - 100
  claimedProficiency?: ProficiencyLevel;
  demonstratedProficiency?: ProficiencyLevel;
  freshness: FreshnessEvaluation;
  evidenceList: PassportEvidenceSummary[];
  transferEvidenceList: TransferEvidence[];
  lastVerifiedAt?: string;
  organizationAttestation?: string;
}

export interface CandidateConsentSettings {
  candidateId: string;
  allowCrossJobReuse: boolean;
  allowCrossOrgSharing: boolean;
  excludedOrganizations: string[];
  allowedCapabilities: string[]; // empty means all
  updatedAt: string;
}

export interface CandidatePassport {
  candidateId: string;
  candidateName: string;
  headline?: string;
  passportId: string;
  verificationHash: string;
  verifiedCapabilities: PassportCapabilityItem[];
  demonstratedCapabilities: PassportCapabilityItem[];
  claimedCapabilities: PassportCapabilityItem[];
  unknownCapabilities: PassportCapabilityItem[];
  totalVerifiedCount: number;
  totalDemonstratedCount: number;
  totalClaimedCount: number;
  totalUnknownCount: number;
  averageConfidence: number;
  consent: CandidateConsentSettings;
  lastUpdated: string;
}

export interface EvidenceReuseAnalysis {
  targetJobId: string;
  targetJobTitle: string;
  reusableCapabilities: {
    capabilityName: string;
    confidence: number;
    freshnessStatus: FreshnessStatus;
    evidenceCount: number;
  }[];
  requiredNewAssessments: {
    capabilityName: string;
    importance: CapabilityImportance;
    rationale: string;
  }[];
  assessmentTimeSavedMinutes: number;
  reuseAllowedByConsent: boolean;
  explanation: string;
}

// ================= ANALYTICS & RECRUITMENT INTELLIGENCE (PHASE 11) =================
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export interface AnalyticsFilterParams {
  timeRange?: AnalyticsTimeRange;
  startDate?: string;
  endDate?: string;
  jobId?: string;
  recruiterId?: string;
  department?: string;
}

export interface MetricMetadata {
  id: string;
  name: string;
  category: 'ats' | 'proof_of_ability' | 'recruiter' | 'job_intelligence';
  definition: string;
  calculationFormula: string;
  source: string;
  timeRange: string;
  filtersApplied: Record<string, any>;
}

export interface FunnelStageAnalytics {
  stage: ApplicationStage;
  label: string;
  count: number;
  conversionFromPreviousRate: number; // 0 - 100%
  overallConversionRate: number; // 0 - 100%
  averageTimeInStageDays: number;
  dropOffCount: number;
  color?: string;
}

export interface AssessmentDepthMetric {
  level: AssessmentLevel;
  levelName: string;
  count: number;
  percentage: number;
  averageScore: number;
}

export interface HardestCapabilityMetric {
  capabilityName: string;
  category: CapabilityCategory;
  totalEvaluatedCount: number;
  verifiedCount: number;
  verificationRate: number; // 0 - 100%
  averageEvidenceSources: number;
  primaryBottleneck: string;
  recommendedRemedy: string;
}

export interface RecurringSkillGapMetric {
  capabilityName: string;
  category: CapabilityCategory;
  gapFrequency: number; // 0 - 100% of candidates lack this
  affectedRoles: string[];
  severity: 'critical' | 'high' | 'medium';
}

export interface RecruiterPerformanceMetric {
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  candidatesReviewed: number;
  decisionsRecorded: number;
  pendingDecisions: number;
  averageTimeToDecisionDays: number;
  auditComplianceRate: number; // 100%
  interviewsScheduled: number;
  interviewsCompleted: number;
}

export interface RecruitmentIntelligenceMetrics {
  metadata: Record<string, MetricMetadata>;
  filters: AnalyticsFilterParams;
  atsMetrics: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalCandidates: number;
    funnel: FunnelStageAnalytics[];
    averageTimeToHireDays: number;
    overallFunnelConversionRate: number;
  };
  proofOfAbilityMetrics: {
    totalCapabilitiesEvaluated: number;
    verifiedCapabilitiesCount: number;
    overallVerificationRate: number;
    evidenceGapsCount: number;
    evidenceSufficiencyAverage: number;
    assessmentsGeneratedCount: number;
    adaptiveDepthDistribution: AssessmentDepthMetric[];
    transferTestSuccessRate: number;
    transferTestsAttempted: number;
    decisionReadinessDistribution: Record<DecisionReadinessState, number>;
    candidateReassessmentRate: number;
    evidenceReuseRate: number;
    evidenceBySourceType: {
      sourceType: EvidenceSourceType;
      label: string;
      count: number;
      verificationContribution: number;
    }[];
    capabilityCategoryDistribution: {
      category: CapabilityCategory;
      label: string;
      verified: number;
      partial: number;
      insufficient: number;
      conflicting: number;
    }[];
  };
  recruiterMetrics: {
    averageTimeToDecisionDays: number;
    candidatesReviewedTotal: number;
    pendingDecisionsTotal: number;
    interviewCompletionRate: number;
    assessmentCompletionRate: number;
    recruiters: RecruiterPerformanceMetric[];
  };
  jobAnalytics: {
    hardestCapabilitiesToVerify: HardestCapabilityMetric[];
    recurringSkillGaps: RecurringSkillGapMetric[];
    evidenceInsufficiencyByStage: {
      stage: ApplicationStage;
      label: string;
      insufficiencyCount: number;
      primaryReason: string;
    }[];
    assessmentEffectivenessScore: number;
  };
  generatedAt: string;
}


