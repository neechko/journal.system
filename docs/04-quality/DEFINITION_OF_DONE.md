# Definition of Done

Sebuah task/feature dianggap selesai hanya jika kriteria relevan berikut terpenuhi:

## Product and domain
- [ ] Acceptance criteria terpenuhi.
- [ ] Behavior sesuai product scope dan domain glossary.
- [ ] Workflow/state transition hanya melalui use case yang sah.
- [ ] Edge cases penting ditangani atau dicatat sebagai risiko.

## Security and privacy
- [ ] Authentication dan authorization diperiksa di server.
- [ ] Tenant scope diverifikasi untuk semua akses data.
- [ ] User input divalidasi.
- [ ] Tidak ada secret/data sensitif bocor ke client/log/test.
- [ ] Private files tidak menjadi public permanen.
- [ ] Blind review/confidentiality tidak dilanggar.

## Quality
- [ ] Unit/integration/E2E tests yang relevan ditambahkan/diperbarui.
- [ ] Regression test ditambahkan untuk bug fix.
- [ ] Lint dan typecheck lulus.
- [ ] Build lulus bila perubahan memengaruhi build/runtime.
- [ ] Tidak ada test yang dilemahkan untuk menyembunyikan kegagalan.

## Operations
- [ ] Errors/logging/metrics cukup untuk diagnosis.
- [ ] Background jobs idempotent dan retry behavior dipahami.
- [ ] Migration/data backfill aman dan direview bila ada.

## Documentation
- [ ] API/domain/architecture docs diperbarui bila kontrak berubah.
- [ ] ADR dibuat/diubah bila keputusan lintas modul berubah.
- [ ] Changelog diperbarui untuk perubahan yang terlihat pengguna bila proyek mengadopsi changelog.

## Agent report
- [ ] Menyebutkan file/area yang diubah.
- [ ] Mencantumkan command test/lint/typecheck/build yang benar-benar dijalankan.
- [ ] Menjelaskan hasil gagal/tidak dapat dijalankan.
- [ ] Menyebutkan asumsi dan keputusan yang masih perlu manusia.
