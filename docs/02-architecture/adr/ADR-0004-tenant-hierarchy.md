# ADR-0004: Organization sebagai Tenant Owner

- **Status:** Proposed
- **Tanggal:** 2026-11-14
- **Decision owner:** TBD

## Context

Satu publisher/institusi dapat memiliki banyak jurnal. Pengguna dapat mengerjakan beberapa jurnal dengan role berbeda.

## Decision

Model baseline: Organization/Publisher memiliki banyak Journal. User identity global; membership, role, dan assignment memiliki scope organization/journal/manuscript.

## Consequences

- Semua data sensitif harus memiliki tenant lineage yang jelas.
- Permission harus mempertimbangkan role, scope, assignment, dan workflow state.
- Isolasi lintas tenant wajib diuji di DB/DAL/API/search/cache/storage/worker.
- Transfer jurnal antar organisasi membutuhkan desain data ownership dan audit trail tersendiri.
