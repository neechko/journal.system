# Open Decision Register

Catat keputusan produk/teknis yang belum final. Tambahkan owner dan due date saat tim terbentuk.

| ID | Pertanyaan | Opsi awal | Risiko jika ditunda | Owner | Status |
|---|---|---|---|---|---|
| Q-001 | Nama produk dan positioning komersial? | TBD | Branding/UX tidak konsisten | TBD | Open |
| Q-002 | Auth/session provider? | Managed auth vs self-hosted; identity provider TBD | Security and implementation choices | TBD | Open |
| Q-003 | ORM/query layer? | Drizzle proposed for evaluation; Prisma remains an alternative | Schema ownership and query patterns | TBD | Open |
| Q-004 | Queue/worker tooling? | Redis-backed queue candidate | Retry/idempotency architecture | TBD | Open |
| Q-005 | File storage provider? | S3-compatible object storage | Privacy, cost, retention | TBD | Open |
| Q-006 | Tenant database isolation? | Shared PostgreSQL schema + verified tenant scope proposed; evaluate RLS separately | Isolation and ops cost | TBD | Open |
| Q-007 | Article canonical content model? | Structured internal schema + JATS adapters | Migration and publishing fidelity | TBD | Open |
| Q-008 | Editorial review policies? | Configurable workflow per journal | Product complexity | TBD | Open |
| Q-009 | Domain and custom domain model? | Subdomain first, custom domain later | Routing and certificate operations | TBD | Open |
| Q-010 | AI provider and data policy? | Disabled by default for confidential content | Privacy/legal/contract risk | TBD | Open |
| Q-011 | DOI deposit responsibility and approval? | Manual approval at launch | Incorrect public metadata | TBD | Open |
| Q-012 | Billing/APC/subscription scope? | Exclude from initial MVP pending discovery | Commercial architecture | TBD | Open |
| Q-013 | Scale targets (journals/submissions/traffic)? | TBD | Capacity planning impossible | TBD | Open |
| Q-014 | RPO/RTO, SLA, data residency? | TBD | Production readiness risk | TBD | Open |
