Help the user turn a vague idea into a complete, written feature specification.

Ask clarifying questions **one section at a time** — never dump all questions at once. Listen carefully and adapt follow-up questions based on answers.

Work through these areas in order:

1. **Problem** — What problem does this solve? Who experiences it?
2. **Users & Roles** — Who uses this feature? What can each role do vs. not do?
3. **Core User Stories** — What specific actions should users be able to take?
4. **Acceptance Criteria** — What does "done" look like? How do we verify it works?
5. **Edge Cases** — What happens when things go wrong? (no data, concurrent edits, permission denied, network failure)
6. **Out of Scope** — What will explicitly NOT be built in this iteration?
7. **Data Model** — What needs to be stored, created, or changed in the database schema?
8. **UI/UX** — Any specific flows, screens, or interactions to note?

Once all areas are covered, generate the spec in this format and save it to `.claude/specs/[kebab-case-feature-name].md`:

```markdown
# Feature: [Name]

> **Status**: Draft
> **Spec file**: `.claude/specs/[filename].md`

## Problem
[1-2 sentence problem statement]

## Users & Roles
| Role | Can Do | Cannot Do |
|------|--------|-----------|
| ... | ... | ... |

## User Stories
- As a **[role]**, I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] [Another criterion]

## Out of Scope
- [Explicitly excluded item]

## Data Model Changes
[Schema additions or modifications, or "No schema changes required"]

## UI / UX Notes
[Flow descriptions, key interactions, or "No specific UI requirements"]

## Open Questions
- [ ] [Any unresolved question]

## Notes
[Technical considerations, dependencies, related specs]
```

Confirm the file path with the user, then suggest running `/evaluate-spec [filename]` to validate it before implementation.

$ARGUMENTS
