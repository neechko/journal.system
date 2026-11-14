# Domain Map and Module Boundaries

**Status:** Proposed baseline

## 1. Context map

| Bounded context | Tanggung jawab | Data utama |
|---|---|---|
| Identity & Access | User, session, memberships, roles, policy | User, Membership, RoleAssignment |
| Organization | Publisher/institution profile and settings | Organization, Domain, Branding |
| Journal Management | Journal identity, policy, boards, sections | Journal, EditorialBoard, JournalPolicy |
| Submission | Manuscript intake and author metadata | Submission, ManuscriptFile, AuthorContribution |
| Editorial | Screening, editor assignment, decisions | EditorialAssignment, Decision, WorkflowEvent |
| Peer Review | Reviewer invitation, assignment, reports | ReviewAssignment, ReviewReport |
| Production | Copyedit, proofs, assets, production state | ProductionJob, Proof, Asset |
| Article & Publishing | Article record, version, issue, publication | Article, ArticleVersion, Issue, Publication |
| Metadata & Identifiers | DOI/ISSN, deposit, external IDs | Identifier, MetadataDeposit, DepositAttempt |
| Discovery | Query, search index, facets | SearchDocument, IndexJob |
| Analytics | Usage events and reports | UsageEvent, ReportSnapshot |
| Preservation | Export packages, preservation status | PreservationPackage, PreservationEvent |
| Integrations | Crossref, ORCID, ROR, email, storage, etc. | IntegrationConfig, SyncRun |
| Billing (later) | Subscription, invoice, APC/payment if in scope | Plan, Invoice, Payment |

## 2. Dependency rules

- Domain modules do not import UI or framework-specific components.
- Domain rules should not depend on the database implementation.
- Application use cases orchestrate domain logic and ports.
- Infrastructure implements ports (database, storage, queue, email, external APIs).
- Presentation (Next.js pages, route handlers, Server Actions) calls application use cases.
- Cross-module collaboration uses explicit application contracts or domain events, not direct access to another module's private tables.
- Avoid a central `common` package that becomes a dumping ground.

## 3. Suggested initial ownership

MVP focus: Identity & Access, Organization, Journal Management, Submission, Editorial, Peer Review, Article & Publishing, and a minimal Production path.

Keep Metadata & Identifiers, Discovery, Analytics, Preservation, and Billing as clearly defined extension points; implement only the minimum needed for an end-to-end MVP.

## 4. Domain event examples

- `OrganizationCreated`
- `JournalCreated`
- `SubmissionReceived`
- `SubmissionScreened`
- `ReviewerInvited`
- `ReviewSubmitted`
- `RevisionRequested`
- `EditorialDecisionRecorded`
- `ArticleAccepted`
- `ProductionStarted`
- `ProofApproved`
- `ArticlePublished`
- `MetadataDepositRequested`

Events must have stable schema/version, actor context, tenant scope, occurred-at timestamp, and correlation ID. Do not promise exactly-once delivery; design handlers to be idempotent.
