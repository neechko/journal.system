# ADR-0002: Next.js App Router + TypeScript untuk Web Layer

- **Status:** Proposed
- **Tanggal:** 2026-11-14
- **Decision owner:** TBD

## Context

Produk membutuhkan public journal/article pages, SEO, rendering server-side, serta dashboard author/editor/reviewer. Next.js dipilih sebagai arah web framework.

## Decision

Gunakan Next.js App Router dan TypeScript strict untuk web application. Next.js menjadi presentation/BFF layer. Business rules dan persistence berada di domain/application/data-access layer, bukan di React component atau Server Action.

## Consequences

- Server Components menjadi default; Client Components hanya pada interaksi yang memerlukan browser state.
- Server Actions/Route Handlers diperlakukan sebagai request boundary.
- Agent wajib membaca dokumentasi Next.js yang cocok dengan versi terpasang di `node_modules/next/dist/docs/`.
- Pola DAL, caching, auth, routing, dan deployment harus diuji dan didokumentasikan.

## Revisit when

- Kebutuhan API publik/SDK atau aplikasi mobile mendorong API surface terpisah.
- Beban backend/domain melebihi peran BFF Next.js.
