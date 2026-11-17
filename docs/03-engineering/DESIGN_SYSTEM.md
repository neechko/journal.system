# Design System and Product UX

**Status:** Proposed baseline  
**Last reviewed:** 2026-11-18

Arah visual dan alasan keputusan ada di `../../DESIGN.md`. Dokumen ini mencatat
prinsip implementasi; status komponen saat ini tidak otomatis memenuhi semua gate
antislop atau WCAG.

## 1. Product experience goals

- Publik: discovery-first, editorial clarity, readable article pages, stable citation metadata.
- Workspace: task-oriented dashboards sesuai role (author, reviewer, editor, production, organization admin).
- Institusi: overview lintas jurnal dengan batas akses yang jelas.
- Consistency: satu design system lintas public site dan workspace, dengan variasi visual seperlunya.

## 2. Principles

- Desain orisinal; jangan menjiplak visual atau aset proprietary penerbit lain.
- Responsive from mobile to desktop.
- Accessibility target: WCAG 2.2 AA sebagai target desain, perlu audit sebelum klaim compliance.
- Semantic HTML, keyboard navigation, visible focus, labels, error summaries, sufficient contrast.
- Loading, empty, error, disabled, permission-denied, and success states harus dirancang.
- Gunakan design tokens (color, typography, spacing, radius, elevation, motion) daripada hard-coded visual values.

## 3. Component policy

- Shared components untuk pattern yang benar-benar sama.
- Business-specific views tetap berada dekat modul domain.
- Forms harus menampilkan validation feedback yang bisa dipahami.
- Tables/list besar memerlukan pagination, empty state, loading, dan accessible labels.
- Jangan menaruh keputusan akses hanya dengan menyembunyikan tombol; server tetap memeriksa permission.

## 4. Reference capture

Saat mempelajari Elsevier/Springer/Atypon atau situs lain, catat pola UX, struktur informasi, dan interaksi sebagai referensi fungsional. Jangan menyalin logo, teks, source assets, atau branding mereka. Simpan screenshot referensi hanya jika hak penggunaan dan provenance jelas.

Pada 2026-11-15, `https://publion.org/` ditinjau sebagai referensi pola
informasi: navigasi lintas kebutuhan, pernyataan misi yang jelas, jalur ke
konten jurnal, pengelompokan kapabilitas, ajakan bertindak, dan footer yang
membantu orientasi. Pola tersebut diadaptasi untuk scope produk ini; identitas,
teks, aset, dan komposisi visual Publion tidak disalin.

## 5. Implementasi visual awal

Status tetap Proposed; implementasi awal bukan keputusan branding atau klaim
bahwa target aksesibilitas telah tercapai.

- Area publik menggunakan pola discovery-first dengan navigasi jurnal,
  pencarian katalog, profil jurnal, dan status fitur yang tersedia atau belum
  tersedia.
- Token visual awal memakai latar paper dan teks ink. Nama token `forest`,
  `lime`, dan `coral` adalah warisan implementasi, bukan identitas merek final.
  Warna jurnal tidak boleh diturunkan dari nama disiplin atau warna penerbit
  referensi. UI memakai sans sistem; judul dan teks editorial memakai serif.
- Header dan footer publik dipakai bersama oleh beranda, katalog, dan profil
  jurnal. Workspace pengelola memakai token yang sama dengan navigasi privat
  tersendiri; authorization dan guard tetap berada di server.
- Data contoh atau jurnal yang dipublikasikan ditampilkan sebagai data nyata
  dari katalog publik; jangan mengganti data dengan angka, indeksasi, DOI,
  ISSN, atau afiliasi fiktif untuk mempercantik tampilan.
- Target WCAG 2.2 AA belum diaudit. Kontras, keyboard, pembaca layar, zoom, dan
  perangkat bergerak tetap perlu diuji pada iterasi UI berikutnya.
