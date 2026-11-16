# ADR 0001: PDF Generation Engine — Playwright + typeset.sh

## Status
Accepted

## Context
Platform ini memerlukan PDF generation untuk:
- Article PDF (final published version)
- Proof PDF (author/editor review)
- Issue/Volume PDF (compiled)

Alternatif yang dievaluasi:
1. **PrinceXML** (commercial) — Industri standar, tapi $4-8k/server/tahun
2. **WeasyPrint** (open source) — CSS Paged Media partial, no CMYK, MathML limited
3. **Playwright + typeset.sh** (open source) — JATS → HTML (typeset.sh) → PDF (Playwright Chrome headless)
4. **Puppeteer print-to-PDF** — Screen CSS, bukan print CSS

## Decision
Gunakan **Playwright + typeset.sh** untuk Phase 1-2 (launch 4 jurnal).
- Zero license cost
- typeset.sh: JATS XML → HTML + CSS Paged Media (used by eLife, PLOS)
- Playwright: Headless Chrome dengan print CSS support yang cukup baik
- Deploy di Fly.io Micro VM ($5/bln) sebagai microservice

## Consequences
### Positif
- Cost: ~$5/bln vs $500+/bln untuk PrinceXML
- Single source: JATS XML → HTML (article page) → PDF (Playwright) → EPUB
- typeset.sh maintained by scholarly community

### Negatif
- Print CSS support tidak sepenuh PrinceXML (footnotes, cross-refs, indexes limited)
- No CMYK, no bleed/crop marks (tidak print-ready)
- Quality gap untuk publisher tier-1

### Mitigasi
- Phase 3+: Upgrade ke PrinceXML jika budget allow
- Proof workflow: HTML proof di browser (visual approximation) + PDF untuk review
- Document known limitations di CONTRIBUTING.md

## Migration Path to PrinceXML
1. Abstract PDF generation di `ProductionPDFService` interface
2. Implement `PlaywrightPDFService` (current) + `PrinceXMLPDFService` (future)
3. Feature flag: `NEXT_PUBLIC_PDF_ENGINE=playwright|princexml`
4. Switch tanpa breaking changes

## References
- typeset.sh: https://github.com/cermine/typeset.sh
- Playwright PDF: https://playwright.dev/docs/api/class-page#page-pdf
- PrinceXML case studies: https://www.princexml.com/case-studies/