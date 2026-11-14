# MVP Scope and Release Boundaries

**Status:** Proposed baseline  
**Last reviewed:** 2026-11-14

## 1. Tujuan MVP

Membuktikan satu alur penerbitan end-to-end untuk beberapa jurnal di bawah satu organisasi, dengan tenant isolation, audit trail, dan konten publik yang terstruktur.

## 2. Kandidat fitur MVP

### A. Platform dan organisasi
- Platform operator dapat membuat organization/publisher.
- Organization admin dapat membuat jurnal dan mengundang anggota.
- Role assignment memiliki scope organization/journal.
- Domain awal dapat menggunakan subdomain platform; custom domain tahap berikutnya.

### B. Website publik jurnal
- Journal homepage, scope, editorial board, policies, author guidelines.
- Issue/volume/arsip.
- Article landing page: title, authors, affiliation, abstract, keywords, references, dates, license, DOI bila sudah terdaftar.
- PDF download dan HTML article rendering sesuai data yang tersedia.
- SEO metadata dan canonical URL.

### C. Editorial workflow dasar
- Author membuat submission dan mengunggah file.
- Editor melakukan initial screening.
- Editor menunjuk reviewer.
- Reviewer mengirim rekomendasi dan review report.
- Editor meminta revision dan mencatat final decision.
- Audit trail untuk perubahan status, assignment, dan keputusan.

### D. Production dan publication
- Artikel accepted masuk ke production queue.
- Metadata dan konten artikel dapat diperbaiki dengan version history.
- Issue assignment dan publish action oleh role berwenang.
- Artikel terbit memiliki halaman publik dan export metadata dasar.

### E. Operasional minimum
- Logging, error monitoring, backup, restore procedure.
- Role/permission tests dan tenant-isolation tests.
- File storage private/public policy.

## 3. Di luar MVP atau perlu discovery lebih lanjut

- Advanced reviewer recommendation/matching.
- AI manuscript screening, copyediting, translation, XML assistance.
- Automated Crossref DOI deposit produksi.
- ORCID OAuth, ROR validation, OAI-PMH, COUNTER/SUSHI.
- OpenSearch cluster, recommendation engine, citation graph.
- Payment gateway, APC billing, subscription commerce.
- Conference and book publishing.
- Full preservation network integration (PKP PN/LOCKSS/CLOCKSS/Portico).
- Researcher social network and collaboration workspace.

## 4. Acceptance criteria MVP (draft)

- Tenant A tidak dapat melihat/mengubah data Tenant B melalui UI, API, Server Action, file URL, search, cache, atau background jobs.
- Satu organisasi dapat memiliki lebih dari satu jurnal.
- Author dapat submit naskah dan memperoleh nomor/status submission.
- Editor dapat menggerakkan workflow hanya melalui transisi yang diizinkan.
- Reviewer hanya melihat naskah yang ditugaskan kepadanya; aturan blind review diterapkan sesuai konfigurasi jurnal.
- Semua keputusan dan perubahan status penting memiliki actor, timestamp, reason, dan audit event.
- Artikel terbit memiliki public URL stabil dan structured metadata.
- Data inti dapat diekspor tanpa bergantung pada UI vendor tertentu.
- Unit, integration, E2E, dan security tests yang relevan lulus.

## 5. Rencana validasi

Sebelum mengunci MVP, wawancarai minimal perwakilan dari: pengelola institusi, editor jurnal, author, reviewer, dan production editor. Catat workflow aktual, edge cases, volume submission, pola review, kebijakan blind review, proses DOI, dan kebutuhan migrasi.
