# Peta kemampuan menuju pengganti OJS

**Status:** Assessment berbasis repository, bukan klaim kesiapan produksi
**Last reviewed:** 2026-11-19

## Tujuan dan batas

Target produk adalah satu alur dari penulis ke pembaca untuk banyak jurnal dan organisasi, dengan kepemilikan data, audit, akses privat, serta ekspor yang memungkinkan migrasi keluar. Ini mengikuti kebutuhan umum yang dijelaskan [PKP untuk OJS](https://pkp.sfu.ca/software/ojs/): pengajuan, review, produksi, publikasi, distribusi metadata, multi-jurnal, dan portabilitas. Pengalaman publik dapat belajar dari halaman jurnal dan artikel penerbit lain, tanpa menyalin identitas atau menganggap integrasi mereka sudah tersedia di platform ini.

Penilaian di bawah hanya menyebut **kode yang ada**. `Ada use case` berarti fungsi tersedia di source, belum berarti alurnya bisa dipakai pengguna. `Aktif terbatas` berarti ada rute/UI, tetapi ada prasyarat atau batas penggunaan.

## Jejak alur dan celah

| Alur | Bukti di repository | Status saat ditinjau | Langkah penerimaan berikutnya |
|---|---|---|---|
| Platform, organisasi, jurnal | `modules/tenancy`, halaman `/admin/organizations`, halaman publik `/journals` | Aktif terbatas; admin dapat memberi dan mencabut role jurnal untuk akun yang sudah login, dengan audit dan tes lintas tenant. Undangan akun, provider login, dan operasional produksi belum siap. | Aktifkan OIDC, uji alur role lewat browser, lalu rancang undangan dan pengelolaan organisasi. |
| Profil dan kebijakan jurnal | Form profil, halaman jurnal publik | Deskripsi, aims and scope, serta pedoman penulis tersedia. Kebijakan lain, editorial board, dan metadata jurnal belum lengkap. | Kebijakan per jurnal punya provenance, status publikasi, dan pratinjau sebelum terbit. |
| Pengajuan penulis | `modules/submissions`, halaman author, unggah PDF privat lokal | Prototipe lokal; storage sengaja dimatikan di produksi. | Storage privat produksi, pemindaian berkas, kuota, retry, penghapusan, dan alur revisi. |
| Screening dan review | `modules/editorial` berisi use case dan state machine; halaman detail editor/reviewer | Antrean editor membaca submission per jurnal sesuai membership aktif; draft penulis tidak tampil. Aksi editorial menolak pilihan screening yang kosong, menjaga default blind review, dan merekam snapshot rekomendasi dari laporan tersimpan. Undangan dan pengingat reviewer serta alur ujung ke ujung belum lengkap. | Satu naskah dapat melewati screening, assignment, review, revisi, dan keputusan manusia lewat UI dengan audit dan blind review teruji. |
| Produksi | `modules/production` berisi versi artikel, issue, JATS/DOI helper; `/production/submissions` | Antrean produksi kini membaca submission diterima per jurnal sesuai role, tetapi tindakan produksi di UI belum tersedia. | Copyediting, proof, persetujuan penulis, validasi JATS, penempatan issue, dan publikasi yang dapat diaudit. |
| Pembacaan dan arsip publik | Halaman jurnal, issue, artikel, PDF route, `modules/publications` | Ada pembacaan publik untuk data yang sudah terbit; kelengkapan metadata dan format perlu diaudit. | Artikel HTML/JATS dan PDF konsisten, URL stabil, versi, lisensi, koreksi/retraksi, SEO, serta aksesibilitas teruji. |
| DOI dan metadata eksternal | `domain/doi.ts`, tabel `doi_registration` | Tidak ada bukti deposit atau verifikasi Crossref. Nama fungsi lama dapat memberi kesan sudah terdaftar. | Adapter deposit terisolasi, approval manusia, status attempt/response, verifikasi resolver, idempotensi. Jangan tampilkan DOI sebagai terdaftar sebelum bukti diterima. |
| Discovery | Direktori jurnal dan adapter Meilisearch | Pencarian jurnal terbatas; indeks artikel dan facets belum terbukti beroperasi. | Pencarian artikel dengan visibilitas publik yang benar, pagination, dan sinkronisasi indeks yang dapat dibangun ulang. |
| Portabilitas dan migrasi OJS | Dokumen JATS dan model domain | Belum ada pipeline impor OJS atau ekspor tenant yang utuh. | Ekspor metadata, teks, berkas, riwayat, identifier, dan pemetaan OJS yang diuji dengan fixture sintetis. |
| Operasional | GitHub Actions quality, Chromatic, preview, produksi, migrasi | Quality dan Vercel preview pada draft PR lulus; Storybook terunggah, tetapi UI Tests Chromatic build 4 dan 5 gagal. Workflow visual kini menunggu hasil tes dan menandai perubahan yang belum ditinjau. PostgreSQL lokal terhubung, tetapi preview belum memiliki database dan auth sendiri. Workflow produksi manual menyiapkan lint, typecheck, test, build, migrasi, deploy, dan HTTP smoke check. Auto deploy Git pada `main` dinonaktifkan; belum ada bukti release produksi atau restore drill. | Tinjau tes visual, siapkan lingkungan preview terisolasi, uji alur ujung ke ujung, lalu verifikasi rollback, restore drill, dan observability sebelum release produksi. |

## Invariant lintas alur

1. Identitas, role, organisasi, jurnal, dan assignment diselesaikan di server pada setiap aksi. Default deny; cakupan tenant diuji di query, berkas, cache, dan hasil pencarian.
2. Naskah, identitas reviewer, review, dan proof bersifat privat. URL publik hanya untuk manifestasi yang memang telah disetujui terbit.
3. Perubahan status berlangsung melalui use case dan transaksi audit. Keputusan akademik final dibuat manusia berwenang.
4. `Article`, `ArticleVersion`, `Publication`, `Issue`, dan identifier tetap terpisah. DOI yang dialokasikan, disiapkan, dikirim, diterima, dan terverifikasi adalah keadaan berbeda.
5. Konten terstruktur dan JATS perlu jalur uji round-trip. PDF adalah format penyajian, bukan satu-satunya sumber isi.
6. Klaim publik seperti ISSN, DOI, indeksasi, lisensi, metrik, dan institusi harus menyimpan sumber serta status verifikasi.

## Urutan pengerjaan yang dapat diuji

### Gate A: Fondasi aman

- CI harus hijau tanpa warning kritis, data sintetis, dan tanpa kredensial produksi.
- Tuntaskan auth, role grant/revoke, tenant isolation, private storage produksi, dan error/loading/empty state.
- Perbaiki ketidaksesuaian dokumentasi dan implementasi sebelum menyebut fitur siap dipakai.

### Gate B: Naskah sampai keputusan

- Satu jurnal uji dapat menerima draf, mengirim submission, melakukan screening, mengundang reviewer, menerima review, meminta revisi, dan membuat keputusan editor.
- Setiap langkah memiliki audit actor/reason/timestamp; reviewer yang tidak ditugaskan dan tenant lain ditolak.
- E2E meliputi alur positif dan batas akses negatif.

### Gate C: Keputusan sampai artikel terbit

- Tim produksi dapat membuat versi terstruktur, mengelola proof, menetapkan issue, meninjau metadata, lalu menerbitkan dengan persetujuan berwenang.
- Halaman artikel, PDF, ekspor JATS, citation metadata, dan koreksi/retraksi konsisten.
- Deposit DOI tetap nonaktif sampai adapter dan verifikasi berfungsi serta ada approval manusia.

### Gate D: Migrasi dan kesiapan pengganti

- Uji impor dan ekspor data OJS menggunakan data sintetis, termasuk penulis, berkas, keputusan, issue, versi, dan DOI yang sudah ada.
- Uji backup dan restore di lingkungan terpisah, observability, beban, aksesibilitas, serta domain jurnal.
- Pilot dengan satu tim jurnal nyata, lalu perluas berdasarkan temuan. Klaim “pengganti OJS” baru layak setelah gate ini dibuktikan.

## Keputusan manusia yang masih terbuka

Nama dan identitas merek, provider auth, kebijakan blind review per jurnal, storage privat produksi, kepemilikan prefix DOI, kebijakan lisensi dan preservasi, model migrasi OJS, serta RPO/RTO tetap mengikuti `DECISION_REGISTER.md`. Implementasi tidak boleh mengubah `Proposed` menjadi `Accepted` hanya karena kode kandidat sudah ada.
