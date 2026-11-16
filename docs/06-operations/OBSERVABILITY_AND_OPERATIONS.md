# Observability and Operations

**Status:** Proposed baseline
**Last reviewed:** 2026-11-15

## 1. Observability

- Structured logs with timestamp, severity, service, environment, request/correlation ID, tenant ID where safe, actor type, and event name.
- Do not log passwords, tokens, raw private manuscript text, full reviewer comments, or sensitive personal data.
- Metrics for request latency/error rate, job queue depth/failures, file processing, submission workflow volume, DOI deposit status, and search/index lag.
- Distributed tracing for web → application → DB/queue/integration when useful.
- Alert on sustained error spikes, failed critical jobs, storage failures, backup failures, and security anomalies.

## 2. Background jobs

- Job schema has version, tenant scope, correlation ID, idempotency key, created-at, attempts, and safe payload.
- Retry only transient errors with bounded backoff.
- Permanent failure routes to dead-letter/reconciliation process.
- Never include full manuscript/review text in queue payload if a record reference is enough.

## 3. Backups and recovery

- Define RPO/RTO before production.
- Back up database and object storage; test restore in a separate environment.
- Document point-in-time recovery, key management, retention, and access procedures.
- A successful backup job is not proof that recovery works; perform restore drills.

## 4. Release discipline

- Separate development, staging, and production.
- Use migrations compatible with rolling deployments where applicable.
- Feature flags for risky/gradual rollout; flags must not become permanent hidden configuration.
- Maintain rollback/forward-fix plan for each risky release.
- Never point agent/test environments at production by default.

## 5. Continuous integration

The GitHub Actions workflow at `.github/workflows/web-quality.yml` runs the web
application's lint, type-check, PGlite-backed tests, and production build on
pushes, pull requests, and manual dispatch. It uses read-only repository
permissions and does not require production credentials or an external
database.

## 6. Operational runbooks to add

- Database unavailable.
- Queue backlog / worker stalled.
- Object storage unavailable.
- Email provider failure.
- Search index stale/rebuild.
- DOI deposit failed/reconciliation.
- Data breach/privacy incident.
- Restore from backup.
