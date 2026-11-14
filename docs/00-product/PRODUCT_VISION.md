# Product Vision

**Status:** Proposed baseline  
**Last reviewed:** 2026-11-14

## 1. Ringkasan

Membangun infrastruktur penerbitan ilmiah digital yang dapat digunakan banyak organisasi dan jurnal melalui satu platform bersama, dengan pengalaman publikasi dan discovery berkualitas tinggi serta workflow editorial yang dapat diaudit.

Produk ini tidak sekadar website jurnal atau pengganti tampilan OJS. Target jangka panjang adalah platform operasional publisher: dari pengelolaan jurnal dan submission, peer review, produksi konten terstruktur, publikasi, metadata, discovery, analitik, hingga tata kelola dan preservasi.

## 2. Masalah yang ingin diselesaikan

- Pengelolaan jurnal tersebar di website, email, spreadsheet, file PDF, dan proses manual.
- Pengalaman author, reviewer, editor, pembaca, dan pengelola institusi tidak konsisten.
- Metadata artikel dan jurnal tidak selalu terstruktur atau mudah dipertukarkan.
- Pengelola jurnal membutuhkan infrastruktur, keamanan, backup, dan integrasi yang sulit dikelola sendiri.
- Data dan proses antarjurnal dalam satu institusi belum tentu memiliki standar dan visibilitas yang konsisten.

Validasi masalah ini melalui wawancara pengguna; jangan menganggap semua organisasi mengalami masalah yang sama.

## 3. Segmen pengguna

- Publisher/organisasi penerbit.
- Universitas atau institusi pemilik beberapa jurnal.
- Editor in Chief dan managing editor.
- Section editor/editor.
- Reviewer.
- Author/corresponding author.
- Production editor/typesetter.
- Pembaca/peneliti.
- Platform operator/support.

## 4. Prinsip produk

1. **Editorial independence:** keputusan akademik tetap milik editor dan kebijakan jurnal.
2. **Structured content:** artikel bukan sekadar PDF; metadata dan struktur naskah harus dapat diproses.
3. **Interoperability:** desain integrasi berdasarkan standar terbuka.
4. **Multi-tenant by design:** isolasi organisasi, jurnal, user, aset, dan data.
5. **Auditable:** setiap keputusan dan perubahan penting dapat ditelusuri.
6. **Human accountable, AI assisted:** AI membantu, bukan menggantikan otoritas akademik.
7. **Accessible and discoverable:** UI responsif, aksesibel, SEO dan metadata ilmiah yang baik.
8. **Portability:** pelanggan dapat mengekspor metadata dan konten mereka.
9. **Incremental architecture:** modular monolith dahulu, evolusi berdasarkan kebutuhan nyata.

## 5. Referensi pengalaman

Pelajari pola dan kemampuan umum dari platform seperti Elsevier/ScienceDirect, Atypon Literatum, Springer Nature, dan platform lain: journal discovery, halaman jurnal, halaman artikel, navigasi issue, author identity, pencarian, akses konten, workflow dan publisher controls.

Jangan menyalin source code, merek, logo, ilustrasi, teks, desain proprietary, atau implementasi internal yang tidak dipublikasikan. Buat design system dan pengalaman produk sendiri.

## 6. Ukuran keberhasilan awal

- Organisasi dapat membuat dan mengelola beberapa jurnal dengan tenant isolation.
- Jurnal dapat menampilkan halaman publik dan arsip.
- Author dapat submit manuskrip dengan metadata dan file.
- Editor dapat menjalankan screening, reviewer assignment, review, revision, dan decision dengan audit trail.
- Artikel yang diterbitkan memiliki halaman artikel dan metadata yang konsisten.
- Konten dapat diekspor dalam format terstruktur; jalur JATS disiapkan.
- Operasi dasar (backup, monitoring, error handling, restore test) terdokumentasi.

Target angka (jumlah jurnal, author, submission, uptime, conversion, biaya) masih `TBD` dan perlu baseline riset.

## 7. Hal yang bukan tujuan MVP

- Menjadi indeks sitasi global.
- Menjamin jurnal terindeks Scopus, Web of Science, DOAJ, atau indeks lain.
- Mengotomatisasi keputusan menerima/menolak artikel menggunakan AI.
- Mengimplementasikan semua standar/integrasi secara penuh pada rilis pertama.
- Memecah sistem menjadi banyak microservices sebelum ada kebutuhan operasional.
