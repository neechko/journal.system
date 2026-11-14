# Repository Structure

**Status:** Proposed baseline; evolve only with a clear reason.

## 1. Suggested initial layout

```text
.
├── apps/
│   ├── web/                         # Next.js App Router web application
│   │   └── src/
│   │       ├── app/                 # Route segments, layouts, pages, route handlers
│   │       ├── components/          # Shared presentation components
│   │       ├── modules/             # UI adapters per domain; no hidden business rules
│   │       └── server/              # Composition root and server-only wiring
│   └── worker/                      # Background worker entrypoint (add when needed)
├── packages/
│   ├── domain/                      # Pure domain model and policies (add when needed)
│   ├── application/                 # Use cases and ports (add when needed)
│   ├── infrastructure/              # DB, storage, queue and external adapters
│   ├── contracts/                   # Runtime schemas and public DTOs
│   ├── ui/                          # Design system (if shared across apps)
│   └── config/                      # Shared lint/tsconfig/tooling (only if useful)
├── docs/
├── .github/
├── .cursor/
├── AGENTS.md
├── CLAUDE.md
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## 2. Avoid premature package creation

Jangan membuat banyak package kosong hanya demi struktur. Pada awalnya, `apps/web/src/modules` dapat menampung code dalam satu deployable. Ekstrak package saat ada kebutuhan nyata untuk dipakai worker atau aplikasi lain, atau saat batas domain sudah stabil.

## 3. Module layout (guideline)

```text
modules/<module-name>/
  domain/          # Entities, value objects, policies, state transitions
  application/     # Use cases, commands, queries, ports
  infrastructure/  # DB repositories and external adapters
  presentation/    # UI-specific adapters/view models (where appropriate)
  tests/
  index.ts         # Public module surface; avoid exposing internals
```

Sesuaikan dengan ukuran modul. Tidak semua modul wajib memiliki setiap folder.

## 4. Next.js route conventions

- `app/` berisi route composition, layouts, loading/error boundaries, metadata, dan handlers.
- Public routes dan authenticated workspace boleh memiliki route groups untuk organisasi kode.
- Route segment bukan domain module; jangan biarkan struktur URL menentukan keseluruhan struktur bisnis.
- Hindari query DB langsung dari page/component. Gunakan DAL/use case.

## 5. Import boundaries

- Domain tidak boleh import Next.js, React, DB client, queue library, atau SDK eksternal.
- Application bergantung pada domain dan interface/ports.
- Infrastructure mengimplementasikan ports.
- Presentation memanggil application layer.
- Jika menggunakan package alias, pastikan alias tidak menyamarkan dependency cycle.
