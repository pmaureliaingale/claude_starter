Generate or update the Entity Relationship Diagram based on the current database schema.

1. Find the schema definition file (e.g. `prisma/schema.prisma`, `models.py`, `schema.sql`, `db/schema.rb` — check CLAUDE.md for the ORM/database in use)
2. Read any migration files for additional context
3. Identify all models/tables, their fields, types, and relations
4. Generate or update `.claude/specs/erd.md` with the following format:

```markdown
# Entity Relationship Diagram

_Last updated: [date]_

\`\`\`mermaid
erDiagram
    USER {
        string id PK
        string email
        string name
        string role
        datetime created_at
        datetime updated_at
    }
    POST {
        string id PK
        string userId FK
        string title
        datetime created_at
        datetime updated_at
    }
    USER ||--o{ POST : "writes"
\`\`\`

## Entities

### User
[Brief description of what this entity represents]

### Post
[Brief description]
```

Cardinality notation:
- One-to-many: `||--o{`
- Many-to-many: `}o--o{`
- One-to-one: `||--||`
- Optional: `|o--o{`

Label primary keys with `PK` and foreign keys with `FK`.

Confirm the ERD was saved to `.claude/specs/erd.md`.

$ARGUMENTS
