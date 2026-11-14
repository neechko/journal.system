# Scholarly Publishing Platform — Agent-Ready Starter Pack

**Status:** Draft awal / baseline untuk diskusi. **Tanggal:** 14 November 2026.

Paket ini menyiapkan dokumentasi proyek agar manusia dan AI coding agents memiliki konteks yang konsisten sebelum implementasi dimulai. Ini bukan aplikasi yang sudah berjalan, bukan spesifikasi final, dan bukan klaim bahwa semua keputusan teknologi sudah disetujui.

## Cara menggunakan paket

1. Ekstrak seluruh isi ZIP ke **root repository** baru.
2. Ganti nama kerja `Scholarly Publishing Platform` bila nama produk sudah ditetapkan.
3. Baca `docs/00-product/PRODUCT_VISION.md`, `docs/00-product/MVP_SCOPE.md`, dan `docs/02-architecture/ARCHITECTURE_OVERVIEW.md` bersama tim. Ubah bagian `TBD` dan tandai keputusan sebagai `Proposed`, `Accepted`, atau `Rejected`.
4. Buat repository Git. Commit baseline dokumen ini sebelum meminta agent membuat kode.
5. Scaffold Next.js menggunakan versi stable yang tersedia pada saat inisialisasi, TypeScript, App Router, dan package manager yang dipilih. Commit lockfile.
6. Pastikan agent benar-benar membaca `AGENTS.md`; lakukan smoke test dengan meminta agent merangkum aturan, domain, dan struktur repository tanpa mengubah file.
7. Implementasikan **vertical slice** kecil terlebih dahulu: buat organisasi/publisher → buat jurnal → tampilkan halaman jurnal publik. Jangan membangun seluruh modul sekaligus.

## Struktur paket

```text
AGENTS.md                         # Instruksi utama lintas-agent
CLAUDE.md                         # Pointer Claude Code ke AGENTS.md
.github/copilot-instructions.md   # Pointer GitHub Copilot
.cursor/rules/*.mdc               # Aturan khusus Cursor yang scoped

docs/
  00-product/                     # Visi, ruang lingkup, pengguna, tenancy
  01-domain/                      # Bounded contexts, istilah, workflow, JATS
  02-architecture/                # Arsitektur, struktur repo, ADR
  03-engineering/                 # Konvensi coding, database, API, UI
  04-quality/                     # Testing dan Definition of Done
  05-security/                    # Baseline keamanan dan multi-tenancy
  06-operations/                  # Observability, backup, operasional
  07-ai/                          # Cara agent bekerja dan template task
  08-planning/                    # Roadmap awal dan register keputusan
  templates/                      # Template spesifikasi, ADR, incident
```

## Prinsip dokumentasi

- `AGENTS.md` menjelaskan **cara agent bekerja**, bukan mengulang seluruh dokumentasi produk.
- Dokumen domain dan arsitektur adalah sumber kebenaran tentang **apa yang dibangun** dan **mengapa**.
- Kode dan test adalah sumber kebenaran tentang **apa yang benar-benar sudah berjalan**. Saat dokumen dan implementasi berbeda, jangan diam-diam menganggap salah satunya benar: laporkan konflik, verifikasi, lalu perbarui salah satunya.
- Setiap keputusan yang berdampak lintas modul dicatat sebagai ADR.
- `TBD` berarti belum diputuskan; agent tidak boleh mengarang keputusan seolah-olah sudah final.
- Dokumen perlu diperbarui dalam pull request ketika behavior, kontrak, status workflow, atau keputusan arsitektur berubah.

## Label status keputusan

- `Proposed`: usulan awal, belum disahkan.
- `Accepted`: disepakati dan menjadi standar proyek.
- `Rejected`: pernah dipertimbangkan namun tidak dipilih.
- `Superseded`: pernah diterima tetapi diganti ADR yang lebih baru.
- `TBD`: perlu keputusan manusia.

## Referensi resmi yang perlu dibaca

- Next.js — AI Coding Agents: https://nextjs.org/docs/app/guides/ai-agents
- Next.js — Data Security: https://nextjs.org/docs/app/guides/data-security
- Next.js — App Router: https://nextjs.org/docs/app
- Next.js — Project Structure: https://nextjs.org/docs/app/getting-started/project-structure
- Next.js — Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Codex — AGENTS.md: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- Cursor — Rules: https://cursor.com/docs/rules
- GitHub Copilot — Custom Instructions: https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions
- Claude Code — CLAUDE.md: https://support.claude.com/en/articles/14553240-give-claude-context-claude-md-and-better-prompts
- NISO JATS: https://www.niso.org/standards-committees/jats
- JATS version list: https://jats.nlm.nih.gov/versions.html

Periksa kembali dokumentasi resmi saat implementasi; versi dan praktik framework dapat berubah. Jangan menganggap tautan ini menggantikan dokumentasi versi yang sudah terpasang pada repository.
