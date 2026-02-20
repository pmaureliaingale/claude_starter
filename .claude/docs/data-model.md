# Data Model

> This document is a living, human-readable overview of the data model.
> It is updated by running `/update-erd` after any schema change.
> For the full ERD diagram, see `.claude/specs/erd.md`.

---

## Overview

[High-level description of the domain and how the core entities relate to each other]

## Entities

### [EntityName]

**Purpose**: [What does this entity represent in the domain?]

**Key fields**:
| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| created_at | datetime | Set on insert |
| updated_at | datetime | Updated on every write |
| ... | ... | ... |

**Relationships**:
- belongs to `[Entity]` via `[foreignKey]`
- has many `[Entity]`

---

_Add each entity in the same format above._

## Key Design Decisions

- [Why did we model X this way instead of Y?]
- [Any denormalization decisions and why]
- [Soft deletes vs hard deletes policy]

## Schema Change Process

1. Update your schema file (e.g. `prisma/schema.prisma`, `models.py`, `schema.sql`)
2. Run any migration commands
3. Run `/update-erd` to regenerate the ERD diagram
4. Update this document with any new entities or relationship changes
