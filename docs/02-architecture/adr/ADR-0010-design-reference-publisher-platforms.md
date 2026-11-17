# ADR-0010: Referensi pengalaman platform penerbit

## Status

Accepted (catatan lama, diamendemen berdasarkan arahan pemilik 2026-11-18)

Tanggal dan bukti persetujuan untuk versi awal catatan ini belum ditemukan.
Penomoran lama `0004-design-reference-taylor-francis.md` bertabrakan dengan
ADR hierarki tenant; lihat `../DECISION_LOG.md`.

## Konteks

Platform perlu membantu pembaca menemukan jurnal dan artikel, serta membantu
penulis, editor, reviewer, dan tim produksi menyelesaikan tugas mereka. Situs
penerbit besar memberi contoh kemampuan dan struktur informasi yang perlu
ditinjau, tetapi identitas visual, kode, aset, dan kontennya milik mereka.

## Keputusan

- Pelajari pola fungsional pada Taylor & Francis, Springer, Elsevier, Publion,
  dan platform serupa: navigasi jurnal, halaman artikel, pencarian, metadata,
  serta alur penulis dan editor.
- Rancang sistem visual asli dari kebutuhan konten dan pengguna platform ini.
  Jangan mengekstrak palet warna, komposisi, ikon, copy, atau aset proprietary
  dari referensi.
- Pakai token semantik dan komponen bersama hanya saat kebutuhan berulang
  terbukti. Antarmuka domain tetap berada dekat modulnya.
- Terapkan aturan antislop pada copy, visual, aksesibilitas, interaksi, dan
  layout ponsel. `DESIGN.md` mencatat arah visual kerja; audit dan tes browser
  diperlukan sebelum klaim kepatuhan atau kualitas rilis.
- Pertahankan Storybook dan Chromatic sebagai alat pemeriksaan komponen yang
  memang digunakan. Keberadaan alat atau story tidak membuktikan seluruh
  halaman lulus audit.

## Konsekuensi

Klaim lama tentang kepatuhan WCAG, performa, dan palet situs referensi tidak
dipakai sebagai fakta produk. Target aksesibilitas dan performa platform harus
diukur pada implementasi sendiri. Kebutuhan seperti ekspor sitasi, JATS,
figure viewer, dan pencarian artikel masuk roadmap berdasarkan prioritas
produk, bukan karena ada pada sebuah situs referensi.

## Referensi

- [OJS oleh PKP](https://pkp.sfu.ca/software/ojs/)
- [Taylor & Francis Online](https://www.tandfonline.com/)
- [Springer Link](https://link.springer.com/)
- [Elsevier](https://www.elsevier.com/)
- [Publion](https://publion.org/)
