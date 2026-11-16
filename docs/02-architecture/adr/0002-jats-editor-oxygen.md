# ADR 0002: JATS XML Editor — oXygen Web Author

## Status
Accepted

## Context
Production workflow memerlukan JATS XML editing untuk:
- Copyediting manuscript XML
- Typesetting adjustments
- Proof corrections
- Metadata enrichment

Alternatif:
1. **oXygen Web Author** (commercial, ~$500-1000/user/tahun) — Industry standard, full JATS support, track changes, comments, validation
2. **FontoXML** (commercial, enterprise) — Similar, more customizable
3. **Custom ProseMirror + JATS schema** (open source, 6-12 bulan dev) — Full control, tapi huge effort
4. **Manual XML editing** (textarea) — Tidak feasible untuk production

## Decision
Phase 1-2: **Manual JATS workflow** (typeset.sh generates JATS dari manuscript, editor review di HTML proof).
Phase 3+: **oXygen Web Author** integration saat budget allow.

## Rationale
- 4 jurnal launch tidak butuh full JATS editing day-1
- typeset.sh sudah generate valid JATS dari manuscript
- HTML proof di browser cukup untuk copyedit/proof review awal
- oXygen Web Author cost signifikan untuk tim kecil

## Future Integration Plan
```
JATS XML (storage) ↔ oXygen Web Author (editor) ↔ typeset.sh (HTML/PDF)
```
- Store JATS di Supabase Storage / DB
- oXygen Web Author connect via WebDAV / REST API
- Round-trip editing preserved

## References
- oXygen Web Author: https://www.oxygenxml.com/web_author/
- JATS4R recommendations: https://jats4r.org/