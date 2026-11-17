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

DOI registration is currently disabled in the application use case. The
existing XML helper and `doi_registration` table are preparation only; they
do not prove a Crossref deposit or resolver verification. A later implementation
must record deposit attempts and provider responses, require human approval,
and expose distinct pending, accepted, and verified states before using the
word "registered" in an audit event or public page.
Public article, issue, and journal reads currently omit stored DOI values
because the schema cannot distinguish an assigned string from a verified DOI.

## 5. Development-only manuscript attachment slice

The current author draft prototype accepts versioned PDF attachments through an
authenticated Server Action and streams downloads through an owner-scoped
Route Handler. Each request resolves the author from the server session; client
organization, author, and storage identifiers are not trusted for access
control. The supported file is PDF only, limited to 10 MB, with extension,
declared MIME type, file signature, and SHA-256 integrity checks. Original file
names are not retained.

For local synthetic-data testing only, an explicit environment opt-in stores
files outside `public` on local disk. The adapter is unencrypted, has no malware
scanner or rate limiter, and is always disabled in production. Do not upload
real or confidential manuscripts. This prototype does not implement final
review access, production object storage, retention/deletion policy, or malware
scanning; those remain prerequisites for real manuscript use.

## 6. Author submission transition

The author workspace supports one guarded transition, `draft` → `submitted`.
The server checks ownership, a present and integrity-verified latest PDF, an
explicit author confirmation, and local private storage availability. The
transition and its audit event commit atomically; the event records the prior
and resulting states, human actor, source, reason, tenant, timestamp, and a
server-generated correlation ID. Repeated or stale transitions do not create
another transition event. The exact submitted manuscript version is stored
with the submission for provenance. Submitted metadata and manuscript versions
are read-only to the author; intake screening, editorial assignment, reviewer
access, and editorial decisions remain unimplemented.

The current author draft prototype includes an optional structured keyword list
entered one per line. The application trims entries and ignores blank lines; it
accepts up to 20 keywords, each no longer than 100 characters. Keywords remain
private to the author under the existing owner-scoped submission queries and
become read-only when the author submits.

## 7. Journal public profile updates

An organization admin can update a journal's public description, aims and scope,
and author guidelines through the authenticated journal workspace. The server
validates the input, checks the actor's organization scope, and writes the
profile change and audit event in one transaction. Each update requires an
explicit confirmation and audit reason. Blank fields are stored as `null`;
description is limited to 2,000 characters. Updates to a published journal
appear on its public profile and directory after revalidation. This action does
not change the journal title, slug, or publication state.

**Last reviewed:** 2026-11-18
