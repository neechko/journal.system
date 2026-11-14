# Personas, Roles, and Tenancy Model

**Status:** Proposed baseline

## 1. Hierarki tenant

```text
Platform
└── Organization / Publisher
    ├── Journal A
    │   ├── Editorial team
    │   ├── Issues
    │   └── Articles
    └── Journal B
        ├── Editorial team
        ├── Issues
        └── Articles
```

Satu user dapat menjadi author di banyak jurnal dan dapat memiliki role yang berbeda di organization/journal yang berbeda. Identitas user bersifat global; membership dan assignment bersifat scoped.

## 2. Personas

| Persona | Tujuan utama | Contoh izin |
|---|---|---|
| Platform operator | Mengelola platform dan tenant | Provision organization, support terkontrol |
| Organization admin | Mengelola institusi dan jurnal | Journal setup, membership, billing bila ada |
| Publisher manager | Memantau portofolio jurnal | Dashboard dan reporting sesuai scope |
| Editor in Chief | Mengelola kebijakan dan keputusan jurnal | Final editorial decision |
| Managing editor | Menjalankan operasional workflow | Assignment, screening, workflow coordination |
| Section editor | Mengelola submission tertentu | Editorial action dalam assignment |
| Reviewer | Menilai naskah yang ditugaskan | Review report dan recommendation |
| Author | Mengirim dan memperbaiki naskah | Submission dan revision miliknya |
| Production editor | Menyiapkan artikel accepted | Copyedit, proof, production files |
| Reader | Menemukan dan membaca artikel | Public content access |

Role names adalah contoh, bukan daftar lengkap final.

## 3. Otorisasi

Gunakan kombinasi RBAC + scope-aware policy (dan atribut bila diperlukan). Setiap policy menjawab:

- Siapa aktornya?
- Aksi apa yang diminta?
- Objek apa yang diakses?
- Tenant/journal apa yang menjadi scope?
- Apakah aktor ditugaskan pada manuscript tersebut?
- Apakah status workflow mengizinkan aksi?

Default deny. Jangan memakai satu `isAdmin` global untuk semua konteks.

## 4. Blind review

Model harus mendukung single-blind, double-blind, dan open review sebagai konfigurasi workflow. API dan UI harus menghindari kebocoran identitas reviewer/author yang dilarang oleh mode review. Log internal tetap menyimpan identitas dengan access control.

## 5. Pertanyaan yang belum diputuskan

- Apakah user identity dan login dikelola sendiri atau memakai identity provider eksternal?
- Apakah editor dapat bekerja lintas jurnal dalam satu organisasi?
- Apakah organisasi dapat mendelegasikan pengelolaan jurnal kepada vendor/partner?
- Apakah tenant membutuhkan data residency atau dedicated database?
- Apakah jurnal dapat dipindahkan antar organisasi? Bagaimana hak dan audit trail dipertahankan?
