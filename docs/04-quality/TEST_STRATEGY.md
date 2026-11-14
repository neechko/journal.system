# Test Strategy

**Status:** Proposed baseline

## 1. Test pyramid

### Unit tests

- Domain invariants, policies, state machines, parsers, validators, utility pure functions.
- Tidak memerlukan network atau provider eksternal.

### Integration tests

- Database repositories, transactions, tenant-scoped queries, object storage adapter, queue adapter, webhook handlers.
- Gunakan isolated test DB/bucket/queue namespace; jangan memakai production credentials.

### End-to-end tests

- Sign-in and access boundaries.
- Organization creation and journal setup.
- Submission → screening → review → revision → decision.
- Acceptance → production → publication.
- Public article/issue pages.
- Negative cross-tenant and role access scenarios.

## 2. Required negative tests

- User Tenant A requests resource Tenant B.
- Author requests another author's private submission.
- Reviewer accesses manuscript not assigned to them.
- Reviewer identity exposed in double-blind mode.
- Unauthorized user invokes Server Action/Route Handler directly.
- Malformed/oversized upload and unsupported MIME type.
- Job replay duplicates external action.
- Stale state transition (two editors act concurrently).
- Cache/search returns data from wrong tenant.

## 3. Reliability tests

- Idempotent job retry.
- Outbox reconciliation.
- File checksum and access control.
- DB migration from previous supported version.
- Restore from backup in a non-production environment.

## 4. Tooling (TBD)

- Unit/integration runner: choose in ADR (Vitest is a candidate).
- E2E: Playwright is a candidate.
- Typecheck and lint in CI.
- Dependency and secret scanning in CI.

## 5. Test data

Gunakan fixture sintetis. Jangan memakai manuskrip asli, personal data, email nyata, reviewer identity, API tokens, atau data produksi dalam test fixture.
