# API and Integration Contracts

**Status:** Proposed baseline

## 1. Internal boundaries

- Route Handlers dan Server Actions adalah transport adapters.
- Business behavior diimplementasikan sebagai application use cases.
- Input dan output memiliki runtime schema dan type yang jelas.
- Response client tidak mengandung internal database shape atau data pribadi yang tidak diperlukan.

## 2. API behavior

- Gunakan HTTP semantics secara konsisten untuk Route Handlers.
- Error responses memiliki stable code, human-safe message, dan correlation ID.
- Aksi yang dapat diulang/dipicu jaringan harus idempotent bila memungkinkan.
- Pagination, sorting, filtering, and maximum page size harus eksplisit.
- Rate-limit login, invite, submission, upload, search, webhook, and other abuse-prone endpoints.

## 3. Versioning

- Perubahan internal dapat berkembang bersama deployment monolith.
- API eksternal/public harus memiliki versioning dan compatibility policy sebelum dirilis.
- Jangan mengubah kontrak integrasi secara breaking tanpa migration/deprecation plan.

## 4. External integrations (future contracts)

| Integration | Tujuan | Prinsip |
|---|---|---|
| Crossref | DOI metadata registration/update | Simpan deposit payload, response, attempt, dan status yang dapat diverifikasi |
| ORCID | Author identity / OAuth | Minta scope minimum dan simpan consent/token securely |
| ROR | Research organization identifiers | Simpan ROR ID dan provenance; validasi melalui sumber resmi |
| OAI-PMH | Metadata harvesting | Dokumentasikan set, format, resumption token, deleted records |
| Email provider | Notification | Template, suppression, retry, delivery status, audit |
| Storage provider | Manuscript/assets | Private-by-default, checksum, signed URLs, lifecycle |
| Search engine | Discovery | Projection dapat dibangun ulang dari primary data |

Jangan menyatakan integrasi aktif hanya karena field atau tombol UI sudah ada.
