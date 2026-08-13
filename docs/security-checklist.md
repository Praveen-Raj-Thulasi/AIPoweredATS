# VERITY ATS — Production Security Checklist & Quality Verification

This checklist verifies all security controls across the VERITY architecture prior to production deployment.

---

## 1. Authentication & Session Verification

- [x] **Secure Password Hashing**: Passwords hashed with bcrypt using 12 salt rounds.
- [x] **Password Complexity Rules**: Minimum 8 characters with required uppercase, lowercase, and numeric characters.
- [x] **JWT Access Token Expiration**: Short-lived access tokens (15 minutes).
- [x] **JWT Refresh Token Rotation**: Single-use refresh tokens with automatic revocation of used tokens.
- [x] **Logout Token Blacklisting**: Access and refresh tokens blacklisted in Redis/memory upon logout.
- [x] **Account Status Validation**: `status === 'active'` verified against database on every authenticated API call.

---

## 2. Authorization & Tenant Isolation

- [x] **Multi-Tenant Organization Scoping**: Recruiter queries scoped strictly to authenticated `req.organizationId`.
- [x] **Candidate Profile Isolation**: Candidates restricted from accessing other candidates' profiles, applications, or passports.
- [x] **Role-Based Access Control**: `requireRoles('recruiter', 'admin')` and `requireRoles('admin')` enforced on privileged endpoints.
- [x] **Mass Assignment / Ownership Guard**: Client-supplied `organizationId`, `userId`, `role`, and `status` stripped from mutation bodies for non-admins.

---

## 3. API & Web Application Defenses

- [x] **NoSQL Injection Protection**: Recursive stripping of MongoDB operator keys (`$` and `.`) from query parameters, params, and JSON bodies.
- [x] **XSS Input Sanitization**: HTML entity escaping on incoming candidate strings.
- [x] **Tiered Rate Limiting**:
  - Auth routes: 15 attempts / 15 minutes.
  - AI inference routes: 40 requests / 1 minute.
  - File upload routes: 25 uploads / 15 minutes.
  - General API: 300 requests / 15 minutes.
- [x] **HTTP Security Headers**: Helmet configured with HSTS (`31536000s`), X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).
- [x] **Payload Size Limits**: Strict 2MB limit on JSON bodies and 10MB on file uploads.

---

## 4. File Storage & S3 Hardening

- [x] **Private Buckets**: S3 buckets configured with Public Access Block enabled.
- [x] **Server-Side Encryption**: Default SSE-KMS / AES256 encryption at rest.
- [x] **Time-Limited Pre-signed URLs**: Direct S3 transfers via 15-minute TTL signed URLs.
- [x] **Path Traversal Defense**: Filenames sanitized to strip `../`, null bytes, and non-printable characters; storage keys generated using cryptographic UUIDs.
- [x] **MIME & Extension Cross-Validation**: Restricted to allowed documents (`PDF`, `DOCX`, `TXT`, `JSON`, `PNG`, `JPG`); hard block on executable extensions (`.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.py`, `.php`, etc.).

---

## 5. AI Security & Untrusted Content Handling

- [x] **Prompt Injection Defense**: Neutralizes instruction override phrases (`IGNORE ALL PREVIOUS INSTRUCTIONS`), roleplay triggers, and delimiter evasions.
- [x] **Boundary Encapsulation**: Untrusted candidate content wrapped in immutable `<untrusted_candidate_data>` XML tags.
- [x] **Declarative Output Verification**: Verifies model responses contain zero executable shell commands, database drop statements, or eval invocations.
- [x] **AI Output Schema Validation**: All AI responses strictly validated against Zod schemas prior to persistence.
- [x] **Prompt Privacy & Redaction**: Passwords, tokens, and PII stripped from logs and telemetry.

---

## 6. Audit Trail & Compliance

- [x] **Authentication Audit Logs**: `auth.register`, `auth.login_success`, `auth.login_failed`, `auth.login_blocked`, `auth.logout`.
- [x] **Role & Privilege Audit Logs**: `admin.update_user_role`, `admin.update_user_status`.
- [x] **Deliberation & Decision Logs**: `decision.recorded`, `evidence.added`, `evidence.override`, `offer.sent`, `offer.responded`.
- [x] **Audit Query API**: Role-restricted endpoint `GET /api/v1/admin/audits` for compliance review.
