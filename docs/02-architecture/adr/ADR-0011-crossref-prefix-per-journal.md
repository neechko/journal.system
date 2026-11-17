# ADR-0011: Crossref DOI Prefix — One Per Journal

## Status
Accepted

## Context
Crossref membership menyediakan DOI prefix (contoh: `10.5555`). Platform memiliki 4 jurnal di launch.

Alternatif:
1. **Satu prefix untuk semua jurnal** — Simple, tapi kurang flexibel
2. **Satu prefix per jurnal** (chosen) — 4 prefix total

## Decision
**Satu Crossref prefix per jurnal** (4 prefix untuk 4 jurnal).

## Rationale

### Flexibility & Branding
- Masing-masing jurnal punya identity sendiri: `10.xxxx/jcs`, `10.xxxx/ije`, `10.xxxx/mrr`, `10.xxxx/ssq`
- Publisher (universitas/institusi) berbeda-beda → prefix per jurnal = branding jelas
- Metadata Crossref: `journal_title`, `journal_abbreviation` per prefix

### Operational
- Crossref deposit per jurnal terpisah → easier debugging
- Jika satu jurnal pindah publisher → prefix stays with journal
- Usage reports per prefix = per jurnal analytics

### Technical
```typescript
// Domain model
interface Journal {
  crossrefPrefix: string;  // "10.5555"
  crossrefSuffixPattern: string; // "jcs.{year}.{articleNumber}"
}

// DOI generation
function generateDoi(journal: Journal, article: Article): string {
  const suffix = journal.crossrefSuffixPattern
    .replace('{year}', new Date().getFullYear().toString())
    .replace('{articleNumber}', article.sequenceNumber.toString().padStart(4, '0'));
  return `${journal.crossrefPrefix}/${suffix}`;
}
```

## Crossref Membership
- **Satu membership** (organization level) bisa hold multiple prefixes
- Cost: $275/tahun membership + $1/DOI (volume discount available)
- 4 jurnal × ~100 artikel/tahun = ~$400/tahun DOI fees

## Prefix Assignment (Dummy untuk Launch)
| Journal | Slug | Crossref Prefix (Dummy) | Real Prefix (Nanti) |
|---------|------|------------------------|---------------------|
| Journal of Computer Science | jcs | `10.50000` | Apply ke Crossref |
| International Journal of Engineering | ije | `10.50001` | Apply ke Crossref |
| Medical Research Review | mrr | `10.50002` | Apply ke Crossref |
| Social Sciences Quarterly | ssq | `10.50003` | Apply ke Crossref |

> **Note**: Dummy prefix `10.50000-10.50003` untuk development. Real prefix didapat saat apply Crossref membership.

## Crossref Deposit Workflow
```
Article Published → Build Crossref XML → Deposit via API → Get DOI → Store DOI
```
- XML generated per jurnal (journal-specific metadata)
- Deposit ke sandbox dulu → production setelah verified
- Crossmark registration untuk corrections/updates

## References
- Crossref DOI structure: https://www.crossref.org/documentation/
- Crossref XML schema: https://www.crossref.org/schema/
- Multiple prefixes per member: https://www.crossref.org/documentation/multiple-prefixes/
