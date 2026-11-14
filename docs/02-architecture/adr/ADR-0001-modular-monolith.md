# ADR-0001: Modular Monolith sebagai Arsitektur Awal

- **Status:** Proposed
- **Tanggal:** 2026-11-14
- **Decision owner:** TBD

## Context

Produk mencakup banyak domain yang saling terkait (organization, journal, submission, review, production, publishing, metadata). Tim dan skala operasional awal belum diketahui. Microservices sejak awal akan menambah distributed transactions, deployment, observability, dan beban operasional.

## Decision

Mulai dengan modular monolith berbasis TypeScript, dibagi menurut bounded context dan layer domain/application/infrastructure/presentation. Web process dan worker process boleh menjadi deployment berbeda, namun menggunakan codebase dan domain model yang sama.

## Consequences

**Positif**
- Lebih sederhana untuk membangun alur end-to-end dan transaksi.
- Lebih mudah menjalankan AI-assisted coding karena batas folder/domain jelas.
- Dapat mengekstrak service ketika kebutuhan dan batas domain sudah terbukti.

**Negatif / risiko**
- Tanpa disiplin boundary, monolith dapat berubah menjadi codebase saling terikat.
- Perlu dependency rules, module ownership, dan tests.

## Revisit when

- Tim independen membutuhkan deployment dan release cadence berbeda.
- Beban/availability satu bounded context memerlukan scaling independen.
- Isolasi keamanan/regulasi membutuhkan runtime boundary terpisah.
- Ada data/evidence operasional yang menunjukkan modular monolith menjadi bottleneck.
