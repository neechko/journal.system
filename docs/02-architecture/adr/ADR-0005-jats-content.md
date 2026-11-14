# ADR-0005: Structured Article Content dan JATS Interoperability

- **Status:** Proposed
- **Tanggal:** 2026-11-14
- **Decision owner:** TBD

## Context

Platform publisher memerlukan konten yang dapat disajikan dalam HTML/PDF, dipakai untuk metadata dan diarsipkan/dipertukarkan. PDF-only akan membatasi transformasi dan interoperabilitas.

## Decision

Model artikel sebagai konten terstruktur dengan jalur impor/ekspor JATS. Baseline standar yang dipertimbangkan adalah NISO JATS 1.4; profil/schema final harus ditentukan sebelum implementasi produksi.

## Consequences

- Schema konten internal harus memetakan elemen ilmiah yang didukung.
- Import/export perlu validation, versioning, provenance, dan round-trip tests.
- Elemen yang belum didukung harus ditandai, bukan dibuang diam-diam.
- JATS support tidak otomatis berarti Crossref deposit, indexing, atau preservation telah tersedia.
