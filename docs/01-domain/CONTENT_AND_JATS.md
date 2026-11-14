# Article Content Model and JATS Interoperability

**Status:** Proposed baseline

## 1. Prinsip content-first

PDF adalah salah satu output publikasi, bukan satu-satunya sumber data artikel. Simpan struktur artikel agar dapat dirender ke HTML, diekspor ke XML/JATS, dipakai untuk metadata, dan dimigrasikan.

## 2. Entitas konten konseptual

- Article identity and bibliographic metadata.
- Contributors/authors, affiliations, contributor roles (mis. CRediT bila dipakai), correspondence.
- Abstract, keywords, subject classifications.
- Structured body: sections, paragraphs, lists, quotations, equations, tables, figures, captions, footnotes, supplementary materials.
- References and citation links.
- Funding, acknowledgements, ethics, conflicts of interest, data availability.
- License, publication dates, history dates, identifiers.
- Article version, correction/retraction relations, provenance.

Jangan menyimpan seluruh struktur sebagai satu blob HTML tanpa schema dan validasi.

## 3. JATS

Baseline interoperabilitas: rancang adapter impor/ekspor terhadap **NISO JATS 1.4** (versi yang tercantum sebagai standar saat paket ini disusun). Pilih Tag Set dan schema yang sesuai dengan kebutuhan; dokumentasikan profil/constraint yang digunakan. Verifikasi ulang versi standar sebelum implementasi produksi.

- JATS XML harus divalidasi terhadap schema yang dipilih.
- Simpan versi XML, schema version, transform version, dan hasil validasi.
- Pertahankan file asli dan hasil transformasi dengan checksum/provenance.
- Tangani elemen yang belum didukung secara eksplisit; jangan membuang konten diam-diam.
- Sediakan round-trip tests untuk konten yang didukung.

## 4. Output targets

- Responsive article HTML.
- PDF (generated or supplied) with version and provenance.
- JATS XML.
- Crossref deposit metadata (setelah integrasi diimplementasikan dan diuji).
- Citation exports (mis. RIS/BibTeX) bila masuk scope.
- OAI-PMH records bila endpoint diimplementasikan.

## 5. Asset management

Asset memiliki storage key, MIME type, size, checksum, visibility, owner scope, version, alt text/caption, dan lifecycle. Private manuscript/review assets harus private by default. Public article assets dapat disajikan melalui signed/CDN-aware access policy.

## 6. Sumber rujukan

- NISO JATS: https://www.niso.org/standards-committees/jats
- JATS versions: https://jats.nlm.nih.gov/versions.html
- JATS Publishing Tag Set: https://jats.nlm.nih.gov/publishing/1.4/
