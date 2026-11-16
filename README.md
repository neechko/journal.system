# Scholarly Publishing Platform

Platform penerbitan ilmiah multi-tenant untuk publisher, universitas,
institusi riset, asosiasi, dan jurnal.

## Status saat ini

Repository berada pada tahap awal pengembangan. Aplikasi Next.js App Router
berada di `apps/web`. Fondasi awal untuk autentikasi OIDC opsional, pengelolaan
organisasi/jurnal, tenant-scoped access, dan halaman jurnal publik sudah dibuat.
Submission, peer review, produksi artikel, serta publication workflow belum
tersedia.

Dokumen produk, domain, arsitektur, dan keamanan tetap menjadi acuan. Status
`Proposed` dan `TBD` belum merupakan keputusan yang disetujui.

## Menjalankan aplikasi web

Persyaratan: Node.js 20.9 atau lebih baru dan npm.

```powershell
cd apps/web
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Pemeriksaan

Jalankan dari `apps/web`:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Untuk konfigurasi database dan OIDC lokal, lihat
[`apps/web/README.md`](./apps/web/README.md).

## Dokumentasi

- [Visi produk](docs/00-product/PRODUCT_VISION.md)
- [Scope MVP](docs/00-product/MVP_SCOPE.md)
- [Peta domain](docs/01-domain/DOMAIN_MAP.md)
- [Lifecycle editorial](docs/01-domain/EDITORIAL_LIFECYCLE.md)
- [Arsitektur](docs/02-architecture/ARCHITECTURE_OVERVIEW.md)
- [Register keputusan terbuka](docs/08-planning/DECISION_REGISTER.md)
