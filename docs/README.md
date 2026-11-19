# Documentation map

| Area | Canonical document | When to read |
|---|---|---|
| Vision | `00-product/PRODUCT_VISION.md` | Semua perubahan produk |
| MVP | `00-product/MVP_SCOPE.md` | Prioritas dan batas rilis awal |
| Personas/tenancy | `00-product/PERSONAS_AND_TENANCY.md` | User, tenant, role, akses |
| Domain map | `01-domain/DOMAIN_MAP.md` | Pembagian modul/domain |
| Glossary | `01-domain/GLOSSARY.md` | Istilah dan definisi |
| Workflow | `01-domain/EDITORIAL_LIFECYCLE.md` | Submission, review, keputusan, produksi, publikasi |
| Article content | `01-domain/CONTENT_AND_JATS.md` | Model konten, XML, PDF, HTML |
| Architecture | `02-architecture/ARCHITECTURE_OVERVIEW.md` | Struktur sistem |
| Repository | `02-architecture/REPOSITORY_STRUCTURE.md` | Penempatan file dan dependensi |
| ADR | `02-architecture/adr/` | Keputusan teknis |
| Coding | `03-engineering/CODING_STANDARDS.md` | Implementasi |
| Database | `03-engineering/DATABASE_GUIDELINES.md` | Schema/migration/query |
| API | `03-engineering/API_CONTRACTS.md` | Endpoint dan integrasi |
| UI | `03-engineering/DESIGN_SYSTEM.md` | UI/UX |
| Test | `04-quality/TEST_STRATEGY.md` | Strategi test |
| DoD | `04-quality/DEFINITION_OF_DONE.md` | Kriteria selesai |
| Security | `05-security/SECURITY_BASELINE.md` | Semua data/auth/tenant |
| Operations | `06-operations/OBSERVABILITY_AND_OPERATIONS.md` | Deploy, backup, observability |
| AI workflow | `07-ai/AGENT_WORKFLOW.md` | Cara memakai agent |
| Task prompt | `07-ai/TASK_TEMPLATE.md` | Prompt implementasi |
| Roadmap | `08-planning/ROADMAP.md` | Tahapan produk |
| Open decisions | `08-planning/DECISION_REGISTER.md` | Keputusan yang masih memblokir pekerjaan |
| OJS replacement gap | `08-planning/OJS_REPLACEMENT_GAP.md` | Bukti kemampuan saat ini dan gate menuju pengganti OJS |
| Design direction | `../DESIGN.md` | Arah visual, alasan keputusan, dan gate antislop |

## Aturan memelihara dokumentasi

- Ubah dokumen canonical, bukan hanya file ringkasan.
- Cantumkan tanggal `Last reviewed` saat dokumen ditinjau.
- Setiap perubahan besar pada arsitektur harus memiliki ADR.
- Jangan menyimpan rahasia, credential, data manuskrip asli, atau informasi pribadi dalam docs.
