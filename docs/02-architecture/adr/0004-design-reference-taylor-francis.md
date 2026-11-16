# ADR 0004: Design Reference — Taylor & Francis Online + 3 Peers

## Status
Accepted

## Context
Butuh design system yang "tier-1 publisher quality" — bukan generic AI slop. Perlu reference yang measurable.

## Decision
**Primary North Star: Taylor & Francis Online (tandfonline.com)**
**Secondary References (specific patterns):**
1. **Elsevier ScienceDirect** — Article page layout, figures/tables, references linking
2. **Nature / PLOS** — XML-first content rendering, accessibility, metadata richness
3. **Wiley Online Library** — Journal page, browse/search UX, institutional branding

## Why Taylor & Francis?
- Clean, academic aesthetic tanpa bloat
- Excellent article page: structured metadata, citation export, figures lightbox, references linking
- Journal page: clear hierarchy (aims/scope, editorial board, metrics, collections)
- Search: faceted, type-ahead, saved searches
- Accessibility: WCAG 2.1 AA compliant
- Performance: fast, proper caching

## Design Token Extraction (Week 1)
Audit 4 situs → extract:
| Token Category | Sources | Output |
|----------------|---------|--------|
| Color palette | All 4 | Semantic tokens (primary, secondary, semantic: success/warning/error, neutral scale) |
| Typography scale | T&F, Nature | Modular scale (1.25 ratio), font stacks (system + Inter fallback) |
| Spacing system | All 4 | 4px base, consistent rhythm |
| Motion/Animation | Nature, PLOS | Reduced-motion respect, meaningful transitions |
| Component patterns | All 4 | Button variants, Card layouts, Table states, Form patterns |

## Component Library Target (Week 1-2)
| Component | Priority | Reference |
|-----------|----------|-----------|
| ArticlePage | P0 | T&F article page |
| JournalPage | P0 | T&F journal page |
| SearchResults | P0 | ScienceDirect search |
| ArticleCard | P0 | All |
| CitationExport | P0 | T&F + Nature |
| FigureLightbox | P0 | ScienceDirect |
| TableResponsive | P0 | Nature |
| Header/Footer | P1 | T&F |
| AuthorProfile | P1 | ORCID + T&F |
| EditorialBoard | P1 | Wiley |
| MetricsDisplay | P2 | All |

## Quality Gates
- **Storybook + Chromatic**: Visual regression pada setiap PR
- **axe-core**: 0 violations (WCAG 2.1 AA)
- **Lighthouse CI**: Performance ≥ 90, Accessibility 100, Best Practices ≥ 90
- **Bundle size**: < 150KB JS gzipped (first load)

## Anti-Patterns to Avoid
- ❌ Generic shadcn/ui tanpa customisasi token
- ❌ Lorem ipsum di production components
- ❌ Hardcoded colors/spacing (`blue-500`, `p-4`)
- ❌ Motion tanpa `prefers-reduced-motion`
- ❌ Tanpa dark mode support
- ❌ Tanpa RTL support (Arabic/Hebrew journals)

## References
- Taylor & Francis Online: https://www.tandfonline.com/
- Elsevier ScienceDirect: https://www.sciencedirect.com/
- Nature: https://www.nature.com/
- PLOS: https://plos.org/
- Wiley Online Library: https://onlinelibrary.wiley.com/