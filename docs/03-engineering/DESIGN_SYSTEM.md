# Design System and Product UX

**Status:** Proposed baseline

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
