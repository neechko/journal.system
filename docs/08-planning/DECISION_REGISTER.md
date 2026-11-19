# Open Decision Register

Catat keputusan produk/teknis yang belum final. Tambahkan owner dan due date saat tim terbentuk.

| ID | Pertanyaan | Opsi awal | Risiko jika ditunda | Owner | Status |
|---|---|---|---|---|---|
| Q-001 | Nama produk dan positioning komersial? | TBD | Branding/UX tidak konsisten | TBD | Open |
| Q-002 | Provider login publik (OIDC) mana yang dipakai? `AUTH_SECRET`, `AUTH_OIDC_ISSUER`, `AUTH_OIDC_CLIENT_ID`, dan `AUTH_OIDC_CLIENT_SECRET` masih kosong, sehingga alur login belum dapat diuji. | Auth.js dengan OIDC terkelola (mis. Google Workspace, Microsoft Entra, atau Keycloak milik sendiri); SSO institusi ditunda | Alur author, reviewer, dan editor tetap tidak terverifikasi | TBD | Open |
| Q-003 | ORM/query layer? | Drizzle proposed for evaluation; Prisma remains an alternative | Schema ownership and query patterns | TBD | Open |
| Q-004 | Queue/worker tooling? | Redis-backed queue candidate | Retry/idempotency architecture | TBD | Open |
| Q-005 | File storage provider? | S3-compatible object storage | Privacy, cost, retention | TBD | Open |
| Q-005a | Storage manuskrip privat untuk produksi? Local storage hanya aktif saat `NODE_ENV !== "production"`, jadi unggah/unduh 503 di produksi. | Object storage privat dengan signed URL berumur pendek dan audit akses | Unggahan manuskrip tidak bisa dipakai di produksi | TBD | Open |
| Q-006 | Tenant database isolation? | Shared PostgreSQL schema + verified tenant scope proposed; evaluate RLS separately | Isolation and ops cost | TBD | Open |
| Q-007 | Article canonical content model? | Structured internal schema + JATS adapters | Migration and publishing fidelity | TBD | Open |
| Q-008 | Editorial review policies? | Configurable workflow per journal | Product complexity | TBD | Open |
| Q-009 | Domain and custom domain model? | Subdomain first, custom domain later | Routing and certificate operations | TBD | Open |
| Q-010 | AI provider and data policy? | Disabled by default for confidential content | Privacy/legal/contract risk | TBD | Open |
| Q-011 | DOI deposit responsibility and approval? | Manual approval at launch | Incorrect public metadata | TBD | Open |
| Q-012 | Billing/APC/subscription scope? | Exclude from initial MVP pending discovery | Commercial architecture | TBD | Open |
| Q-013 | Scale targets (journals/submissions/traffic)? | TBD | Capacity planning impossible | TBD | Open |
| Q-014 | RPO/RTO, SLA, data residency? | TBD | Production readiness risk | TBD | Open |
| Q-015 | Preview environment memakai database dan auth terpisah? | Supabase branch/copy database + OIDC client khusus preview; alternatifnya preview berbagi database dev dengan data sintetis | Preview dapat menulis ke data yang dipakai bersama | TBD | Open |
