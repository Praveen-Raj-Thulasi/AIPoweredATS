# VERITY ATS — REST API Specification & Architecture Overview

**Base Path**: `/api/v1` (with `/api` alias for backwards compatibility)  
**Security Standard**: Bearer JWT / HTTP-only secure cookie authentication, Role-Based Access Control, and Multi-Tenant Organization Isolation.

---

## 1. Authentication & Session Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | 15 / 15m | Registers candidate or recruiter with initial organization creation. |
| `POST` | `/auth/login` | Public | 15 / 15m | Authenticates user; issues access JWT and HTTP-only refresh token. |
| `POST` | `/auth/refresh` | Public | 15 / 15m | Single-use refresh token rotation; invalidates old refresh token. |
| `POST` | `/auth/logout` | Authenticated | Standard | Blacklists current access & refresh tokens in Redis/memory. |
| `GET` | `/auth/me` | Authenticated | Standard | Returns authenticated user profile and organization context. |

---

## 2. Job Requisitions & Capability Models (`/api/v1/jobs`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/jobs` | Recruiter / Admin | Lists jobs scoped to caller's organization. |
| `GET` | `/jobs/public` | Public | Public career portal listing for active open roles. |
| `POST` | `/jobs` | Recruiter / Admin | Creates a new job requisition. |
| `GET` | `/jobs/:id` | Recruiter / Admin | Retrieves job details by ID. |
| `PATCH` | `/jobs/:id` | Recruiter / Admin | Updates job requisition details. |
| `POST` | `/jobs/:id/capabilities/compile` | Recruiter / Admin | Triggers AI compilation of JD into multi-dimensional capabilities. |
| `GET` | `/jobs/:id/capabilities` | Recruiter / Admin | Retrieves compiled Capability Model with versioning & relationship graph. |
| `PUT` | `/jobs/:id/capabilities` | Recruiter / Admin | Modifies capability model requirements, weights, and thresholds. |
| `POST` | `/jobs/:id/capabilities/approve` | Recruiter / Admin | Locks and approves Capability Model for candidate screening. |
| `POST` | `/jobs/:id/compare-candidates` | Recruiter / Admin | Produces multidimensional structured candidate comparison. |

---

## 3. Candidates, Claims & Proof of Ability (`/api/v1/candidates`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/candidates` | Recruiter / Admin | Lists candidate profiles scoped to organization. |
| `GET` | `/candidates/:id` | Recruiter / Candidate | Retrieves candidate profile (private recruiter notes stripped for candidates). |
| `POST` | `/candidates/upload-resume` | Authenticated | Uploads PDF/DOCX resume to private S3 with MIME validation. |
| `POST` | `/candidates/:id/claims/extract` | Recruiter / Admin | Extracts structured technical claims from uploaded resume. |
| `GET` | `/candidates/:id/capabilities` | Recruiter / Candidate | Returns candidate's evaluated capability matrix. |
| `POST` | `/candidates/:id/evidence` | Recruiter / Admin | Adds cross-stage evidence item (coding task, interview, transfer test). |
| `POST` | `/candidates/:id/capabilities/override` | Recruiter / Admin | Records audited manual capability override with mandatory rationale. |
| `GET` | `/candidates/:id/fingerprint` | Recruiter / Admin | Returns 8-dimensional Capability Fingerprint and growth metrics. |
| `GET` | `/candidates/:id/decision-readiness` | Recruiter / Admin | Evaluates candidate hiring readiness state with next-best actions. |
| `POST` | `/candidates/:id/decisions` | Recruiter / Admin | Records human-in-the-loop deliberation decision in immutable ledger. |

---

## 4. Living Capability Passport & Evidence Reuse (`/api/v1/candidates/:id/passport`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/candidates/:id/passport` | Recruiter / Candidate | Generates cryptographically verified Living Capability Passport. |
| `GET` | `/candidates/:id/passport/consent` | Recruiter / Candidate | Retrieves candidate's data sharing consent policies. |
| `PATCH` | `/candidates/:id/passport/consent` | Candidate / Admin | Updates candidate data sharing consent preferences. |
| `POST` | `/candidates/:id/passport/reuse-check` | Recruiter / Admin | Evaluates historical evidence applicability for target job requisition. |
| `POST` | `/candidates/0/passport/freshness-check` | Authenticated | Computes exponential decay curve and reassessment necessity. |

---

## 5. Adaptive Assessments & AI Interviews (`/api/v1/assessments`, `/api/v1/interviews`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/assessments/sessions` | Authenticated | Starts adaptive assessment session targeting highest-uncertainty competencies. |
| `POST` | `/assessments/sessions/:token/attempt` | Authenticated | Submits candidate challenge solution; deterministic scoring & adaptation. |
| `POST` | `/interviews` | Recruiter / Admin | Schedules technical interview panel with meeting links. |
| `POST` | `/interviews/sessions/start` | Recruiter / Admin | Launches AI technical probing engine session linked to Capability Model. |
| `POST` | `/interviews/sessions/:id/turn` | Recruiter / Admin | Submits candidate spoken response; generates targeted follow-up probes. |

---

## 6. Recruitment Intelligence & Compliance (`/api/v1/analytics`, `/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/dashboard` | Recruiter / Admin | High-level pipeline summary counts. |
| `GET` | `/analytics/recruitment-intelligence` | Recruiter / Admin | Server-aggregated funnel dwell times, Bloom depth L1-L6, hardest capabilities. |
| `GET` | `/admin/overview` | Admin Only | Global system health, tenant counts, and role metrics. |
| `GET` | `/admin/audits` | Admin Only | Multi-attribute queryable audit trail for compliance verification. |
