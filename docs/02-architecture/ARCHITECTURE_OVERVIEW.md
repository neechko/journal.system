# Architecture Overview

**Status:** Proposed baseline; keputusan final dicatat pada ADR.

## 1. Target arsitektur

Mulai dengan **modular monolith berbasis TypeScript**. Satu codebase dan satu sumber data transaksional; boleh memiliki proses web dan worker yang dipisah deployment-nya. Hindari microservices sampai kebutuhan skalabilitas, kepemilikan tim, atau isolasi operasional terbukti.

## 2. Technology direction (proposed)

| Layer | Baseline | Status / catatan |
|---|---|---|
| Web framework | Next.js App Router | Dinyatakan sebagai arah proyek |
| Language | TypeScript strict | Proposed baseline |
| UI | React + Tailwind CSS + design system komponen | Proposed; pilih token dan library lewat ADR |
| Primary database | PostgreSQL | Proposed; source of truth transaksional |
| Cache / queue | Redis-compatible | Proposed; library queue TBD |
| Search | Mulai dengan kebutuhan minimum; OpenSearch saat dibutuhkan | Proposed evolution path |
| Object storage | S3-compatible private object storage | Proposed |
| Background work | Worker process terpisah untuk job berat/retry | Proposed |
| Testing | Unit + integration + Playwright E2E | Proposed |
| Observability | Structured logs, metrics, traces, error reporting | Provider TBD |
| Deployment | Containerized environments, reverse proxy/CDN/WAF | Provider TBD |

Jangan menginstall semua komponen sejak hari pertama. Tambahkan ketika vertical slice membutuhkan dan ada ADR/justifikasi.

## 3. Logical layers

```text
Browser / Crawlers
       │
       ▼
Next.js Presentation (App Router)
  - public journal/article pages
  - author/editor/reviewer dashboards
  - route handlers / server actions (thin adapters)
       │
       ▼
Application Layer (use cases)
       │
       ▼
Domain Modules
  - Organization / Journal / Submission / Editorial
  - Review / Production / Article / Metadata
       │
       ▼
Ports / Interfaces
       │
       ├── PostgreSQL adapter
       ├── Object storage adapter
       ├── Queue/cache adapter
       ├── Search adapter
       ├── Email/notification adapter
       └── External scholarly integrations
```

Worker menjalankan use case yang sama untuk asynchronous jobs; jangan menduplikasi domain logic dalam job handler.

## 4. Next.js role

Next.js adalah web presentation dan backend-for-frontend. Untuk aplikasi baru, usulan pola data access adalah server-only DAL yang memeriksa authorization dan mengembalikan DTO minimal. Route Handlers/Server Actions memanggil use cases; bukan menjadi repository layer atau tempat menulis business rules.

Jangan menganggap Server Actions internal/rahasia hanya karena tidak terlihat sebagai endpoint di UI.

## 5. Multi-tenancy

- Organization/publisher adalah tenant owner utama.
- Journal berada di bawah organization kecuali keputusan produk berikutnya mengubah model ini.
- User global dapat memiliki membership/roles scoped.
- Query, cache key, storage path, search document, event/job payload, and logs harus mempertahankan tenant context.
- Tenant isolation test meliputi database, route, DAL, search, file, background worker, dan cache.

## 6. Data ownership and consistency

- PostgreSQL menjadi source of truth untuk transaksi dan status workflow.
- Search index adalah projection/rebuildable view; bukan source of truth.
- Cache dapat dihapus dan dibangun ulang.
- Object storage menyimpan binary dengan metadata ownership di database.
- Untuk publish/index/deposit yang membutuhkan transaksi lintas sistem, gunakan outbox + idempotent handlers; jangan mengandalkan transaksi database bersama layanan eksternal.

## 7. Async jobs

Contoh job: email notification, PDF rendering, JATS validation/export, metadata deposit, search indexing, scheduled reminders, report aggregation. Job harus idempotent, retry-aware, observable, tenant-scoped, dan memiliki dead-letter/reconciliation approach.

## 8. Non-functional requirements to decide

- Target availability and recovery objectives (RTO/RPO): TBD.
- Expected tenants, journals per tenant, manuscripts/month, peak concurrency: TBD.
- Data residency and retention rules: TBD.
- Accessibility target: target WCAG 2.2 AA as design objective, verify applicable legal/customer requirements.
- Performance budgets: define real user metrics and page-level budgets before launch.
- Disaster recovery, key rotation, incident response, and service-level agreement: TBD.
