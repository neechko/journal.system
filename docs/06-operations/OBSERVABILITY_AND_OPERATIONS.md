# Observability and Operations

**Status:** Proposed baseline
**Last reviewed:** 2026-11-19

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

`cd-production.yml` hanya berjalan lewat manual dispatch dengan input
konfirmasi `deploy` dan environment `production`. Workflow mengulang lint,
typecheck, test, dan build sebelum migrasi dan deploy. Migrasi serta deploy
berada dalam satu job berurutan agar aplikasi baru tidak berjalan sebelum
skema kompatibel tersedia. Migrasi harus diperiksa sebelum release, termasuk
dampak pada data lama dan rencana pemulihan. Merge ke `main` tidak dengan
sendirinya menjalankan migrasi atau deploy lewat workflow ini.
`db-migrate.yml` hanya dapat dijalankan manual untuk perbaikan operasional;
workflow itu tidak lagi berpacu dengan deploy pada setiap push.

Vercel project memakai Root Directory `apps/web`. Perintah `vercel pull`,
`vercel build`, dan `vercel deploy --prebuilt` dalam GitHub Actions dijalankan
dari root repository agar CLI tidak mencoba `apps/web/apps/web`. Perintah npm
untuk aplikasi tetap berjalan dari `apps/web`. Preview PR harus berhasil sebelum
merge; perubahan `.env.local` tidak mengubah GitHub Actions Secrets atau
environment variables di Vercel secara otomatis.

Quality, Chromatic, dan Vercel preview pada draft PR telah lulus pada
2026-11-19. Preview merespons HTTP 200, tetapi belum memiliki database dan
provider login terisolasi. Hasil itu belum memenuhi gate release produksi.

## 6. Operational runbooks to add

- Database unavailable.
- Queue backlog / worker stalled.
- Object storage unavailable.
- Email provider failure.
- Search index stale/rebuild.
- DOI deposit failed/reconciliation.
- Data breach/privacy incident.
- Restore from backup.
