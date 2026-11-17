# ADR-0009: Hosting & Database — Vercel + Supabase

## Status
Accepted

## Context
Butuh hosting untuk Next.js app + PostgreSQL database + Auth + Storage + Realtime.

Alternatif:
1. **Vercel + Supabase** (chosen) — Next.js native, managed Postgres, built-in Auth/Storage/Realtime
2. **AWS/GCP/Azure + RDS/Cloud SQL** — Full control, tapi ops overhead tinggi
3. **Railway/Render/Fly.io full stack** — Simpler, tapi less mature untuk Next.js
4. **Self-hosted K8s** — Maximum control, tapi butuh DevOps team

## Decision
**Vercel (Pro → Enterprise) + Supabase (Free → Pro)** untuk Phase 1-2.

### Vercel
- Next.js App Router native support
- ISR/SSG/SSR seamless
- Edge Functions untuk middleware (auth, tenant resolution)
- Preview deployments per PR
- Analytics, Speed Insights built-in
- Cost: $20/bln Pro, Enterprise custom

### Supabase
- Managed PostgreSQL (pgvector, pg_search ready)
- Row Level Security (RLS) untuk multi-tenancy
- Auth (OIDC, email, magic link, SSO ready)
- Storage (S3-compatible, CDN edge)
- Realtime subscriptions
- Database branching, PITR, backups
- Cost: Free tier generous, Pro $25/bln

## Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│  Supabase   │────▶│  Meilisearch│
│  (App)      │     │  (DB/Auth/  │     │  (Search)   │
│             │     │   Storage)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Fly.io     │     │   Resend    │     │  Chromatic  │
│  (PDF Svc)  │     │  (Email)    │     │  (Visual    │
│             │     │             │     │   Regression)│
└─────────────┘     └─────────────┘     └─────────────┘
```

## Tenant Isolation Strategy
- **Database level**: RLS policies pada semua tabel (`organization_id` = current tenant)
- **Application level**: Middleware resolve tenant dari subdomain/path → set `request.headers['x-tenant-id']`
- **API level**: Server Actions / Route Handlers validate tenant access sebelum query

## Migration Path (Phase 3+)
- Vercel Enterprise → Dedicated infrastructure
- Supabase → Self-hosted Postgres di K8s (Citus untuk scaling)
- Meilisearch Cloud → Self-hosted Meilisearch cluster

## Cost Projection
| Phase | Vercel | Supabase | Meilisearch | Fly.io | Total/bln |
|-------|--------|----------|-------------|--------|-----------|
| 1-2 (Launch) | $20 | $25 | $0 (pg_search) | $5 | ~$50 |
| 3 (Scale) | $150+ | $100+ | $29+ | $50+ | ~$300+ |

## References
- Vercel Next.js docs: https://nextjs.org/docs/app/building-your-application/deploying/vercel
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Multi-tenancy patterns: https://supabase.com/docs/guides/database/multi-tenancy
