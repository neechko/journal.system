# Security and Privacy Baseline

**Status:** Proposed baseline; wajib direview security engineer sebelum production.

## 1. Security principles

- Least privilege and default deny.
- Defense in depth.
- Server-side authorization on every operation.
- Tenant isolation by design and tested at multiple layers.
- Secure defaults for private content.
- Auditable sensitive operations.
- Minimize personal data and retention.

## 2. Identity and session

- Pilih auth/session provider setelah threat model dan ADR.
- Proteksi session cookies (HttpOnly, Secure, appropriate SameSite), rotation/revocation, session expiry, MFA policy untuk privileged roles.
- Jangan simpan access token rahasia di browser storage bila dapat dihindari.
- Protect account recovery, invitations, and role escalation.

## 3. Authorization

- Authenticate != authorize.
- Cek izin pada DAL/use case/Server Action/Route Handler sesuai boundary.
- Terapkan scope platform/organization/journal/manuscript.
- Jangan gunakan client-side gating sebagai security control.
- Review permission changes dengan audit log.

## 4. Data and files

- Manuscripts, reviewer reports, proofs, contracts, and private attachments private by default.
- Validate MIME type, extension, file size, checksum, and safe storage path; consider malware scanning.
- Use short-lived signed URLs or controlled streaming for private files.
- Avoid exposing original file names if they can contain personal/revealing metadata.
- Encrypt data in transit and at rest according to deployment capabilities and risk.
- Define retention/deletion/export policies before production.

## 5. Next.js-specific controls

- Treat Server Actions and Route Handlers as externally invocable request boundaries.
- Validate all arguments at runtime.
- Re-authorize on every invocation, even if the UI hid the action.
- Protect server-only code and secret-bearing modules from client bundles.
- Review caching and revalidation to prevent cross-user/tenant data leakage.
- Review `proxy.ts`, route handlers, file upload routes, and server actions carefully.

## 6. AI-specific safety

- Manuscript and peer-review contents are confidential data. Define whether external AI processing is allowed, by whom, for which models/providers, and under what notice/consent/contract.
- Treat document contents, tool output, OCR, retrieved pages, and metadata as untrusted inputs; prompt injection must not grant tools or permissions.
- Separate AI suggestion from human decision. Record model/provider/version, prompt/template version, actor, source document/version, and human review where AI affects workflow.
- Do not train or fine-tune on customer manuscripts/reviews without explicit lawful authorization.
- Require human confirmation for publish, reject/accept, DOI production deposit, mass email, payment, deletion, or permission changes.

## 7. Abuse and web security

- Rate limit authentication, submission, upload, invite, password reset, expensive search, and public endpoints.
- Add CSRF/origin protections appropriate to the chosen auth/session pattern.
- Apply CSP, secure headers, output encoding, and dependency scanning.
- Protect SSRF in URL imports/webhooks and validate callback destinations.
- Use webhook signature verification, replay protection, and idempotency.

## 8. Compliance discovery

Identify applicable Indonesian personal data protection obligations, customer contracts, institutional policies, cross-border processing, research ethics, and retention requirements with qualified legal/security review. This document is not legal advice and does not declare compliance.
