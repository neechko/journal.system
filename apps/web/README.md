# Web application

Next.js App Router application for the scholarly publishing platform.

## Local setup

Run commands from this directory. If `.env.local` does not already exist, copy
`.env.example` to it, then set `DATABASE_URL`. Run the Drizzle migrations
against a local PostgreSQL database:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run db:migrate
npm run dev
```

### Optional local demo content

After running migrations, seed one clearly synthetic, published organization and
journal to preview the public pages:

```powershell
$env:DEMO_SEED_LOCAL = "true"
npm run db:seed:demo
Remove-Item Env:\DEMO_SEED_LOCAL
```

The script refuses production mode and any database URL other than the local
`journal_system` database. It is idempotent, refuses to overwrite conflicting
records, creates no login account or credentials, and uses no real scholarly
identifiers. The seeded records are public in this local development database.

OIDC is disabled until all of `AUTH_OIDC_ISSUER`, `AUTH_OIDC_CLIENT_ID`,
`AUTH_OIDC_CLIENT_SECRET`, and `AUTH_SECRET` are configured. Set `AUTH_URL` to
the canonical application origin (the example uses localhost); otherwise,
`AUTH_TRUST_HOST=true` is accepted only when the app is behind a trusted proxy.
The issuer must use HTTPS, except for localhost development. Configure the
identity provider's callback URL as
`http://localhost:3000/api/auth/callback/oidc`. Generate a local session secret
with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

For local synthetic-file testing only, set
`LOCAL_PRIVATE_STORAGE_ENABLED=true` in `.env.local` before starting the
development server. Keep it disabled otherwise. This local adapter is
unencrypted, does not scan files, and is hard-disabled in production; never use
real or confidential manuscripts.

After the first successful OIDC sign-in, an authorized database administrator
must review and run
[`scripts/bootstrap-platform-operator.sql`](./scripts/bootstrap-platform-operator.sql)
interactively with the authenticated user's ID, DBA identity, and approval
reference:

```powershell
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f scripts/bootstrap-platform-operator.sql
```

The script locks the role table and only works while no platform operator
exists. It writes an audit event and does not create a default user or grant
access automatically. Do not use this bootstrap procedure in production
without an approved operational and audit process.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite uses Vitest (MIT) for TypeScript unit/integration tests and
PGlite (Apache-2.0) as an isolated in-process PostgreSQL test database. Both
are development-only; PGlite avoids a local database service for tests but is
not the application runtime database. Alternatives considered were Node's
built-in test runner or an external PostgreSQL test service. Drizzle Kit
generates reviewable SQL migrations; the application continues to use the
PostgreSQL adapter.

## Slice boundaries

- Organization provisioning is limited to platform operators.
- An organization admin can create draft journals and explicitly publish a
  journal page; publication is audited and requires an explicit confirmation.
- Organization admins can maintain plain-text journal aims/scope and author
  guidelines. Updates are tenant-scoped, audited, and explicitly confirmed;
  published changes are visible immediately.
- Organization admins can grant and revoke journal-scoped editorial, reviewer,
  and production roles for accounts that have signed in. Each change checks
  the organization and journal in a transaction and records an audit reason.
  Account invitations and OIDC provider setup are still outstanding.
- The `/journals` directory and public journal lookup return only records with
  `published_at` set. The directory searches journal title, organization name,
  and description, and shows 12 journals per page. Published issue and article
  pages have read-only routes, but their metadata and structured content still
  need publication workflow and accessibility verification. Public journal pages derive their
  title, description, and Open Graph metadata from published journal data;
  canonical host/domain policy remains undecided.
- The home page highlights up to three recently published journals from the
  same public-only catalog query. Public home, directory, and journal profile
  pages share an original discovery-first visual system; no fabricated metrics
  or scholarly identifiers are shown.
- Authenticated authors can create, view, and edit private title/abstract
  drafts for published journals when OIDC is configured. Drafts are scoped to
  their author account and audited. Authors may attach versioned PDF files up
  to 10 MB when the explicitly opt-in development-only local storage is enabled;
  files remain outside `public` and downloads are authorized against the owner
  on every request.
- Local manuscript storage is unencrypted, has no malware scanning or rate
  limiting, and is always disabled in production. Use synthetic test PDFs only;
  do not upload real or confidential manuscripts. No production object-storage
  adapter or retention policy is configured. The signed-in account is the only
  author identity currently recorded; co-author and affiliation metadata,
  editorial screening, review, article publication, member invitations, and
  production bootstrap are not complete end-to-end user flows. Some domain
  use cases and read-only publication routes exist. Editor and production
  queues list role-scoped journal data, while production actions remain
  unavailable in the UI.
- Authors can submit an owned draft after attaching a stored manuscript PDF.
  The `draft` → `submitted` transition is audited and makes the record
  read-only. Submission is disabled unless private local development storage is
  explicitly enabled; this does not make the feature production-ready.
- `DATABASE_URL`, the identity provider, role provisioning, rate limiting, and
  production security controls still require environment/operator setup.

Product and architecture decisions are documented in the repository-level
`docs/` directory. Do not treat proposed decisions as accepted.
