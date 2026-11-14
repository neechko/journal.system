# Initial Roadmap

**Status:** Proposed; urutan dapat berubah setelah discovery dan validasi pengguna.

## Phase 0 — Discovery and foundation

- Wawancara publisher, editor, author, reviewer, production.
- Definisikan positioning, model bisnis, target tenant, dan MVP scope.
- Setujui ADR awal: architecture, tenancy, auth, database, content/JATS, file storage.
- Setup repository, CI, quality gates, environment strategy, observability baseline.

**Exit criteria:** product scope disetujui; architecture decisions utama tercatat; vertical slice direncanakan.

## Phase 1 — Tenant and journal foundation

- Platform operator, organization, membership, role scope.
- Journal profile, policy, editorial board, sections.
- Public journal home and archive skeleton.

**Exit criteria:** tenant A/B isolation tests lulus; beberapa jurnal dapat dikelola.

## Phase 2 — Submission and editorial workflow

- Author profile and submission.
- Editorial screening and assignment.
- Reviewer invitation, review, revision, decision.
- Audit trail and notifications.

**Exit criteria:** satu manuscript end-to-end melewati workflow konfigurasi yang disetujui.

## Phase 3 — Production and publication

- Article version/content model.
- Production checklist, proof, issue assignment.
- Public article page, PDF/HTML delivery, metadata export.
- JATS import/export proof of concept.

**Exit criteria:** accepted article dapat diproduksi dan diterbitkan dengan structured content.

## Phase 4 — Interoperability and discovery

- DOI/Crossref integration.
- ORCID/ROR where prioritized.
- OAI-PMH endpoint.
- Full-text search/facets; evaluate OpenSearch.
- Citation export and analytics foundations.

**Exit criteria:** integration status verified and operationally monitored; search results respect visibility/tenant policy.

## Phase 5 — Scale, preservation, and advanced services

- Performance scaling, DR drills, advanced analytics.
- Preservation network integration.
- COUNTER/SUSHI if institutional reporting requirements justify.
- Conferences/books, billing, and researcher profile ecosystem only after product validation.

## Prioritization rule

Setiap fase harus menghasilkan value yang dapat diuji. Jangan memulai semua modul bersamaan. Prioritaskan vertical slice, security boundaries, data model correctness, and content portability.
