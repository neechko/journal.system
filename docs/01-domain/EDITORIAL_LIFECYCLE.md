# Editorial and Publishing Lifecycle

**Status:** Proposed baseline; harus divalidasi dengan kebijakan jurnal per tenant.

## 1. Prinsip

- Workflow merupakan state machine, bukan string status bebas.
- Setiap transition memiliki actor, guard/permission, reason, timestamp, dan audit event.
- Konfigurasi tiap jurnal boleh mengubah detail proses, tetapi tidak boleh menonaktifkan kontrol keamanan atau audit.
- Rekomendasi reviewer tidak sama dengan keputusan editor.
- AI tidak membuat final academic decision.

## 2. Draft lifecycle

```text
DRAFT
  └─ submit → SUBMITTED
       └─ intake check → INITIAL_CHECK
            ├─ return to author → AUTHOR_ACTION_REQUIRED
            ├─ desk reject → REJECTED
            └─ pass → EDITOR_ASSIGNMENT
                 └─ assign editor → WITH_EDITOR
                      ├─ reject → REJECTED
                      └─ invite reviewers → UNDER_REVIEW
                           ├─ review complete → EDITOR_DECISION_PENDING
                           │    ├─ revision → REVISION_REQUESTED
                           │    │    └─ resubmit → RESUBMITTED → UNDER_REVIEW / EDITOR_DECISION_PENDING
                           │    ├─ accept → ACCEPTED
                           │    └─ reject → REJECTED
                           └─ withdraw → WITHDRAWN (where allowed)

ACCEPTED → PRODUCTION → AUTHOR_PROOF → READY_TO_PUBLISH
          → PUBLISHED → CORRECTED / RETRACTED (if applicable)
```

Diagram ini baseline, bukan workflow final. Implementasi harus memakai transition table/guard formal; jangan menyalin diagram sebagai satu-satunya spesifikasi.

## 3. Transition record minimum

- entity ID dan tenant/journal scope
- state before dan after
- actor ID dan actor type (human/system/AI)
- action/command
- reason/comment yang sesuai
- event timestamp (UTC)
- correlation/request ID
- source (UI/API/system job)
- idempotency key bila aksi dapat diulang

## 4. Reviewer confidentiality

- Sistem harus mendukung mode single-blind, double-blind, dan open review.
- Pada double-blind, identitas author/reviewer tidak boleh bocor ke pihak yang tidak berhak melalui UI, API, file metadata, filename, email, export, atau log.
- Permission reviewer dibatasi pada assignment aktif dan data yang diperlukan.

## 5. Editorial decisions

Decision types (mis. accept, minor revision, major revision, reject, resubmit) harus configurable dan memiliki definisi kebijakan. Simpan final decision secara terpisah dari reviewer recommendation. Perubahan keputusan membutuhkan permission dan audit trail.

## 6. Edge cases yang wajib dirancang

- Reviewer menolak undangan atau tidak merespons.
- Reviewer diganti setelah menerima undangan.
- Author meminta withdrawal.
- Submission dikirim ganda.
- Revisi terlambat dan extension.
- Conflict of interest.
- Editor menangani submission miliknya sendiri (harus dicegah/dikelola sesuai kebijakan).
- Transfer submission antarjurnal.
- Reopen/reconsideration/appeal.
- Correction, expression of concern, dan retraction setelah publikasi.
- Publikasi ahead-of-print sebelum issue assignment.
- Resubmission setelah reject (apakah submission baru atau versi lama) ditentukan kebijakan.
