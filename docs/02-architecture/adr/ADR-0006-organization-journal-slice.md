# ADR-0006: Fondasi Vertical Slice Organisasi dan Jurnal

- **Status:** Proposed
- **Tanggal:** 2026-11-14
- **Decision owner:** TBD
- **Related ADRs:** ADR-0001, ADR-0002, ADR-0003, ADR-0004

## Context

Vertical slice awal yang disarankan adalah platform operator membuat organization,
organization admin membuat journal, lalu halaman publik menampilkan jurnal.
Slice ini menyentuh data tenant dan mutasi yang memerlukan otorisasi server-side.

PostgreSQL, hierarki organization → journal, dan pola server-only DAL sudah
tercatat sebagai baseline Proposed. ORM/query layer serta identity provider
belum diputuskan. Ketersediaan layanan PostgreSQL lokal belum terverifikasi;
`psql` dan `docker` tidak tersedia dari lingkungan ini.

## Decision drivers

- Default deny dan tenant scope yang diverifikasi server-side.
- Batas domain tidak bergantung pada Next.js atau database.
- Migrasi dan query tenant dapat ditinjau sebagai SQL.
- Tidak ada credential atau akun admin default.
- Perubahan awal dapat diuji tanpa mengklaim integrasi eksternal telah aktif.

## Options considered

### Option A — PostgreSQL shared schema + Drizzle

Satu database transaksional dengan organization sebagai pemilik tenant utama.
Gunakan kolom tenant lineage, foreign key/unique constraint yang mencakup scope,
dan DAL yang menerima scope terverifikasi. Drizzle menjadi kandidat ORM/query
layer yang tetap dekat dengan SQL dan menyediakan migrasi eksplisit.

### Option B — PostgreSQL + Prisma

Menggunakan schema/client terkelola Prisma. Ini menyediakan workflow schema
yang terintegrasi, tetapi menambah abstraksi di atas SQL dan perlu divalidasi
terhadap kebutuhan constraint tenant serta ownership migrasi.

### Option C — Memilih identity provider dan membuat mutasi sebelum keputusan

Ini mempercepat demo, tetapi dapat mengunci vendor, pemrosesan identitas, dan
policy akses yang belum disetujui. Opsi ini tidak direkomendasikan.

## Decision

**Baseline development lokal disetujui oleh pengguna pada 2026-11-14.
Status ADR tetap Proposed dan persetujuan ini bukan persetujuan production.**

1. Pertahankan PostgreSQL sebagai sumber kebenaran dan gunakan shared schema
   dengan organization sebagai tenant owner untuk MVP.
2. Gunakan Drizzle untuk query dan migrasi pada slice awal; tinjau kembali
   maintainability dan workflow migrasi sebelum production.
3. Terapkan tenant scope eksplisit di DAL dan constraints database. Evaluasi
   PostgreSQL Row-Level Security sebagai defense-in-depth pada ADR terpisah;
   RLS tidak menggantikan authorization aplikasi.
4. Gunakan Auth.js dengan provider OIDC generik untuk session/OIDC integration.
   Provider identitas pelanggan dan konfigurasi issuer tetap TBD. Tanpa issuer,
   client ID, secret, session secret, dan database yang valid, autentikasi dan
   mutasi harus fail-closed.
5. Untuk vertical slice, platform operator hanya membuat organization dan
   organization admin hanya mengelola journal dalam organization membership
   yang telah diverifikasi server-side. Role ini mengikuti contoh persona/MVP;
   policy final tetap harus ditinjau.
6. Jangan membuat data organization/journal contoh yang menyerupai tenant
   produksi, credential default, atau identifier ilmiah palsu.

Implementasi ini menggunakan pilihan tersebut hanya sebagai baseline
development lokal. Belum ada auth provider, strategi RLS, atau test database
production-like yang dipilih; status ADR tidak berubah menjadi Accepted.

## Implementation snapshot

Implementasi awal menyediakan:

- Auth.js dengan provider OIDC generik; provider tidak aktif bila konfigurasi
  belum lengkap, dan konfigurasi parsial ditolak.
- Host autentikasi memerlukan `AUTH_URL` kanonis, atau
  `AUTH_TRUST_HOST=true` hanya di belakang reverse proxy yang dipercaya.
- Tabel Auth.js, organization, organization membership, platform operator,
  journal, dan audit event dalam migrasi PostgreSQL yang dihasilkan Drizzle Kit.
- Use case dan repository server-side untuk provisioning organization,
  pembuatan journal draft, publikasi halaman jurnal, dan public lookup.
- Organization admin membership diverifikasi di database dalam transaksi yang
  sama dengan setiap mutasi. ID dari form tidak membuktikan izin.
- Public lookup hanya memilih journal dengan `published_at` yang telah diisi.
- Tes integrasi tenant menggunakan PGlite, bukan layanan PostgreSQL production.
- Bootstrap platform operator satu kali melalui prosedur DBA yang eksplisit;
  tidak ada akun atau role default.

Slug organization bersifat unik secara global; slug journal unik dalam
organization. Formatnya lowercase ASCII dengan tanda hubung. Pembuatan jurnal
selalu menghasilkan draft; publikasi memerlukan aksi terpisah, konfirmasi
eksplisit, alasan, dan audit event. Ini adalah pilihan implementasi slice awal,
bukan keputusan produk final.

Implementasi belum menetapkan bootstrap role production, rate limiting,
PostgreSQL RLS, secret management, rotasi session, atau konfigurasi identity
provider pelanggan. Penggunaan OIDC/Drizzle dan shared schema tetap terbatas
pada baseline development yang disetujui; Q-002, Q-003, dan Q-006 tetap open
hingga review/ADR final.

## Consequences

### Positive

- Mencegah tenant-write tanpa identitas dan scope tepercaya.
- Menjaga model organisasi/jurnal tetap portabel dan dapat diuji.
- Memungkinkan perubahan provider tanpa menanamkan SDK provider ke domain.

### Negative / risks

- Vertical slice belum dapat dijalankan end-to-end sebelum identity/session
  adapter dan database development tersedia.
- Shared schema memerlukan disiplin pada setiap query, foreign key, cache, dan
  pekerjaan asynchronous.
- Drizzle masih memerlukan evaluasi maintainability, operasi migrasi, dan
  kompatibilitas dengan strategi deployment yang belum diputuskan.

## Security/privacy impact

- Mutasi harus autentikasi dan otorisasi ulang pada setiap invocation.
- Organization/journal ID dari browser tidak membuktikan hak akses.
- Query journal privat harus menggunakan scope organization yang telah
  diverifikasi; public query hanya boleh mengembalikan data yang memang
  dipublikasikan.
- Tidak mengaktifkan autentikasi berbasis password atau akun bawaan sebagai
  jalan pintas.

## Migration/rollout plan

1. Catat pilihan database/query layer, auth/session, dan tenant isolation pada
   ADR yang disepakati sebelum production.
2. Tambahkan migrasi Organization dan Journal dengan constraints tenant.
3. Implementasikan auth adapter, DAL, use case, dan UI sebagai satu vertical
   slice.
4. Uji akses lintas tenant positif/negatif dan jalankan integrasi pada database
   terisolasi sebelum menyatakan slice selesai.

## Revisit when

- Kebutuhan data residency atau dedicated database muncul.
- Batas skalabilitas atau operasional shared schema terbukti tidak memadai.
- Identity provider pelanggan dan kebijakan pemrosesan identitas telah
  ditentukan.
- Bukti dari integration tests menunjukkan perlu defense-in-depth RLS.
