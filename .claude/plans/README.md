# Plans

This folder stores implementation plans generated **before any code is written**.

## What is a plan?

A plan is a structured, step-by-step breakdown of how a feature will be built — created by Claude after reading the spec but before touching any files. Plans are your review checkpoint: you read it, approve it, then implementation begins.

This prevents Claude from charging ahead with the wrong approach. The plan surfaces risks, lists every file that will change, and gives you a chance to redirect before any work happens.

## Workflow

```
Idea
  └─▶  /gather-requirements  ──▶  .claude/specs/feature.md
                                         │
                                  /evaluate-spec
                                         │
                                  /implement-spec
                                         │
                              generates plan first
                                         │
                              .claude/plans/feature.md  ◀── YOU REVIEW THIS
                                         │
                                    (approved)
                                         │
                                    writes code
```

## File Naming

Plans are named to match their spec:

- Spec: `.claude/specs/student-dashboard.md`
- Plan: `.claude/plans/student-dashboard.md`

## Plan Format

```markdown
# Plan: [Feature Name]

## Goal
[What is being built, in one sentence]

## Files to Create
- `src/...` — [purpose]

## Files to Modify
- `src/...` — [what changes and why]

## Implementation Steps
1. [First step]
2. [Second step]
...

## Schema Changes
[Any database model additions/modifications, or "None"]

## Risks / Unknowns
- [Something to watch out for]

## Out of Scope
[What will NOT be done in this implementation]
```

## Plans vs Specs

- **Spec** — *what* to build (written before any decisions about implementation)
- **Plan** — *how* to build it (written by Claude after reading the spec)

Always start with a spec. Never start coding from a plan alone.
