# Prompt Recipes for Agentic Development

Prompt harus menyebut goal, konteks, batasan, acceptance criteria, dan bentuk verifikasi. Hindari prompt seperti “buatkan semua fitur seperti Elsevier”.

## 1. Repository reconnaissance (read-only)

```text
Baca AGENTS.md dan docs/README.md. Jangan mengubah file.
Petakan struktur repository yang benar-benar ada, bounded contexts yang sudah ada,
entry points, data access pattern, test strategy, dan gap terhadap dokumen arsitektur.
Pisahkan fakta yang ditemukan di kode dari asumsi atau rekomendasi.
Berikan ringkasan maksimal 10 temuan dan pertanyaan keputusan yang paling penting.
```

## 2. Feature discovery before coding

```text
Jangan coding dulu. Baca dokumen produk/domain/arsitektur yang relevan dan inspect kode.
Ubah permintaan berikut menjadi feature specification: [request].
Tuliskan user story, acceptance criteria Given/When/Then, role/tenant matrix,
state transitions, data/API impact, failure cases, test plan, dan out-of-scope.
Tandai semua konflik atau TBD; jangan mengarang keputusan final.
```

## 3. Implementation

```text
Implementasikan feature yang sudah disetujui pada [feature spec path].
Ikuti AGENTS.md dan ADR yang relevan. Untuk Next.js baca docs lokal versi terpasang.
Buat perubahan terkecil, validasi input, periksa authorization dan tenant scope di server,
serta tambahkan tests termasuk negative tests. Jangan mengubah scope lain.
Jalankan checks dan laporkan command serta hasil persisnya.
```

## 4. Security review

```text
Lakukan review read-only terhadap perubahan [diff/PR]. Fokus pada authentication,
authorization, tenant isolation, IDOR, cache leakage, file access, SSRF/CSRF,
secret exposure, logs, blind-review confidentiality, and AI prompt injection.
Untuk setiap temuan tulis severity, file/line, exploit scenario, impact, dan remediation.
Jangan mengubah kode sebelum diminta.
```

## 5. Test generation

```text
Berdasarkan acceptance criteria dan domain rules [paths], identifikasi skenario test
positif, negatif, boundary, concurrency, retry/idempotency, dan tenant isolation.
Implementasikan test tanpa mengubah production code kecuali ada defect yang menghalangi.
Jangan membuat test yang hanya mengulang implementation detail.
```

## 6. Refactoring

```text
Refactor [module] untuk [specific reason]. Pertahankan behavior dan public contract.
Sebelum mengubah, identifikasi callers, tests, dependency boundaries, and risks.
Jangan mengubah schema, API behavior, role semantics, or workflow states.
Buktikan equivalence dengan tests dan jelaskan perubahan struktur.
```

## 7. Documentation/ADR update

```text
Bandingkan implementasi saat ini dengan [docs/ADR path]. Identifikasi drift.
Jangan mengubah status keputusan secara implisit. Usulkan edit dokumentasi dan/atau ADR,
sertakan alasan, consequences, migration impact, dan keputusan yang perlu disetujui.
```
