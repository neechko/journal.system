# Database and Migration Guidelines

**Status:** Proposed baseline

## 1. Ownership

- PostgreSQL adalah source of truth transaksional.
- Setiap bounded context memiliki ownership yang jelas atas tabel/aggregate-nya.
- Modul lain mengaksesnya melalui application contract, bukan query langsung ke tabel internal.

## 2. Schema design

- Gunakan primary key stabil; pertimbangkan UUID/ULID setelah trade-off dicatat.
- Definisikan foreign keys, unique constraints, check constraints, dan indexes sesuai invariant.
- Hindari polymorphic references tanpa batas/validasi yang kuat.
- Simpan timestamps teknis dalam UTC.
- Simpan status workflow sebagai enum/value yang dikontrol; perubahan lewat use case.
- Bedakan soft delete dari archive/withdrawn/retracted state.
- Buat audit/history records untuk keputusan dan perubahan sensitif.

## 3. Tenant isolation

- Setiap record tenant-owned harus punya lineage tenant yang eksplisit atau dapat diverifikasi secara aman.
- Hindari query berdasarkan object ID saja; gabungkan dengan tenant scope yang sah.
- Jangan mempercayai tenant ID dari client.
- Pertimbangkan PostgreSQL Row-Level Security sebagai defense-in-depth, bukan pengganti policy di application layer.
- Buat test yang mencoba membaca dan mengubah record tenant lain.

## 4. Migrations

- Migration harus committed, repeatable pada environment baru, dan ditinjau manusia.
- Untuk table besar, rancang expand → backfill → validate → contract.
- Hindari destructive migration dalam satu deploy tanpa rencana rollback/restore.
- Seed data produksi tidak boleh berisi akun/password default atau data akademik palsu.
- Migration rollback tidak selalu aman untuk data; dokumentasikan prosedur pemulihan.

## 5. Performance

- Tambahkan index berdasarkan query workload yang terukur.
- Periksa N+1 queries dan pagination.
- Gunakan cursor pagination untuk daftar besar bila sesuai.
- Jangan menggunakan search index sebagai pengganti query transaksional untuk keputusan workflow.

Runtime web menggunakan `DATABASE_URL`. `DIRECT_DATABASE_URL` hanya untuk
migrasi/tooling agar koneksi serverless tidak diam-diam memakai koneksi langsung
yang disediakan untuk DDL.
