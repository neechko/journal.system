# Arah desain platform jurnal

**Status:** Working direction, identitas merek final masih TBD
**Last reviewed:** 2026-11-18
**Scope:** situs publik, ruang kerja penulis, editor, reviewer, produksi, dan administrator.

## Design read

Reading this as: platform penerbitan ilmiah multi-tenant untuk peneliti dan tim jurnal, dengan bahasa visual editorial yang tenang dan teliti, dial **ENERGY 1 / RHYTHM 2 / MOTION 1**.

Antislop adalah filter mutu. Dokumen ini memberi arah. Referensi [OJS](https://pkp.sfu.ca/software/ojs/), [Taylor & Francis](https://www.tandfonline.com/page/authors), [Springer](https://link.springer.com/brands/springer), [Elsevier](https://www.elsevier.com/en-gb/researcher/author/login-to-editorial-manager), dan [Publion](https://publion.org/publish/journal) dipakai untuk mempelajari kebutuhan pengguna dan kelengkapan alur. Palet, tanda, komposisi, teks, dan aset mereka tidak diambil.

## Karakter dan alasan keputusan

| Keputusan | Arah | Alasan |
|---|---|---|
| Identitas | Indeks editorial: judul karya, penulis, jurnal, tanggal, versi, dan status disusun seperti rekam ilmiah yang mudah dipindai. | Metadata adalah isi utama produk, bukan dekorasi. |
| Tipografi | Serif pada judul karya dan teks baca panjang; sans sistem pada navigasi, formulir, tabel, dan status. | Membantu pembacaan panjang sambil menjaga kepadatan ruang kerja. |
| Warna | Dasar kertas dan tinta; satu warna aksi platform yang netral; warna status hanya untuk makna operasional. | Pembaca perlu membedakan konten, aksi, dan status tanpa warna yang berisik. |
| Warna jurnal | Hanya dari pengaturan jurnal yang disetujui pemilik dan lolos uji kontras. | Masing-masing jurnal memiliki identitas sendiri. Jangan menetapkan warna berdasarkan disiplin atau meniru penerbit lain. |
| Komposisi | Halaman artikel mengutamakan teks; direktori mengutamakan pencarian dan daftar; ruang kerja mengutamakan antrean dan tindakan berikutnya. | Tiap halaman mengikuti pekerjaan nyata penggunanya. |
| Spasi | Lebar baca terbatas, metadata dikelompokkan dekat objeknya, jeda lebih besar di antara tahap alur. | Hubungan antardata lebih jelas dan artikel nyaman dibaca. |
| Kartu | Dipakai hanya untuk unit yang dapat dipilih atau dipisahkan secara semantik, seperti jurnal dan issue. | Daftar artikel dan antrean lebih mudah dipindai sebagai baris. |
| Ikon | Hanya saat maknanya jelas tanpa teks tambahan; status utama tetap tertulis. | Menghindari ikon generik dan ambiguitas. |
| Gerak | Umpan balik hover, fokus, aktif, serta pembukaan kontrol singkat; hormati reduced motion. | Interaksi terasa responsif tanpa mengganggu pembacaan. |

Motif berulang adalah **garis metadata** yang memisahkan identitas karya dari isi, dengan label teks yang singkat dan konsisten. Satu fokus utama per layar: judul karya pada artikel, pilihan jurnal pada direktori, dan tugas berikutnya pada ruang kerja. Identitas final, logo, foto, ilustrasi, dan warna merek memerlukan keputusan pemilik; sampai ada keputusan, nama produk ditampilkan sebagai teks dan tidak ada aset yang berpura-pura final.

## Aturan layar

| Layar | Urutan kebutuhan konten | Keadaan yang harus tersedia |
|---|---|---|
| Beranda | Tujuan platform, akses ke jurnal yang benar-benar terbit, penjelasan status pengembangan yang jujur. | Tanpa jurnal, memuat, gagal mengambil data. |
| Direktori jurnal | Pencarian, hasil, ringkasan jurnal, navigasi halaman. | Tidak ada hasil, memuat, gagal. |
| Halaman jurnal | Identitas jurnal, aims and scope, kebijakan nyata, pedoman penulis, arsip, artikel terbaru. | Field belum diisi ditandai jelas. |
| Artikel | Judul, penulis dan afiliasi terverifikasi, abstrak, isi terstruktur, referensi, lisensi, versi, DOI hanya jika terverifikasi. | Konten atau berkas tidak tersedia, gagal memuat. |
| Penulis | Draf, persyaratan sebelum submit, unggah privat, status dan tindakan berikutnya. | Draf kosong, unggah berlangsung, unggah gagal. |
| Editor | Antrean per jurnal dengan scope terverifikasi, detail, riwayat, keputusan manusia. | Tidak ada tugas, memuat, gagal, akses ditolak. |
| Reviewer | Hanya assignment sendiri, tenggat, berkas yang diizinkan, laporan dan konflik kepentingan. | Tidak ada assignment, memuat, gagal, akses ditolak. |
| Produksi | Artikel diterima, versi, proof, pemeriksaan metadata, penempatan issue, publikasi berotorisasi. | Antrean kosong, memuat, gagal, akses ditolak. |

Navigasi hanya memuat tujuan yang benar-benar tersedia. Tautan ke ruang kerja yang memerlukan login tetap harus menuju alur autentikasi yang jelas. Jangan tampilkan tombol untuk integrasi yang belum bekerja. Jangan mengarang jurnal, ISSN, DOI, pengindeksan, metrik, reviewer, testimoni, ataupun klaim keamanan.

## Sistem visual dan aksesibilitas

- Palet aktif maksimal tiga warna inti dan satu aksen. Token semantik boleh menandai sukses, peringatan, dan kesalahan bila status nyata. Nama token lama seperti `forest` adalah warisan implementasi, bukan izin meniru warna merek penerbit.
- Semua pasangan teks dan latar harus diukur: minimal 4,5:1 untuk teks biasa dan 3:1 untuk teks besar. Nilai ini target, belum klaim bahwa semua layar saat ini lulus.
- Target sentuh kontrol utama dan menu minimal 44 x 44 CSS px. `sm: 24px` atau `md: 40px` tidak boleh disebut memenuhi target tersebut.
- Sediakan fokus terlihat, nama aksesibel, label formulir, semantik native, urutan Tab yang logis, dan dukungan pembesaran teks. Dialog dapat ditutup dengan Escape.
- Desain diuji pada lebar 320, 375, 414, 768, dan 1280 CSS px, tema terang dan gelap yang dikirim, keyboard, serta reduced motion. Tabel padat boleh bergulir pada wadahnya; halaman tidak boleh meluber horizontal.
- Komponen yang memuat data menyediakan keadaan kosong, memuat, dan gagal. Jangan memakai skeleton palsu sebagai gambar promosi.
- Media memiliki dimensi atau aspect ratio. Jika ada gambar utama, muat prioritas tinggi. Jangan menyatakan skor Lighthouse atau Web Vitals tanpa hasil ukur.

## Copy dan bukti

Gunakan kata kerja yang sesuai tugas: "Lihat pedoman penulis", "Mulai draf pengajuan", "Unduh PDF", "Tinjau naskah". Jelaskan batas sistem apa adanya. DOI yang baru disiapkan tidak disebut terdaftar, jurnal yang baru dibuat tidak disebut terbit, dan metadata tanpa sumber tidak ditampilkan sebagai fakta. Tidak ada statistik, testimoni, logo pelanggan, foto orang, atau badge promosi tanpa sumber dan izin yang jelas.

## Penerapan dan gate

Perubahan visual harus menjelaskan tujuan warna, huruf, tata letak, spasi, kartu, ikon, dan gerak dalam satu kalimat. Setelah implementasi, jalankan Delivery Gate antislop untuk Hard Gate, Purpose Gate, liveliness, dan craftsmanship. Catat hasil klik tiap kontrol, ukuran layar, tema, kontras, build, dan keterbatasan verifikasi. Temuan setelah implementasi dicatat terpisah dari arah desain ini.

**Status implementasi:** dokumen ini adalah target yang dapat ditinjau. Kepatuhan UI saat ini belum dinyatakan lulus; lihat audit di `anti-slop/` dan peta celah di `docs/08-planning/OJS_REPLACEMENT_GAP.md`.
