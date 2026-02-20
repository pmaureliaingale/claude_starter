# [Project Name]

[One sentence: what this project does and who it's for]

> **New project?** Run `/choose-stack` to get a stack recommendation, then update this file.
> Run `/gather-requirements` to start writing your first spec.

## Commands

> Fill these in after your stack is chosen. Include only commands Claude would need to run.

```bash
# [start]   # Start development / local server
# [build]   # Production build
# [test]    # Run test suite
# [lint]    # Lint / format
```

## Stack

> Run `/choose-stack` to have Claude recommend the right stack for your project,
> or fill this in manually after deciding.

- **Language**: [e.g. TypeScript, Python, Go, Rust]
- **Framework**: [e.g. Next.js, FastAPI, Express, Django, none]
- **Database**: [e.g. PostgreSQL, SQLite, MongoDB, none]
- **Auth**: [e.g. NextAuth, Clerk, custom JWT, none]
- **Deployment**: [e.g. Vercel, Cloudflare Pages, Railway, AWS, Docker]

## Architecture

> Describe how the project is structured. Focus on things Claude can't infer from reading code.

- [How routing or API structure is organized]
- [Where core business logic lives]
- [Any non-obvious patterns or conventions]

## Important Gotchas

> Things that have burned you before. Vague notes get ignored — be specific.

- [e.g. "Always run X after changing the schema"]
- [e.g. "Package Y requires Z to be installed globally"]

## Engineering Standards

**All new features and enhancements MUST include tests. See `.claude/rules/testing.md` for details.**

**NEVER commit changes unless the user explicitly asks you to.**

If migrations are created, run them when complete.

Standardize patterns by creating reusable components or utilities. If logic is likely to be repeated, extract it. We do not want duplicate code.

**Data Model Rules**
- Table names MUST be singular (e.g. `user`, `session`, `order_item`)
- Every table MUST have `created_at` and `updated_at` timestamp fields

> Add your own project standards below as your team develops conventions.

## Rules

See `.claude/rules/` for detailed standards:

- @.claude/rules/code-style.md
- @.claude/rules/git-workflow.md
- @.claude/rules/testing.md
- @.claude/rules/security.md
