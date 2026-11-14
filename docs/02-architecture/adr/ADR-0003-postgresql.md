# ADR-0003: PostgreSQL sebagai Primary Transactional Database

- **Status:** Proposed
- **Tanggal:** 2026-11-14
- **Decision owner:** TBD

## Context

Platform membutuhkan relasi kaya antara organisasi, jurnal, user, submission, review, issue, article, identifier, dan audit events.

## Decision

Gunakan PostgreSQL sebagai sumber kebenaran transaksional utama. Search index, cache, dan analytics projections tidak menggantikan primary records.

## Consequences

- Relasi, constraints, indexes, transactions, dan migrations harus eksplisit.
- Tenant scope harus tercermin pada query dan test; PostgreSQL Row-Level Security dapat dievaluasi sebagai defense-in-depth melalui ADR terpisah.
- Strategi ORM/query builder, migration ownership, dan production operations masih perlu keputusan.
