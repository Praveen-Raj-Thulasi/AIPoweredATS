import { Router } from 'express';
import multer from 'multer';

import { authController, registerSchema, loginSchema, refreshTokenSchema } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { organizationController } from '../controllers/organization.controller';
import { adminController } from '../controllers/admin.controller';
import { auditController } from '../controllers/audit.controller';
import * as jobController from '../controllers/job.controller';
import * as candidateController from '../controllers/candidate.controller';
import * as applicationController from '../controllers/application.controller';
import * as interviewController from '../controllers/interview.controller';
import * as offerController from '../controllers/offer.controller';
import * as storageController from '../controllers/storage.controller';
import * as aiController from '../controllers/ai.controller';
import * as analyticsController from '../controllers/analytics.controller';
import * as capabilityController from '../controllers/capability.controller';
import * as proofOfSkillController from '../controllers/proof-of-skill.controller';
import * as assessmentController from '../controllers/assessment.controller';
import * as fingerprintController from '../controllers/fingerprint.controller';
import * as decisionController from '../controllers/decision.controller';
import * as passportController from '../controllers/passport.controller';

import { requireAuth, requireRoles, requireOrganizationIsolation } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { authLimiter, aiLimiter, uploadLimiter } from '../middlewares/security.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

// ================= STORAGE SECURE DOWNLOAD =================
router.get('/storage/download', storageController.downloadSecureFile);

// ================= AUTH ROUTES (/api/v1/auth) =================
const authRouter = Router();
authRouter.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
authRouter.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);
authRouter.post('/logout', requireAuth, authController.logout);
authRouter.get('/me', requireAuth, authController.getMe);
router.use('/auth', authRouter);

// ================= USER ROUTES (/api/v1/users) =================
const userRouter = Router();
userRouter.use(requireAuth);
userRouter.get('/profile', userController.getProfile);
userRouter.patch('/profile', userController.updateProfile);
userRouter.post('/change-password', userController.changePassword);
userRouter.get('/organization-members', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, userController.listOrganizationMembers);
router.use('/users', userRouter);

// ================= ORGANIZATION ROUTES (/api/v1/organizations) =================
const orgRouter = Router();
orgRouter.use(requireAuth);
orgRouter.use(requireRoles('recruiter', 'admin'));
orgRouter.get('/current', requireOrganizationIsolation, organizationController.getCurrentOrganization);
orgRouter.patch('/current', requireOrganizationIsolation, organizationController.updateCurrentOrganization);
router.use('/organizations', orgRouter);

// ================= ADMIN ROUTES (/api/v1/admin) =================
const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use(requireRoles('admin'));
adminRouter.get('/overview', adminController.getSystemOverview);
adminRouter.get('/users', adminController.getAllUsers);
adminRouter.patch('/users/:id/status', adminController.updateUserStatus);
adminRouter.patch('/users/:id/role', adminController.updateUserRole);
adminRouter.get('/organizations', adminController.getAllOrganizations);
adminRouter.get('/audits', auditController.getAuditLogs);
router.use('/admin', adminRouter);


// ================= JOB ROUTES (/api/v1/jobs) =================
const jobRouter = Router();
jobRouter.get('/', requireAuth, requireOrganizationIsolation, jobController.getJobs);
jobRouter.get('/public', jobController.getJobs); // Public listing for open jobs
jobRouter.get('/:id', requireAuth, requireOrganizationIsolation, jobController.getJobById);
jobRouter.post('/', requireAuth, requireRoles('recruiter', 'admin'), requireOrganizationIsolation, jobController.createJob);
jobRouter.post('/:id/duplicate', requireAuth, requireRoles('recruiter', 'admin'), requireOrganizationIsolation, jobController.duplicateJob);
jobRouter.post('/:id/archive', requireAuth, requireRoles('recruiter', 'admin'), requireOrganizationIsolation, jobController.archiveJob);
jobRouter.patch('/:id', requireAuth, requireRoles('recruiter', 'admin'), requireOrganizationIsolation, jobController.updateJob);

// Capability Compiler routes (Phase 3)
jobRouter.post('/:id/capabilities/compile', requireAuth, requireRoles('recruiter', 'admin'), requireOrganizationIsolation, capabilityController.compileJobCapabilities);
jobRouter.get('/:id/capabilities', requireAuth, requireOrganizationIsolation, capabilityController.getJobCapabilityModel);
jobRouter.put('/:id/capabilities', requireAuth, requireRoles('recruiter', 'admin'), requireOrganizationIsolation, capabilityController.updateJobCapabilityModel);
jobRouter.post('/:id/capabilities/approve', requireAuth, requireRoles('recruiter', 'admin'), requireOrganizationIsolation, capabilityController.approveJobCapabilityModel);
jobRouter.post('/:id/compare-candidates', requireAuth, requireRoles('recruiter', 'admin'), requireOrganizationIsolation, fingerprintController.compareCandidatesForJob);

router.use('/jobs', jobRouter);

// ================= CANDIDATES ROUTES (/api/v1/candidates) =================
const candidateRouter = Router();
candidateRouter.use(requireAuth);
candidateRouter.get('/', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, candidateController.getCandidates);
candidateRouter.get('/:id', requireOrganizationIsolation, candidateController.getCandidateById);
candidateRouter.post('/upload-resume', uploadLimiter, upload.single('resume'), requireOrganizationIsolation, candidateController.uploadResume);
candidateRouter.post('/:id/comments', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, candidateController.addComment);
candidateRouter.patch('/:id/tags', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, candidateController.updateTags);

// Proof of Skill & Candidate Capability routes (Phase 4, 5, 7, 8, 9)
candidateRouter.get('/:id/capabilities', requireOrganizationIsolation, proofOfSkillController.getCandidateCapabilities);
candidateRouter.get('/:id/fingerprint', requireOrganizationIsolation, fingerprintController.getCandidateFingerprint);
candidateRouter.get('/:id/decision-readiness', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, decisionController.getDecisionReadiness);
candidateRouter.post('/:id/decisions', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, decisionController.recordDecision);
candidateRouter.get('/:id/decisions/history', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, decisionController.getDecisionHistory);
candidateRouter.post('/:id/claims/extract', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, proofOfSkillController.extractClaims);
candidateRouter.post('/:id/evidence', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, proofOfSkillController.addEvidence);
candidateRouter.post('/:id/capabilities/override', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, proofOfSkillController.overrideCapabilityVerification);
candidateRouter.get('/:id/evidence/timeline', requireOrganizationIsolation, proofOfSkillController.getEvidenceTimeline);
candidateRouter.post('/:id/evidence-request', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, proofOfSkillController.requestCandidateEvidence);
candidateRouter.get('/:id/assessments/uncertainty', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, assessmentController.getCandidateUncertainty);

// Living Capability Passport & Evidence Reuse (Phase 9)
candidateRouter.get('/:id/passport', requireOrganizationIsolation, passportController.getCandidatePassport);
candidateRouter.get('/:id/passport/consent', requireOrganizationIsolation, passportController.getConsentSettings);
candidateRouter.patch('/:id/passport/consent', requireOrganizationIsolation, passportController.updateConsentSettings);
candidateRouter.post('/:id/passport/reuse-check', requireOrganizationIsolation, passportController.checkEvidenceReuse);
candidateRouter.post('/:id/passport/freshness-check', requireOrganizationIsolation, passportController.evaluateFreshness);

router.use('/candidates', candidateRouter);

// ================= ADAPTIVE ASSESSMENTS ROUTES (/api/v1/assessments) =================
const assessmentRouter = Router();
assessmentRouter.use(requireAuth);
assessmentRouter.post('/sessions', assessmentController.startSession);
assessmentRouter.get('/sessions/:id', assessmentController.getSessionById);
assessmentRouter.post('/sessions/:id/submit', assessmentController.submitAttempt);

router.use('/assessments', assessmentRouter);

// ================= APPLICATIONS ROUTES (/api/v1/applications) =================
const appRouter = Router();
appRouter.use(requireAuth);
appRouter.get('/', requireOrganizationIsolation, applicationController.getApplications);
appRouter.get('/:id', requireOrganizationIsolation, applicationController.getApplicationById);
appRouter.patch('/:id/stage', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, applicationController.updateApplicationStage);
appRouter.post('/:id/notes', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, applicationController.addApplicationNote);
appRouter.post('/:id/re-evaluate', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, applicationController.reEvaluateApplication);
router.use('/applications', appRouter);

// ================= INTERVIEWS ROUTES (/api/v1/interviews) =================
const interviewRouter = Router();
interviewRouter.use(requireAuth);
interviewRouter.get('/', requireOrganizationIsolation, interviewController.getInterviews);
interviewRouter.post('/', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, interviewController.scheduleInterview);
interviewRouter.patch('/:id', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, interviewController.updateInterview);
interviewRouter.post('/:id/feedback', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, interviewController.submitFeedback);

// Adaptive AI Interview Engine Routes (Phase 6)
import * as interviewSessionController from '../controllers/interview-session.controller';
interviewRouter.post('/sessions', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, interviewSessionController.startInterviewSession);
interviewRouter.get('/sessions/:id', requireOrganizationIsolation, interviewSessionController.getInterviewSessionById);
interviewRouter.post('/sessions/:id/respond', requireOrganizationIsolation, interviewSessionController.recordResponse);
interviewRouter.post('/sessions/:id/accept-followup', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, interviewSessionController.acceptOrAddFollowUp);
interviewRouter.post('/sessions/:id/complete', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, interviewSessionController.completeInterviewSession);

router.use('/interviews', interviewRouter);

// ================= OFFER ROUTES (/api/v1/offers) =================
const offerRouter = Router();
offerRouter.use(requireAuth);
offerRouter.get('/', requireOrganizationIsolation, offerController.getOffers);
offerRouter.post('/', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, offerController.createOffer);
offerRouter.post('/:id/send', requireRoles('recruiter', 'admin'), requireOrganizationIsolation, offerController.sendOffer);
offerRouter.post('/:id/respond', offerController.respondToOffer); // Candidate or Recruiter
router.use('/offers', offerRouter);

// ================= AI ROUTES (/api/v1/ai) =================
const aiRouter = Router();
aiRouter.use(requireAuth);
aiRouter.use(requireRoles('recruiter', 'admin'));
aiRouter.post('/generate-job-description', aiController.generateJobDescription);
aiRouter.post('/semantic-talent-search', aiController.semanticTalentSearch);
aiRouter.post('/send-email', aiController.sendCandidateEmail);
aiRouter.get('/email-history', aiController.getEmailHistory);
router.use('/ai', aiRouter);

// ================= ANALYTICS ROUTES (/api/v1/analytics) =================
const analyticsRouter = Router();
analyticsRouter.use(requireAuth);
analyticsRouter.use(requireRoles('recruiter', 'admin'));
analyticsRouter.use(requireOrganizationIsolation);
analyticsRouter.get('/dashboard', analyticsController.getDashboardAnalytics);
analyticsRouter.get('/recruitment-intelligence', analyticsController.getRecruitmentIntelligence);
router.use('/analytics', analyticsRouter);

export default router;
