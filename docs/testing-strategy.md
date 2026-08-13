# VERITY ATS — Production Testing Strategy & QA Architecture

This document defines the comprehensive Quality Assurance (QA) and testing methodology for the VERITY Applicant Tracking System.

---

## 1. Testing Philosophy & Quality Gates

VERITY enforces a multi-tiered testing strategy designed to eliminate regressions, guarantee multi-tenant data isolation, protect against AI hallucinations/injections, and verify sub-second operational performance.

```
       +---------------------------------------------+
       |           End-to-End User Journeys          |  (Critical Recruiter & Candidate Flows)
       +---------------------------------------------+
       |          Integration & API Test Suite       |  (REST Endpoints, RBAC, Multi-Tenancy)
       +---------------------------------------------+
       |        Deterministic Mocked AI Harness      |  (Schema Validation, Injection, Resiliency)
       +---------------------------------------------+
       |         Domain Unit & Calculation Tests     |  (Confidence, Freshness, Uncertainty Math)
       +---------------------------------------------+
```

### Pre-Deployment Quality Gates
Every release must satisfy the following zero-tolerance quality gates:
1. **Zero TypeScript Compiler Errors**: `tsc` clean build across `@ats/server`, `@ats/client`, and `@ats/shared`.
2. **100% Test Suite Pass Rate**: All 13 Jest test suites must pass without skipped or failing tests.
3. **No Unsanitized LLM Ingestion**: All user documents must pass through `aiSecurityService` prompt sanitization.
4. **Token Revocation Verification**: JWT access and refresh tokens must be actively blacklisted upon logout.
5. **No Exposed Secrets**: Zero hardcoded credentials or unmasked PII in logs.

---

## 2. Test Suite Architecture

| Test Suite File | Test Category | Target Coverage |
| :--- | :--- | :--- |
| `tests/auth.test.ts` | Authentication & RBAC | Registration, Bcrypt password complexity, Login, JWT verification, Refresh, Logout invalidation. |
| `tests/core-ats.test.ts` | Core ATS Workflows | Requisitions, Applications, 8-Stage Pipeline transitions, Interviews, Offer letters. |
| `tests/capability-compiler.test.ts` | AI Capability Compiler | Multi-dimensional JD parsing, Zod schema validation, Recruiter approval workflow, Org isolation. |
| `tests/proof-of-skill.test.ts` | Proof of Ability Engine | Multi-source evidence events, Corroboration synthesis, Confidence scoring, Recruiter overrides. |
| `tests/adaptive-assessment.test.ts` | Adaptive Coding Challenges | Information gain uncertainty prioritization, Deterministic test case execution, Bloom taxonomy depth. |
| `tests/adaptive-interview.test.ts` | AI Technical Probing | Claim extraction from spoken answers, Dynamic follow-up synthesis, Human-in-the-loop overrides. |
| `tests/capability-fingerprint.test.ts` | Capability Fingerprint | 8-dimensional capability fingerprinting, Growth velocity modeling, Side-by-side candidate comparison. |
| `tests/decision-intelligence.test.ts` | Recruiter Decision Space | Decision readiness calculation (`READY`, `MOSTLY_READY`, `INSUFFICIENT_EVIDENCE`), Audit history. |
| `tests/passport-and-freshness.test.ts` | Living Passport & Freshness | Exponential evidence decay curves (half-life calculations), Cross-job evidence reuse, Privacy consent. |
| `tests/analytics-intelligence.test.ts` | Recruitment Intelligence | Server-side 7-stage funnel dwell times, Conversion drop-offs, Hardest capabilities, Metric metadata. |
| `tests/ai-resilience.test.ts` | AI Security & Resiliency | Prompt injection neutralization, Delimiter escaping, Boundary encapsulation, Cost tracking, Prompt caching. |
| `tests/security-hardening.test.ts` | Security & Input Defense | Session blacklisting, Single-use refresh token rotation, NoSQL operator stripping, S3 file validation. |
| `tests/e2e-critical-journeys.test.ts` | End-to-End Simulations | Complete Recruiter deliberation flow & Candidate application-to-passport lifecycle. |

---

## 3. Mocked AI Test Harness

To ensure test determinism, sub-second test execution, and zero cost in CI/CD pipelines, automated tests run against `DevelopmentAIProvider` and `aiSecurityService` rather than live AWS Bedrock invocations.

### Resiliency Scenarios Tested
- **Prompt Injection**: Injection patterns like `IGNORE ALL PREVIOUS INSTRUCTIONS` are neutralized to `[FILTERED_INSTRUCTION_OVERRIDE]`.
- **Dangerous Output**: Shell commands (`rm -rf`, `sudo`, `curl | sh`) in AI responses are flagged and blocked by `validateSafeDeclarativeOutput`.
- **Malformed Responses**: Schemas missing required attributes are rejected by Zod validators.
- **Budget Exceeded**: Requests exceeding monthly tenant budgets trigger automatic fallback to offline providers.

---

## 4. Running the Test Suite

```bash
# Run all server test suites
npm test --workspace=server

# Run a specific test suite
npm test --workspace=server -- tests/e2e-critical-journeys.test.ts

# Run production build validation
npm run build
```
