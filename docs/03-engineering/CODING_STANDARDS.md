# Coding Standards

**Status:** Proposed baseline

## 1. General

- Gunakan TypeScript strict dan named exports sebagai default.
- Utamakan nama domain yang jelas daripada singkatan internal.
- File/module memiliki satu tanggung jawab utama.
- Hindari `any`, type assertions yang tidak perlu, `@ts-ignore`, dan non-null assertion tanpa alasan yang terdokumentasi.
- Jangan membuat abstraction sebelum ada kebutuhan yang nyata.

## 2. Naming

- React components/types: `PascalCase`.
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` hanya untuk nilai yang benar-benar konstan/global.
- Database tables/columns: pilih `snake_case` atau konvensi ORM dan gunakan konsisten; keputusan final dicatat dalam ADR.
- Domain events: past tense, misalnya `SubmissionReceived`.
- Commands/use cases: kata kerja yang eksplisit, misalnya `AssignReviewer`.

## 3. Error handling

- Bedakan validation, authentication, authorization, conflict, not found, rate limit, dependency failure, dan unexpected failure.
- Gunakan structured error code yang stabil untuk client/API.
- Jangan expose stack trace, SQL, storage key privat, atau detail provider.
- Retry hanya untuk error yang memang transient dan operasi idempotent.

## 4. Validation and types

- Validasi di boundary (form, request, webhook, job payload, file import).
- Domain layer tidak boleh bergantung pada schema HTTP.
- Gunakan DTO yang minimal dan eksplisit; jangan mengirim database records mentah ke client.
- Parse tanggal dan timezone secara eksplisit; simpan timestamp teknis dalam UTC.

## 5. React / Next.js

- Server Components default.
- Client boundary sekecil mungkin.
- Hindari fetch waterfall; gunakan data loading yang sesuai dan parallel ketika aman.
- Cache private data harus memperhitungkan user dan tenant scope.
- UI tidak menentukan authorization; server tetap memverifikasi setiap aksi.
- Jangan mengakses `process.env` secret dari client component.

## 6. Dependency policy

Sebelum menambah dependency, tulis alasan, alternatif, security posture, maintenance health, license, bundle/operational impact, dan bagaimana dependency akan dihapus/diganti. Lock versi melalui package manager; jangan edit lockfile manual.

## 7. Comments and documentation

Komentar menjelaskan alasan/invariant, bukan mengulang kode. Public contracts, state transition, policy, dan integrasi eksternal harus terdokumentasi.
