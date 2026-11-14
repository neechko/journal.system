# AI Coding Task Template

Salin template ini ke issue/prompt agent. Hapus bagian yang tidak relevan, tetapi jangan hilangkan acceptance criteria untuk task sensitif.

```markdown
# Task: [nama perubahan]

## Goal
[Perilaku atau hasil yang diinginkan, bukan hanya daftar file.]

## Context
- Product area:
- Bounded context/module:
- Related docs:
- Existing behavior:

## User story
As a [role], I want [capability], so that [outcome].

## Acceptance criteria
- [ ] Given ... when ... then ...
- [ ] Given ... when ... then ...

## Constraints
- Tenant scope:
- Roles/permissions:
- Workflow/state transitions:
- Privacy/confidentiality:
- Performance/accessibility:
- Out of scope:

## Data/API impact
- Entities/tables:
- API/contracts/events:
- Migration/backfill:
- External integrations:

## Test plan
- Unit:
- Integration:
- E2E:
- Negative/security tests:

## Agent instructions
1. Inspect relevant code and docs before editing.
2. Identify uncertainty and write a short plan before non-trivial changes.
3. Do not invent unresolved product or architecture decisions.
4. Implement the smallest complete change.
5. Run relevant checks and report exact results.
6. Update docs/ADR if contracts or decisions change.

## Human approval required?
[Yes/No. Explain for sensitive or irreversible actions.]
```
